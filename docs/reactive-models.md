# Reactive Source And Tracking Models

Solid Doctor rules query shared models instead of rediscovering Solid semantics locally.

## Reactive Source Model

`analyzeReactiveSources(sourceText)` returns a small interface for:

- imported Solid primitives and local aliases
- component props parameter names
- signal getters and setters
- store roots from `createStore`
- memo accessors from `createMemo`
- resource accessors from `createResource`
- helper predicates for reactive reads and reactive `.map()` expressions

Rules should ask this model whether a snippet reads reactive data instead of matching only `props` or unaliased `createSignal`.

## Tracking Scope Model

`analyzeTrackingScopes(sourceText, reactiveSources)` returns normalized scope records for:

- effects
- memos
- resources
- mount-only code
- async regions after `await`

Rules should use this model for tracked and untracked context decisions. Product-layer code remains outside these models: scoring, reporting, baselines, CI output, and agent installation consume diagnostics after rule execution.
