export const CATEGORIES = {
  async: "async",
  bundle: "bundle",
  server: "server",
  reactivity: "reactivity",
  render: "render",
  effect: "effect",
  js: "js",
  advanced: "advanced",
} as const;

export const SEVERITIES = {
  error: "error",
  warning: "warning",
} as const;

export const CONFIDENCE = {
  high: "high",
  medium: "medium",
  low: "low",
} as const;

export const IMPACTS = {
  critical: "critical",
  high: "high",
  mediumHigh: "medium-high",
  medium: "medium",
  lowMedium: "low-medium",
  low: "low",
} as const;

export type Category = (typeof CATEGORIES)[keyof typeof CATEGORIES];
export type Severity = (typeof SEVERITIES)[keyof typeof SEVERITIES];
export type Confidence = (typeof CONFIDENCE)[keyof typeof CONFIDENCE];
export type Impact = (typeof IMPACTS)[keyof typeof IMPACTS];

export type RuleMetadata = {
  category: Category;
  defaultSeverity: Severity;
  confidence: Confidence;
  impact: Impact;
  impactDescription: string;
  tags: string[];
  docsSlug: string;
  description: string;
  why: string;
  badExample: string;
  preferredExample: string;
  remediation: string;
  suppressionGuidance: string;
  references: string[];
  fixable: boolean;
};

export type DiagnosticFix = {
  safe: boolean;
  diff: string;
};

export type RawFinding = {
  line: number;
  column: number;
  message: string;
  severity?: Severity;
  confidence?: Confidence;
  remediation?: string;
  fix?: DiagnosticFix;
};

export type RuleDefinition = {
  id: string;
  meta: RuleMetadata;
};

export type NormalizerContext = {
  relativeFilePath: string;
};

export type Diagnostic = {
  ruleId: string;
  category: Category;
  severity: Severity;
  confidence: Confidence;
  impact: Impact;
  impactDescription: string;
  tags: string[];
  docsSlug: string;
  filePath: string;
  line: number;
  column: number;
  message: string;
  remediation: string;
  fixable: boolean;
  fix?: DiagnosticFix;
};

export function diagnosticFingerprint(diagnostic: Diagnostic): string {
  return [
    diagnostic.ruleId,
    diagnostic.filePath,
    diagnostic.line,
    diagnostic.column,
    diagnostic.message,
  ].join("|");
}

export function normalizeFinding({
  rule,
  finding,
  context,
}: {
  rule: RuleDefinition;
  finding: RawFinding;
  context: NormalizerContext;
}): Diagnostic {
  const diagnostic: Diagnostic = {
    ruleId: rule.id,
    category: rule.meta.category,
    severity: finding.severity ?? rule.meta.defaultSeverity,
    confidence: finding.confidence ?? rule.meta.confidence,
    impact: rule.meta.impact,
    impactDescription: rule.meta.impactDescription,
    tags: rule.meta.tags,
    docsSlug: rule.meta.docsSlug,
    filePath: context.relativeFilePath,
    line: finding.line,
    column: finding.column,
    message: finding.message,
    remediation: finding.remediation ?? rule.meta.remediation,
    fixable: rule.meta.fixable || Boolean(finding.fix),
  };

  if (finding.fix) {
    diagnostic.fix = finding.fix;
  }

  return diagnostic;
}
