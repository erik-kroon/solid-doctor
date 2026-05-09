import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import { mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "bun:test";
import { promisify } from "node:util";

import { installAgentInstructions } from "../src/agent-installer";
import { findRule, getRules } from "../src/rule-catalog";
import { assertRuleDocsComplete, renderRuleExplanation } from "../src/rule-docs";

const execFileAsync = promisify(execFile);

test("each MVP rule has complete docs metadata", () => {
  assert.doesNotThrow(() => assertRuleDocsComplete());
});

test("rule catalog owns metadata lookup and rule pack selection", () => {
  assert.equal(getRules("none").length, 0);
  assert.equal(getRules("mvp").length, 9);
  assert.equal(findRule("reactive-prop-snapshot")?.id, "solid/reactive-prop-snapshot");
});

test("explain renders useful rule guidance from metadata", async () => {
  const explanation = renderRuleExplanation("reactive-prop-snapshot");

  assert.match(explanation, /solid\/reactive-prop-snapshot/);
  assert.match(explanation, /Why it matters:/);
  assert.match(explanation, /Preferred pattern:/);
  assert.match(explanation, /Suppression:/);

  const { stdout } = await execFileAsync("bun", [
    "src/cli.ts",
    "explain",
    "solid/reactive-prop-snapshot",
  ]);
  assert.match(stdout, /Read the prop inside JSX/);
});

test("agent installer preserves user-authored AGENTS content and writes Cursor guidance", async () => {
  const tempDir = await mkdtemp(join(tmpdir(), "solid-doctor-agents-"));

  try {
    await writeFile(
      join(tempDir, "package.json"),
      JSON.stringify({ name: "agent-fixture", dependencies: { "solid-js": "latest" } }),
    );
    await writeFile(join(tempDir, "AGENTS.md"), "# Existing Guidance\n\nKeep this paragraph.\n");

    await installAgentInstructions({ projectRoot: tempDir, dryRun: false, target: "all" });

    const agents = await readFile(join(tempDir, "AGENTS.md"), "utf8");
    const cursor = await readFile(join(tempDir, ".cursor", "rules", "solid-doctor.mdc"), "utf8");

    assert.match(agents, /Keep this paragraph/);
    assert.match(agents, /<!-- solid-doctor:start -->/);
    assert.match(agents, /solid\/dynamic-map-in-jsx/);
    assert.match(cursor, /Project profile: solid/);
    assert.match(cursor, /createResource/);
  } finally {
    await rm(tempDir, { recursive: true, force: true });
  }
});

test("agent installer dry-run shows intended changes without writing files", async () => {
  const tempDir = await mkdtemp(join(tmpdir(), "solid-doctor-agents-"));

  try {
    await mkdir(tempDir, { recursive: true });
    await writeFile(
      join(tempDir, "package.json"),
      JSON.stringify({ name: "agent-fixture", dependencies: { "solid-js": "latest" } }),
    );
    const { stdout } = await execFileAsync("bun", [
      "src/cli.ts",
      "install-agents",
      tempDir,
      "--target",
      "agents",
      "--dry-run",
    ]);

    assert.match(stdout, /Would update:/);
    assert.match(stdout, /Solid Doctor Guidance/);
    await assert.rejects(readFile(join(tempDir, "AGENTS.md"), "utf8"));
  } finally {
    await rm(tempDir, { recursive: true, force: true });
  }
});

test("agent installer guidance reflects config-disabled rules", async () => {
  const tempDir = await mkdtemp(join(tmpdir(), "solid-doctor-agents-"));

  try {
    await writeFile(
      join(tempDir, "package.json"),
      JSON.stringify({
        name: "agent-fixture",
        dependencies: { "solid-js": "latest" },
        solidDoctor: {
          ignore: {
            rules: ["solid/dynamic-map-in-jsx"],
          },
        },
      }),
    );

    const [result] = await installAgentInstructions({
      projectRoot: tempDir,
      dryRun: true,
      target: "agents",
    });

    assert.ok(result);
    assert.match(result.content, /Project profile: solid/);
    assert.doesNotMatch(result.content, /solid\/dynamic-map-in-jsx/);
    assert.match(result.content, /solid\/reactive-prop-snapshot/);
  } finally {
    await rm(tempDir, { recursive: true, force: true });
  }
});
