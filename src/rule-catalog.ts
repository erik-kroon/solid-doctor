import type { RawFinding, RuleDefinition } from "./diagnostics";
import { asyncNoFetchInEffectRule } from "./rules/async-no-fetch-in-effect";
import { asyncTrackingGapRule } from "./rules/async-tracking-gap";
import { browserGlobalInSsrRule } from "./rules/browser-global-in-ssr";
import { derivedStateInEffectRule } from "./rules/derived-state-in-effect";
import { dynamicMapInJsxRule } from "./rules/dynamic-map-in-jsx";
import { effectCleanupSubscriptionsRule } from "./rules/effect-cleanup-subscriptions";
import { reactivePropSnapshotRule } from "./rules/reactive-prop-snapshot";
import { renderStableChildrenRule } from "./rules/render-stable-children";
import { serverRequestScopedStateRule } from "./rules/server-request-scoped-state";
import type { RuleContext } from "./rule-runner";

export type RulePack = "mvp" | "none";

export type RunnableRule = RuleDefinition & {
  check(context: RuleContext): Promise<RawFinding[]> | RawFinding[];
};

export const MVP_RULES = [
  reactivePropSnapshotRule,
  derivedStateInEffectRule,
  asyncTrackingGapRule,
  asyncNoFetchInEffectRule,
  dynamicMapInJsxRule,
  renderStableChildrenRule,
  browserGlobalInSsrRule,
  serverRequestScopedStateRule,
  effectCleanupSubscriptionsRule,
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
      rule.meta.impactDescription,
      rule.meta.suppressionGuidance,
      ...rule.meta.tags,
      ...rule.meta.references,
    ];

    if (fields.some((field) => field.trim().length === 0)) {
      throw new Error(`Rule ${rule.id} has incomplete docs metadata.`);
    }
  }
}
