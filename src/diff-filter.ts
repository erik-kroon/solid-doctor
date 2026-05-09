import { execFile } from "node:child_process";
import { readFile } from "node:fs/promises";
import { promisify } from "node:util";

import type { Diagnostic } from "./diagnostics";

const execFileAsync = promisify(execFile);

export type ChangedLines = Map<string, Set<number>>;

export function filterDiagnosticsToChangedLines(
  diagnostics: Diagnostic[],
  changedLines: ChangedLines | undefined,
): Diagnostic[] {
  if (!changedLines) {
    return diagnostics;
  }

  return diagnostics.filter((diagnostic) =>
    changedLines.get(diagnostic.filePath)?.has(diagnostic.line),
  );
}

export async function readChangedLinesFile(path: string): Promise<ChangedLines> {
  const changedLines: ChangedLines = new Map();
  const content = await readFile(path, "utf8");

  for (const rawLine of content.split("\n")) {
    const line = rawLine.trim();

    if (!line) {
      continue;
    }

    const [filePath, lineNumber] = line.split(":");

    if (!filePath || !lineNumber) {
      continue;
    }

    addChangedLine(changedLines, filePath, Number(lineNumber));
  }

  return changedLines;
}

export async function loadGitChangedLines(
  baseRef: string,
  projectRoot: string,
): Promise<ChangedLines> {
  const { stdout } = await execFileAsync("git", [
    "-C",
    projectRoot,
    "diff",
    "--unified=0",
    baseRef,
    "--",
  ]);
  return parseGitDiffChangedLines(stdout);
}

export function parseGitDiffChangedLines(diff: string): ChangedLines {
  const changedLines: ChangedLines = new Map();
  let currentFile: string | null = null;

  for (const line of diff.split("\n")) {
    if (line.startsWith("+++ b/")) {
      currentFile = line.slice("+++ b/".length);
      continue;
    }

    if (!currentFile || !line.startsWith("@@")) {
      continue;
    }

    const match = line.match(/\+(\d+)(?:,(\d+))?/);

    if (!match?.[1]) {
      continue;
    }

    const start = Number(match[1]);
    const count = Number(match[2] ?? "1");

    for (let offset = 0; offset < count; offset += 1) {
      addChangedLine(changedLines, currentFile, start + offset);
    }
  }

  return changedLines;
}

function addChangedLine(changedLines: ChangedLines, filePath: string, line: number): void {
  if (!Number.isFinite(line)) {
    return;
  }

  const lines = changedLines.get(filePath) ?? new Set<number>();
  lines.add(line);
  changedLines.set(filePath, lines);
}
