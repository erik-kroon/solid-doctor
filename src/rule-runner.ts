import { readFile } from "node:fs/promises";
import { relative } from "node:path";

import {
  type Diagnostic,
  type RawFinding,
  type RuleDefinition,
  normalizeFinding,
} from "./diagnostics";
import type { ProjectProfile } from "./project-classifier";
import { analyzeReactiveSources, type ReactiveSourceModel } from "./reactive-source-model";
import { asyncTrackingGapRule } from "./rules/async-tracking-gap";
import { browserGlobalInSsrRule } from "./rules/browser-global-in-ssr";
import { derivedStateInEffectRule } from "./rules/derived-state-in-effect";
import { dynamicMapInJsxRule } from "./rules/dynamic-map-in-jsx";
import { reactivePropSnapshotRule } from "./rules/reactive-prop-snapshot";
import { analyzeTrackingScopes, type TrackingScopeModel } from "./tracking-scope-model";

export const MVP_RULES = [
  reactivePropSnapshotRule,
  derivedStateInEffectRule,
  asyncTrackingGapRule,
  dynamicMapInJsxRule,
  browserGlobalInSsrRule,
];

export type RulePack = "mvp" | "none";

export type RuleContext = {
  project: ProjectProfile;
  filePath: string;
  relativeFilePath: string;
  sourceText: string;
  reactiveSources: ReactiveSourceModel;
  trackingScopes: TrackingScopeModel;
};

export type RunnableRule = RuleDefinition & {
  check(context: RuleContext): Promise<RawFinding[]> | RawFinding[];
};

export function getRules(rulePack: RulePack = "mvp"): RunnableRule[] {
  return rulePack === "none" ? [] : MVP_RULES;
}

export function findRule(ruleIdOrSlug: string): RunnableRule | null {
  return (
    MVP_RULES.find((rule) => rule.id === ruleIdOrSlug || rule.meta.docsSlug === ruleIdOrSlug) ??
    null
  );
}

export async function runRules({
  project,
  sourceFiles,
  rulePack = "mvp",
}: {
  project: ProjectProfile;
  sourceFiles: string[];
  rulePack?: RulePack;
}): Promise<Diagnostic[]> {
  const diagnostics: Diagnostic[] = [];
  const rules = getRules(rulePack);

  for (const filePath of sourceFiles) {
    const sourceText = await readFile(filePath, "utf8");
    const context = createRuleContext({ project, filePath, sourceText });

    for (const rule of rules) {
      const findings = await rule.check(context);

      for (const finding of findings) {
        diagnostics.push(normalizeFinding({ rule, finding, context }));
      }
    }
  }

  return diagnostics;
}

function createRuleContext({
  project,
  filePath,
  sourceText,
}: {
  project: ProjectProfile;
  filePath: string;
  sourceText: string;
}): RuleContext {
  const reactiveSources = analyzeReactiveSources(sourceText);

  return {
    project,
    filePath,
    relativeFilePath: relative(project.root, filePath),
    sourceText,
    reactiveSources,
    trackingScopes: analyzeTrackingScopes(sourceText, reactiveSources),
  };
}
