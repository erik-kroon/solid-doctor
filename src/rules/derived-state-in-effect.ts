import { CATEGORIES, CONFIDENCE, SEVERITIES, type RawFinding } from "../diagnostics";
import type { RunnableRule } from "../rule-catalog";

export const derivedStateInEffectRule: RunnableRule = {
  id: "solid/derived-state-in-effect",
  meta: {
    category: CATEGORIES.reactivity,
    defaultSeverity: SEVERITIES.warning,
    confidence: CONFIDENCE.medium,
    impact: "high",
    impactDescription: "avoids redundant updates and state drift",
    tags: ["reactive", "effects", "createMemo", "derived-state"],
    docsSlug: "derived-state-in-effect",
    description:
      "Detects effects that mirror reactive inputs into another signal as derived state.",
    why: "Effects are for side effects. Derived values are easier to reason about when modeled as memos or direct reactive reads.",
    badExample: "createEffect(() => setFullName(`${props.first} ${props.last}`));",
    preferredExample: "const fullName = createMemo(() => `${props.first} ${props.last}`);",
    remediation:
      "Use createMemo or derive the value directly in JSX instead of mirroring reactive state from an effect.",
    suppressionGuidance:
      "Suppress only when the effect is synchronizing with an external system rather than deriving app state.",
    references: ["https://docs.solidjs.com/reference/basic-reactivity/create-effect"],
    fixable: false,
  },
  check(context) {
    const findings: RawFinding[] = [];

    for (const effect of context.trackingScopes.effects) {
      if (!context.reactiveReads.hasReadInRegion(effect)) {
        continue;
      }

      for (const write of context.reactiveReads.writesInRegion(effect)) {
        findings.push({
          line: write.line,
          column: write.column,
          message: `Effect writes derived state with '${write.setterName}' from reactive inputs.`,
        });
      }
    }

    return findings;
  },
};
