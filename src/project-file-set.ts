import type { FileClassification, ProjectProfile } from "./project-classifier";
import { collectSourceFiles } from "./file-walk";

export type ProjectSourceFile = {
  filePath: string;
  relativeFilePath: string;
  classification: FileClassification;
};

export async function collectAnalyzableProjectFiles(
  project: ProjectProfile,
): Promise<ProjectSourceFile[]> {
  const sourceFiles = await collectSourceFiles(project.root);

  return sourceFiles.flatMap((filePath) => {
    const relativeFilePath = relativeProjectPath(project.root, filePath);
    const classification = project.fileClassifications.get(relativeFilePath);

    if (!classification || classification.ignored) {
      return [];
    }

    return [{ filePath, relativeFilePath, classification }];
  });
}

function relativeProjectPath(projectRoot: string, filePath: string): string {
  return filePath.replace(`${projectRoot}/`, "");
}
