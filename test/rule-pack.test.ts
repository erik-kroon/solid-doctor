import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import { test } from "bun:test";
import { promisify } from "node:util";

import { scanProject } from "../src/scan";

const execFileAsync = promisify(execFile);

type RejectedExecFileError = Error & {
  code?: number;
  stdout?: string;
};

test("MVP rule pack reports the first Solid-specific rule categories", async () => {
  const report = await scanProject("fixtures/invalid-mvp-rule-pack");
  const ruleIds = report.diagnostics.map((diagnostic) => diagnostic.ruleId);

  assert.deepEqual(
    new Set(ruleIds),
    new Set([
      "solid/derived-state-in-effect",
      "solid/async-tracking-gap",
      "solid/dynamic-map-in-jsx",
      "solid/browser-global-in-ssr",
    ]),
  );
  assert.equal(report.diagnostics.length, 4);
});

test("MVP rule pack keeps conservative false-positive guards", async () => {
  const report = await scanProject("fixtures/false-positive-mvp-rule-pack");

  assert.deepEqual(report.diagnostics, []);
  assert.equal(report.score, 100);
});

test("MVP rule pack can be disabled as one group", async () => {
  const { stdout } = await execFileAsync("bun", [
    "src/cli.ts",
    "scan",
    "fixtures/invalid-mvp-rule-pack",
    "--rules",
    "none",
  ]);

  assert.match(stdout, /Health score: 100\/100/);
  assert.match(stdout, /No Solid-specific diagnostics found/);
});

test("MVP rule pack diagnostics use Solid-native guidance", async () => {
  await assert.rejects(
    execFileAsync("bun", ["src/cli.ts", "scan", "fixtures/invalid-mvp-rule-pack"]),
    (error) => {
      const execError = error as RejectedExecFileError;
      const stdout = execError.stdout ?? "";

      assert.equal(execError.code, 1);
      assert.match(stdout, /createMemo/);
      assert.match(stdout, /createResource/);
      assert.match(stdout, /<For> or <Index>/);
      assert.match(stdout, /onMount/);
      return true;
    },
  );
});
