import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { test } from "bun:test";

import plugin, { OXLINT_COMPATIBLE_RULES, oxlintRuleName } from "../src/oxlint-plugin";

test("Oxlint plugin metadata maps Solid Doctor rule ids to plugin rule names", () => {
  assert.equal(plugin.meta.name, "solid-doctor");
  assert.ok(plugin.rules["reactive-prop-snapshot"]);
  assert.equal(oxlintRuleName("solid/reactive-prop-snapshot"), "reactive-prop-snapshot");
  assert.equal(
    OXLINT_COMPATIBLE_RULES.some((rule) => rule.id === "solid/browser-global-in-ssr"),
    false,
  );
});

test("Oxlint plugin tracer rule reports through an Oxlint-shaped context", async () => {
  const source = await readFile("fixtures/invalid-prop-snapshot/src/App.tsx", "utf8");
  const reports: Array<{ message: string; loc: { line: number; column: number } }> = [];
  const rule = plugin.rules["reactive-prop-snapshot"];

  assert.ok(rule);

  const visitor = rule.create({
    filename: `${process.cwd()}/fixtures/invalid-prop-snapshot/src/App.tsx`,
    cwd: `${process.cwd()}/fixtures/invalid-prop-snapshot`,
    sourceCode: {
      text: source,
    },
    report(diagnostic) {
      reports.push(diagnostic);
    },
  });

  visitor.Program();

  assert.equal(reports.length, 1);
  assert.match(reports[0]?.message ?? "", /Local value 'name' snapshots props\.name/);
  assert.deepEqual(reports[0]?.loc, { line: 6, column: 2 });
});

test("Oxlint fixture config can load the Solid Doctor plugin rule", async () => {
  const config = JSON.parse(await readFile("fixtures/oxlint-plugin/.oxlintrc.json", "utf8"));

  assert.deepEqual(config.jsPlugins, ["../../dist/oxlint-plugin.js"]);
  assert.equal(config.rules["solid-doctor/reactive-prop-snapshot"], "error");
});
