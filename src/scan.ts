import { diagnosticFingerprint, type Diagnostic } from "./diagnostics";
import {
  applyAdoptionFilters,
  collectInlineSuppressions,
  loadSolidDoctorConfig,
  type SuppressionHint,
} from "./adoption-config";
import type { ChangedLines } from "./diff-filter";
import { filterDiagnosticsToChangedLines } from "./diff-filter";
import { collectAnalyzableProjectFiles } from "./project-file-set";
import { classifyProject, type ProjectProfile } from "./project-classifier";
import { runRules } from "./rule-runner";
import type { RulePack } from "./rule-catalog";
import { calculateScore, type ScoreReport } from "./scoring";

export type DoctorReport = {
  project: ProjectProfile;
  diagnostics: Diagnostic[];
  suppressionHints: SuppressionHint[];
  score: number;
  scores: ScoreReport;
  classifierMessages: string[];
};

export type ScanOptions = {
  rulePack?: RulePack;
  verbose?: boolean;
  baselineFingerprints?: Set<string>;
  changedLines?: ChangedLines;
};

export async function scanProject(
  projectRoot: string,
  options: ScanOptions = {},
): Promise<DoctorReport> {
  const project = await classifyProject(projectRoot);
  const config = await loadSolidDoctorConfig(projectRoot);

  if (!project.usesSolid) {
    throw new Error("Solid Doctor only scans projects with a solid-js dependency.");
  }

  const sourceFiles = await collectAnalyzableProjectFiles(project, { config });
  const rawDiagnostics = await runRules({ project, sourceFiles, rulePack: options.rulePack });
  const adopted = applyAdoptionFilters({
    diagnostics: rawDiagnostics,
    suppressions: await collectInlineSuppressions(sourceFiles),
    config,
  });
  const unbaselinedDiagnostics = adopted.diagnostics.filter(
    (diagnostic) => !options.baselineFingerprints?.has(diagnosticFingerprint(diagnostic)),
  );
  const diagnostics = filterDiagnosticsToChangedLines(unbaselinedDiagnostics, options.changedLines);
  const scores = calculateScore(diagnostics);

  return {
    project,
    diagnostics,
    suppressionHints: adopted.suppressionHints,
    score: scores.overall,
    scores,
    classifierMessages: options.verbose ? project.classificationSummary : [],
  };
}
