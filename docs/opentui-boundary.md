# OpenTUI Boundary

OpenTUI is the terminal presentation surface for dashboard and issue exploration workflows.

The base scanner, rule engine, reporters, CI path, scoring, baselines, and agent installer do not import `@opentui/*`.

`solid-doctor check` and `solid-doctor scan` run through the core CLI only. `solid-doctor doctor` and `solid-doctor inspect` scan the project, write the same JSON report shape used by automation, and then hand that report to `apps/tui` in a source checkout.

The npm package does not include `apps/tui` yet. Packaged `doctor` and `inspect` commands fail with an explicit message instead of trying to load source-checkout paths.

The TUI owns presentation only:

- dashboard score display
- issue explorer view models
- filtering by severity, category, impact, tag, rule, file, confidence, and fixability
- detail text from rule metadata
- code location and future diff preview slots

Issue details come from the shared report projection module, not direct rule lookup. This keeps the OpenTUI view model aligned with JSON, Markdown, SARIF, and GitHub annotation output.

Analysis remains owned by the core scanner.
