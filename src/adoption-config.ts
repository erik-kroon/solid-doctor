import { existsSync } from "node:fs";
import { readFile } from "node:fs/promises";
import { join } from "node:path";

import type { Diagnostic } from "./diagnostics";
import type { ProjectSourceFile } from "./project-file-set";
import { findRule } from "./rule-catalog";

export type SolidDoctorConfig = {
  ignore: {
    rules: string[];
    files: string[];
  };
  overrides: Array<{
    files: string[];
    ignore: {
      rules: string[];
    };
  }>;
};

export type InlineSuppression = {
  filePath: string;
  line: number;
  column: number;
  ruleIds: string[];
};

export type SuppressionHint = {
  kind: "unused" | "unknown-rule";
  filePath: string;
  line: number;
  column: number;
  ruleId: string;
  message: string;
};

export type AdoptionFilterResult = {
  diagnostics: Diagnostic[];
  suppressionHints: SuppressionHint[];
};

type RawConfig = {
  ignore?: {
    rules?: unknown;
    files?: unknown;
  };
  overrides?: unknown;
};

type PackageJsonWithConfig = {
  solidDoctor?: unknown;
};

export async function loadSolidDoctorConfig(projectRoot: string): Promise<SolidDoctorConfig> {
  const packageConfig = await readPackageSolidDoctorConfig(projectRoot);
  const fileConfig = await readConfigFile(projectRoot);
  const repositoryIgnoredFiles = await readRepositoryIgnoreFiles(projectRoot);

  return mergeConfigs([
    normalizeConfig(packageConfig),
    normalizeConfig(fileConfig),
    {
      ignore: {
        rules: [],
        files: repositoryIgnoredFiles,
      },
      overrides: [],
    },
  ]);
}

export function isIgnoredFile(filePath: string, config: SolidDoctorConfig): boolean {
  return config.ignore.files.some((pattern) => matchesFilePattern(filePath, pattern));
}

export function applyAdoptionFilters({
  diagnostics,
  suppressions,
  config,
}: {
  diagnostics: Diagnostic[];
  suppressions: InlineSuppression[];
  config: SolidDoctorConfig;
}): AdoptionFilterResult {
  const configFilteredDiagnostics = diagnostics.filter(
    (diagnostic) => !isIgnoredDiagnostic(diagnostic, config),
  );
  const usedSuppressions = new Set<string>();
  const suppressedDiagnostics = configFilteredDiagnostics.filter((diagnostic) => {
    const suppression = suppressions.find(
      (candidate) =>
        candidate.filePath === diagnostic.filePath &&
        candidate.line + 1 === diagnostic.line &&
        candidate.ruleIds.includes(diagnostic.ruleId),
    );

    if (!suppression) {
      return true;
    }

    usedSuppressions.add(suppressionKey(suppression, diagnostic.ruleId));
    return false;
  });

  return {
    diagnostics: suppressedDiagnostics,
    suppressionHints: createSuppressionHints({ suppressions, usedSuppressions }),
  };
}

export async function collectInlineSuppressions(
  sourceFiles: ProjectSourceFile[],
): Promise<InlineSuppression[]> {
  const suppressions: InlineSuppression[] = [];

  for (const sourceFile of sourceFiles) {
    suppressions.push(
      ...parseInlineSuppressions(
        await readFile(sourceFile.filePath, "utf8"),
        sourceFile.relativeFilePath,
      ),
    );
  }

  return suppressions;
}

export function parseInlineSuppressions(
  sourceText: string,
  filePath: string,
): InlineSuppression[] {
  const suppressions: InlineSuppression[] = [];
  const marker = "solid-doctor-disable-next-line";

  sourceText.split(/\r?\n/).forEach((lineText, index) => {
    const markerIndex = lineText.indexOf(marker);

    if (markerIndex === -1) {
      return;
    }

    const ruleIds = lineText
      .slice(markerIndex + marker.length)
      .replace(/\*\//g, " ")
      .replace(/[{}*]/g, " ")
      .trim()
      .split(/[\s,]+/)
      .filter(Boolean);

    suppressions.push({
      filePath,
      line: index + 1,
      column: markerIndex + 1,
      ruleIds,
    });
  });

  return suppressions;
}

function isIgnoredDiagnostic(diagnostic: Diagnostic, config: SolidDoctorConfig): boolean {
  if (config.ignore.rules.includes(diagnostic.ruleId)) {
    return true;
  }

  return config.overrides.some(
    (override) =>
      override.ignore.rules.includes(diagnostic.ruleId) &&
      override.files.some((pattern) => matchesFilePattern(diagnostic.filePath, pattern)),
  );
}

function createSuppressionHints({
  suppressions,
  usedSuppressions,
}: {
  suppressions: InlineSuppression[];
  usedSuppressions: Set<string>;
}): SuppressionHint[] {
  const hints: SuppressionHint[] = [];

  for (const suppression of suppressions) {
    for (const ruleId of suppression.ruleIds) {
      if (!findRule(ruleId)) {
        hints.push({
          kind: "unknown-rule",
          filePath: suppression.filePath,
          line: suppression.line,
          column: suppression.column,
          ruleId,
          message: `Inline suppression names unknown rule '${ruleId}'.`,
        });
        continue;
      }

      if (!usedSuppressions.has(suppressionKey(suppression, ruleId))) {
        hints.push({
          kind: "unused",
          filePath: suppression.filePath,
          line: suppression.line,
          column: suppression.column,
          ruleId,
          message: `Inline suppression for '${ruleId}' did not match a diagnostic on the next line.`,
        });
      }
    }
  }

  return hints;
}

function suppressionKey(suppression: InlineSuppression, ruleId: string): string {
  return [suppression.filePath, suppression.line, suppression.column, ruleId].join("|");
}

async function readPackageSolidDoctorConfig(projectRoot: string): Promise<unknown> {
  const packageJsonPath = join(projectRoot, "package.json");

  try {
    const packageJson = JSON.parse(await readFile(packageJsonPath, "utf8")) as PackageJsonWithConfig;
    return packageJson.solidDoctor;
  } catch (error) {
    return undefined;
  }
}

async function readConfigFile(projectRoot: string): Promise<unknown> {
  const configPath = join(projectRoot, "solid-doctor.config.json");

  if (!existsSync(configPath)) {
    return undefined;
  }

  return JSON.parse(await readFile(configPath, "utf8")) as RawConfig;
}

async function readRepositoryIgnoreFiles(projectRoot: string): Promise<string[]> {
  const patterns: string[] = [];

  for (const fileName of [".solid-doctorignore", ".gitignore"]) {
    const path = join(projectRoot, fileName);

    if (!existsSync(path)) {
      continue;
    }

    patterns.push(...parseIgnoreFile(await readFile(path, "utf8")));
  }

  return patterns;
}

function parseIgnoreFile(content: string): string[] {
  return content
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0 && !line.startsWith("#") && !line.startsWith("!"));
}

function mergeConfigs(configs: SolidDoctorConfig[]): SolidDoctorConfig {
  return {
    ignore: {
      rules: unique(configs.flatMap((config) => config.ignore.rules)),
      files: unique(configs.flatMap((config) => config.ignore.files)),
    },
    overrides: configs.flatMap((config) => config.overrides),
  };
}

function normalizeConfig(config: unknown): SolidDoctorConfig {
  if (!isRecord(config)) {
    return emptyConfig();
  }

  return {
    ignore: {
      rules: stringArray(config.ignore?.rules),
      files: stringArray(config.ignore?.files),
    },
    overrides: normalizeOverrides(config.overrides),
  };
}

function normalizeOverrides(value: unknown): SolidDoctorConfig["overrides"] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.flatMap((entry) => {
    if (!isRecord(entry)) {
      return [];
    }

    const files = stringArray(entry.files);
    const ignoreRules = stringArray(entry.ignore?.rules);

    if (files.length === 0 || ignoreRules.length === 0) {
      return [];
    }

    return [
      {
        files,
        ignore: {
          rules: ignoreRules,
        },
      },
    ];
  });
}

function emptyConfig(): SolidDoctorConfig {
  return {
    ignore: {
      rules: [],
      files: [],
    },
    overrides: [],
  };
}

function stringArray(value: unknown): string[] {
  if (typeof value === "string") {
    return [value];
  }

  if (!Array.isArray(value)) {
    return [];
  }

  return value.filter((item): item is string => typeof item === "string" && item.trim() !== "");
}

function isRecord(value: unknown): value is Record<string, Record<string, unknown> & unknown> {
  return typeof value === "object" && value !== null;
}

function unique(values: string[]): string[] {
  return [...new Set(values)];
}

function matchesFilePattern(filePath: string, pattern: string): boolean {
  const normalizedFilePath = filePath.replaceAll("\\", "/");
  const normalizedPattern = pattern.replaceAll("\\", "/").replace(/^\//, "");

  if (normalizedPattern.endsWith("/")) {
    return normalizedFilePath.startsWith(normalizedPattern);
  }

  if (!/[*?]/.test(normalizedPattern)) {
    return (
      normalizedFilePath === normalizedPattern ||
      normalizedFilePath.startsWith(`${normalizedPattern}/`)
    );
  }

  return globPatternToRegExp(normalizedPattern).test(normalizedFilePath);
}

function globPatternToRegExp(pattern: string): RegExp {
  let source = "^";

  for (let index = 0; index < pattern.length; index += 1) {
    const character = pattern[index] ?? "";
    const nextCharacter = pattern[index + 1];

    if (character === "*" && nextCharacter === "*") {
      source += ".*";
      index += 1;
      continue;
    }

    if (character === "*") {
      source += "[^/]*";
      continue;
    }

    if (character === "?") {
      source += "[^/]";
      continue;
    }

    source += escapeRegExp(character);
  }

  return new RegExp(`${source}$`);
}

function escapeRegExp(value: string): string {
  return value.replace(/[|\\{}()[\]^$+?.]/g, "\\$&");
}
