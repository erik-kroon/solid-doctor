# Rule Runner Boundary

Solid Doctor keeps rule execution separate from the doctor product layer.

## Adapter-owned

- Loading rule implementations.
- Creating `RuleContext` values with project, file, relative path, and source text.
- Running rules and collecting raw findings.
- Mapping raw rule findings into normalized Solid Doctor diagnostics.

This is where future Oxlint JavaScript-plugin rules or native Oxlint rules should be adapted into the same internal contract.

## Doctor-layer-owned

- Project classification.
- Scoring.
- Terminal, JSON, SARIF, Markdown, and agent-readable reports.
- CI thresholds, baselines, and diff filtering.
- Agent instruction installation.

Rules should not know how scores are calculated or how reports are rendered. They emit raw findings plus metadata, and the adapter turns those findings into diagnostics.
