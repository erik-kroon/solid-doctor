import type { Diagnostic } from "./diagnostics";
import type { ChangedLines } from "./diff-filter";
import { filterDiagnosticsToChangedLines } from "./diff-filter";
import { collectAnalyzableProjectFiles } from "./project-file-set";
import { classifyProject, type ProjectProfile } from "./project-classifier";
import { runRules } from "./rule-runner";
import type { RulePack } from "./rule-catalog";
import { calculateScore, diagnosticFingerprint, type ScoreReport } from "./scoring";

export type DoctorReport = {
  project: ProjectProfile;
  diagnostics: Diagnostic[];
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

  if (!project.usesSolid) {
    throw new Error("Solid Doctor only scans projects with a solid-js dependency.");
  }

  const sourceFiles = await collectAnalyzableProjectFiles(project);
  const rawDiagnostics = await runRules({ project, sourceFiles, rulePack: options.rulePack });
  const unbaselinedDiagnostics = rawDiagnostics.filter(
    (diagnostic) => !options.baselineFingerprints?.has(diagnosticFingerprint(diagnostic)),
  );
  const diagnostics = filterDiagnosticsToChangedLines(unbaselinedDiagnostics, options.changedLines);
  const scores = calculateScore(diagnostics);

  return {
    project,
    diagnostics,
    score: scores.overall,
    scores,
    classifierMessages: options.verbose ? project.classificationSummary : [],
  };
}
