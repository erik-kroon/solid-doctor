---
title: Keep Effects For Side Effects
impact: MEDIUM
impactDescription: keeps Solid's data graph declarative and easier to verify
tags: effect, createEffect, derivation, integration
---

## Keep Effects For Side Effects

**Impact: MEDIUM (keeps Solid's data graph declarative and easier to verify)**

Use `createEffect` for I/O, logging, imperative DOM APIs, external
subscriptions, and third-party integration. Do not use effects as general
reactive glue for values that can be accessors, memos, resources, or store
updates at the source.

**Incorrect (effect mirrors a signal into another signal):**

```tsx
const [query, setQuery] = createSignal("");
const [normalized, setNormalized] = createSignal("");

createEffect(() => {
  setNormalized(query().trim().toLowerCase());
});
```

**Correct (derived accessor):**

```tsx
const [query, setQuery] = createSignal("");
const normalized = () => query().trim().toLowerCase();
```

**Correct (side effect):**

```tsx
createEffect(() => {
  analytics.track("search_changed", { query: normalized() });
});
```

**Check:**

- If the effect only sets Solid state from Solid state, derive instead.
- If the effect touches the outside world, keep it and add cleanup if needed.
- Watch for effects that read and write the same signal.

References:

- [createEffect](https://docs.solidjs.com/reference/basic-reactivity/create-effect)
