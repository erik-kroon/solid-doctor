import { performance } from "node:perf_hooks";

import { diagnosticFingerprint, type Diagnostic } from "./diagnostics";
import {
  applyAdoptionFilters,
  collectInlineSuppressions,
  loadSolidDoctorConfig,
  type SuppressionHint,
} from "./adoption-config";
import type { ChangedLines } from "./diff-filter";
import type { ChangedFiles } from "./diff-filter";
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
  metadata: DoctorRunMetadata;
  score: number;
  scores: ScoreReport;
  classifierMessages: string[];
};

export type DoctorRunMetadata = {
  checkedFiles: number;
  diagnosticsCount: number;
  elapsedMilliseconds: number;
  selectedProjects: SelectedProjectMetadata[];
};

export type SelectedProjectMetadata = {
  relativeRoot: string;
  packageName: string | null;
  checkedFiles: number;
  diagnosticsCount: number;
};

export type ScanOptions = {
  rulePack?: RulePack;
  verbose?: boolean;
  baselineFingerprints?: Set<string>;
  changedLines?: ChangedLines;
  changedFiles?: ChangedFiles;
  selectedProjects?: string[];
};

export async function scanProject(
  projectRoot: string,
  options: ScanOptions = {},
): Promise<DoctorReport> {
  const startedAt = performance.now();
  const project = await classifyProject(projectRoot);
  const config = await loadSolidDoctorConfig(projectRoot);

  if (!project.usesSolid) {
    throw new Error("Solid Doctor only scans projects with a solid-js dependency.");
  }

  const selectedProjects = resolveSelectedProjects(project, options.selectedProjects ?? []);
  const selectedProjectRoots = new Set(
    selectedProjects.map((selectedProject) => selectedProject.relativeRoot),
  );
  const sourceFiles = await collectAnalyzableProjectFiles(project, {
    config,
    selectedProjectRoots,
    changedFiles: options.changedFiles,
  });
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
  const metadata = {
    checkedFiles: sourceFiles.length,
    diagnosticsCount: diagnostics.length,
    elapsedMilliseconds: Number((performance.now() - startedAt).toFixed(2)),
    selectedProjects: selectedProjects.map((selectedProject) => ({
      relativeRoot: selectedProject.relativeRoot,
      packageName: selectedProject.packageName,
      checkedFiles: sourceFiles.filter((sourceFile) =>
        sourceFile.relativeFilePath.startsWith(`${selectedProject.relativeRoot}/`),
      ).length,
      diagnosticsCount: diagnostics.filter((diagnostic) =>
        diagnostic.filePath.startsWith(`${selectedProject.relativeRoot}/`),
      ).length,
    })),
  };

  return {
    project,
    diagnostics,
    suppressionHints: adopted.suppressionHints,
    metadata,
    score: scores.overall,
    scores,
    classifierMessages: options.verbose ? project.classificationSummary : [],
  };
}

function resolveSelectedProjects(
  project: ProjectProfile,
  selectedProjects: string[],
): ProjectProfile["packages"] {
  if (selectedProjects.length === 0) {
    return [];
  }

  return selectedProjects.map((selection) => {
    const match = project.packages.find(
      (packageProfile) =>
        packageProfile.relativeRoot === selection || packageProfile.packageName === selection,
    );

    if (!match) {
      throw new Error(`Unknown project selection '${selection}'.`);
    }

    return match;
  });
}
