import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import { test } from "bun:test";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);

test("benchmark command reports fixture timing and enforces a max threshold", async () => {
  const { stdout } = await execFileAsync("bun", [
    "src/benchmark.ts",
    "--fixture",
    "fixtures/valid-solid",
    "--runs",
    "1",
    "--max-ms",
    "10000",
  ]);

  assert.match(stdout, /Solid Doctor Benchmark/);
  assert.match(stdout, /fixtures\/valid-solid/);
  assert.match(stdout, /checkedFiles/);
});

test("performance docs explain metadata and regression guard usage", async () => {
  const { stdout } = await execFileAsync("bun", [
    "src/cli.ts",
    "scan",
    "fixtures/valid-solid",
    "--format",
    "json",
  ]);
  const report = JSON.parse(stdout);

  assert.equal(typeof report.metadata.elapsedMilliseconds, "number");
  assert.equal(report.metadata.checkedFiles, 1);
});
