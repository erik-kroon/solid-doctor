---
title: Build Index Maps For Repeated Lookups
impact: LOW-MEDIUM
impactDescription: removes repeated linear scans from reactive hot paths
tags: js, maps, derived-values, lists
---

## Build Index Maps For Repeated Lookups

**Impact: LOW-MEDIUM (removes repeated linear scans from reactive hot paths)**

When render or derived logic repeatedly looks up records by ID, build a `Map`
once in a memo instead of scanning arrays inside each row or computation.

**Incorrect (linear scan per row):**

```tsx
<For each={tasks()}>
  {(task) => {
    const owner = () => users().find((user) => user.id === task.ownerId);
    return <TaskRow task={task} owner={owner()} />;
  }}
</For>
```

**Correct (memoized index):**

```tsx
const usersById = createMemo(() => {
  const map = new Map<string, User>();
  for (const user of users()) map.set(user.id, user);
  return map;
});

<For each={tasks()}>{(task) => <TaskRow task={task} owner={usersById().get(task.ownerId)} />}</For>;
```

**Check:**

- Use this for repeated lookup hot paths, not one-off tiny arrays.
- Keep the index source narrow.
- Preserve ordering separately when display order matters.

References:

- [createMemo](https://docs.solidjs.com/reference/basic-reactivity/create-memo)
