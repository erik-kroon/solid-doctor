import { resolve } from "node:path";

import { projectDoctorReport } from "./report-projection";
import { scanProject, type DoctorReport, type ScanOptions } from "./scan";

export type DiagnoseOptions = ScanOptions;

export async function diagnose(
  projectRoot: string,
  options: DiagnoseOptions = {},
): Promise<DoctorReport> {
  return scanProject(resolve(projectRoot), options);
}

export { projectDoctorReport };
export type { Diagnostic, DiagnosticFix, RuleMetadata, Severity } from "./diagnostics";
export type { ProjectProfile, PackageProfile } from "./project-classifier";
export type { ReportIssue, ReportProjection } from "./report-projection";
export type { DoctorReport, DoctorRunMetadata, ScanOptions } from "./scan";
export type { ScoreReport } from "./scoring";
export type { SuppressionHint } from "./adoption-config";
