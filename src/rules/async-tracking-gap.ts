import { CATEGORIES, CONFIDENCE, SEVERITIES, type RawFinding } from "../diagnostics";
import type { RunnableRule } from "../rule-runner";
import { positionAt } from "./rule-utils";

export const asyncTrackingGapRule: RunnableRule = {
  id: "solid/async-tracking-gap",
  meta: {
    category: CATEGORIES.reactivity,
    defaultSeverity: SEVERITIES.warning,
    confidence: CONFIDENCE.medium,
    docsSlug: "async-tracking-gap",
    description: "Detects reactive reads after await inside tracked effects.",
    why: "Solid tracks dependencies synchronously. Reads after await do not participate in the original tracking scope.",
    badExample: "createEffect(async () => { await load(); console.log(props.id); });",
    preferredExample: "createEffect(() => { const id = props.id; void load(id); });",
    remediation:
      "Read tracked dependencies before await, pass them into the async work, or model the work with createResource.",
    suppressionGuidance:
      "Suppress only when the post-await read is deliberately untracked and the async work is not expected to rerun.",
    references: [
      "https://docs.solidjs.com/reference/basic-reactivity/create-effect",
      "https://docs.solidjs.com/reference/basic-reactivity/create-resource",
    ],
    fixable: false,
  },
  check(context) {
    const findings: RawFinding[] = [];

    for (const effect of context.trackingScopes.effects) {
      if (effect.asyncAfterAwaitStart === null) {
        continue;
      }

      const afterAwait = context.sourceText.slice(
        effect.asyncAfterAwaitStart + "await ".length,
        effect.end,
      );

      if (!context.reactiveSources.hasReactiveRead(afterAwait)) {
        continue;
      }

      findings.push({
        ...positionAt(context.sourceText, effect.asyncAfterAwaitStart),
        message:
          "Reactive values read after await are outside Solid's synchronous tracking window.",
      });
    }

    return findings;
  },
};
