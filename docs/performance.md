# Performance

JSON reports include lightweight timing metadata:

```json
{
  "metadata": {
    "checkedFiles": 1,
    "diagnosticsCount": 0,
    "elapsedMilliseconds": 2.5,
    "selectedProjects": []
  }
}
```

Use the benchmark command for local smoke checks:

```bash
bun src/benchmark.ts --fixture fixtures/valid-solid --runs 3 --max-ms 10000
```

The command prints CSV-style rows with `averageMs`, `maxMs`, `checkedFiles`, and `diagnosticsCount`. `--max-ms` is intentionally coarse so CI catches obvious regressions without failing on ordinary machine variance.

Recommended CI guard:

```bash
bun src/benchmark.ts \
  --fixture fixtures/valid-solid \
  --fixture fixtures/invalid-core-rule-pack \
  --runs 3 \
  --max-ms 10000
```

If benchmark values approach the threshold, inspect rule-level work and shared analyzers before raising the limit.
