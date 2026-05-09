import { findRule, getRules, type RunnableRule } from "./rule-runner";

export function renderRuleExplanation(ruleIdOrSlug: string): string {
  const rule = findRule(ruleIdOrSlug);

  if (!rule) {
    throw new Error(`Unknown Solid Doctor rule: ${ruleIdOrSlug}`);
  }

  return renderRuleMetadata(rule);
}

export function renderRuleMetadata(rule: RunnableRule): string {
  return [
    `${rule.id}`,
    "",
    `Category: ${rule.meta.category}`,
    `Default severity: ${rule.meta.defaultSeverity}`,
    `Confidence: ${rule.meta.confidence}`,
    "",
    rule.meta.description,
    "",
    "Why it matters:",
    rule.meta.why,
    "",
    "Bad pattern:",
    rule.meta.badExample,
    "",
    "Preferred pattern:",
    rule.meta.preferredExample,
    "",
    "Remediation:",
    rule.meta.remediation,
    "",
    "Suppression:",
    rule.meta.suppressionGuidance,
    "",
    "References:",
    ...rule.meta.references.map((reference) => `- ${reference}`),
  ].join("\n");
}

export function assertRuleDocsComplete(): void {
  for (const rule of getRules()) {
    const fields = [
      rule.meta.description,
      rule.meta.why,
      rule.meta.badExample,
      rule.meta.preferredExample,
      rule.meta.remediation,
      rule.meta.suppressionGuidance,
      ...rule.meta.references,
    ];

    if (fields.some((field) => field.trim().length === 0)) {
      throw new Error(`Rule ${rule.id} has incomplete docs metadata.`);
    }
  }
}
