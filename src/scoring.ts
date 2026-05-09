import {
  CATEGORIES,
  type Category,
  type Confidence,
  type Diagnostic,
  type Severity,
} from "./diagnostics";

export type ScoreReport = {
  overall: number;
  categories: Record<Category, number>;
};

const SEVERITY_WEIGHT: Record<Severity, number> = {
  error: 25,
  warning: 12,
};

const CONFIDENCE_MULTIPLIER: Record<Confidence, number> = {
  high: 1,
  medium: 0.8,
  low: 0.5,
};

export function calculateScore(diagnostics: Diagnostic[]): ScoreReport {
  const categories = Object.fromEntries(
    Object.values(CATEGORIES).map((category) => [category, scoreCategory(diagnostics, category)]),
  ) as Record<Category, number>;
  const totalPenalty = diagnostics.reduce(
    (sum, diagnostic) => sum + diagnosticPenalty(diagnostic),
    0,
  );

  return {
    overall: clampScore(100 - totalPenalty),
    categories,
  };
}

export function diagnosticFingerprint(diagnostic: Diagnostic): string {
  return [
    diagnostic.ruleId,
    diagnostic.filePath,
    diagnostic.line,
    diagnostic.column,
    diagnostic.message,
  ].join("|");
}

function scoreCategory(diagnostics: Diagnostic[], category: Category): number {
  const categoryPenalty = diagnostics
    .filter((diagnostic) => diagnostic.category === category)
    .reduce((sum, diagnostic) => sum + diagnosticPenalty(diagnostic), 0);

  return clampScore(100 - categoryPenalty);
}

function diagnosticPenalty(diagnostic: Diagnostic): number {
  return SEVERITY_WEIGHT[diagnostic.severity] * CONFIDENCE_MULTIPLIER[diagnostic.confidence];
}

function clampScore(score: number): number {
  return Math.max(0, Math.round(score));
}
