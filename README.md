# Solid Doctor

Oxlint-fast code health for Solid's reactive graph.

Solid Doctor is a diagnostic CLI for Solid and SolidStart projects. It catches code that compiles, looks familiar to React developers, and still breaks Solid's fine-grained reactivity model.

> Your AI writes React-shaped Solid. Solid Doctor catches it.

## Why It Exists

Solid does not fail in the same way React fails.

React code often gets slow because components render too much. Solid code more often gets wrong because a reactive value was read in the wrong place, copied into a stale local snapshot, derived inside an effect, accessed after an async boundary, used as a dynamic list with React-shaped `.map()`, or evaluated on the server where browser globals do not exist.

Those mistakes are common when teams migrate from React, when Solid is adopted incrementally, and when coding agents generate Solid from React-heavy examples. Solid Doctor makes those mistakes visible, explainable, and enforceable.

## Current State

This is a working TypeScript/Bun implementation of the Solid Doctor product loop:

- Scan a Solid project from one CLI command.
- Classify Solid, SolidStart, Vite Solid, libraries, monorepos, generated files, tests, client-only paths, and SSR-capable files.
- Run a Solid-specific rule pack focused on correctness and maintainability risks.
- Normalize findings into diagnostics with rule id, category, severity, confidence, impact, tags, docs slug, location, remediation, and optional fix data.
- Produce a `0-100` health score with category subscores.
- Report to terminal, JSON, Markdown, SARIF, and GitHub annotations.
- Support incremental adoption through baselines, changed-line filtering, git diff mode, and score thresholds.
- Explain rule guidance through `solid-doctor explain`.
- Install managed agent guidance into `AGENTS.md` and Cursor rules.
- Feed the optional OpenTUI dashboard and issue explorer from the same report projection used by reporters.

The package is not published yet. The repo is currently most useful as a product-quality prototype and engineering reference for a Solid-aware, Oxlint-oriented diagnostic tool.

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

Report formats:

```bash
bun src/cli.ts scan fixtures/valid-solid --format json
bun src/cli.ts scan fixtures/invalid-prop-snapshot --format markdown
bun src/cli.ts scan fixtures/invalid-prop-snapshot --format sarif
bun src/cli.ts scan fixtures/invalid-prop-snapshot --format github
```

Incremental adoption and CI:

```bash
bun src/cli.ts scan . --ci --diff main --min-score 80
bun src/cli.ts scan . --write-baseline solid-doctor-baseline.json
bun src/cli.ts scan . --baseline solid-doctor-baseline.json
bun src/cli.ts scan . --changed-lines changed-lines.txt
```

Rule docs and agent guidance:

```bash
bun src/cli.ts explain solid/reactive-prop-snapshot
bun src/cli.ts install-agents . --target all --dry-run
```

Optional TUI surface:

```bash
bun src/cli.ts doctor fixtures/valid-solid
bun src/cli.ts inspect fixtures/invalid-prop-snapshot
```

## Verification

```bash
bun run test
bun run check-types
bun run --cwd apps/tui check-types
```

Focused scanner checks:

```bash
bun run scan -- fixtures/valid-solid
bun src/cli.ts scan fixtures/invalid-prop-snapshot
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

For engineering signal, the highest-value areas are:

- Fixture-driven tests that cover valid, invalid, and false-positive Solid patterns.
- A normalized diagnostic contract shared by reports, scoring, docs, CI, TUI, and agent guidance.
- Project/file classification that gates SSR diagnostics away from client-only, generated, test, and config files.
- Adoption paths for existing projects through baselines, diff filtering, and score thresholds.

## Principles

- Solid-native, not React-translated.
- Oxlint-first, not ESLint-first.
- High signal over high volume.
- Fix guidance over vague warnings.
- Rule metadata as the source of truth for CLI, docs, JSON, reports, and agent instructions.
- Incremental adoption for existing projects through diff mode, baselines, and score thresholds.
- No formatting opinions. `oxfmt` owns formatting.

## License

Not published yet.
