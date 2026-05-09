import assert from "node:assert/strict";
import { test } from "bun:test";

import { projectDoctorReport, projectIssues } from "../src/report-projection";
import { scanProject } from "../src/scan";

test("report projection enriches diagnostics once for reporters and TUI views", async () => {
  const report = await scanProject("fixtures/invalid-prop-snapshot");
  const projection = projectDoctorReport(report);
  const [issue] = projection.issues;

  assert.equal(projection.schemaVersion, 1);
  assert.equal(projection.project.packageName, "invalid-prop-snapshot-fixture");
  assert.ok(issue);
  assert.equal(issue.location, "src/App.tsx:6:3");
  assert.equal(issue.annotationLevel, "warning");
  assert.equal(issue.impact, "high");
  assert.deepEqual(issue.tags, ["reactive", "props", "splitProps", "mergeProps"]);
  assert.match(issue.fingerprint, /^solid\/reactive-prop-snapshot\|src\/App\.tsx/);
  assert.match(issue.explanation, /Solid components run once/);
  assert.match(issue.preferredExample, /props\.name/);
});

test("issue projection preserves diff previews from fix data", async () => {
  const report = await scanProject("fixtures/invalid-prop-snapshot");
  const [diagnostic] = report.diagnostics;

  assert.ok(diagnostic);

  const [issue] = projectIssues([
    {
      ...diagnostic,
      fixable: true,
      fix: {
        safe: true,
        diff: "- const name = props.name;\n+ const name = () => props.name;",
      },
    },
  ]);

  assert.ok(issue);
  assert.match(issue.diffPreview ?? "", /const name = \(\) => props\.name/);
});
