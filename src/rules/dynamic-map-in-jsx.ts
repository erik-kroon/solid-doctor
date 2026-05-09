import { CATEGORIES, CONFIDENCE, SEVERITIES, type RawFinding } from "../diagnostics";
import type { RunnableRule } from "../rule-runner";
import { lineEndAt, lineStartAt, positionAt } from "./rule-utils";

export const dynamicMapInJsxRule: RunnableRule = {
  id: "solid/dynamic-map-in-jsx",
  meta: {
    category: CATEGORIES.reactivity,
    defaultSeverity: SEVERITIES.warning,
    confidence: CONFIDENCE.medium,
    docsSlug: "dynamic-map-in-jsx",
    description: "Detects reactive arrays rendered with .map() directly in JSX.",
    why: "Solid's list control-flow components preserve fine-grained updates and make dynamic list intent explicit.",
    badExample: "<ul>{items().map((item) => <li>{item}</li>)}</ul>",
    preferredExample: "<ul><For each={items()}>{(item) => <li>{item}</li>}</For></ul>",
    remediation:
      "Use Solid's <For> or <Index> control-flow component for reactive arrays rendered in JSX.",
    suppressionGuidance:
      "Suppress only for arrays that are known to be static for the component lifetime.",
    references: [
      "https://docs.solidjs.com/reference/components/for",
      "https://docs.solidjs.com/reference/components/index-component",
    ],
    fixable: false,
  },
  check(context) {
    const findings: RawFinding[] = [];
    const pattern = /\b([A-Za-z_$][\w$]*(?:\(\)|(?:\.[A-Za-z_$][\w$]*)+))\.map\s*\(/g;
    let match;

    while ((match = pattern.exec(context.sourceText))) {
      const lineStart = lineStartAt(context.sourceText, match.index);
      const lineEnd = lineEndAt(context.sourceText, match.index);
      const line = context.sourceText.slice(lineStart, lineEnd);

      if (!line.includes("{") || !line.includes("map")) {
        continue;
      }

      if (!match[1] || !context.reactiveSources.isReactiveMapExpression(match[1])) {
        continue;
      }

      findings.push({
        ...positionAt(context.sourceText, match.index),
        message:
          "Reactive array mapping in JSX uses React-shaped .map(); Solid tracks lists with control-flow components.",
      });
    }

    return findings;
  },
};
