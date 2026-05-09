import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "bun:test";
import { promisify } from "node:util";

import { readBaseline, writeBaseline } from "../src/baseline";
import { parseGitDiffChangedLines } from "../src/diff-filter";
import { scanProject } from "../src/scan";

const execFileAsync = promisify(execFile);

type RejectedExecFileError = Error & {
  code?: number;
  stdout?: string;
};

test("reports include weighted overall and category scores", async () => {
  const report = await scanProject("fixtures/invalid-mvp-rule-pack");

  assert.equal(report.score, report.scores.overall);
  assert.equal(report.scores.categories.reactivity < 100, true);
  assert.equal(report.scores.categories.ssr < 100, true);
});

test("JSON output is versioned and serializable", async () => {
  const { stdout } = await execFileAsync("bun", [
    "src/cli.ts",
    "scan",
    "fixtures/valid-solid",
    "--format",
    "json",
  ]);
  const report = JSON.parse(stdout);

  assert.equal(report.schemaVersion, 1);
  assert.equal(report.project.packageName, "valid-solid-fixture");
  assert.equal(report.score.overall, 100);
  assert.deepEqual(report.diagnostics, []);
});

test("baseline suppresses known diagnostics without changing new fingerprints", async () => {
  const tempDir = await mkdtemp(join(tmpdir(), "solid-doctor-"));
  const baselinePath = join(tempDir, "baseline.json");

  try {
    const initialReport = await scanProject("fixtures/invalid-prop-snapshot");
    await writeBaseline(baselinePath, initialReport.diagnostics);

    const suppressedReport = await scanProject("fixtures/invalid-prop-snapshot", {
      baselineFingerprints: await readBaseline(baselinePath),
    });

    assert.deepEqual(suppressedReport.diagnostics, []);
    assert.equal(suppressedReport.score, 100);
  } finally {
    await rm(tempDir, { recursive: true, force: true });
  }
});

test("changed-line filtering keeps only diagnostics introduced in selected lines", async () => {
  const report = await scanProject("fixtures/invalid-mvp-rule-pack", {
    changedLines: new Map([["src/App.tsx", new Set([11])]]),
  });

  assert.deepEqual(
    report.diagnostics.map((diagnostic) => diagnostic.ruleId),
    ["solid/browser-global-in-ssr"],
  );
});

test("git diff parser extracts added line ranges", () => {
  const changedLines = parseGitDiffChangedLines(`diff --git a/src/App.tsx b/src/App.tsx
--- a/src/App.tsx
+++ b/src/App.tsx
@@ -1,0 +2,3 @@
+one
+two
+three`);

  assert.deepEqual(changedLines.get("src/App.tsx"), new Set([2, 3, 4]));
});

test("score threshold failures return a non-zero exit code", async () => {
  await assert.rejects(
    execFileAsync("bun", ["src/cli.ts", "scan", "fixtures/valid-solid", "--min-score", "101"]),
    (error) => {
      assert.equal((error as RejectedExecFileError).code, 1);
      return true;
    },
  );
});
