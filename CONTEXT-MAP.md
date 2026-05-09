# Context Map

Use this map to route future work quickly.

## Product And Planning

- `README.md`: external-facing product description, current usage, roadmap.
- `CONTEXT.md`: domain vocabulary, product boundaries, rule quality bar.
- `AGENTS.md`: operating guidance for coding agents.
- GitHub issue `#1`: optimal end-state PRD.
- GitHub issues `#4` through `#9`: remaining vertical slices.

## CLI And Scan Flow

- `src/cli.ts`: parses `solid-doctor scan <project>`, prints terminal output, owns exit codes.
- `src/scan.ts`: classifies the project, collects files, runs rules, computes score.
- `src/project-classifier.ts`: detects whether a target is a Solid project.
- `src/file-walk.ts`: finds source files while skipping generated/build/dependency directories.

## Rule System

- `src/rule-runner.ts`: adapter boundary between raw rule findings and normalized diagnostics.
- `src/diagnostics.ts`: diagnostic, rule metadata, severity, confidence, and normalization contracts.
- `src/rules/`: current rule implementations.
- `src/rules/rule-utils.ts`: shared text/position helpers used by rules.
- `docs/rule-runner-boundary.md`: durable boundary notes.

## Fixtures And Tests

- `fixtures/valid-solid/`: clean Solid project fixture.
- `fixtures/invalid-prop-snapshot/`: deliberately invalid fixture for scanner behavior.
- `test/scan.test.ts`: CLI-level fixture tests.
- `test/diagnostics.test.ts`: raw finding to diagnostic normalization tests.

## Apps

- `apps/web/`: web app scaffold; not yet the primary product surface.
- `apps/tui/`: OpenTUI exploration for post-MVP interactive UI.

## Decisions And Agent Workflow

- `docs/adr/`: durable architecture decisions.
- `docs/agents/workflow.md`: issue tracking and skill conventions.

## Local References

- `references/`: gitignored source references populated by `scripts/clone-references.sh`.
- Treat references as prior art and vocabulary sources. Do not copy code blindly.
