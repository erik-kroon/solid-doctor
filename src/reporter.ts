import type { DoctorReport } from "./scan";
import { diagnosticFingerprint } from "./scoring";

export function renderTerminalReport(report: DoctorReport): string {
  const lines = [
    "Solid Doctor",
    `Project: ${report.project.packageName ?? report.project.root}`,
    `Health score: ${report.score}/100`,
  ];

  if (report.diagnostics.length === 0) {
    lines.push("", "No Solid-specific diagnostics found.");
    appendClassifierMessages(lines, report.classifierMessages);
    return lines.join("\n");
  }

  lines.push("", "Diagnostics:");

  for (const diagnostic of report.diagnostics) {
    lines.push(
      `- [${diagnostic.severity}] ${diagnostic.category} ${diagnostic.filePath}:${diagnostic.line}:${diagnostic.column}`,
      `  ${diagnostic.message}`,
      `  Fix: ${diagnostic.remediation}`,
    );
  }

  appendClassifierMessages(lines, report.classifierMessages);

  return lines.join("\n");
}

export function renderJsonReport(report: DoctorReport): string {
  return `${JSON.stringify(toJsonReport(report), null, 2)}\n`;
}

export function renderMarkdownReport(report: DoctorReport): string {
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

  if (report.diagnostics.length === 0) {
    lines.push("", "No Solid-specific diagnostics found.");
    return `${lines.join("\n")}\n`;
  }

  lines.push(
    "",
    "## Diagnostics",
    "",
    "| Severity | Rule | Location | Remediation |",
    "| --- | --- | --- | --- |",
  );

  for (const diagnostic of report.diagnostics) {
    lines.push(
      `| ${diagnostic.severity} | ${diagnostic.ruleId} | ${diagnostic.filePath}:${diagnostic.line}:${diagnostic.column} | ${diagnostic.remediation} |`,
    );
  }

  return `${lines.join("\n")}\n`;
}

export function renderSarifReport(report: DoctorReport): string {
  return `${JSON.stringify(toSarifReport(report), null, 2)}\n`;
}

export function renderGithubAnnotations(report: DoctorReport): string {
  return report.diagnostics
    .map((diagnostic) => {
      const annotationLevel = diagnostic.severity === "error" ? "error" : "warning";
      const title = `${diagnostic.ruleId}: ${diagnostic.remediation}`;
      return `::${annotationLevel} file=${escapeAnnotationProperty(diagnostic.filePath)},line=${diagnostic.line},col=${diagnostic.column},title=${escapeAnnotationProperty(title)}::${escapeAnnotationMessage(diagnostic.message)}`;
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
    diagnostics: report.diagnostics.map((diagnostic) => ({
      ...diagnostic,
      fingerprint: diagnosticFingerprint(diagnostic),
    })),
  };
}

function toSarifReport(report: DoctorReport) {
  const rules = new Map(
    report.diagnostics.map((diagnostic) => [
      diagnostic.ruleId,
      {
        id: diagnostic.ruleId,
        name: diagnostic.ruleId,
        shortDescription: { text: diagnostic.message },
        help: { text: diagnostic.remediation },
        properties: {
          category: diagnostic.category,
          confidence: diagnostic.confidence,
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
        results: report.diagnostics.map((diagnostic) => ({
          ruleId: diagnostic.ruleId,
          level: diagnostic.severity === "error" ? "error" : "warning",
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
            fingerprint: diagnosticFingerprint(diagnostic),
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
