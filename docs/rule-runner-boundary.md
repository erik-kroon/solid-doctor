# Rule Runner Boundary

Solid Doctor keeps rule execution separate from the doctor product layer.

## Adapter-owned

- Creating `RuleContext` values with project, file, relative path, and source text.
- Running rules and collecting raw findings.
- Mapping raw rule findings into normalized Solid Doctor diagnostics.

This is where future Oxlint JavaScript-plugin rules or native Oxlint rules should be adapted into the same internal contract.

## Doctor-layer-owned

- Project classification.
- Rule catalog lookup, metadata, docs, and rule pack selection.
- Project file set selection for analyzable files.
- Scoring.
- Terminal, JSON, SARIF, Markdown, and agent-readable reports.
- CI thresholds, baselines, and diff filtering.
- Agent instruction installation.

Rules should not know how scores are calculated or how reports are rendered. They emit raw findings plus metadata, including category, impact, and tags, and the adapter turns those findings into diagnostics.

Reporters and TUI views consume report projections rather than re-deriving fingerprints, locations, annotation levels, or rule-enriched issue details independently.
