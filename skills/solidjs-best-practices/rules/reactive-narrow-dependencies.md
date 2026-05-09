---
title: Track The Narrowest Dependency
impact: HIGH
impactDescription: reduces unnecessary recomputation in Solid's fine-grained graph
tags: reactive, dependencies, stores, memo, untrack
---

## Track The Narrowest Dependency

**Impact: HIGH (reduces unnecessary recomputation in Solid's fine-grained graph)**

Read the smallest signal, memo, resource, or store property needed by a
computation. Broad reads make the computation subscribe to changes that do not
affect its output. Use store property reads, focused memos, and `untrack()` for
incidental values that should not subscribe.

**Incorrect (broad object read):**

```tsx
const label = createMemo(() => {
  const user = currentUser();
  return `${user.firstName} ${user.lastName}`;
});
```

If `currentUser()` returns a whole object, unrelated user fields can invalidate
the memo.

**Correct (narrow source reads):**

```tsx
const label = createMemo(() => `${firstName()} ${lastName()}`);
```

**Correct (store property-level tracking):**

```tsx
const [user, setUser] = createStore({
  firstName: "Ada",
  lastName: "Lovelace",
  preferences: { density: "compact" },
});

const label = createMemo(() => `${user.firstName} ${user.lastName}`);
```

**Check:**

- Inspect what each memo/effect/resource source reads.
- Avoid spreading stores or serializing whole objects in reactive scopes.
- Use `untrack()` only for incidental reads; do not hide real dependencies.

References:

- [Fine-grained reactivity](https://docs.solidjs.com/advanced-concepts/fine-grained-reactivity)
- [Stores](https://docs.solidjs.com/concepts/stores)
- [untrack](https://docs.solidjs.com/reference/reactive-utilities/untrack)
