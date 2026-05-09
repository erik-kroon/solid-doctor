---
title: Choose Delegated Or Native Events Deliberately
impact: MEDIUM
impactDescription: keeps common events cheap while preserving propagation semantics
tags: effect, events, delegated-events, native-events
---

## Choose Delegated Or Native Events Deliberately

**Impact: MEDIUM (keeps common events cheap while preserving propagation semantics)**

Solid delegates common events with `onClick`, `onInput`, and related `on__`
handlers. Delegation is efficient for common bubbling events. Use native
`on:*` handlers for custom events, occasional events, case-sensitive event
names, or propagation-sensitive behavior such as `stopPropagation()`.

**Incorrect (delegated handler expects native propagation stop):**

```tsx
<button
  onClick={(event) => {
    event.stopPropagation();
    save();
  }}
>
  Save
</button>
```

With delegated events, propagation may not behave like a listener attached
directly to the element.

**Correct (native event when propagation matters):**

```tsx
<button
  on:click={(event) => {
    event.stopPropagation();
    save();
  }}
>
  Save
</button>
```

**Correct (delegated event for common list interactions):**

```tsx
<For each={rows()}>{(row) => <button onClick={() => select(row.id)}>{row.name}</button>}</For>
```

**Check:**

- Use delegated handlers for common bubbling events in normal UI.
- Use native handlers for custom elements, uncommon events, and strict
  propagation semantics.
- Remember event handlers are not reactive bindings; call reactive values inside
  the handler if the latest value is needed.

References:

- [Event handlers](https://docs.solidjs.com/concepts/components/event-handlers)
