---
title: Derive Values Without Effects
impact: HIGH
impactDescription: avoids redundant updates and state drift
tags: reactive, effects, createMemo, derived-state
---

## Derive Values Without Effects

**Impact: HIGH (avoids redundant updates and state drift)**

Do not use `createEffect` to synchronize state that can be computed from current
reactive inputs. Use an accessor for cheap derived values and `createMemo` for
expensive or shared derived values.

**Incorrect (effect writes derived state):**

```tsx
const [firstName, setFirstName] = createSignal("Ada");
const [lastName, setLastName] = createSignal("Lovelace");
const [fullName, setFullName] = createSignal("");

createEffect(() => {
  setFullName(`${firstName()} ${lastName()}`);
});
```

**Correct (cheap accessor):**

```tsx
const [firstName, setFirstName] = createSignal("Ada");
const [lastName, setLastName] = createSignal("Lovelace");
const fullName = () => `${firstName()} ${lastName()}`;
```

**Correct (memo for expensive/shared derivation):**

```tsx
const filteredRows = createMemo(() => {
  const q = search().trim().toLowerCase();
  return rows().filter((row) => row.name.toLowerCase().includes(q));
});
```

**Check:**

- If an effect only calls a setter from values it reads, it is probably derived
  state.
- Keep effects for I/O, subscriptions, browser APIs, logging, and imperative
  integrations.
- Verify behavior with source signal changes and avoid self-trigger loops.

References:

- [Memos](https://docs.solidjs.com/concepts/derived-values/memos)
- [createMemo](https://docs.solidjs.com/reference/basic-reactivity/create-memo)
