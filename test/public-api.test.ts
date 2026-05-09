import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "bun:test";
import { promisify } from "node:util";

import { diagnose, projectDoctorReport } from "../src/index";

const execFileAsync = promisify(execFile);

type RejectedExecFileError = Error & {
  code?: number;
  stdout?: string;
};

test("public diagnose API returns report data and run metadata", async () => {
  const report = await diagnose("fixtures/valid-solid");

  assert.equal(report.project.packageName, "valid-solid-fixture");
  assert.equal(report.score, 100);
  assert.deepEqual(report.diagnostics, []);
  assert.equal(report.metadata.checkedFiles, 1);
  assert.equal(report.metadata.diagnosticsCount, 0);
  assert.equal(typeof report.metadata.elapsedMilliseconds, "number");

  const projection = projectDoctorReport(report);
  assert.equal(projection.metadata.checkedFiles, 1);
});

test("package entrypoint declares runtime and type exports", async () => {
  const packageJson = JSON.parse(await readFile("package.json", "utf8"));

  assert.equal(packageJson.main, "./dist/index.js");
  assert.equal(packageJson.types, "./dist/types/index.d.ts");
  assert.equal(packageJson.exports["."].import, "./dist/index.js");
  assert.equal(packageJson.exports["."].types, "./dist/types/index.d.ts");
});

test("JSON report includes stable metadata fields", async () => {
  const { stdout } = await execFileAsync("bun", [
    "src/cli.ts",
    "scan",
    "fixtures/valid-solid",
    "--format",
    "json",
  ]);
  const report = JSON.parse(stdout);

  assert.equal(report.schemaVersion, 1);
  assert.equal(report.metadata.checkedFiles, 1);
  assert.equal(report.metadata.diagnosticsCount, 0);
  assert.equal(typeof report.metadata.elapsedMilliseconds, "number");
});

test("JSON output stays valid for expected scan errors", async () => {
  const tempDir = await mkdtemp(join(tmpdir(), "solid-doctor-non-solid-"));

  try {
    await writeFile(
      join(tempDir, "package.json"),
      `${JSON.stringify({ name: "not-solid", dependencies: {} }, null, 2)}\n`,
    );

    await assert.rejects(
      execFileAsync("bun", ["src/cli.ts", "scan", tempDir, "--format", "json"]),
      (error) => {
        const execError = error as RejectedExecFileError;
        const output = JSON.parse(execError.stdout ?? "");

        assert.equal(execError.code, 2);
        assert.equal(output.schemaVersion, 1);
        assert.equal(output.error.code, "scan_failed");
        assert.match(output.error.message, /solid-js dependency/);
        return true;
      },
    );
  } finally {
    await rm(tempDir, { recursive: true, force: true });
  }
});
