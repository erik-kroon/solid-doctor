# Solid Doctor Context

Solid Doctor is a diagnostic product for Solid's reactive graph. It is not a formatter, a general lint suite, or an ESLint-first port. It should feel native to Solid and natural beside `oxlint` and `oxfmt`.

## Product Promise

Your AI writes React-shaped Solid. Solid Doctor catches it.

The tool should make Solid's correctness model visible across local development, CI, code review, and agentic coding workflows.

## Core Users

- Solid developers who want fast feedback on components, effects, resources, stores, and SolidStart routes.
- React-to-Solid migrants who need guardrails against patterns that compile but become stale or unsafe in Solid.
- SolidStart teams that need SSR and client-boundary checks.
- Library authors who need stronger lifecycle, owner, and SSR guarantees.
- AI coding-agent users who need generated Solid code to follow Solid's mental model.

## Domain Vocabulary

- **Diagnostic**: A normalized issue with rule id, category, severity, confidence, impact, tags, file location, message, docs slug, and remediation.
- **Health score**: A `0-100` project score derived from diagnostics. Current scoring is impact-weighted and confidence-adjusted, with category subscores for adoption planning.
- **Rule**: A detection unit that emits raw findings plus metadata.
- **Rule pack**: A group of rules focused on an adoption surface, such as MVP, reactivity, SSR, effects, owners, or library author mode.
- **Reactive snapshot**: A local value copied from a reactive source outside a tracking scope and later treated as live.
- **Tracking scope**: A Solid computation or JSX binding context where signal, store, resource, or prop reads are subscribed.
- **Owner**: Solid's lifetime and context owner used for cleanup, context lookup, and descendant computations.
- **Async tracking gap**: Code that assumes tracking or owner context continues after `await`.
- **SSR browser global leak**: Use of `window`, `document`, storage, or navigator-style APIs in server-capable code.
- **Doctor run**: One analysis session over a project, fixture, file set, diff, or CI target.

## Product Boundaries

Solid Doctor should:

- Detect Solid-specific correctness and code-health risks.
- Explain why a pattern is risky in Solid vocabulary.
- Provide actionable remediation and credible docs references.
- Support incremental adoption through baselines, diff mode, and score thresholds.
- Produce outputs useful to humans, CI systems, and coding agents.

Solid Doctor should not:

- Compete with `oxfmt`.
- Replace all general-purpose `oxlint` rules.
- Become ESLint-first.
- Auto-rewrite complex reactive code without human judgment.
- Enforce one team's style or component architecture.

## Current Implementation Snapshot

- TypeScript-only source and tests.
- Bun-native execution.
- Type checks use `tsgo` through `@typescript/native-preview`.
- The CLI entry point is `src/cli.ts`.
- The scanner orchestration is `src/scan.ts`.
- Rule execution is isolated in `src/rule-runner.ts`.
- Diagnostic contracts live in `src/diagnostics.ts`.
- MVP rules currently live under `src/rules/`.
- Fixture projects live under `fixtures/`.

## Rule Quality Bar

New rules should have:

- A specific Solid mental model failure.
- High-signal default behavior.
- Metadata with category, impact, tags, severity, confidence, docs slug, and remediation.
- Valid, invalid, and false-positive fixtures.
- A path to shared source/tracking analysis instead of private duplicated heuristics.
