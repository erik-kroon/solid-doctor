import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import { test } from "bun:test";
import { promisify } from "node:util";

import { projectAgentReport } from "../src/agent-report";
import type { DoctorReport } from "../src/scan";

const execFileAsync = promisify(execFile);

type RejectedExecFileError = Error & {
  stdout?: string;
};

test("agent report format exposes actionable diagnostic context", async () => {
  await assert.rejects(
    execFileAsync("bun", [
      "src/cli.ts",
      "scan",
      "fixtures/invalid-prop-snapshot",
      "--format",
      "agent",
    ]),
    (error) => {
      const report = JSON.parse((error as RejectedExecFileError).stdout ?? "");
      const diagnostic = report.diagnostics[0];

      assert.equal(report.schemaVersion, 1);
      assert.equal(diagnostic.ruleId, "solid/reactive-prop-snapshot");
      assert.equal(diagnostic.fileContext.location, "src/App.tsx:6:3");
      assert.match(diagnostic.explanation, /Solid components run once/);
      assert.match(diagnostic.remediation, /Read props\.name inside JSX/);
      assert.equal(diagnostic.confidence, "high");
      assert.equal(diagnostic.fix.fixable, false);
      return true;
    },
  );
});

test("agent report preserves unsafe fix markers instead of hiding risk", () => {
  const report = projectAgentReport({
    project: {
      root: "fixture",
      packageName: "fixture",
      usesSolid: true,
      usesSolidStart: false,
      ssrCapable: false,
      kind: "solid",
      packages: [],
      fileClassifications: new Map(),
      clientOnlyFiles: new Set(),
      ignoredFiles: new Set(),
      classificationSummary: [],
    },
    diagnostics: [
      {
        ruleId: "solid/example",
        category: "reactivity",
        severity: "warning",
        confidence: "medium",
        impact: "medium",
        impactDescription: "Example.",
        tags: ["example"],
        docsSlug: "example",
        filePath: "src/App.tsx",
        line: 1,
        column: 1,
        message: "Example.",
        remediation: "Review manually.",
        fixable: true,
        fix: {
          safe: false,
          diff: "- bad\n+ maybe",
        },
      },
    ],
    suppressionHints: [],
    metadata: {
      checkedFiles: 1,
      diagnosticsCount: 1,
      elapsedMilliseconds: 1,
      selectedProjects: [],
    },
    score: 90,
    scores: {
      overall: 90,
      categories: {
        async: 100,
        bundle: 100,
        server: 100,
        reactivity: 90,
        render: 100,
        effect: 100,
        js: 100,
        advanced: 100,
      },
    },
    classifierMessages: [],
  } satisfies DoctorReport);

  assert.equal(report.diagnostics[0]?.fix.safe, false);
  assert.match(report.diagnostics[0]?.fix.diff ?? "", /maybe/);
});
