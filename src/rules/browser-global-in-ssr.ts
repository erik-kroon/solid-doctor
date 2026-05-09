import { CATEGORIES, CONFIDENCE, SEVERITIES, type RawFinding } from "../diagnostics";
import type { RunnableRule } from "../rule-runner";
import { positionAt } from "./rule-utils";

const BROWSER_GLOBAL_PATTERN = /\b(window|document|localStorage|sessionStorage|navigator)\b/g;

export const browserGlobalInSsrRule: RunnableRule = {
  id: "solid/browser-global-in-ssr",
  meta: {
    category: CATEGORIES.ssr,
    defaultSeverity: SEVERITIES.error,
    confidence: CONFIDENCE.high,
    docsSlug: "browser-global-in-ssr",
    description: "Detects browser globals read from SSR-capable files.",
    why: "SolidStart server rendering can evaluate route and module code where browser globals such as window and document do not exist.",
    badExample: "const title = document.title;",
    preferredExample: "onMount(() => { const title = document.title; });",
    remediation:
      "Move browser-only access behind onMount, a client-only boundary, or a runtime browser guard.",
    suppressionGuidance:
      "Suppress only when the file is guaranteed to execute in the browser despite its path classification.",
    references: ["https://docs.solidjs.com/solid-start"],
    fixable: false,
  },
  check(context) {
    const fileClassification = context.project.fileClassifications.get(context.relativeFilePath);

    if (!fileClassification?.serverCapable) {
      return [];
    }

    const findings: RawFinding[] = [];
    const { onMountRanges } = context.trackingScopes;
    let match: RegExpExecArray | null;

    while ((match = BROWSER_GLOBAL_PATTERN.exec(context.sourceText))) {
      const matchIndex = match.index;

      if (onMountRanges.some((range) => matchIndex >= range.start && matchIndex <= range.end)) {
        continue;
      }

      findings.push({
        ...positionAt(context.sourceText, matchIndex),
        message: `Browser global '${match[1]}' is read in an SSR-capable file.`,
      });
    }

    return findings;
  },
};
