import { CATEGORIES, CONFIDENCE, SEVERITIES } from "../diagnostics";
import type { RunnableRule } from "../rule-catalog";

export const storeDestructureSnapshotRule: RunnableRule = {
  id: "solid/store-destructure-snapshot",
  meta: {
    category: CATEGORIES.reactivity,
    defaultSeverity: SEVERITIES.warning,
    confidence: CONFIDENCE.high,
    impact: "high",
    impactDescription: "prevents stale store snapshots in JSX",
    tags: ["reactive", "stores", "destructuring", "createStore"],
    docsSlug: "store-destructure-snapshot",
    description: "Detects destructured Solid store properties later used in returned JSX.",
    why: "Solid stores track property access through the proxy. Destructuring a store property into a local value can disconnect later JSX reads from the store.",
    badExample: "const { profile } = state; return <h1>{profile.name}</h1>;",
    preferredExample: "return <h1>{state.profile.name}</h1>;",
    remediation:
      "Read store properties through the store proxy in JSX, or wrap intentional derivations in createMemo.",
    suppressionGuidance:
      "Suppress only when the destructured value is intentionally a one-time snapshot and will not be expected to update.",
    references: ["https://docs.solidjs.com/concepts/stores"],
    fixable: false,
  },
  check(context) {
    return context.reactiveReads.storeSnapshotsUsedInReturnedJsx().map((snapshot) => ({
      line: snapshot.line,
      column: snapshot.column,
      message: `Local value '${snapshot.localName}' snapshots ${snapshot.sourceName}.${snapshot.propertyName} before JSX can track the store property.`,
      remediation: `Read ${snapshot.sourceName}.${snapshot.propertyName} through the store proxy in JSX, or wrap the derivation in createMemo.`,
    }));
  },
};
