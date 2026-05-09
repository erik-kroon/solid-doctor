import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";

import { classifyProject } from "./project-classifier";
import { getRules } from "./rule-catalog";

const START_MARKER = "<!-- solid-doctor:start -->";
const END_MARKER = "<!-- solid-doctor:end -->";

export type AgentTarget = "agents" | "cursor" | "all";

export type AgentInstallResult = {
  path: string;
  content: string;
  changed: boolean;
};

export async function installAgentInstructions({
  projectRoot,
  dryRun,
  target,
}: {
  projectRoot: string;
  dryRun: boolean;
  target: AgentTarget;
}): Promise<AgentInstallResult[]> {
  const profile = await classifyProject(projectRoot);
  const guidance = renderAgentGuidance(profile.kind);
  const targets = resolveTargets(projectRoot, target);
  const results: AgentInstallResult[] = [];

  for (const path of targets) {
    const existing = await readOptionalFile(path);
    const content = upsertManagedBlock(existing, guidance);

    if (!dryRun) {
      await mkdir(dirname(path), { recursive: true });
      await writeFile(path, content);
    }

    results.push({ path, content, changed: existing !== content });
  }

  return results;
}

function renderAgentGuidance(projectKind: string): string {
  const lines = [
    START_MARKER,
    "# Solid Doctor Guidance",
    "",
    `Project profile: ${projectKind}`,
    "",
    "Follow Solid's fine-grained reactivity, SSR, lifecycle, and rendering model:",
  ];

  for (const rule of getRules()) {
    lines.push(
      "",
      `- ${rule.id} [${rule.meta.category}/${rule.meta.impact}]: ${rule.meta.remediation}`,
    );
  }

  lines.push(
    "",
    "Prefer Solid primitives such as props accessors, createMemo, createResource, onMount, <For>, and <Index> when a rule points to them.",
    END_MARKER,
  );

  return lines.join("\n");
}

function resolveTargets(projectRoot: string, target: AgentTarget): string[] {
  if (target === "agents") {
    return [join(projectRoot, "AGENTS.md")];
  }

  if (target === "cursor") {
    return [join(projectRoot, ".cursor", "rules", "solid-doctor.mdc")];
  }

  return [
    join(projectRoot, "AGENTS.md"),
    join(projectRoot, ".cursor", "rules", "solid-doctor.mdc"),
  ];
}

async function readOptionalFile(path: string): Promise<string> {
  try {
    return await readFile(path, "utf8");
  } catch (error) {
    return "";
  }
}

function upsertManagedBlock(existing: string, block: string): string {
  const start = existing.indexOf(START_MARKER);
  const end = existing.indexOf(END_MARKER);

  if (start !== -1 && end !== -1 && end > start) {
    return `${existing.slice(0, start)}${block}${existing.slice(end + END_MARKER.length)}`;
  }

  const prefix = existing.trimEnd();
  return `${prefix}${prefix ? "\n\n" : ""}${block}\n`;
}
