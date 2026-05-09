import { CATEGORIES, CONFIDENCE, SEVERITIES } from "../diagnostics";
import type { RunnableRule } from "../rule-catalog";

export const dynamicMapInJsxRule: RunnableRule = {
  id: "solid/dynamic-map-in-jsx",
  meta: {
    category: CATEGORIES.render,
    defaultSeverity: SEVERITIES.warning,
    confidence: CONFIDENCE.medium,
    impact: "medium-high",
    impactDescription: "preserves DOM identity and avoids inefficient list updates",
    tags: ["render", "lists", "For", "Index"],
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
    return context.reactiveReads.reactiveJsxListSources().map((source) => ({
      line: source.line,
      column: source.column,
      message:
        "Reactive array mapping in JSX uses React-shaped .map(); Solid tracks lists with control-flow components.",
    }));
  },
};
