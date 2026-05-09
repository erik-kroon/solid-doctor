# JSON Report

`solid-doctor scan <project> --format json` emits a stable report object.

Current schema version: `1`.

Top-level fields:

- `schemaVersion`: JSON report schema version.
- `project`: serializable project profile summary.
- `score`: overall score and category subscores.
- `metadata`: scan metadata including checked file count, diagnostic count, and elapsed milliseconds.
- `diagnostics`: normalized diagnostics projected through the report projection module with stable fingerprints, locations, rule metadata, impact, tags, and issue-facing fields for reporters and TUI views.
- `suppressionHints`: unused or unknown inline suppressions that did not suppress a diagnostic.

Expected scan errors with `--format json` use this shape on stdout and exit non-zero:

```json
{
  "schemaVersion": 1,
  "error": {
    "code": "scan_failed",
    "message": "Solid Doctor only scans projects with a solid-js dependency."
  }
}
```

Baselines use the same fingerprints:

```bash
solid-doctor scan . --write-baseline solid-doctor-baseline.json
solid-doctor scan . --baseline solid-doctor-baseline.json
```

Diff adoption can use Git diff mode or an explicit changed-lines file:

```bash
solid-doctor scan . --diff main
solid-doctor scan . --changed-lines changed-lines.txt
```

`changed-lines.txt` uses one `path:line` entry per changed line.
