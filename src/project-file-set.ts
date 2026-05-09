import type { FileClassification, ProjectProfile } from "./project-classifier";
import { collectSourceFiles } from "./file-walk";
import { isIgnoredFile, type SolidDoctorConfig } from "./adoption-config";

export type ProjectSourceFile = {
  filePath: string;
  relativeFilePath: string;
  classification: FileClassification;
};

export async function collectAnalyzableProjectFiles(
  project: ProjectProfile,
  options: { config?: SolidDoctorConfig } = {},
): Promise<ProjectSourceFile[]> {
  const sourceFiles = await collectSourceFiles(project.root);

  return sourceFiles.flatMap((filePath) => {
    const relativeFilePath = relativeProjectPath(project.root, filePath);
    const classification = project.fileClassifications.get(relativeFilePath);

    if (!classification || classification.ignored || isIgnoredByConfig(relativeFilePath, options)) {
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

function relativeProjectPath(projectRoot: string, filePath: string): string {
  return filePath.replace(`${projectRoot}/`, "");
}
