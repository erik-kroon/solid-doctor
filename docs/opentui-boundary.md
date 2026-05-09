# OpenTUI Boundary

OpenTUI is optional and post-MVP presentation code.

The base scanner, rule engine, reporters, CI path, scoring, baselines, and agent installer do not import `@opentui/*`.

`solid-doctor check` and `solid-doctor scan` run through the core CLI only. `solid-doctor doctor` and `solid-doctor inspect` scan the project, write the same JSON report shape used by automation, and then hand that report to `apps/tui`.

The TUI owns presentation only:

- dashboard score display
- issue explorer view models
- filtering by severity, category, rule, file, confidence, and fixability
- detail text from rule metadata
- code location and future diff preview slots

Issue details come from the shared report projection module, not direct rule lookup. This keeps the OpenTUI view model aligned with JSON, Markdown, SARIF, and GitHub annotation output.

Analysis remains owned by the core scanner.
