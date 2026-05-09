# Solid Doctor

Code health for Solid and SolidStart.

Solid Doctor is a diagnostic CLI for Solid and SolidStart projects. It scans codebases and reports a `0-100` health score with actionable findings for reactivity, rendering, async data, SSR, lifecycle and maintainability risks.

> Fast diagnostics for Solid reactivity, SSR and lifecycle bugs.

## Why It Exists

Solid code has its own failure modes.

Reactive values can be read in the wrong place, copied into stale local snapshots, derived inside effects, accessed after async boundaries, rendered with inefficient list patterns, leaked across owners or evaluated on the server where browser globals do not exist.

Those mistakes happen in hand-written Solid, migrated code and AI-generated changes. Solid Doctor makes them visible, explainable and enforceable across local development, CI, code review and coding-agent workflows.

## Current State

This is a working TypeScript implementation of the Solid Doctor product loop:

- Scan a Solid project from one CLI command.
- Classify Solid, SolidStart, Vite Solid, libraries, monorepos, generated files, tests, client-only paths, and SSR-capable files.
- Run a Solid-specific rule pack focused on correctness and maintainability risks.
- Normalize findings into diagnostics with rule id, category, severity, confidence, impact, tags, docs slug, location, remediation, and optional fix data.
- Produce a `0-100` health score with category subscores.
- Report to terminal, JSON, Markdown, SARIF, and GitHub annotations.
- Support incremental adoption through baselines, changed-line filtering, git diff mode, and score thresholds.
- Support project config, repository ignores, per-rule/file ignores, and next-line suppressions.
- Explain rule guidance through `solid-doctor explain`.
- Install managed agent guidance into `AGENTS.md` and Cursor rules.
- Build a Node-compatible npm package artifact that runs through `npx` and `bunx`.
- Feed the optional source-checkout OpenTUI dashboard and issue explorer from the same report projection used by reporters.

The package is prepared for npm publishing as `solid-doctor`, but is not published yet.

## Implemented Rule Pack

The current MVP rule pack detects:

- `solid/reactive-prop-snapshot`: local snapshots of component props later used as if they were live.
- `solid/derived-state-in-effect`: effects that mirror reactive inputs into another signal as derived state.
- `solid/async-tracking-gap`: reactive reads after `await` inside tracked effects.
- `solid/async-no-fetch-in-effect`: application data fetches started from effects instead of Solid async primitives.
- `solid/dynamic-map-in-jsx`: reactive arrays rendered with `.map()` directly in JSX.
- `solid/render-stable-children`: repeated `props.children` reads without Solid's `children()` helper.
- `solid/browser-global-in-ssr`: browser globals in SSR-capable SolidStart files.
- `solid/server-request-scoped-state`: request-scoped mutable module state in SSR-capable files.
- `solid/effect-cleanup-subscriptions`: subscriptions, listeners, timers, observers, or roots without cleanup.

Additional selectable rule packs:

- `--rules reactivity`: includes the MVP reactivity rules plus `solid/store-destructure-snapshot` for Solid store destructuring snapshots.

The rules are intentionally conservative. A diagnostic should point to a likely Solid correctness, SSR, lifecycle, or maintainability risk, not a formatting preference.

## Example

```tsx
function Greeting(props: { name: string }) {
  const name = props.name;

  return <h1>Hello {name}</h1>;
}
```

In Solid, the component function runs once. `name` is a snapshot, so JSX no longer reads `props.name` reactively. Solid Doctor reports that pattern and explains the safer shape:

```tsx
function Greeting(props: { name: string }) {
  return <h1>Hello {props.name}</h1>;
}
```

Example CLI output:

```txt
Solid Doctor
Project: invalid-prop-snapshot-fixture
Health score: 82/100

Diagnostics:
- [warning] reactivity/high src/App.tsx:6:3
  Tags: reactive, props, splitProps, mergeProps
  Local value 'name' snapshots props.name before JSX can track it.
  Fix: Read props.name inside JSX, use a prop accessor, or wrap the derivation in createMemo.
```

## Usage

External docs:

- [Installation](docs/installation.md)
- [Configuration and adoption](docs/configuration.md)
- [Rule reference](docs/rule-reference.md)
- [GitHub Action](docs/github-action.md)
- [Performance](docs/performance.md)
- [Agent output](docs/agent-output.md)

Package runners:

```bash
npx solid-doctor scan .
bunx solid-doctor scan .
```

Local project install:

```bash
npm install --save-dev solid-doctor
npx solid-doctor scan .
```

With Bun:

```bash
bun add --dev solid-doctor
bunx solid-doctor scan .
```

Until the first npm publish, use the packed tarball smoke path from [docs/package-release.md](docs/package-release.md).

## Local Development

Install dependencies:

```bash
bun install
```

Run the scanner:

```bash
bun run scan -- fixtures/valid-solid
bun run scan -- fixtures/invalid-prop-snapshot
```

Equivalent direct commands:

```bash
bun src/cli.ts scan fixtures/valid-solid
bun src/cli.ts check fixtures/valid-solid
```

Build the npm package artifact:

```bash
bun run build
node dist/cli.js scan fixtures/valid-solid
```

Report formats:

```bash
solid-doctor scan fixtures/valid-solid --format json
solid-doctor scan fixtures/invalid-prop-snapshot --format markdown
solid-doctor scan fixtures/invalid-prop-snapshot --format sarif
solid-doctor scan fixtures/invalid-prop-snapshot --format github
solid-doctor scan fixtures/invalid-prop-snapshot --format agent
```

GitHub Action:

```yaml
- uses: erik-kroon/solid-doctor@main
  id: solid-doctor
  with:
    directory: .
    diff-base: origin/${{ github.base_ref }}
    min-score: 80
```

Incremental adoption and CI:

```bash
solid-doctor scan . --ci --diff main --min-score 80
solid-doctor scan . --project apps/web --project @scope/ui
solid-doctor scan . --staged
solid-doctor scan . --write-baseline solid-doctor-baseline.json
solid-doctor scan . --baseline solid-doctor-baseline.json
solid-doctor scan . --changed-lines changed-lines.txt
```

Configuration and suppressions:

```json
{
  "ignore": {
    "rules": ["solid/browser-global-in-ssr"],
    "files": ["src/legacy/**"]
  },
  "overrides": [
    {
      "files": ["src/routes/admin/**"],
      "ignore": {
        "rules": ["solid/dynamic-map-in-jsx"]
      }
    }
  ]
}
```

Save that as `solid-doctor.config.json` or under the `solidDoctor` package.json key. File ignores also honor `.solid-doctorignore` and non-negated `.gitignore` entries. Inline suppressions use a named next-line directive:

```tsx
// solid-doctor-disable-next-line solid/browser-global-in-ssr
const title = document.title;
```

Rule docs and agent guidance:

```bash
solid-doctor explain solid/reactive-prop-snapshot
solid-doctor explain suppression
solid-doctor install-agents . --target all --dry-run
```

Oxlint plugin usage is documented in [docs/oxlint-plugin.md](docs/oxlint-plugin.md).

Optional TUI surface for source checkouts:

```bash
bun src/cli.ts doctor fixtures/valid-solid
bun src/cli.ts inspect fixtures/invalid-prop-snapshot
```

## Verification

```bash
bun run test
bun run check-types
bun run build
bun run benchmark -- --fixture fixtures/valid-solid --runs 3
bun run --cwd apps/tui check-types
```

Focused scanner checks:

```bash
bun run scan -- fixtures/valid-solid
bun src/cli.ts scan fixtures/invalid-prop-snapshot
```

Package smoke checks:

```bash
bun pm pack --destination .context/package-smoke
npm exec --package .context/package-smoke/solid-doctor-0.1.0.tgz -- solid-doctor scan fixtures/valid-solid
bunx --package "$PWD/.context/package-smoke/solid-doctor-0.1.0.tgz" solid-doctor scan fixtures/valid-solid
```

## Architecture

Solid Doctor is intentionally built as a product layer over a rule engine.

```txt
src/
  cli.ts                         # command entry point
  scan.ts                        # doctor run orchestration, filtering, scoring
  project-classifier.ts          # project and file classification
  project-file-set.ts            # analyzable file selection
  file-walk.ts                   # source discovery
  adoption-config.ts             # config, ignores, suppressions, and adoption filtering
  rule-runner.ts                 # rule execution boundary
  diagnostics.ts                 # normalized diagnostic contract and identity
  reactive-source-model.ts       # shared reactive source analysis
  reactive-read-model.ts         # shared reactive read queries
  tracking-scope-model.ts        # shared tracking scope analysis
  source-location.ts             # source index, line, and column helpers
  report-projection.ts           # enriched report interface for reporters and TUI
  scoring.ts                     # impact-weighted score engine
  reporter.ts                    # terminal, JSON, Markdown, SARIF, GitHub output
  agent-installer.ts             # managed agent instruction updates
  rule-docs.ts                   # explain output from rule metadata
  tui-view-model.ts              # optional TUI presentation model
  rules/
    *.ts                         # Solid-specific rules
dist/
  cli.js                         # bundled npm CLI artifact
  types/                         # generated declarations for packaged runtime code
```

The key interface is the rule runner:

- Rules emit raw findings and metadata.
- `src/rule-runner.ts` adapts rule findings into normalized diagnostics.
- The doctor layer owns project classification, scoring, reporting, baselines, CI behavior, and agent installation.

That boundary keeps the current TypeScript implementation small while leaving a path toward Oxlint JavaScript plugins or native Oxlint rules later. Reporters and TUI views consume a shared report projection, so fingerprints, locations, annotation levels, rule explanations, examples, tags, and diff previews are enriched once.

## What To Look At

For product shape, start with:

- [CONTEXT.md](CONTEXT.md): product vocabulary, users, boundaries, and rule quality bar.
- [CONTEXT-MAP.md](CONTEXT-MAP.md): where implementation areas live.
- [docs/adr/0001-oxlint-first-solid-doctor.md](docs/adr/0001-oxlint-first-solid-doctor.md): Oxlint-first architecture decision.
- [docs/rule-runner-boundary.md](docs/rule-runner-boundary.md): rule runner ownership and product-layer ownership.
- [docs/reactive-models.md](docs/reactive-models.md): shared reactive source, read, and tracking models.
- [docs/package-release.md](docs/package-release.md): package publishing checklist and source-release boundary.
- [docs/github-action.md](docs/github-action.md): GitHub Action usage, inputs, outputs, and PR comment behavior.
- [docs/oxlint-plugin.md](docs/oxlint-plugin.md): Oxlint JS plugin-compatible rule surface.

For engineering signal, the highest-value areas are:

- Fixture-driven tests that cover valid, invalid, and false-positive Solid patterns.
- A normalized diagnostic contract shared by reports, scoring, docs, CI, TUI, and agent guidance.
- Project/file classification that gates SSR diagnostics away from client-only, generated, test, and config files.
- Adoption paths for existing projects through baselines, diff filtering, and score thresholds.

## Principles

- Solid-native, not a React lint clone.
- Oxlint-first, not ESLint-first.
- High signal over high volume.
- Fix guidance over vague warnings.
- Rule metadata as the source of truth for CLI, docs, JSON, reports, and agent instructions.
- Incremental adoption for existing projects through diff mode, baselines, and score thresholds.
- No formatting opinions. `oxfmt` owns formatting.

## License

UNLICENSED.
