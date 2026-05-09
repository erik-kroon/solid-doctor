import type { FileClassification, ProjectProfile } from "./project-classifier";
import { collectSourceFiles } from "./file-walk";
import { isIgnoredFile, type SolidDoctorConfig } from "./adoption-config";
import type { ChangedFiles } from "./diff-filter";

export type ProjectSourceFile = {
  filePath: string;
  relativeFilePath: string;
  classification: FileClassification;
};

export async function collectAnalyzableProjectFiles(
  project: ProjectProfile,
  options: {
    config?: SolidDoctorConfig;
    selectedProjectRoots?: Set<string>;
    changedFiles?: ChangedFiles;
  } = {},
): Promise<ProjectSourceFile[]> {
  const sourceFiles = await collectSourceFiles(project.root);

  return sourceFiles.flatMap((filePath) => {
    const relativeFilePath = relativeProjectPath(project.root, filePath);
    const classification = project.fileClassifications.get(relativeFilePath);

    if (
      !classification ||
      classification.ignored ||
      isIgnoredByConfig(relativeFilePath, options) ||
      isOutsideSelectedProjects(relativeFilePath, options.selectedProjectRoots) ||
      isOutsideChangedFiles(relativeFilePath, options.changedFiles)
    ) {
      return [];
    }

    return [{ filePath, relativeFilePath, classification }];
  });
}

function isIgnoredByConfig(
  relativeFilePath: string,
  options: { config?: SolidDoctorConfig },
): boolean {
  return options.config ? isIgnoredFile(relativeFilePath, options.config) : false;
}

function isOutsideSelectedProjects(
  relativeFilePath: string,
  selectedProjectRoots: Set<string> | undefined,
): boolean {
  if (!selectedProjectRoots || selectedProjectRoots.size === 0) {
    return false;
  }

  return ![...selectedProjectRoots].some((root) => relativeFilePath.startsWith(`${root}/`));
}

function isOutsideChangedFiles(
  relativeFilePath: string,
  changedFiles: ChangedFiles | undefined,
): boolean {
  return Boolean(changedFiles && !changedFiles.has(relativeFilePath));
}

function relativeProjectPath(projectRoot: string, filePath: string): string {
  return filePath.replace(`${projectRoot}/`, "");
}
