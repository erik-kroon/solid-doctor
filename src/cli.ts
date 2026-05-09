#!/usr/bin/env node
import { spawn } from "node:child_process";
import { existsSync } from "node:fs";
import { mkdtemp, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";

import { type AgentTarget, installAgentInstructions } from "./agent-installer";
import { readBaseline, writeBaseline } from "./baseline";
import { loadGitChangedLines, loadGitStagedFiles, readChangedLinesFile } from "./diff-filter";
import { projectDoctorReport } from "./report-projection";
import {
  renderGithubAnnotations,
  renderJsonError,
  renderJsonReport,
  renderMarkdownReport,
  renderSarifReport,
  renderTerminalReport,
} from "./reporter";
import type { RulePack } from "./rule-catalog";
import { renderRuleExplanation } from "./rule-docs";
import { scanProject } from "./scan";

const [, , command, targetArg, ...args] = process.argv;

if (!command) {
  printUsageAndExit();
}

if (command === "explain") {
  if (!targetArg) {
    printUsageAndExit();
  }

  try {
    console.log(renderRuleExplanation(targetArg));
    process.exit(0);
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    process.exit(2);
  }
}

if (command === "install-agents") {
  if (!targetArg) {
    printUsageAndExit();
  }

  try {
    const results = await installAgentInstructions({
      projectRoot: resolve(targetArg),
      dryRun: args.includes("--dry-run"),
      target: parseAgentTarget(args),
    });

    for (const result of results) {
      console.log(`${result.changed ? "Would update" : "No changes"}: ${result.path}`);

      if (args.includes("--dry-run")) {
        console.log(result.content);
      }
    }

    process.exit(0);
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    process.exit(2);
  }
}

if (command === "doctor" || command === "inspect") {
  if (!targetArg) {
    printUsageAndExit();
  }

  try {
    const targetRoot = resolve(targetArg);
    const report = await scanProject(targetRoot, await parseScanOptions(targetRoot, args));

    if (process.env.SOLID_DOCTOR_TUI_DRY_RUN === "1") {
      console.log(`${command === "inspect" ? "Issue Explorer" : "Doctor Dashboard"} ready`);
      console.log(`Score: ${report.score}/100`);
      console.log(`Issues: ${report.diagnostics.length}`);
      process.exit(0);
    }

    const tempDir = await mkdtemp(join(tmpdir(), "solid-doctor-tui-"));
    const reportPath = join(tempDir, "report.json");
    await writeFile(reportPath, `${JSON.stringify(projectDoctorReport(report), null, 2)}\n`);
    process.exit(await runTui(reportPath, command === "inspect" ? "inspect" : "dashboard"));
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    process.exit(2);
  }
}

if ((command !== "scan" && command !== "check") || !targetArg) {
  printUsageAndExit();
}

function printUsageAndExit(): never {
  console.error(
    "Usage: solid-doctor scan <project> [--rules mvp|none] [--format terminal|json|markdown|sarif|github] [--project name-or-path] [--staged] [--baseline file] [--write-baseline file] [--diff base] [--changed-lines file] [--min-score number] [--verbose]",
  );
  console.error("       solid-doctor check <project> [scan options]");
  console.error("       solid-doctor doctor <project> [scan options]");
  console.error("       solid-doctor inspect <project> [scan options]");
  console.error("       solid-doctor explain <rule>");
  console.error(
    "       solid-doctor install-agents <project> [--target agents|cursor|all] [--dry-run]",
  );
  process.exit(2);
}

try {
  const targetRoot = resolve(targetArg);
  const minScore = parseOptionalNumber(valueAfter(args, "--min-score"), "--min-score");
  const report = await scanProject(targetRoot, await parseScanOptions(targetRoot, args));
  const writeBaselinePath = valueAfter(args, "--write-baseline");

  if (writeBaselinePath) {
    await writeBaseline(resolve(writeBaselinePath), report.diagnostics);
  }

  console.log(renderReport(report, parseFormat(args)));
  process.exit(
    report.diagnostics.length > 0 || (minScore !== null && report.score < minScore) ? 1 : 0,
  );
} catch (error) {
  const message = error instanceof Error ? error.message : String(error);

  if (wantsJsonOutput(args)) {
    console.log(renderJsonError({ code: "scan_failed", message }));
  } else {
    console.error(message);
  }

  process.exit(2);
}

function parseRulePack(args: string[]): RulePack {
  const flagIndex = args.indexOf("--rules");

  if (flagIndex === -1) {
    return "mvp";
  }

  const value = args[flagIndex + 1];

  if (value === "mvp" || value === "reactivity" || value === "none") {
    return value;
  }

  throw new Error("Expected --rules to be one of: mvp, reactivity, none.");
}

async function parseScanOptions(targetRoot: string, args: string[]) {
  const baselinePath = valueAfter(args, "--baseline");
  const changedLinesPath = valueAfter(args, "--changed-lines");
  const diffBase = valueAfter(args, "--diff");

  return {
    rulePack: parseRulePack(args),
    verbose: args.includes("--verbose"),
    selectedProjects: parseProjectSelections(args),
    baselineFingerprints: baselinePath ? await readBaseline(resolve(baselinePath)) : undefined,
    changedFiles: args.includes("--staged") ? await loadGitStagedFiles(targetRoot) : undefined,
    changedLines: changedLinesPath
      ? await readChangedLinesFile(resolve(changedLinesPath))
      : diffBase
        ? await loadGitChangedLines(diffBase, targetRoot)
        : undefined,
  };
}

function parseProjectSelections(args: string[]): string[] {
  return valuesAfter(args, "--project").flatMap((value) =>
    value
      .split(",")
      .map((part) => part.trim())
      .filter(Boolean),
  );
}

type OutputFormat = "terminal" | "json" | "markdown" | "sarif" | "github";

function parseFormat(args: string[]): OutputFormat {
  const format = valueAfter(args, "--format") ?? (args.includes("--ci") ? "markdown" : "terminal");

  if (
    format === "terminal" ||
    format === "json" ||
    format === "markdown" ||
    format === "sarif" ||
    format === "github"
  ) {
    return format;
  }

  throw new Error("Expected --format to be one of: terminal, json, markdown, sarif, github.");
}

function wantsJsonOutput(args: string[]): boolean {
  return valueAfter(args, "--format") === "json";
}

function parseOptionalNumber(value: string | null, flagName: string): number | null {
  if (value === null) {
    return null;
  }

  const number = Number(value);

  if (!Number.isFinite(number)) {
    throw new Error(`Expected ${flagName} to be a number.`);
  }

  return number;
}

function valueAfter(args: string[], flagName: string): string | null {
  const flagIndex = args.indexOf(flagName);

  if (flagIndex === -1) {
    return null;
  }

  return args[flagIndex + 1] ?? null;
}

function valuesAfter(args: string[], flagName: string): string[] {
  const values: string[] = [];

  for (let index = 0; index < args.length; index += 1) {
    if (args[index] !== flagName) {
      continue;
    }

    const value = args[index + 1];

    if (value) {
      values.push(value);
    }
  }

  return values;
}

function parseAgentTarget(args: string[]): AgentTarget {
  const target = valueAfter(args, "--target") ?? "all";

  if (target === "agents" || target === "cursor" || target === "all") {
    return target;
  }

  throw new Error("Expected --target to be one of: agents, cursor, all.");
}

function renderReport(
  report: Awaited<ReturnType<typeof scanProject>>,
  format: OutputFormat,
): string {
  switch (format) {
    case "json":
      return renderJsonReport(report);
    case "markdown":
      return renderMarkdownReport(report);
    case "sarif":
      return renderSarifReport(report);
    case "github":
      return renderGithubAnnotations(report);
    case "terminal":
      return renderTerminalReport(report);
  }
}

async function runTui(reportPath: string, mode: "dashboard" | "inspect"): Promise<number> {
  if (!existsSync("apps/tui/src/index.tsx")) {
    console.error(
      "The OpenTUI doctor and inspect commands currently require a source checkout. Use 'solid-doctor scan <project> --format json' from the npm package.",
    );
    return 2;
  }

  const child = spawn("bun", ["apps/tui/src/index.tsx", reportPath, mode], {
    stdio: "inherit",
  });

  return await new Promise((resolvePromise, reject) => {
    child.on("error", reject);
    child.on("close", (code) => resolvePromise(code ?? 0));
  });
}
