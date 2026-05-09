# Sections

This file defines the section ordering, impact levels, and filename prefixes
for SolidJS best-practice rules.

## 1. Eliminating Waterfalls and Async Blocking (async)

**Impact:** CRITICAL

Sequential async work, broad resource sources, and fetches buried in effects
are the highest-impact Solid performance issues. Remove waterfalls before
tuning smaller reactive work.

## 2. Bundle Size and Code Splitting (bundle)

**Impact:** CRITICAL

Solid's runtime is small, so user-visible load cost often comes from broad
imports, heavy widgets, browser-only libraries, and eager route islands.

## 3. SolidStart, SSR, and Server Boundaries (server)

**Impact:** HIGH

Server functions, actions, API routes, SSR, streaming, SSG, headers, cookies,
sessions, and serialization all need explicit request and runtime boundaries.

## 4. Fine-Grained Reactivity and State Shape (reactive)

**Impact:** HIGH

Solid updates exact subscribers. The main risk is not component re-rendering;
it is losing live reactive reads, subscribing too broadly, or creating owners
that never clean up.

## 5. Control Flow and Rendering (render)

**Impact:** MEDIUM-HIGH

Solid's control-flow components encode reactive identity, conditional work, and
DOM reuse more precisely than generic JSX mapping or conditional expressions.

## 6. Effects, Lifecycle, and Events (effect)

**Impact:** MEDIUM

Effects are for side effects and integrations. Event delegation is efficient,
but native events are still necessary for custom or propagation-sensitive cases.

## 7. JavaScript and DOM Performance (js)

**Impact:** LOW-MEDIUM

General hot-path JavaScript and DOM patterns still matter after async,
bundling, server boundaries, and reactive subscriptions are shaped correctly.

## 8. Advanced Patterns and Tooling (advanced)

**Impact:** LOW

Advanced owner, root, context, cache, and instrumentation patterns are powerful
but should stay narrow and well verified.
