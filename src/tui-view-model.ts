import type { Category, Confidence, Diagnostic, Severity } from "./diagnostics";
import { projectIssue, type ReportIssue } from "./report-projection";
import type { ScoreReport } from "./scoring";

export type TuiReport = {
  score: ScoreReport;
  diagnostics: Diagnostic[];
};

export type IssueFilters = {
  severity?: Severity;
  category?: Category;
  ruleId?: string;
  filePath?: string;
  confidence?: Confidence;
  fixable?: boolean;
};

export type IssueViewModel = {
  ruleId: string;
  severity: Severity;
  category: Category;
  confidence: Confidence;
  filePath: string;
  line: number;
  column: number;
  fixable: boolean;
  title: string;
  explanation: string;
  remediation: string;
  badExample: string;
  preferredExample: string;
  references: string[];
  codeContext: string;
  diffPreview: string | null;
};

export type TuiViewModel = {
  score: ScoreReport;
  issues: IssueViewModel[];
  selectedIssue: IssueViewModel | null;
  filters: IssueFilters;
};

export function createTuiViewModel({
  report,
  filters = {},
  selectedIndex = 0,
}: {
  report: TuiReport;
  filters?: IssueFilters;
  selectedIndex?: number;
}): TuiViewModel {
  const issues = report.diagnostics
    .map(projectIssueToViewModel)
    .filter((diagnostic) => matchesFilters(diagnostic, filters));

  return {
    score: report.score,
    issues,
    selectedIssue: issues[selectedIndex] ?? null,
    filters,
  };
}

function matchesFilters(diagnostic: IssueViewModel, filters: IssueFilters): boolean {
  return (
    (!filters.severity || diagnostic.severity === filters.severity) &&
    (!filters.category || diagnostic.category === filters.category) &&
    (!filters.ruleId || diagnostic.ruleId === filters.ruleId) &&
    (!filters.filePath || diagnostic.filePath === filters.filePath) &&
    (!filters.confidence || diagnostic.confidence === filters.confidence) &&
    (filters.fixable === undefined || diagnostic.fixable === filters.fixable)
  );
}

function projectIssueToViewModel(diagnostic: Diagnostic): IssueViewModel {
  return toIssueViewModel(projectIssue(diagnostic));
}

function toIssueViewModel(issue: ReportIssue): IssueViewModel {
  return {
    ruleId: issue.ruleId,
    severity: issue.severity,
    category: issue.category,
    confidence: issue.confidence,
    filePath: issue.filePath,
    line: issue.line,
    column: issue.column,
    fixable: issue.fixable,
    title: issue.message,
    explanation: issue.explanation,
    remediation: issue.remediation,
    badExample: issue.badExample,
    preferredExample: issue.preferredExample,
    references: issue.references,
    codeContext: issue.location,
    diffPreview: issue.diffPreview,
  };
}
