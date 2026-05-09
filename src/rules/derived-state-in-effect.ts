import { CATEGORIES, CONFIDENCE, SEVERITIES, type RawFinding } from "../diagnostics";
import type { RunnableRule } from "../rule-runner";
import { escapeRegExp, positionAt } from "./rule-utils";

export const derivedStateInEffectRule: RunnableRule = {
  id: "solid/derived-state-in-effect",
  meta: {
    category: CATEGORIES.reactivity,
    defaultSeverity: SEVERITIES.warning,
    confidence: CONFIDENCE.medium,
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
    const signalSetters = context.reactiveSources.signalSetters;

    for (const effect of context.trackingScopes.effects) {
      if (!context.reactiveSources.hasReactiveRead(effect.body)) {
        continue;
      }

      for (const setter of signalSetters) {
        const setterIndex = effect.body.search(new RegExp(`\\b${escapeRegExp(setter)}\\s*\\(`));

        if (setterIndex === -1) {
          continue;
        }

        const position = positionAt(context.sourceText, effect.bodyStart + setterIndex);
        findings.push({
          ...position,
          message: `Effect writes derived state with '${setter}' from reactive inputs.`,
        });
      }
    }

    return findings;
  },
};
