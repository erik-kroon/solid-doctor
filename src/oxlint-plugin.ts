import { relative } from "node:path";

import { type RawFinding } from "./diagnostics";
import { analyzeFile } from "./file-analysis";
import { classifyFile, PROJECT_KINDS, type ProjectProfile } from "./project-classifier";
import { MVP_RULES, type RunnableRule } from "./rule-catalog";
import type { RuleContext } from "./rule-runner";

const OXLINT_COMPATIBLE_RULE_IDS = new Set([
  "solid/reactive-prop-snapshot",
  "solid/store-destructure-snapshot",
  "solid/derived-state-in-effect",
  "solid/async-tracking-gap",
  "solid/async-no-fetch-in-effect",
  "solid/dynamic-map-in-jsx",
  "solid/render-stable-children",
  "solid/effect-cleanup-subscriptions",
]);

export const OXLINT_COMPATIBLE_RULES = MVP_RULES.filter((rule) =>
  OXLINT_COMPATIBLE_RULE_IDS.has(rule.id),
);

export type OxlintPlugin = {
  meta: {
    name: "solid-doctor";
  };
  rules: Record<string, OxlintRule>;
};

type OxlintRule = {
  create(context: OxlintContext): {
    Program(): void;
  };
};

type OxlintContext = {
  filename: string;
  cwd?: string;
  sourceCode: {
    text: string;
  };
  report(diagnostic: OxlintDiagnostic): void;
};

type OxlintDiagnostic = {
  message: string;
  loc: {
    line: number;
    column: number;
  };
};

const plugin: OxlintPlugin = {
  meta: {
    name: "solid-doctor",
  },
  rules: Object.fromEntries(
    OXLINT_COMPATIBLE_RULES.map((rule) => [oxlintRuleName(rule.id), createOxlintRule(rule)]),
  ),
};

export default plugin;

export function oxlintRuleName(ruleId: string): string {
  return ruleId.replace(/^solid\//, "");
}

function createOxlintRule(rule: RunnableRule): OxlintRule {
  return {
    create(context) {
      return {
        Program() {
          const findings = rule.check(createPluginRuleContext(context));

          if (isPromiseLike(findings)) {
            throw new Error(`Oxlint plugin rule ${rule.id} must run synchronously.`);
          }

          for (const finding of findings) {
            reportFinding(context, rule, finding);
          }
        },
      };
    },
  };
}

function createPluginRuleContext(context: OxlintContext): RuleContext {
  const sourceText = context.sourceCode.text;
  const projectRoot = context.cwd ?? process.cwd();
  const relativeFilePath = relative(projectRoot, context.filename).replaceAll("\\", "/");
  const classification = classifyFile(relativeFilePath, {
    kind: PROJECT_KINDS.solid,
    usesSolidStart: false,
  });
  return {
    project: {
      root: projectRoot,
      packageName: null,
      usesSolid: true,
      usesSolidStart: false,
      ssrCapable: false,
      kind: PROJECT_KINDS.solid,
      packages: [],
      fileClassifications: new Map([[relativeFilePath, classification]]),
      clientOnlyFiles: classification.clientOnly ? new Set([relativeFilePath]) : new Set(),
      ignoredFiles: classification.ignored ? new Set([relativeFilePath]) : new Set(),
      classificationSummary: [],
    } satisfies ProjectProfile,
    filePath: context.filename,
    relativeFilePath,
    analysis: analyzeFile(sourceText),
  };
}

function reportFinding(context: OxlintContext, rule: RunnableRule, finding: RawFinding): void {
  context.report({
    message: `${finding.message} ${finding.remediation ?? rule.meta.remediation}`,
    loc: {
      line: finding.line,
      column: Math.max(finding.column - 1, 0),
    },
  });
}

function isPromiseLike(value: unknown): value is Promise<unknown> {
  return typeof value === "object" && value !== null && "then" in value;
}
