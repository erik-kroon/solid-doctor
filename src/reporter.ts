import type { DoctorReport } from "./scan";
import { projectDoctorReport, type ReportProjection } from "./report-projection";

export function renderTerminalReport(report: DoctorReport): string {
  const projection = projectDoctorReport(report);
  const lines = [
    "Solid Doctor",
    `Project: ${projection.project.packageName ?? projection.project.root}`,
    `Health score: ${projection.score.overall}/100`,
  ];

  if (projection.issues.length === 0) {
    lines.push("", "No Solid-specific diagnostics found.");
    appendSuppressionHints(lines, projection.suppressionHints);
    appendClassifierMessages(lines, report.classifierMessages);
    return lines.join("\n");
  }

  lines.push("", "Diagnostics:");

  for (const diagnostic of projection.issues) {
    lines.push(
      `- [${diagnostic.severity}] ${diagnostic.category}/${diagnostic.impact} ${diagnostic.location}`,
      `  Tags: ${diagnostic.tags.join(", ")}`,
      `  ${diagnostic.message}`,
      `  Fix: ${diagnostic.remediation}`,
    );
  }

  appendSuppressionHints(lines, projection.suppressionHints);
  appendClassifierMessages(lines, report.classifierMessages);

  return lines.join("\n");
}

export function renderJsonReport(report: DoctorReport): string {
  return `${JSON.stringify(toJsonReport(report), null, 2)}\n`;
}

export function renderJsonError({
  code,
  message,
}: {
  code: string;
  message: string;
}): string {
  return `${JSON.stringify(
    {
      schemaVersion: 1,
      error: {
        code,
        message,
      },
    },
    null,
    2,
  )}\n`;
}

export function renderMarkdownReport(report: DoctorReport): string {
  const projection = projectDoctorReport(report);
  const lines = [
    "# Solid Doctor Report",
    "",
    `Health score: **${report.score}/100**`,
    "",
    "## Category Scores",
    "",
    "| Category | Score |",
    "| --- | ---: |",
  ];

  for (const [category, score] of Object.entries(report.scores.categories)) {
    lines.push(`| ${category} | ${score}/100 |`);
  }

  if (projection.issues.length === 0) {
    lines.push("", "No Solid-specific diagnostics found.");
    return `${lines.join("\n")}\n`;
  }

  lines.push(
    "",
    "## Diagnostics",
    "",
    "| Severity | Impact | Tags | Rule | Location | Remediation |",
    "| --- | --- | --- | --- | --- | --- |",
  );

  for (const diagnostic of projection.issues) {
    lines.push(
      `| ${diagnostic.severity} | ${diagnostic.impact} | ${diagnostic.tags.join(", ")} | ${diagnostic.ruleId} | ${diagnostic.location} | ${diagnostic.remediation} |`,
    );
  }

  return `${lines.join("\n")}\n`;
}

export function renderSarifReport(report: DoctorReport): string {
  return `${JSON.stringify(toSarifReport(report), null, 2)}\n`;
}

export function renderGithubAnnotations(report: DoctorReport): string {
  return projectDoctorReport(report)
    .issues.map((diagnostic) => {
      return `::${diagnostic.annotationLevel} file=${escapeAnnotationProperty(diagnostic.filePath)},line=${diagnostic.line},col=${diagnostic.column},title=${escapeAnnotationProperty(diagnostic.ruleTitle)}::${escapeAnnotationMessage(diagnostic.message)}`;
    })
    .join("\n");
}

function appendClassifierMessages(lines: string[], messages: string[]): void {
  if (messages.length === 0) {
    return;
  }

  lines.push("", "Classifier:");
  lines.push(...messages);
}

function toJsonReport(report: DoctorReport) {
  const projection = projectDoctorReport(report);
  return toJsonProjection(projection);
}

function toJsonProjection(projection: ReportProjection) {
  return {
    schemaVersion: projection.schemaVersion,
    project: projection.project,
    score: projection.score,
    metadata: projection.metadata,
    diagnostics: projection.issues,
    suppressionHints: projection.suppressionHints,
  };
}

function appendSuppressionHints(
  lines: string[],
  suppressionHints: ReportProjection["suppressionHints"],
): void {
  if (suppressionHints.length === 0) {
    return;
  }

  lines.push("", "Suppressions:");

  for (const hint of suppressionHints) {
    lines.push(`- ${hint.filePath}:${hint.line}:${hint.column} ${hint.message}`);
  }
}

function toSarifReport(report: DoctorReport) {
  const issues = projectDoctorReport(report).issues;
  const rules = new Map(
    issues.map((diagnostic) => [
      diagnostic.ruleId,
      {
        id: diagnostic.ruleId,
        name: diagnostic.ruleId,
        shortDescription: { text: diagnostic.message },
        help: { text: diagnostic.remediation },
        properties: {
          category: diagnostic.category,
          confidence: diagnostic.confidence,
          impact: diagnostic.impact,
          impactDescription: diagnostic.impactDescription,
          tags: diagnostic.tags,
          docsSlug: diagnostic.docsSlug,
        },
      },
    ]),
  );

  return {
    version: "2.1.0",
    $schema: "https://json.schemastore.org/sarif-2.1.0.json",
    runs: [
      {
        tool: {
          driver: {
            name: "Solid Doctor",
            informationUri: "https://github.com/erik-kroon/solid-doctor",
            rules: [...rules.values()],
          },
        },
        results: issues.map((diagnostic) => ({
          ruleId: diagnostic.ruleId,
          level: diagnostic.annotationLevel,
          message: {
            text: `${diagnostic.message} ${diagnostic.remediation}`,
          },
          locations: [
            {
              physicalLocation: {
                artifactLocation: {
                  uri: diagnostic.filePath,
                },
                region: {
                  startLine: diagnostic.line,
                  startColumn: diagnostic.column,
                },
              },
            },
          ],
          properties: {
            category: diagnostic.category,
            confidence: diagnostic.confidence,
            impact: diagnostic.impact,
            impactDescription: diagnostic.impactDescription,
            tags: diagnostic.tags,
            fingerprint: diagnostic.fingerprint,
          },
        })),
      },
    ],
  };
}

function escapeAnnotationProperty(value: string): string {
  return value
    .replaceAll("%", "%25")
    .replaceAll("\r", "%0D")
    .replaceAll("\n", "%0A")
    .replaceAll(",", "%2C");
}

function escapeAnnotationMessage(value: string): string {
  return value.replaceAll("%", "%25").replaceAll("\r", "%0D").replaceAll("\n", "%0A");
}
