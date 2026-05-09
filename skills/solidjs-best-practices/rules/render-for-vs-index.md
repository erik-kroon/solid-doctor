---
title: Choose For Or Index By Mutation Shape
impact: MEDIUM-HIGH
impactDescription: preserves DOM identity and avoids inefficient list updates
tags: render, lists, For, Index
---

## Choose For Or Index By Mutation Shape

**Impact: MEDIUM-HIGH (preserves DOM identity and avoids inefficient list updates)**

Use `<For>` when item identity matters or rows can reorder, insert, or remove.
Use `<Index>` when positions are stable and the value at each position changes,
especially primitive arrays. Avoid `array.map()` in reactive JSX for dynamic
lists because it does not encode Solid's list update strategy.

**Incorrect (dynamic JSX map):**

```tsx
<ul>
  {users().map((user) => (
    <UserRow user={user} />
  ))}
</ul>
```

**Correct (identity list):**

```tsx
<For each={users()} fallback={<p>No users</p>}>
  {(user) => <UserRow user={user} />}
</For>
```

**Correct (stable-index values):**

```tsx
<Index each={scores()}>
  {(score, index) => (
    <li>
      #{index + 1}: {score()}
    </li>
  )}
</Index>
```

**Check:**

- Pick `<For>` for records with IDs, sorting, filtering, insertion, deletion,
  drag-and-drop, or row-local state.
- Pick `<Index>` for stable positions where values update in place.
- Verify row identity when editing, focusing, animating, or reordering.

References:

- [`<For>`](https://docs.solidjs.com/reference/components/for)
- [`<Index>`](https://docs.solidjs.com/reference/components/index-component)
