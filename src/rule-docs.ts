import { assertRuleMetadataComplete, findRule, type RunnableRule } from "./rule-catalog";

export function renderRuleExplanation(ruleIdOrSlug: string): string {
  if (ruleIdOrSlug === "suppression" || ruleIdOrSlug === "suppressions") {
    return renderSuppressionExplanation();
  }

  const rule = findRule(ruleIdOrSlug);

  if (!rule) {
    throw new Error(`Unknown Solid Doctor rule: ${ruleIdOrSlug}`);
  }

  return renderRuleMetadata(rule);
}

function renderSuppressionExplanation(): string {
  return [
    "Inline suppressions",
    "",
    "Use `solid-doctor-disable-next-line <rule-id>` on the line immediately before the diagnostic to suppress one named rule.",
    "",
    "JavaScript example:",
    "// solid-doctor-disable-next-line solid/browser-global-in-ssr",
    "const title = document.title;",
    "",
    "JSX example:",
    "{/* solid-doctor-disable-next-line solid/dynamic-map-in-jsx */}",
    "{items().map((item) => <li>{item}</li>)}",
    "",
    "Missed suppressions:",
    "An unused suppression is reported when the named rule does not produce a diagnostic on the next physical line. Unknown rule ids are reported separately.",
  ].join("\n");
}

export function renderRuleMetadata(rule: RunnableRule): string {
  return [
    `${rule.id}`,
    "",
    `Category: ${rule.meta.category}`,
    `Impact: ${rule.meta.impact} (${rule.meta.impactDescription})`,
    `Default severity: ${rule.meta.defaultSeverity}`,
    `Confidence: ${rule.meta.confidence}`,
    `Tags: ${rule.meta.tags.join(", ")}`,
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
