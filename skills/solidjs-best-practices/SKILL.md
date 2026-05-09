---
name: solidjs-best-practices
description: "Apply Solid.js, Solid Router, and SolidStart best practices for fine-grained reactivity, async data, routing, SSR/SSG/streaming, resources, signals, stores, effects, control flow, bundle boundaries, and performance. Use when writing, reviewing, or refactoring Solid components, SolidStart routes/server functions/actions, router query/createAsync data flows, hydration behavior, event handling, or large-list rendering."
---

# SolidJS Best Practices

Use this skill to write, review, or refactor Solid and SolidStart code without
importing React mental models. The durable move is to shape reactive
dependencies, async boundaries, owners, server boundaries, and bundles around
Solid's fine-grained graph.

## Core Model

Solid components are setup functions. They usually run once to create DOM
bindings and reactive computations. Signal, store, memo, resource, and prop
reads update only the computations and DOM bindings that depend on them.

Optimize Solid code by changing what gets tracked, where async work starts, how
resources are scoped, and where server/client boundaries sit. Do not default to
React-style component memoization or "reduce re-renders" advice.

## Preflight

Start with one line when the task is non-trivial:

```text
SOLID_BEST_PRACTICES: target=<component|route|server|data|bundle|review> rendering=<csr|ssr|streaming|ssg|unknown> priority=<async|bundle|server|reactive|render|effect|js|advanced>
```

Before editing, inspect the nearest package/config files and the specific route,
component, data loader, or server function involved. Infer SolidStart rendering
mode from config, route conventions, and deployment code when possible. Ask only
when local context cannot determine whether code runs on the server, client, or
both.

## Workflow

1. Classify the surface:
   - Component-only Solid, Solid Router, SolidStart route, server function,
     action, API route, reusable library component, or browser-only integration.
2. Map data and async work:
   - Identify `createResource`, `createAsync`, `query`, actions, server
     functions, fetch calls, Suspense boundaries, route preloads, and mutation
     invalidation.
   - Remove waterfalls before tuning smaller work.
3. Map bundle boundaries:
   - Identify route splits, `lazy`, heavy widgets, third-party scripts,
     optional feature imports, and client-only modules.
4. Check server boundaries:
   - Keep auth, request data, cookies, redirects, and database work in
     request-scoped server paths.
   - Guard browser APIs and browser-only libraries.
5. Audit reactivity:
   - Keep props live, read signals in intentional tracking scopes, use memos
     for expensive shared derivation, and avoid effects for pure derived state.
6. Audit rendering and control flow:
   - Prefer Solid control-flow components over dynamic JSX array mapping and
     broad conditional work.
7. Audit effects, lifecycle, and owners:
   - Effects are for side effects. Register cleanup under a live owner and be
     careful after `await`.
8. Verify:
   - Run the nearest typecheck, tests, linter, build, route smoke test, or
     browser check available. If optimizing performance, measure the relevant
     layer before and after when tooling exists.

## Rule Categories

| Priority | Category                                  | Impact      | Prefix      |
| -------- | ----------------------------------------- | ----------- | ----------- |
| 1        | Eliminating Waterfalls and Async Blocking | CRITICAL    | `async-`    |
| 2        | Bundle Size and Code Splitting            | CRITICAL    | `bundle-`   |
| 3        | SolidStart, SSR, and Server Boundaries    | HIGH        | `server-`   |
| 4        | Fine-Grained Reactivity and State Shape   | HIGH        | `reactive-` |
| 5        | Control Flow and Rendering                | MEDIUM-HIGH | `render-`   |
| 6        | Effects, Lifecycle, and Events            | MEDIUM      | `effect-`   |
| 7        | JavaScript and DOM Performance            | LOW-MEDIUM  | `js-`       |
| 8        | Advanced Patterns and Tooling             | LOW         | `advanced-` |

## Quick Rules

### 1. Eliminating Waterfalls and Async Blocking

- `async-cheap-condition-before-resource`: Check cheap synchronous guards before creating or reading async resources.
- `async-start-early-await-late`: Start independent promises before branching; read results only where needed.
- `async-parallel`: Use `Promise.all()` or `Promise.allSettled()` for independent server/API work.
- `async-resource-source`: Drive `createResource` or `createAsync` from a narrow source accessor.
- `async-no-fetch-in-effect`: Prefer route data, `createResource`, `createAsync`, router `query`, or actions over ad-hoc fetches in `createEffect`.
- `async-suspense-boundaries`: Place `<Suspense>` around genuinely async subtrees.
- `async-router-preload`: Preload route data and route code on navigation intent.
- `async-query-cache`: Wrap repeatable route loaders in `query()` and deduplicate by function name and serialized arguments.
- `async-revalidate-targeted`: Revalidate only affected query cache entries after mutations when automatic SolidStart revalidation is not enough.
- `async-api-start-promises-early`: In API routes and server functions, start DB/API calls early and await late.

### 2. Bundle Size and Code Splitting

- `bundle-direct-imports`: Import directly from packages/files; avoid convenience barrels that pull large graphs.
- `bundle-lazy-routes`: Lazy-load route components and large route-only islands.
- `bundle-lazy-heavy-components`: Use `lazy(() => import(...))` for modals, editors, charts, maps, and rarely used panels.
- `bundle-preload-on-intent`: Call `lazyComponent.preload()` on hover, focus, viewport, or another strong intent signal.
- `bundle-client-only`: Use client-only loading only for browser-dependent components.
- `bundle-defer-third-party`: Defer analytics, widgets, heatmaps, ads, and non-critical logging until after initial interactivity.
- `bundle-conditional-imports`: Import optional modules only when the feature is activated.
- `bundle-analyzable-paths`: Keep dynamic imports and filesystem paths statically analyzable.
- `bundle-vite-analyze`: Measure bundles with Vite/Rollup visualizers before and after meaningful bundle changes.

### 3. SolidStart, SSR, and Server Boundaries

- `server-auth-functions-actions`: Authenticate and authorize server functions, API routes, and actions.
- `server-request-scoped-state`: Keep per-request data in request/event context, not module-level mutable variables.
- `server-no-browser-apis`: Guard `window`, `document`, `localStorage`, layout reads, and browser-only libraries behind client paths.
- `server-effects-dont-run`: Never rely on `createEffect` or `onMount` for server-rendered data, metadata, authorization, redirects, or critical output.
- `server-serialization-minimal`: Serialize only data needed by hydrated client code.
- `server-streaming-suspense`: Use streaming SSR with Suspense for independent slow regions.
- `server-prerender-static`: Pre-render stable marketing, docs, blog, and landing routes when possible.
- `server-cache-readonly-data`: Cache read-heavy data with explicit invalidation and request isolation.
- `server-api-parallel-fetching`: Parallelize database and external API work in API routes and server functions.
- `server-streaming-header-boundary`: Run cookie, session, redirect, and response-header logic before streaming starts or use `deferStream` where needed.
- `server-csp-serialization`: Choose serialization mode with CSP and payload tradeoffs in mind.

### 4. Fine-Grained Reactivity and State Shape

- `reactive-keep-props-live`: Do not destructure props into plain values; use `props.*`, accessors, `splitProps`, or `mergeProps`.
- `reactive-signal-read-in-tracking-scope`: Read signals inside JSX, `createMemo`, `createEffect`, resource sources, or event handlers intentionally.
- `reactive-memo-expensive-derived`: Use `createMemo` for expensive derived values or derived values shared by multiple consumers.
- `reactive-no-effect-derived-state`: Derive values with accessors or `createMemo` instead of setting state in `createEffect`.
- `reactive-narrow-dependencies`: Track the smallest signal, memo, resource, or store property needed by a computation.
- `reactive-stores-for-nested-state`: Use `createStore` for nested objects/arrays that benefit from property-level tracking.
- `reactive-store-path-updates`: Use store setters with paths, `produce`, or `reconcile` instead of replacing broad objects unnecessarily.
- `reactive-batch-related-updates`: Use `batch()` for multiple related signal updates outside automatic batching contexts.
- `reactive-untrack-incidental-reads`: Use `untrack()` for incidental reads that should not subscribe.
- `reactive-on-explicit-deps`: Use `on()` when an effect should depend on specific sources.
- `reactive-equality-options`: Use `equals` deliberately for high-frequency or structurally equal values.
- `reactive-owner-cleanup`: Create roots, subscriptions, timers, and external resources under an owner and dispose them with `onCleanup`.
- `reactive-async-owner-boundary`: Be careful after `await`; owner and dependency tracking do not automatically continue.

### 5. Control Flow and Rendering

- `render-for-vs-index`: Use `<For>` for keyed identity lists and `<Index>` for stable-index primitive/value lists.
- `render-avoid-array-map-jsx`: Avoid `array.map()` in reactive JSX for dynamic lists; prefer `<For>` or `<Index>`.
- `render-show-switch-match`: Use `<Show>`, `<Switch>`, and `<Match>` for reactive conditionals.
- `render-keyed-show-reset`: Use keyed `<Show>` when subtree identity should reset on value changes.
- `render-stable-children`: Use `children(() => props.children)` before reading `props.children` multiple times.
- `render-error-boundary`: Wrap failure-prone subtrees with `<ErrorBoundary>`.
- `render-dynamic`: Use `<Dynamic>` for runtime component or element selection.
- `render-portal-overlays`: Use `<Portal>` for modals, popovers, tooltips, and overflow escapes.
- `render-classlist`: Prefer `classList` for toggling classes and `class` for stable static classes.
- `render-style-static-css`: Prefer CSS/classes for static styling; reserve style objects for small dynamic values.

### 6. Effects, Lifecycle, and Events

- `effect-side-effects-only`: Use `createEffect` for side effects, not pure derivation.
- `effect-cleanup-subscriptions`: Register timers, listeners, observers, and external subscriptions with `onCleanup`.
- `effect-onmount-dom`: Use `onMount` for DOM APIs that require mounted elements.
- `effect-render-effect-rare`: Reserve `createRenderEffect` for render-phase work that truly needs it.
- `effect-no-self-trigger-loop`: Avoid effects that read and write the same signal without guards.
- `effect-delegated-vs-native-events`: Use delegated `onClick`/`onInput` for common bubbling events; use `on:*` for custom, occasional, or propagation-sensitive events.
- `effect-stop-propagation-caution`: Do not rely on `stopPropagation()` semantics with delegated events.
- `effect-ref-timing`: Remember refs are assigned during rendering and may not be connected until mount.
- `effect-transition-nonurgent`: Use `useTransition` or `startTransition` for non-urgent resource-driven updates.

### 7. JavaScript and DOM Performance

- `js-batch-dom-css`: Group DOM/CSS writes via classes, `classList`, or `cssText`.
- `js-index-maps`: Build `Map`/`Set` indexes for repeated lookups in render or derivation paths.
- `js-cache-storage`: Cache `localStorage`/`sessionStorage` reads and version persisted schemas.
- `js-combine-iterations`: Combine multiple `filter`/`map`/`reduce` passes in hot paths.
- `js-early-exit`: Return early from functions and loops.
- `js-hoist-regexp`: Hoist `RegExp` construction outside loops and reactive computations.
- `js-virtualize-large-lists`: Virtualize very large lists instead of rendering all rows.
- `js-web-worker-heavy`: Move CPU-heavy parsing, searching, formatting, or diffing off the main thread.

### 8. Advanced Patterns and Tooling

- `advanced-create-root-dispose`: Use `createRoot` manually only when you can guarantee disposal.
- `advanced-run-with-owner`: Use `getOwner`/`runWithOwner` for callbacks that must create Solid computations later.
- `advanced-context-value-shape`: Provide stable context objects containing signals, stores, and actions, not frequently replaced snapshots.
- `advanced-no-global-singletons-ssr`: Avoid global singleton mutation that leaks across SSR requests.
- `advanced-dev-only-code`: Keep debugger and instrumentation code behind `DEV` or `import.meta.env.DEV`.

## Rule Details

Read the detailed rule files in `rules/` when you need concrete examples,
review language, or implementation patterns. Each rule file follows the
Vercel-style shape: title, impact, tags, incorrect example, correct example,
and references.

Start with:

```text
rules/async-resource-source.md
rules/async-start-early-await-late.md
rules/async-parallel.md
rules/async-no-fetch-in-effect.md
rules/async-suspense-boundaries.md
rules/async-query-cache.md
rules/bundle-direct-imports.md
rules/bundle-lazy-heavy-components.md
rules/bundle-client-only.md
rules/server-auth-functions-actions.md
rules/server-request-scoped-state.md
rules/server-no-browser-apis.md
rules/server-effects-dont-run.md
rules/reactive-keep-props-live.md
rules/reactive-memo-expensive-derived.md
rules/reactive-no-effect-derived-state.md
rules/reactive-narrow-dependencies.md
rules/reactive-owner-cleanup.md
rules/render-for-vs-index.md
rules/render-show-switch-match.md
rules/render-stable-children.md
rules/effect-side-effects-only.md
rules/effect-cleanup-subscriptions.md
rules/effect-delegated-vs-native-events.md
rules/js-index-maps.md
rules/advanced-run-with-owner.md
```

Use `rules/_sections.md` for the category map and `rules/_template.md` when
adding new rules. Keep examples local to the actual codebase and adapt imports,
router APIs, and SolidStart version to the project.

## Solid-Specific Review Checklist

Use this checklist before applying React or Next.js instincts:

1. Do not assume component re-rendering. A Solid component usually runs once.
2. Do not destructure reactive props into snapshots. Keep props live with
   `props.*`, accessors, `splitProps`, or `mergeProps`.
3. Do not use effects for derivation. Use accessors and `createMemo`; keep
   effects for I/O, DOM APIs, subscriptions, logging, and integration code.
4. Do not fetch casually in effects. Prefer router data APIs, `createResource`,
   `createAsync`, `query`, preloads, actions, and Suspense boundaries.
5. Do not map dynamic lists with plain `array.map()` inside JSX. Use `<For>` or
   `<Index>` based on the list mutation shape.
6. Do not store request data globally in SSR. Use request-scoped context and
   explicit caches.
7. Do not put browser-only code in server-rendered paths. Use guards, dynamic
   imports, or client-only boundaries.
8. Do measure bundles, hydration, and data waterfalls when performance claims
   matter. Solid is fast, but large third-party packages, broad imports, and
   browser-only widgets still dominate load time.

## Official Source Map

Prefer current official docs when a rule depends on framework behavior:

- Fine-grained reactivity: https://docs.solidjs.com/advanced-concepts/fine-grained-reactivity
- SolidStart rendering modes: https://docs.solidjs.com/solid-start
- Props, `splitProps`, and `children`: https://docs.solidjs.com/concepts/components/props
- Signals, effects, and memos: https://docs.solidjs.com/concepts/signals and https://docs.solidjs.com/reference/basic-reactivity/create-memo
- Resources and Suspense: https://docs.solidjs.com/reference/basic-reactivity/create-resource and https://docs.solidjs.com/reference/components/suspense
- Router data APIs: https://docs.solidjs.com/solid-router/reference/data-apis/create-async, https://docs.solidjs.com/solid-router/reference/data-apis/query, and https://docs.solidjs.com/solid-router/reference/data-apis/revalidate
- List rendering: https://docs.solidjs.com/reference/components/for and https://docs.solidjs.com/reference/components/index-component
- Event handlers: https://docs.solidjs.com/concepts/components/event-handlers
- Cleanup and owners: https://docs.solidjs.com/reference/lifecycle/on-cleanup and https://docs.solidjs.com/reference/reactive-utilities/run-with-owner
- SolidStart data fetching, mutation, and serialization: https://docs.solidjs.com/solid-start/building-your-application/data-fetching, https://docs.solidjs.com/solid-start/building-your-application/data-mutation, and https://docs.solidjs.com/solid-start/advanced/serialization

## Guardrails

- Do not copy React/Next rules verbatim. Translate the intent into Solid's
  reactive graph, owner lifetime, router data cache, and SolidStart rendering
  model.
- Do not add caching without freshness, invalidation, request isolation, and
  capacity rules.
- Do not move code across server/client boundaries without checking auth,
  secrets, serialization, CSP, cookies, redirects, and browser API access.
- Do not introduce broad abstractions for one local reactive issue.
- Do not code-split tiny always-used UI just to satisfy a rule.
- Do not claim a performance improvement without measuring or stating the
  measurement gap.

## Output

For implementation work, report:

- `Surface`
- `Primary rules applied`
- `Changes`
- `Verification`
- `Residual risk`

For review work, lead with findings:

```markdown
| Severity | Rule | Location | Finding | Fix |
| -------- | ---- | -------- | ------- | --- |
```
