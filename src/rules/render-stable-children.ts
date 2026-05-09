import { CATEGORIES, CONFIDENCE, SEVERITIES, type RawFinding } from "../diagnostics";
import type { RunnableRule } from "../rule-catalog";
import { escapeRegExp } from "./rule-utils";

export const renderStableChildrenRule: RunnableRule = {
  id: "solid/render-stable-children",
  meta: {
    category: CATEGORIES.render,
    defaultSeverity: SEVERITIES.warning,
    confidence: CONFIDENCE.medium,
    impact: "medium",
    impactDescription: "avoids duplicated child resolution and surprising reactive reads",
    tags: ["render", "children", "props"],
    docsSlug: "render-stable-children",
    description: "Detects repeated props.children reads without Solid's children() helper.",
    why: "props.children can be a getter. Re-reading or inspecting it can duplicate work and make lazy child evaluation harder to reason about.",
    badExample: "<><main>{props.children}</main><footer>{props.children}</footer></>",
    preferredExample:
      "const resolved = children(() => props.children); return <><main>{resolved()}</main><footer>{resolved()}</footer></>;",
    remediation:
      "Resolve children once with children(() => props.children) before reading or passing them through multiple times.",
    suppressionGuidance:
      "Suppress only when children are intentionally read once per independent lazy branch.",
    references: ["https://docs.solidjs.com/concepts/components/props"],
    fixable: false,
  },
  check(context) {
    const childrenName = context.analysis.localNameFor("children");
    const findings: RawFinding[] = [];

    for (const propsName of context.analysis.propNames()) {
      const readPattern = new RegExp(`\\b${escapeRegExp(propsName)}\\.children\\b`, "g");
      const resolverPattern = new RegExp(
        `\\b${escapeRegExp(childrenName)}\\s*\\(\\s*\\(\\s*\\)\\s*=>\\s*${escapeRegExp(
          propsName,
        )}\\.children\\b`,
      );
      const reads = [...context.analysis.sourceText().matchAll(readPattern)];

      if (reads.length < 2 || resolverPattern.test(context.analysis.sourceText())) {
        continue;
      }

      const firstRead = reads[0];

      if (firstRead?.index === undefined) {
        continue;
      }

      findings.push({
        ...context.analysis.positionAt(firstRead.index),
        message: `${propsName}.children is read ${reads.length} times without children() resolution.`,
      });
    }

    return findings;
  },
};
