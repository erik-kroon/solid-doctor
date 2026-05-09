# Agent Output

Use the agent report when a coding agent needs to inspect and repair diagnostics without parsing terminal text:

```bash
solid-doctor scan . --format agent
```

The output is JSON with:

- `project`, `score`, and `metadata` from the shared report projection.
- `diagnostics[]` with rule id, severity, confidence, impact, tags, message, explanation, remediation, file location, references, and fixability.
- `fix.safe` and `fix.diff` when a rule provides fix data. Unsafe fixes are preserved with `safe: false` instead of being hidden.
- `suppressionHints[]` for unused or unknown inline suppressions.

Installed guidance from `solid-doctor install-agents` is managed between Solid Doctor markers and reflects the detected project profile plus config-enabled default rules.
