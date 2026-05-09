import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import { test } from "bun:test";
import { promisify } from "node:util";

import { projectDoctorReport, projectIssues } from "../src/report-projection";
import { createTuiViewModel } from "../src/tui-view-model";
import { scanProject } from "../src/scan";

const execFileAsync = promisify(execFile);

test("TUI view model filters issues by severity, category, rule, file, confidence, and fixability", async () => {
  const report = await scanProject("fixtures/invalid-mvp-rule-pack");
  const viewModel = createTuiViewModel({
    report: projectDoctorReport(report),
    filters: {
      severity: "error",
      category: "server",
      ruleId: "solid/browser-global-in-ssr",
      filePath: "src/App.tsx",
      confidence: "high",
      fixable: false,
    },
  });

  assert.equal(viewModel.issues.length, 1);
  assert.equal(viewModel.selectedIssue?.ruleId, "solid/browser-global-in-ssr");
  assert.equal(viewModel.selectedIssue?.impact, "high");
  assert.deepEqual(viewModel.selectedIssue?.tags, [
    "server",
    "browser-api",
    "ssr",
    "hydration",
    "onMount",
  ]);
  assert.match(viewModel.selectedIssue?.explanation ?? "", /server rendering/);
  assert.match(viewModel.selectedIssue?.preferredExample ?? "", /onMount/);
  assert.equal(viewModel.selectedIssue?.diffPreview, null);
});

test("TUI view model exposes diff previews when fix data exists", async () => {
  const report = await scanProject("fixtures/invalid-prop-snapshot");
  const [diagnostic] = report.diagnostics;

  assert.ok(diagnostic);

  const viewModel = createTuiViewModel({
    report: {
      ...projectDoctorReport(report),
      issues: projectIssues([
        {
          ...diagnostic,
          fixable: true,
          fix: {
            safe: true,
            diff: "- const name = props.name;\n+ const name = () => props.name;",
          },
        },
      ]),
    },
    filters: { fixable: true },
  });

  assert.match(viewModel.selectedIssue?.diffPreview ?? "", /const name = \(\) => props\.name/);
});

test("doctor and inspect commands can prepare the optional TUI without loading it in dry-run mode", async () => {
  const doctor = await execFileAsync("bun", ["src/cli.ts", "doctor", "fixtures/valid-solid"], {
    env: { ...process.env, SOLID_DOCTOR_TUI_DRY_RUN: "1" },
  });
  const inspect = await execFileAsync("bun", ["src/cli.ts", "inspect", "fixtures/valid-solid"], {
    env: { ...process.env, SOLID_DOCTOR_TUI_DRY_RUN: "1" },
  });

  assert.match(doctor.stdout, /Doctor Dashboard ready/);
  assert.match(inspect.stdout, /Issue Explorer ready/);
});

test("check command keeps the base scanner path dependency-free", async () => {
  const { stdout } = await execFileAsync("bun", ["src/cli.ts", "check", "fixtures/valid-solid"]);

  assert.match(stdout, /Solid Doctor/);
  assert.match(stdout, /Health score: 100\/100/);
});
