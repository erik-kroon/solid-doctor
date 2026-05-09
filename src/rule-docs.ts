import { assertRuleMetadataComplete, findRule, type RunnableRule } from "./rule-catalog";

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
  assertRuleMetadataComplete();
}
