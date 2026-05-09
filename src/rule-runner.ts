import { readFile } from "node:fs/promises";

import { type Diagnostic, normalizeFinding } from "./diagnostics";
import { analyzeFile, type FileAnalysis } from "./file-analysis";
import type { ProjectSourceFile } from "./project-file-set";
import type { ProjectProfile } from "./project-classifier";
import { getRules } from "./rule-catalog";
import type { RulePack } from "./rule-catalog";

export type RuleContext = {
  project: ProjectProfile;
  filePath: string;
  relativeFilePath: string;
  analysis: FileAnalysis;
};

export async function runRules({
  project,
  sourceFiles,
  rulePack = "core",
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
  return {
    project,
    filePath: sourceFile.filePath,
    relativeFilePath: sourceFile.relativeFilePath,
    analysis: analyzeFile(sourceText),
  };
}
