---
title: Memoize Expensive Or Shared Derived Values
impact: MEDIUM-HIGH
impactDescription: avoids repeated expensive derivation across consumers
tags: reactive, memo, derived-values, performance
---

## Memoize Expensive Or Shared Derived Values

**Impact: MEDIUM-HIGH (avoids repeated expensive derivation across consumers)**

Use `createMemo` for expensive derived values or derived values read by multiple
consumers. Do not wrap every simple expression in a memo; cheap accessors are
clearer and avoid unnecessary nodes in the graph.

**Incorrect (expensive work repeated in multiple places):**

```tsx
function Results() {
  const visibleRows = () => rows().filter(matchesSearch).sort(compareByScore).slice(0, 100);

  return (
    <>
      <p>{visibleRows().length} results</p>
      <RowList rows={visibleRows()} />
    </>
  );
}
```

**Correct (one memo shared by consumers):**

```tsx
function Results() {
  const visibleRows = createMemo(() =>
    rows().filter(matchesSearch).sort(compareByScore).slice(0, 100),
  );

  return (
    <>
      <p>{visibleRows().length} results</p>
      <RowList rows={visibleRows()} />
    </>
  );
}
```

**Check:**

- Use an accessor for cheap formatting or one-off string composition.
- Use `createMemo` when the work is expensive, shared, or should be cached.
- Keep memo dependencies narrow.

References:

- [Memos](https://docs.solidjs.com/concepts/derived-values/memos)
- [createMemo](https://docs.solidjs.com/reference/basic-reactivity/create-memo)
