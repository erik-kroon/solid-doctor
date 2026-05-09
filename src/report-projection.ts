import { diagnosticFingerprint, type Diagnostic } from "./diagnostics";
import type { SuppressionHint } from "./adoption-config";
import { findRule } from "./rule-catalog";
import type { DoctorReport } from "./scan";
import type { ScoreReport } from "./scoring";

export type ReportIssue = Diagnostic & {
  fingerprint: string;
  location: string;
  annotationLevel: "error" | "warning";
  ruleTitle: string;
  explanation: string;
  badExample: string;
  preferredExample: string;
  references: string[];
  diffPreview: string | null;
};

export type ReportProjection = {
  schemaVersion: 1;
  project: {
    root: string;
    packageName: string | null;
    kind: string;
    usesSolid: boolean;
    usesSolidStart: boolean;
    packages: Array<{
      relativeRoot: string;
      packageName: string | null;
      kind: string;
      usesSolid: boolean;
    }>;
  };
  score: ScoreReport;
  issues: ReportIssue[];
  suppressionHints: SuppressionHint[];
};

export function projectDoctorReport(report: DoctorReport): ReportProjection {
  return {
    schemaVersion: 1,
    project: {
      root: report.project.root,
      packageName: report.project.packageName,
      kind: report.project.kind,
      usesSolid: report.project.usesSolid,
      usesSolidStart: report.project.usesSolidStart,
      packages: report.project.packages.map((packageProfile) => ({
        relativeRoot: packageProfile.relativeRoot,
        packageName: packageProfile.packageName,
        kind: packageProfile.kind,
        usesSolid: packageProfile.usesSolid,
      })),
    },
    score: report.scores,
    issues: projectIssues(report.diagnostics),
    suppressionHints: report.suppressionHints,
  };
}

export function projectIssues(diagnostics: Diagnostic[]): ReportIssue[] {
  return diagnostics.map(projectIssue);
}

export function projectIssue(diagnostic: Diagnostic): ReportIssue {
  const rule = findRule(diagnostic.ruleId);
  const fingerprint = diagnosticFingerprint(diagnostic);

  return {
    ...diagnostic,
    fingerprint,
    location: `${diagnostic.filePath}:${diagnostic.line}:${diagnostic.column}`,
    annotationLevel: diagnostic.severity === "error" ? "error" : "warning",
    ruleTitle: `${diagnostic.ruleId} [${diagnostic.impact}]: ${diagnostic.remediation}`,
    explanation: rule?.meta.why ?? diagnostic.message,
    badExample: rule?.meta.badExample ?? "",
    preferredExample: rule?.meta.preferredExample ?? "",
    references: rule?.meta.references ?? [],
    diffPreview: diagnostic.fix?.diff ?? null,
  };
}
