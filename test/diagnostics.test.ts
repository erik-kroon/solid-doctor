import assert from "node:assert/strict";
import { test } from "bun:test";

import { normalizeFinding, type RuleDefinition } from "../src/diagnostics";

test("normalizes a raw rule finding with rule metadata", () => {
  const rule: RuleDefinition = {
    id: "solid/example-rule",
    meta: {
      category: "reactivity",
      defaultSeverity: "warning",
      confidence: "high",
      docsSlug: "example-rule",
      description: "Example description.",
      why: "Example why.",
      badExample: "bad();",
      preferredExample: "good();",
      remediation: "Use the Solid primitive that keeps the read tracked.",
      suppressionGuidance: "Suppress with a reason.",
      references: [],
      fixable: false,
    },
  };
  const context = {
    relativeFilePath: "src/App.tsx",
  };

  const diagnostic = normalizeFinding({
    rule,
    context,
    finding: {
      line: 4,
      column: 9,
      message: "Example diagnostic.",
    },
  });

  assert.deepEqual(diagnostic, {
    ruleId: "solid/example-rule",
    category: "reactivity",
    severity: "warning",
    confidence: "high",
    docsSlug: "example-rule",
    filePath: "src/App.tsx",
    line: 4,
    column: 9,
    message: "Example diagnostic.",
    remediation: "Use the Solid primitive that keeps the read tracked.",
    fixable: false,
  });
});

test("raw findings can override metadata defaults when needed", () => {
  const rule: RuleDefinition = {
    id: "solid/example-rule",
    meta: {
      category: "reactivity",
      defaultSeverity: "warning",
      confidence: "medium",
      docsSlug: "example-rule",
      description: "Example description.",
      why: "Example why.",
      badExample: "bad();",
      preferredExample: "good();",
      remediation: "Default remediation.",
      suppressionGuidance: "Suppress with a reason.",
      references: [],
      fixable: false,
    },
  };

  const diagnostic = normalizeFinding({
    rule,
    context: { relativeFilePath: "src/App.tsx" },
    finding: {
      line: 1,
      column: 1,
      message: "Specific diagnostic.",
      severity: "error",
      confidence: "high",
      remediation: "Specific remediation.",
    },
  });

  assert.equal(diagnostic.severity, "error");
  assert.equal(diagnostic.confidence, "high");
  assert.equal(diagnostic.remediation, "Specific remediation.");
});
