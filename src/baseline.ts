import { readFile, writeFile } from "node:fs/promises";

import { diagnosticFingerprint, type Diagnostic } from "./diagnostics";

export type BaselineFile = {
  version: 1;
  diagnostics: Array<{
    fingerprint: string;
    ruleId: string;
    filePath: string;
    line: number;
    message: string;
  }>;
};

export async function readBaseline(path: string): Promise<Set<string>> {
  const baseline = JSON.parse(await readFile(path, "utf8")) as BaselineFile;
  return new Set(baseline.diagnostics.map((diagnostic) => diagnostic.fingerprint));
}

export async function writeBaseline(path: string, diagnostics: Diagnostic[]): Promise<void> {
  const baseline: BaselineFile = {
    version: 1,
    diagnostics: diagnostics.map((diagnostic) => ({
      fingerprint: diagnosticFingerprint(diagnostic),
      ruleId: diagnostic.ruleId,
      filePath: diagnostic.filePath,
      line: diagnostic.line,
      message: diagnostic.message,
    })),
  };

  await writeFile(path, `${JSON.stringify(baseline, null, 2)}\n`);
}
