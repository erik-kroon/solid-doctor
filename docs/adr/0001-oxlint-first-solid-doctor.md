# ADR 0001: Oxlint-First Solid Doctor

## Status

Accepted.

## Context

Solid Doctor should catch Solid-specific correctness problems, especially React-shaped Solid that compiles but breaks fine-grained reactivity, lifecycle, owner, async, or SSR expectations.

The project should fit beside `oxlint` and `oxfmt`. Existing ESLint-oriented Solid rules are valuable prior art, but the product should not be architected as an ESLint-first plugin.

## Decision

Solid Doctor will use an Oxlint-oriented rule runner boundary:

- The CLI and doctor product layer own project classification, scoring, reporting, CI behavior, baselines, and agent installation.
- Rules emit raw findings and rule metadata.
- The rule runner normalizes raw findings into Solid Doctor diagnostics.
- The boundary should be able to adapt TypeScript rules now, Oxlint JavaScript-plugin rules next, and native Oxlint rules later.

## Consequences

- Rules must not know how reports are rendered or scores are calculated.
- Diagnostic metadata must remain stable and centralized.
- Future performance work can move hot rules closer to Oxlint without rewriting the CLI product surface.
- Contributors should prefer shared analyzer modules over one-off rule heuristics.
