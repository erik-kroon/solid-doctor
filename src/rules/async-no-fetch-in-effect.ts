import { CATEGORIES, CONFIDENCE, SEVERITIES, type RawFinding } from "../diagnostics";
import type { RunnableRule } from "../rule-catalog";
import { positionAt } from "../source-location";

const FETCH_PATTERN = /\bfetch\s*\(/;

export const asyncNoFetchInEffectRule: RunnableRule = {
  id: "solid/async-no-fetch-in-effect",
  meta: {
    category: CATEGORIES.async,
    defaultSeverity: SEVERITIES.warning,
    confidence: CONFIDENCE.medium,
    impact: "high",
    impactDescription: "avoids duplicate requests, missing Suspense integration, and stale writes",
    tags: ["async", "createEffect", "resources", "router", "query"],
    docsSlug: "async-no-fetch-in-effect",
    description: "Detects direct application data fetches started from createEffect.",
    why: "Effects do not model async pending, error, cache, preload, SSR, or Suspense state. Solid data fetching belongs in resources, route data, queries, or actions.",
    badExample: "createEffect(() => { void fetch('/api/profile').then(setProfile); });",
    preferredExample:
      "const [profile] = createResource(() => props.userId, async (userId) => fetchProfile(userId));",
    remediation:
      "Move application data fetching to createResource, createAsync/query, route data, or an action with explicit pending and error UI.",
    suppressionGuidance:
      "Suppress only for non-rendering telemetry or fire-and-forget integrations that intentionally do not drive UI state.",
    references: [
      "https://docs.solidjs.com/reference/basic-reactivity/create-resource",
      "https://docs.solidjs.com/solid-router/reference/data-apis/query",
    ],
    fixable: false,
  },
  check(context) {
    const findings: RawFinding[] = [];

    for (const effect of context.trackingScopes.effects) {
      const match = FETCH_PATTERN.exec(effect.body);

      if (!match) {
        continue;
      }

      findings.push({
        ...positionAt(context.sourceText, effect.bodyStart + match.index),
        message: "Application data is fetched from createEffect instead of Solid async primitives.",
      });
    }

    return findings;
  },
};
