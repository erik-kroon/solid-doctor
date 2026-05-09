import { scanProject } from "./scan";

type BenchmarkResult = {
  fixture: string;
  runs: number;
  averageMs: number;
  maxMs: number;
  checkedFiles: number;
  diagnosticsCount: number;
};

const args = process.argv.slice(2);

try {
  const fixtures = valuesAfter(args, "--fixture");
  const targets = fixtures.length > 0 ? fixtures : ["fixtures/valid-solid"];
  const runs = parsePositiveInteger(valueAfter(args, "--runs") ?? "3", "--runs");
  const maxAllowedMs = parseOptionalNumber(valueAfter(args, "--max-ms"), "--max-ms");
  const results: BenchmarkResult[] = [];

  for (const fixture of targets) {
    results.push(await benchmarkFixture(fixture, runs));
  }

  printResults(results);

  if (
    maxAllowedMs !== null &&
    results.some((result) => result.averageMs > maxAllowedMs || result.maxMs > maxAllowedMs)
  ) {
    process.exit(1);
  }
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(2);
}

async function benchmarkFixture(fixture: string, runs: number): Promise<BenchmarkResult> {
  const elapsed: number[] = [];
  let checkedFiles = 0;
  let diagnosticsCount = 0;

  for (let index = 0; index < runs; index += 1) {
    const report = await scanProject(fixture);
    elapsed.push(report.metadata.elapsedMilliseconds);
    checkedFiles = report.metadata.checkedFiles;
    diagnosticsCount = report.metadata.diagnosticsCount;
  }

  return {
    fixture,
    runs,
    averageMs: round(elapsed.reduce((sum, value) => sum + value, 0) / elapsed.length),
    maxMs: round(Math.max(...elapsed)),
    checkedFiles,
    diagnosticsCount,
  };
}

function printResults(results: BenchmarkResult[]): void {
  console.log("Solid Doctor Benchmark");
  console.log("fixture,runs,averageMs,maxMs,checkedFiles,diagnosticsCount");

  for (const result of results) {
    console.log(
      [
        result.fixture,
        result.runs,
        result.averageMs,
        result.maxMs,
        result.checkedFiles,
        result.diagnosticsCount,
      ].join(","),
    );
  }
}

function valueAfter(args: string[], flagName: string): string | null {
  const flagIndex = args.indexOf(flagName);

  if (flagIndex === -1) {
    return null;
  }

  return args[flagIndex + 1] ?? null;
}

function valuesAfter(args: string[], flagName: string): string[] {
  const values: string[] = [];

  for (let index = 0; index < args.length; index += 1) {
    if (args[index] !== flagName) {
      continue;
    }

    const value = args[index + 1];

    if (value) {
      values.push(value);
    }
  }

  return values;
}

function parsePositiveInteger(value: string, flagName: string): number {
  const number = Number(value);

  if (!Number.isInteger(number) || number < 1) {
    throw new Error(`Expected ${flagName} to be a positive integer.`);
  }

  return number;
}

function parseOptionalNumber(value: string | null, flagName: string): number | null {
  if (value === null) {
    return null;
  }

  const number = Number(value);

  if (!Number.isFinite(number)) {
    throw new Error(`Expected ${flagName} to be a number.`);
  }

  return number;
}

function round(value: number): number {
  return Number(value.toFixed(2));
}
