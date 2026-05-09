import { readdir, readFile } from "node:fs/promises";
import { join, relative } from "node:path";

import { collectSourceFiles } from "./file-walk";

type PackageJson = {
  name?: string;
  main?: string;
  module?: string;
  exports?: unknown;
  workspaces?: string[] | { packages?: string[] };
  scripts?: Record<string, string>;
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
  peerDependencies?: Record<string, string>;
};

export const PROJECT_KINDS = {
  solidStart: "solid-start",
  viteSolid: "vite-solid",
  library: "library",
  solid: "solid",
} as const;

export const FILE_ROLES = {
  app: "app",
  library: "library",
  test: "test",
  config: "config",
  generated: "generated",
  ignored: "ignored",
  clientOnly: "client-only",
  serverCapable: "server-capable",
} as const;

export type ProjectKind = (typeof PROJECT_KINDS)[keyof typeof PROJECT_KINDS];
export type FileRole = (typeof FILE_ROLES)[keyof typeof FILE_ROLES];

export type PackageProfile = {
  root: string;
  relativeRoot: string;
  packageName: string | null;
  usesSolid: boolean;
  kind: ProjectKind;
};

export type FileClassification = {
  relativePath: string;
  roles: FileRole[];
  clientOnly: boolean;
  serverCapable: boolean;
  ignored: boolean;
  reasons: string[];
};

export type ProjectProfile = {
  root: string;
  packageName: string | null;
  usesSolid: boolean;
  usesSolidStart: boolean;
  ssrCapable: boolean;
  kind: ProjectKind;
  packages: PackageProfile[];
  fileClassifications: Map<string, FileClassification>;
  clientOnlyFiles: Set<string>;
  ignoredFiles: Set<string>;
  classificationSummary: string[];
};

export async function classifyProject(projectRoot: string): Promise<ProjectProfile> {
  const packageJson = await readPackageJson(projectRoot);
  const dependencies = {
    ...packageJson.dependencies,
    ...packageJson.devDependencies,
    ...packageJson.peerDependencies,
  };

  const kind = classifyPackageKind(packageJson);
  const packages = await classifyWorkspacePackages(projectRoot, packageJson);
  const usesSolid =
    Boolean(dependencies["solid-js"]) || packages.some((profile) => profile.usesSolid);
  const usesSolidStart =
    Boolean(dependencies["@solidjs/start"] ?? dependencies["solid-start"]) ||
    packages.some((profile) => profile.kind === PROJECT_KINDS.solidStart);
  const sourceFiles = await collectSourceFiles(projectRoot);
  const fileClassifications = new Map<string, FileClassification>();

  for (const filePath of sourceFiles) {
    const relativePath = relative(projectRoot, filePath);
    const packageProfile = packageProfileForFile(relativePath, packages);
    fileClassifications.set(
      relativePath,
      classifyFile(relativePath, { kind: packageProfile?.kind ?? kind, usesSolidStart }),
    );
  }

  const clientOnlyFiles = new Set(
    [...fileClassifications.values()]
      .filter((classification) => classification.clientOnly)
      .map((classification) => classification.relativePath),
  );
  const ignoredFiles = new Set(
    [...fileClassifications.values()]
      .filter((classification) => classification.ignored)
      .map((classification) => classification.relativePath),
  );

  return {
    root: projectRoot,
    packageName: packageJson.name ?? null,
    usesSolid,
    usesSolidStart,
    ssrCapable: usesSolidStart,
    kind,
    packages,
    fileClassifications,
    clientOnlyFiles,
    ignoredFiles,
    classificationSummary: summarizeClassification({
      packageJson,
      kind,
      packages,
      fileClassifications,
    }),
  };
}

export function classifyFile(
  relativePath: string,
  project: Pick<ProjectProfile, "kind" | "usesSolidStart">,
): FileClassification {
  const roles: FileRole[] = [];
  const reasons: string[] = [];
  const path = relativePath.replaceAll("\\", "/");

  if (/(\.test\.|\.spec\.|__tests__\/|\/test\/|^test\/)/.test(path)) {
    roles.push(FILE_ROLES.test);
    reasons.push("test path");
  }

  if (/^(fixtures|references)\//.test(path)) {
    roles.push(FILE_ROLES.generated);
    reasons.push("fixture or reference path");
  }

  if (
    /(^|\/)(vite|astro|tsup|rollup|eslint|oxlint|tailwind|postcss|tsconfig)\.config\./.test(path)
  ) {
    roles.push(FILE_ROLES.config);
    reasons.push("config filename");
  }

  if (/(^|\/)(generated|__generated__)\/|\.generated\./.test(path)) {
    roles.push(FILE_ROLES.generated);
    reasons.push("generated path");
  }

  if (/(\.client\.|\/client\/)/.test(path)) {
    roles.push(FILE_ROLES.clientOnly);
    reasons.push("client-only path marker");
  }

  if (path.startsWith("src/") || path.includes("/src/")) {
    roles.push(project.kind === PROJECT_KINDS.library ? FILE_ROLES.library : FILE_ROLES.app);
    reasons.push("source path");
  }

  const ignored = roles.some(
    (role) =>
      role === FILE_ROLES.generated || role === FILE_ROLES.config || role === FILE_ROLES.test,
  );
  const clientOnly = roles.includes(FILE_ROLES.clientOnly);
  const serverCapable =
    project.usesSolidStart && !clientOnly && !ignored && !roles.includes(FILE_ROLES.test);

  if (ignored) {
    roles.push(FILE_ROLES.ignored);
  }

  if (serverCapable) {
    roles.push(FILE_ROLES.serverCapable);
    reasons.push("SolidStart SSR-capable path");
  }

  return {
    relativePath,
    roles,
    clientOnly,
    serverCapable,
    ignored,
    reasons,
  };
}

async function readPackageJson(projectRoot: string): Promise<PackageJson> {
  const packageJsonPath = join(projectRoot, "package.json");

  try {
    return JSON.parse(await readFile(packageJsonPath, "utf8")) as PackageJson;
  } catch (error) {
    throw new Error(`Could not read package.json at ${packageJsonPath}`);
  }
}

function classifyPackageKind(packageJson: PackageJson): ProjectKind {
  const dependencies = {
    ...packageJson.dependencies,
    ...packageJson.devDependencies,
    ...packageJson.peerDependencies,
  };

  if (dependencies["@solidjs/start"] || dependencies["solid-start"]) {
    return PROJECT_KINDS.solidStart;
  }

  if (dependencies["vite-plugin-solid"] || packageJson.scripts?.dev?.includes("vite")) {
    return PROJECT_KINDS.viteSolid;
  }

  if (
    packageJson.peerDependencies?.["solid-js"] ||
    packageJson.exports ||
    packageJson.main ||
    packageJson.module
  ) {
    return PROJECT_KINDS.library;
  }

  return PROJECT_KINDS.solid;
}

async function classifyWorkspacePackages(
  projectRoot: string,
  packageJson: PackageJson,
): Promise<PackageProfile[]> {
  const declaredWorkspacePatterns = Array.isArray(packageJson.workspaces)
    ? packageJson.workspaces
    : packageJson.workspaces?.packages;
  const workspacePatterns = declaredWorkspacePatterns ?? ["apps/*", "packages/*"];

  if (workspacePatterns.length === 0) {
    return [];
  }

  const profiles: PackageProfile[] = [];

  for (const pattern of workspacePatterns) {
    if (!pattern.endsWith("/*")) {
      continue;
    }

    const parent = join(projectRoot, pattern.slice(0, -2));
    let entries;

    try {
      entries = await readdir(parent, { withFileTypes: true });
    } catch (error) {
      continue;
    }

    for (const entry of entries) {
      if (!entry.isDirectory()) {
        continue;
      }

      const packageRoot = join(parent, entry.name);

      try {
        const childPackageJson = await readPackageJson(packageRoot);
        const dependencies = {
          ...childPackageJson.dependencies,
          ...childPackageJson.devDependencies,
          ...childPackageJson.peerDependencies,
        };

        profiles.push({
          root: packageRoot,
          relativeRoot: relative(projectRoot, packageRoot),
          packageName: childPackageJson.name ?? null,
          usesSolid: Boolean(dependencies["solid-js"]),
          kind: classifyPackageKind(childPackageJson),
        });
      } catch (error) {
        continue;
      }
    }
  }

  return profiles;
}

function summarizeClassification({
  packageJson,
  kind,
  packages,
  fileClassifications,
}: {
  packageJson: PackageJson;
  kind: ProjectKind;
  packages: PackageProfile[];
  fileClassifications: Map<string, FileClassification>;
}): string[] {
  const lines = [
    `Project kind: ${kind}`,
    `Package: ${packageJson.name ?? "(anonymous)"}`,
    `Workspace packages: ${packages.length}`,
  ];

  for (const profile of packages) {
    lines.push(
      `- ${profile.relativeRoot}: ${profile.kind}${profile.usesSolid ? " with Solid" : ""}`,
    );
  }

  for (const classification of fileClassifications.values()) {
    lines.push(
      `- ${classification.relativePath}: ${classification.roles.join(", ") || "unclassified"} (${classification.reasons.join("; ") || "no specific markers"})`,
    );
  }

  return lines;
}

function packageProfileForFile(
  relativePath: string,
  packages: PackageProfile[],
): PackageProfile | null {
  const normalized = relativePath.replaceAll("\\", "/");

  return (
    packages
      .filter((profile) => normalized.startsWith(`${profile.relativeRoot.replaceAll("\\", "/")}/`))
      .sort((left, right) => right.relativeRoot.length - left.relativeRoot.length)[0] ?? null
  );
}
