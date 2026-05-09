import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import { test } from "bun:test";
import { promisify } from "node:util";

import { FILE_ROLES, PROJECT_KINDS, classifyProject } from "../src/project-classifier";
import { scanProject } from "../src/scan";

const execFileAsync = promisify(execFile);

test("classifier gates SSR diagnostics away from client-only and generated files", async () => {
  const profile = await classifyProject("fixtures/classifier-solid-start");

  assert.equal(profile.kind, PROJECT_KINDS.solidStart);
  assert.equal(profile.fileClassifications.get("src/routes/index.tsx")?.serverCapable, true);
  assert.equal(profile.fileClassifications.get("src/entry.client.tsx")?.clientOnly, true);
  assert.equal(profile.fileClassifications.get("src/generated/types.generated.ts")?.ignored, true);

  const report = await scanProject("fixtures/classifier-solid-start");
  assert.deepEqual(
    report.diagnostics.map((diagnostic) => diagnostic.filePath),
    ["src/routes/index.tsx"],
  );
});

test("classifier detects monorepo package profiles", async () => {
  const profile = await classifyProject("fixtures/classifier-monorepo");
  const packageKinds = new Map(
    profile.packages.map((packageProfile) => [packageProfile.relativeRoot, packageProfile.kind]),
  );

  assert.equal(profile.packages.length, 2);
  assert.equal(packageKinds.get("apps/web"), PROJECT_KINDS.viteSolid);
  assert.equal(packageKinds.get("packages/ui"), PROJECT_KINDS.library);
  assert.equal(
    profile.fileClassifications
      .get("packages/ui/src/index.tsx")
      ?.roles.includes(FILE_ROLES.library),
    true,
  );
});

test("verbose scan output explains project and file classification", async () => {
  const { stdout } = await execFileAsync("bun", [
    "src/cli.ts",
    "scan",
    "fixtures/classifier-solid-start",
    "--rules",
    "none",
    "--verbose",
  ]);

  assert.match(stdout, /Classifier:/);
  assert.match(stdout, /Project kind: solid-start/);
  assert.match(stdout, /src\/entry\.client\.tsx: .*client-only/);
});
