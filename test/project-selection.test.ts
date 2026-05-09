import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import { mkdtemp, mkdir, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "bun:test";
import { promisify } from "node:util";

import { scanProject } from "../src/scan";

const execFileAsync = promisify(execFile);

type RejectedExecFileError = Error & {
  code?: number;
  stdout?: string;
};

test("project selection scans one named workspace package", async () => {
  const report = await scanProject("fixtures/project-selection-monorepo", {
    selectedProjects: ["@fixture/selection-ui"],
  });

  assert.deepEqual(
    report.diagnostics.map((diagnostic) => diagnostic.filePath),
    ["packages/ui/src/index.tsx"],
  );
  assert.equal(report.metadata.checkedFiles, 1);
  assert.deepEqual(report.metadata.selectedProjects, [
    {
      relativeRoot: "packages/ui",
      packageName: "@fixture/selection-ui",
      checkedFiles: 1,
      diagnosticsCount: 1,
    },
  ]);
});

test("multiple selected projects are visible in JSON metadata", async () => {
  await assert.rejects(
    execFileAsync("bun", [
      "src/cli.ts",
      "scan",
      "fixtures/project-selection-monorepo",
      "--project",
      "apps/web",
      "--project",
      "@fixture/selection-ui",
      "--format",
      "json",
    ]),
    (error) => {
      const report = JSON.parse((error as RejectedExecFileError).stdout ?? "");

      assert.equal(report.metadata.selectedProjects.length, 2);
      assert.deepEqual(
        report.metadata.selectedProjects.map(
          (project: { relativeRoot: string }) => project.relativeRoot,
        ),
        ["apps/web", "packages/ui"],
      );
      return true;
    },
  );
});

test("staged mode scans staged source files in a git repository", async () => {
  const tempDir = await mkdtemp(join(tmpdir(), "solid-doctor-staged-"));

  try {
    await mkdir(join(tempDir, "src"), { recursive: true });
    await writeFile(
      join(tempDir, "package.json"),
      `${JSON.stringify({ name: "staged-solid", dependencies: { "solid-js": "latest" } }, null, 2)}\n`,
    );
    await writeFile(
      join(tempDir, "src", "App.tsx"),
      [
        "type Props = { name: string };",
        "export function App(props: Props) {",
        "  const name = props.name;",
        "  return <h1>{name}</h1>;",
        "}",
        "",
      ].join("\n"),
    );
    await writeFile(
      join(tempDir, "src", "Other.tsx"),
      [
        "type Props = { title: string };",
        "export function Other(props: Props) {",
        "  const title = props.title;",
        "  return <h2>{title}</h2>;",
        "}",
        "",
      ].join("\n"),
    );
    await execFileAsync("git", ["-C", tempDir, "init"]);
    await execFileAsync("git", ["-C", tempDir, "add", "package.json", "src/App.tsx"]);

    await assert.rejects(
      execFileAsync("bun", ["src/cli.ts", "scan", tempDir, "--staged", "--format", "json"]),
      (error) => {
        const report = JSON.parse((error as RejectedExecFileError).stdout ?? "");

        assert.equal(report.metadata.checkedFiles, 1);
        assert.equal(report.diagnostics[0].filePath, "src/App.tsx");
        return true;
      },
    );
  } finally {
    await rm(tempDir, { recursive: true, force: true });
  }
});
