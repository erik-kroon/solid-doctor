import { readFile } from "node:fs/promises";

import { type Diagnostic, normalizeFinding } from "./diagnostics";
import type { ProjectSourceFile } from "./project-file-set";
import type { ProjectProfile } from "./project-classifier";
import { analyzeReactiveReads, type ReactiveReadModel } from "./reactive-read-model";
import { analyzeReactiveSources, type ReactiveSourceModel } from "./reactive-source-model";
import { getRules } from "./rule-catalog";
import type { RulePack } from "./rule-catalog";
import { analyzeTrackingScopes, type TrackingScopeModel } from "./tracking-scope-model";

export type RuleContext = {
  project: ProjectProfile;
  filePath: string;
  relativeFilePath: string;
  sourceText: string;
  reactiveSources: ReactiveSourceModel;
  trackingScopes: TrackingScopeModel;
  reactiveReads: ReactiveReadModel;
};

export async function runRules({
  project,
  sourceFiles,
  rulePack = "mvp",
}: {
  project: ProjectProfile;
  sourceFiles: ProjectSourceFile[];
  rulePack?: RulePack;
}): Promise<Diagnostic[]> {
  const diagnostics: Diagnostic[] = [];
  const rules = getRules(rulePack);

  for (const sourceFile of sourceFiles) {
    const sourceText = await readFile(sourceFile.filePath, "utf8");
    const context = createRuleContext({ project, sourceFile, sourceText });

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
  sourceFile,
  sourceText,
}: {
  project: ProjectProfile;
  sourceFile: ProjectSourceFile;
  sourceText: string;
}): RuleContext {
  const reactiveSources = analyzeReactiveSources(sourceText);
  const trackingScopes = analyzeTrackingScopes(sourceText, reactiveSources);

  return {
    project,
    filePath: sourceFile.filePath,
    relativeFilePath: sourceFile.relativeFilePath,
    sourceText,
    reactiveSources,
    trackingScopes,
    reactiveReads: analyzeReactiveReads({ source: sourceText, reactiveSources, trackingScopes }),
  };
}
