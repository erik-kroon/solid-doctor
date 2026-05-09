import type { RawFinding, RuleDefinition } from "./diagnostics";
import { asyncTrackingGapRule } from "./rules/async-tracking-gap";
import { browserGlobalInSsrRule } from "./rules/browser-global-in-ssr";
import { derivedStateInEffectRule } from "./rules/derived-state-in-effect";
import { dynamicMapInJsxRule } from "./rules/dynamic-map-in-jsx";
import { reactivePropSnapshotRule } from "./rules/reactive-prop-snapshot";
import type { RuleContext } from "./rule-runner";

export type RulePack = "mvp" | "none";

export type RunnableRule = RuleDefinition & {
  check(context: RuleContext): Promise<RawFinding[]> | RawFinding[];
};

export const MVP_RULES = [
  reactivePropSnapshotRule,
  derivedStateInEffectRule,
  asyncTrackingGapRule,
  dynamicMapInJsxRule,
  browserGlobalInSsrRule,
];

export function getRules(rulePack: RulePack = "mvp"): RunnableRule[] {
  return rulePack === "none" ? [] : MVP_RULES;
}

export function findRule(ruleIdOrSlug: string): RunnableRule | null {
  return (
    MVP_RULES.find((rule) => rule.id === ruleIdOrSlug || rule.meta.docsSlug === ruleIdOrSlug) ??
    null
  );
}

export function assertRuleMetadataComplete(): void {
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
