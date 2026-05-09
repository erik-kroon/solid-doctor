import { CATEGORIES, CONFIDENCE, SEVERITIES, type RawFinding } from "../diagnostics";
import { localNameFor } from "../reactive-source-model";
import type { RunnableRule } from "../rule-catalog";
import { positionAt } from "../source-location";
import { escapeRegExp } from "./rule-utils";

const REGISTRATION_PATTERN = /\b(addEventListener|setInterval|setTimeout|observe|subscribe)\s*\(/;

export const effectCleanupSubscriptionsRule: RunnableRule = {
  id: "solid/effect-cleanup-subscriptions",
  meta: {
    category: CATEGORIES.effect,
    defaultSeverity: SEVERITIES.warning,
    confidence: CONFIDENCE.medium,
    impact: "medium",
    impactDescription: "avoids duplicate handlers after remounts and reactive reruns",
    tags: ["effect", "cleanup", "onCleanup", "subscriptions"],
    docsSlug: "effect-cleanup-subscriptions",
    description:
      "Detects effects and mount hooks that register listeners, timers, observers, or subscriptions without cleanup.",
    why: "Owner cleanup runs before an effect reruns and when a component disposes. Registrations without paired cleanup can leak handlers or duplicate work.",
    badExample: 'onMount(() => { window.addEventListener("resize", updateLayout); });',
    preferredExample:
      'onMount(() => { window.addEventListener("resize", updateLayout); onCleanup(() => window.removeEventListener("resize", updateLayout)); });',
    remediation:
      "Pair external registrations with onCleanup in the same owner scope, using stable handler references for removals.",
    suppressionGuidance:
      "Suppress only when the API returns no disposable resource and the registration is guaranteed to be process-lifetime.",
    references: [
      "https://docs.solidjs.com/reference/lifecycle/on-cleanup",
      "https://docs.solidjs.com/reference/basic-reactivity/create-effect",
    ],
    fixable: false,
  },
  check(context) {
    const cleanupName = localNameFor(context.reactiveSources.solidImports, "onCleanup");
    const cleanupPattern = new RegExp(`\\b${escapeRegExp(cleanupName)}\\s*\\(`);
    const findings: RawFinding[] = [];

    for (const scope of context.trackingScopes.scopes) {
      if (scope.kind !== "effect" && scope.kind !== "mount") {
        continue;
      }

      const registration = REGISTRATION_PATTERN.exec(scope.body);

      if (!registration || cleanupPattern.test(scope.body)) {
        continue;
      }

      findings.push({
        ...positionAt(context.sourceText, scope.bodyStart + registration.index),
        message: "External registration is created without paired onCleanup in this owner scope.",
      });
    }

    return findings;
  },
};
