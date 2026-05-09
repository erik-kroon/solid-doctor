import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import { test } from "bun:test";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);

type RejectedExecFileError = Error & {
  code?: number;
  stdout?: string;
};

test("valid Solid fixture reports no diagnostics and exits cleanly", async () => {
  const { stdout } = await execFileAsync("bun", ["src/cli.ts", "scan", "fixtures/valid-solid"]);

  assert.match(stdout, /Health score: 100\/100/);
  assert.match(stdout, /No Solid-specific diagnostics found/);
});

test("invalid prop snapshot fixture reports a diagnostic and exits non-zero", async () => {
  await assert.rejects(
    execFileAsync("bun", ["src/cli.ts", "scan", "fixtures/invalid-prop-snapshot"]),
    (error) => {
      const execError = error as RejectedExecFileError;
      const stdout = execError.stdout ?? "";

      assert.equal(execError.code, 1);
      assert.match(stdout, /Health score: 82\/100/);
      assert.match(stdout, /reactivity/);
      assert.match(stdout, /fixtures\/invalid-prop-snapshot\/src\/App.tsx|src\/App.tsx/);
      assert.match(stdout, /Local value 'name' snapshots props.name/);
      assert.match(stdout, /Fix: Read props.name inside JSX/);
      return true;
    },
  );
});
