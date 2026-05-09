import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { test } from "bun:test";

test("GitHub Action metadata exposes CI adoption inputs and score output", async () => {
  const action = await readFile("action.yml", "utf8");

  for (const input of [
    "directory",
    "diff-base",
    "format",
    "min-score",
    "fail-on",
    "github-token",
    "pr-comment",
  ]) {
    assert.match(action, new RegExp(`^  ${input}:`, "m"));
  }

  assert.match(action, /^outputs:\n  score:/m);
  assert.match(action, /echo "score=\$score" >> "\$GITHUB_OUTPUT"/);
});

test("GitHub Action runs the packaged CLI and emits PR annotations", async () => {
  const action = await readFile("action.yml", "utf8");

  assert.match(action, /npx --yes "\$INPUT_PACKAGE"/);
  assert.match(action, /--format json/);
  assert.match(action, /--format github/);
  assert.match(action, /--diff "\$resolved_diff_base"/);
  assert.match(action, /Solid Doctor GitHub annotations/);
});

test("GitHub Action docs include a copyable pull request workflow", async () => {
  const docs = await readFile("docs/github-action.md", "utf8");

  assert.match(docs, /uses: erik-kroon\/solid-doctor@/);
  assert.match(docs, /fetch-depth: 0/);
  assert.match(docs, /score/);
  assert.match(docs, /min-score/);
});
