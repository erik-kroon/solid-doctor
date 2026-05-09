import type { DiagnosticFix } from "./diagnostics";
import { projectDoctorReport, type ReportProjection } from "./report-projection";
import type { DoctorReport } from "./scan";

export type AgentReport = {
  schemaVersion: 1;
  project: ReportProjection["project"];
  score: ReportProjection["score"];
  metadata: ReportProjection["metadata"];
  diagnostics: AgentDiagnostic[];
  suppressionHints: ReportProjection["suppressionHints"];
};

export type AgentDiagnostic = {
  ruleId: string;
  severity: string;
  confidence: string;
  impact: string;
  category: string;
  tags: string[];
  message: string;
  explanation: string;
  remediation: string;
  fileContext: {
    filePath: string;
    line: number;
    column: number;
    location: string;
  };
  fix: {
    fixable: boolean;
    safe: boolean | null;
    diff: string | null;
  };
  references: string[];
};

export function projectAgentReport(report: DoctorReport): AgentReport {
  const projection = projectDoctorReport(report);

  return {
    schemaVersion: projection.schemaVersion,
    project: projection.project,
    score: projection.score,
    metadata: projection.metadata,
    diagnostics: projection.issues.map((issue) => ({
      ruleId: issue.ruleId,
      severity: issue.severity,
      confidence: issue.confidence,
      impact: issue.impact,
      category: issue.category,
      tags: issue.tags,
      message: issue.message,
      explanation: issue.explanation,
      remediation: issue.remediation,
      fileContext: {
        filePath: issue.filePath,
        line: issue.line,
        column: issue.column,
        location: issue.location,
      },
      fix: toAgentFix(issue),
      references: issue.references,
    })),
    suppressionHints: projection.suppressionHints,
  };
}

function toAgentFix(issue: { fixable: boolean; fix?: DiagnosticFix }): AgentDiagnostic["fix"] {
  return {
    fixable: issue.fixable,
    safe: issue.fix?.safe ?? null,
    diff: issue.fix?.diff ?? null,
  };
}
