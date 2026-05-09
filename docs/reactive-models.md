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

This model owns import, alias, and source discovery. It does not decide whether a read is tracked or belongs to a rule pattern.

## Reactive Read Model

`analyzeReactiveReads({ source, reactiveSources, trackingScopes })` turns source discovery and tracking scopes into direct domain queries:

- `readsInRegion(region)`
- `writesInRegion(region)`
- `readsAfterAwait(scope)`
- `reactiveJsxListSources()`
- `propSnapshotsUsedInReturnedJsx()`
- `isIndexTracked(index)`
- `isIndexPostAwait(index)`
- `isIndexInsideMount(index)`

Rules should ask these questions instead of slicing source text, recalculating regions, or rediscovering whether a pattern is reactive.

## Tracking Scope Model

`analyzeTrackingScopes(sourceText, reactiveSources)` returns normalized scope records for:

- effects
- memos
- resources
- mount-only code
- async regions after `await`

Rules should use this model for tracked and untracked context decisions. Product-layer code remains outside these models: scoring, reporting, baselines, CI output, and agent installation consume diagnostics after rule execution.
