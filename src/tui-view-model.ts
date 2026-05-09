import type { Category, Confidence, Diagnostic, Severity } from "./diagnostics";
import { findRule } from "./rule-runner";
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
    .filter((diagnostic) => matchesFilters(diagnostic, filters))
    .map(toIssueViewModel);

  return {
    score: report.score,
    issues,
    selectedIssue: issues[selectedIndex] ?? null,
    filters,
  };
}

function matchesFilters(diagnostic: Diagnostic, filters: IssueFilters): boolean {
  return (
    (!filters.severity || diagnostic.severity === filters.severity) &&
    (!filters.category || diagnostic.category === filters.category) &&
    (!filters.ruleId || diagnostic.ruleId === filters.ruleId) &&
    (!filters.filePath || diagnostic.filePath === filters.filePath) &&
    (!filters.confidence || diagnostic.confidence === filters.confidence) &&
    (filters.fixable === undefined || diagnostic.fixable === filters.fixable)
  );
}

function toIssueViewModel(diagnostic: Diagnostic): IssueViewModel {
  const rule = findRule(diagnostic.ruleId);

  return {
    ruleId: diagnostic.ruleId,
    severity: diagnostic.severity,
    category: diagnostic.category,
    confidence: diagnostic.confidence,
    filePath: diagnostic.filePath,
    line: diagnostic.line,
    column: diagnostic.column,
    fixable: diagnostic.fixable,
    title: diagnostic.message,
    explanation: rule?.meta.why ?? diagnostic.message,
    remediation: diagnostic.remediation,
    badExample: rule?.meta.badExample ?? "",
    preferredExample: rule?.meta.preferredExample ?? "",
    references: rule?.meta.references ?? [],
    codeContext: `${diagnostic.filePath}:${diagnostic.line}:${diagnostic.column}`,
    diffPreview: diagnostic.fix?.diff ?? null,
  };
}
