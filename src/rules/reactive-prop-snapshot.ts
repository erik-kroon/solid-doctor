import { CATEGORIES, CONFIDENCE, SEVERITIES } from "../diagnostics";
import type { RunnableRule } from "../rule-catalog";

export const reactivePropSnapshotRule: RunnableRule = {
  id: "solid/reactive-prop-snapshot",
  meta: {
    category: CATEGORIES.reactivity,
    defaultSeverity: SEVERITIES.warning,
    confidence: CONFIDENCE.high,
    docsSlug: "reactive-prop-snapshot",
    description: "Detects local snapshots of component props that are later used in JSX.",
    why: "Solid components run once, so copying props into a local value before JSX can disconnect the JSX read from prop updates.",
    badExample: "const name = props.name; return <h1>{name}</h1>;",
    preferredExample: "return <h1>{props.name}</h1>;",
    remediation:
      "Read the prop inside JSX, use a prop accessor, or wrap the derivation in createMemo.",
    suppressionGuidance:
      "Suppress only when the value is intentionally a one-time initial snapshot and is not expected to update.",
    references: ["https://docs.solidjs.com/concepts/components/props"],
    fixable: false,
  },
  check(context) {
    return context.reactiveReads.propSnapshotsUsedInReturnedJsx().map((snapshot) => ({
      line: snapshot.line,
      column: snapshot.column,
      message: `Local value '${snapshot.localName}' snapshots ${snapshot.sourceName}.${snapshot.propName} before JSX can track it.`,
      remediation: `Read ${snapshot.sourceName}.${snapshot.propName} inside JSX, use a prop accessor, or wrap the derivation in createMemo.`,
    }));
  },
};
