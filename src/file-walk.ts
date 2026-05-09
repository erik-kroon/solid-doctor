import { readdir } from "node:fs/promises";
import { join } from "node:path";

const SOURCE_EXTENSIONS = new Set([".js", ".jsx", ".ts", ".tsx"]);
const IGNORED_DIRECTORIES = new Set([".git", "node_modules", "dist", "build", "coverage"]);

export async function collectSourceFiles(root: string): Promise<string[]> {
  const files: string[] = [];
  await walk(root, files);
  return files;
}

async function walk(directory: string, files: string[]): Promise<void> {
  const entries = await readdir(directory, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = join(directory, entry.name);

    if (entry.isDirectory()) {
      if (!IGNORED_DIRECTORIES.has(entry.name)) {
        await walk(fullPath, files);
      }
      continue;
    }

    if (entry.isFile() && SOURCE_EXTENSIONS.has(extensionOf(entry.name))) {
      files.push(fullPath);
    }
  }
}

function extensionOf(fileName: string): string {
  const match = fileName.match(/\.[^.]+$/);
  return match ? match[0] : "";
}
