import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { test } from "bun:test";

import { MVP_RULES, REACTIVITY_RULES } from "../src/rule-catalog";

test("README links to external adoption docs", async () => {
  const readme = await readFile("README.md", "utf8");

  for (const path of [
    "docs/installation.md",
    "docs/configuration.md",
    "docs/rule-reference.md",
    "docs/github-action.md",
    "docs/agent-output.md",
  ]) {
    assert.match(readme, new RegExp(`\\(${path}\\)`));
  }
});

test("rule reference covers each shipped rule with examples and suppression guidance", async () => {
  const docs = await readFile("docs/rule-reference.md", "utf8");
  const rules = [...new Map([...MVP_RULES, ...REACTIVITY_RULES].map((rule) => [rule.id, rule])).values()];

  for (const rule of rules) {
    assert.match(docs, new RegExp(rule.id.replace("/", "\\/")));
    assert.match(docs, new RegExp(rule.meta.docsSlug));
  }

  assert.match(docs, /Bad pattern/);
  assert.match(docs, /Preferred pattern/);
  assert.match(docs, /Suppression/);
});

test("configuration docs include copyable config and adoption commands", async () => {
  const docs = await readFile("docs/configuration.md", "utf8");

  assert.match(docs, /solid-doctor.config.json/);
  assert.match(docs, /solidDoctor/);
  assert.match(docs, /solid-doctor-disable-next-line/);
  assert.match(docs, /--baseline/);
  assert.match(docs, /--staged/);
});
