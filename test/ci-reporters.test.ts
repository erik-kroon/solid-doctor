import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import { test } from "bun:test";
import { promisify } from "node:util";

import { renderGithubAnnotations, renderMarkdownReport, renderSarifReport } from "../src/reporter";
import { scanProject } from "../src/scan";

const execFileAsync = promisify(execFile);

test("Markdown reporter emits a readable CI summary", async () => {
  const report = await scanProject("fixtures/invalid-prop-snapshot");
  const markdown = renderMarkdownReport(report);

  assert.match(markdown, /# Solid Doctor Report/);
  assert.match(markdown, /\| Severity \| Rule \| Location \| Remediation \|/);
  assert.match(markdown, /solid\/reactive-prop-snapshot/);
});

test("SARIF reporter emits schema-shaped results", async () => {
  const report = await scanProject("fixtures/invalid-prop-snapshot");
  const sarif = JSON.parse(renderSarifReport(report));

  assert.equal(sarif.version, "2.1.0");
  assert.equal(sarif.runs[0].tool.driver.name, "Solid Doctor");
  assert.equal(sarif.runs[0].results[0].ruleId, "solid/reactive-prop-snapshot");
  assert.equal(
    sarif.runs[0].results[0].locations[0].physicalLocation.artifactLocation.uri,
    "src/App.tsx",
  );
});

test("GitHub annotation output includes file, line, severity, title, and remediation", async () => {
  const report = await scanProject("fixtures/invalid-prop-snapshot");
  const annotations = renderGithubAnnotations(report);

  assert.match(
    annotations,
    /^::warning file=src\/App\.tsx,line=6,col=3,title=solid\/reactive-prop-snapshot:/,
  );
  assert.match(annotations, /Read props\.name inside JSX/);
});

test("CI mode defaults to Markdown output", async () => {
  const { stdout } = await execFileAsync("bun", [
    "src/cli.ts",
    "scan",
    "fixtures/valid-solid",
    "--ci",
  ]);

  assert.match(stdout, /# Solid Doctor Report/);
  assert.match(stdout, /No Solid-specific diagnostics found/);
});
