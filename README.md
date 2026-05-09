# Solid Doctor

Oxlint-fast code health for Solid's reactive graph.

Solid Doctor is a diagnostic tool for Solid and SolidStart projects. It catches code that compiles, looks familiar to React developers, and still breaks Solid's fine-grained reactivity model.

> Your AI writes React-shaped Solid. Solid Doctor catches it.

## Why This Exists

Solid does not fail in the same way React fails.

React code often gets slow because components render too much. Solid code more often gets wrong because a reactive value was read in the wrong place, copied into a stale local snapshot, destructured out of a proxy, derived inside an effect, accessed after an async boundary, or used in SSR-capable code where the browser does not exist.

Those mistakes are common when teams migrate from React, when Solid is adopted incrementally, and when coding agents generate Solid from React-heavy examples.

Solid Doctor makes those mistakes visible, explainable, and enforceable.

## Product Direction

Solid Doctor is designed as a product layer over a rule engine:

- A one-command CLI that scans Solid projects and reports a `0-100` health score.
- An Oxlint-oriented rule runner boundary for Solid-specific diagnostics.
- A project classifier for Solid, SolidStart, libraries, monorepos, test fixtures, and generated code.
- A normalized diagnostic model with severity, confidence, category, impact, tags, docs slug, location, and remediation.
- Reporters for terminal, JSON, Markdown, SARIF, GitHub annotations, and agent-readable output.
- Agent instruction installation for `AGENTS.md`, Codex, Claude Code, Cursor, Copilot, and similar workflows.
- Fixture-driven conformance tests that prove rules catch real Solid mistakes without punishing idiomatic Solid.

The tool should complement `oxlint`, `oxfmt`, and existing Solid linting work. It is not trying to become a formatter, a general-purpose lint suite, or an ESLint-first plugin.

## What It Detects

The long-term rule set focuses on Solid-specific correctness and maintainability risks:

- Reactive prop and store snapshots.
- Signal reads outside tracking scopes.
- Derived state in effects.
- Async tracking gaps after `await`.
- Resource source functions that track too much.
- Dynamic reactive `.map()` usage in JSX.
- Component setup conditionals that should be reactive control flow.
- Missing cleanup for timers, listeners, observers, subscriptions, and roots.
- `createRoot` owner leaks.
- Browser globals in SSR-capable SolidStart paths.
- Request-scoped mutable module state.
- Client-only imports leaking into server-rendered code.

The first tracer rule detects this class of bug:

```tsx
function Greeting(props: { name: string }) {
  const name = props.name;

  return <h1>Hello {name}</h1>;
}
```

In Solid, `name` is a snapshot. The fix is to keep the read live:

```tsx
function Greeting(props: { name: string }) {
  return <h1>Hello {props.name}</h1>;
}
```

## Current Status

The implementation now covers the vertical slices from the PRD:

- TypeScript-only implementation.
- Bun-native CLI execution.
- `tsgo` type checking through `@typescript/native-preview`.
- Solid, SolidStart, Vite Solid, library, monorepo, test/config/generated/client-only/server-capable classification.
- A rule runner boundary that separates rule findings from the doctor product layer.
- Shared reactive source and tracking scope models.
- A normalized diagnostic model with severity, confidence, category, impact, tags, docs slug, fixability, location, remediation, and optional fix data.
- Impact-weighted health scoring with category subscores.
- Terminal, JSON, Markdown, SARIF, and GitHub annotation reporters.
- Baseline, diff, changed-line, and score-threshold adoption paths.
- Rule metadata, `explain`, and agent instruction installation for `AGENTS.md` and Cursor.
- Optional OpenTUI dashboard/issue explorer commands that consume the same JSON report shape.
- Fixture-driven tests for clean scans, diagnostics, false-positive guards, reporters, classifier behavior, agent docs, and TUI view models.

Example output:

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

Run the scanner against the included fixtures:

```bash
bun src/cli.ts scan fixtures/valid-solid
bun src/cli.ts scan fixtures/invalid-prop-snapshot
```

Equivalent base command:

```bash
bun src/cli.ts check fixtures/valid-solid
```

Report formats and CI paths:

```bash
bun src/cli.ts scan fixtures/valid-solid --format json
bun src/cli.ts scan fixtures/invalid-prop-snapshot --format markdown
bun src/cli.ts scan fixtures/invalid-prop-snapshot --format sarif
bun src/cli.ts scan fixtures/invalid-prop-snapshot --format github
bun src/cli.ts scan . --ci --diff main --min-score 80
```

Incremental adoption:

```bash
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

Run tests and type checks:

```bash
bun test test/*.test.ts
bun run check-types
bun run --cwd apps/tui check-types
```

Package scripts:

```bash
bun run scan -- fixtures/valid-solid
bun run test
bun run check-types
```

## Architecture

The current core is deliberately small:

```txt
src/
  cli.ts                         # command entry point
  scan.ts                        # scan orchestration, filtering, scoring
  project-classifier.ts          # project and file classification
  file-walk.ts                   # source discovery
  rule-runner.ts                 # rule execution boundary
  diagnostics.ts                 # normalized diagnostic contract
  reactive-source-model.ts       # shared reactive source analysis
  tracking-scope-model.ts        # shared tracking scope analysis
  scoring.ts                     # weighted score engine
  reporter.ts                    # terminal, JSON, Markdown, SARIF, GitHub output
  agent-installer.ts             # managed agent instruction updates
  rule-docs.ts                   # explain output from rule metadata
  tui-view-model.ts              # optional TUI presentation model
  rules/
    *.ts                         # MVP Solid-specific rules
```

The important boundary is the rule runner:

- Rules emit raw findings and metadata.
- The adapter normalizes findings into Solid Doctor diagnostics.
- The doctor layer owns project classification, scoring, reporting, baselines, CI behavior, and agent installation.

That boundary is what lets the project start with a small TypeScript rule implementation while keeping a path open for Oxlint JavaScript plugins and future native Oxlint rules.

## Roadmap

Implemented vertical slices:

1. Tracer CLI scan with one real diagnostic.
2. Oxlint-oriented rule runner boundary.
3. MVP React-shaped Solid rule pack.
4. Shared reactive source and tracking scope models.
5. Project classifier depth for SolidStart, libraries, and monorepos.
6. Scoring, JSON, baseline, and diff adoption.
7. CI reporters and PR annotation path.
8. Agent instruction installer and rule docs.
9. Optional OpenTUI interactive doctor UI.

The MVP rule pack is:

- Reactive prop/store snapshot.
- Derived state in effects.
- Async tracking gap after `await`.
- Data fetches started from effects instead of Solid async primitives.
- Dynamic reactive `.map()` in JSX.
- Repeated `props.children` reads without `children()`.
- Browser globals in SSR-capable paths.
- Request-scoped mutable module state in SSR-capable paths.
- Missing cleanup for subscriptions, timers, observers, and listeners.

## References

The local `references/` directory is gitignored and can be populated with curated source references:

```bash
bash scripts/clone-references.sh
```

Important references include React Doctor for product shape, Oxc/Oxlint for engine direction, `eslint-plugin-solid` and Solid docs for rule semantics, Biome for diagnostic UX, Solid Devtools for reactive graph vocabulary, and Oxlint Action for CI annotation behavior.

See [AGENTS.md](AGENTS.md) for how coding agents should use those references.

## Principles

- Solid-native, not React-translated.
- Oxlint-first, not ESLint-first.
- High signal over high volume.
- Fix guidance over vague warnings.
- Rule metadata as the source of truth for CLI, docs, JSON, and agent instructions.
- Incremental adoption for existing projects through diff mode, baselines, and score thresholds.
- No formatting opinions. `oxfmt` owns formatting.

## License

Not published yet.
