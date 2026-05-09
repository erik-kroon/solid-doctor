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
      "solid/async-no-fetch-in-effect",
      "solid/dynamic-map-in-jsx",
      "solid/browser-global-in-ssr",
    ]),
  );
  assert.equal(report.diagnostics.length, 5);
});

test("MVP rule pack keeps conservative false-positive guards", async () => {
  const report = await scanProject("fixtures/false-positive-mvp-rule-pack");

  assert.deepEqual(report.diagnostics, []);
  assert.equal(report.score, 100);
});

test("skill taxonomy rules report the next high-value Solid mistakes", async () => {
  const report = await scanProject("fixtures/invalid-skill-taxonomy");
  const ruleIds = report.diagnostics.map((diagnostic) => diagnostic.ruleId);

  assert.deepEqual(
    new Set(ruleIds),
    new Set([
      "solid/async-no-fetch-in-effect",
      "solid/effect-cleanup-subscriptions",
      "solid/render-stable-children",
      "solid/server-request-scoped-state",
    ]),
  );
});

test("skill taxonomy rules keep documented valid patterns quiet", async () => {
  const report = await scanProject("fixtures/valid-skill-taxonomy");

  assert.deepEqual(report.diagnostics, []);
  assert.equal(report.score, 100);
});

test("rule metadata examples are not scanned as executable Solid code", async () => {
  const report = await scanProject(".");

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

test("reactivity rule pack adds store destructuring diagnostics", async () => {
  const report = await scanProject("fixtures/invalid-store-reactivity", {
    rulePack: "reactivity",
  });

  assert.deepEqual(
    report.diagnostics.map((diagnostic) => diagnostic.ruleId),
    ["solid/store-destructure-snapshot"],
  );
});

test("store destructuring rule keeps direct store reads quiet", async () => {
  const report = await scanProject("fixtures/false-positive-store-reactivity", {
    rulePack: "reactivity",
  });

  assert.deepEqual(report.diagnostics, []);
});

test("expanded rules can be selected from the CLI", async () => {
  const { stdout } = await execFileAsync("bun", [
    "src/cli.ts",
    "scan",
    "fixtures/invalid-store-reactivity",
    "--rules",
    "reactivity",
    "--format",
    "json",
  ]).catch((error: RejectedExecFileError) => ({ stdout: error.stdout ?? "" }));
  const report = JSON.parse(stdout);

  assert.equal(report.diagnostics[0].ruleId, "solid/store-destructure-snapshot");
});

test("expanded rules can be disabled through config", async () => {
  const { stdout } = await execFileAsync("bun", [
    "src/cli.ts",
    "scan",
    "fixtures/config-store-reactivity",
    "--rules",
    "reactivity",
    "--format",
    "json",
  ]);
  const report = JSON.parse(stdout);

  assert.deepEqual(report.diagnostics, []);
  assert.equal(report.score.overall, 100);
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
