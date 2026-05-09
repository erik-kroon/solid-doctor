---
title: Drive Resources From Narrow Sources
impact: HIGH
impactDescription: prevents unnecessary refetching and async churn
tags: async, resources, createResource, createAsync, suspense
---

## Drive Resources From Narrow Sources

**Impact: HIGH (prevents unnecessary refetching and async churn)**

`createResource` and `createAsync` should depend on the smallest reactive value
that actually changes the request. A broad fetcher that reads many props or
signals subscribes the resource to all of them and refetches when unrelated
inputs change. Use a source accessor and return `false`, `null`, or `undefined`
when the fetcher should not run.

**Incorrect (fetcher reads broad component state):**

```tsx
const [user] = createResource(async () => {
  if (!props.enabled || !props.userId) return undefined;
  return fetchUser(props.userId, filters());
});
```

This fetcher depends on every reactive value it reads. A filter change can
refetch the user even if filters only affect local presentation.

**Correct (source describes the request identity):**

```tsx
const userSource = () => (props.enabled && props.userId ? props.userId : false);
const [user] = createResource(userSource, fetchUser);
```

**Correct (source includes only request-shaping fields):**

```tsx
const reportSource = () => {
  const range = dateRange();
  return props.accountId && range
    ? { accountId: props.accountId, start: range.start, end: range.end }
    : false;
};

const [report] = createResource(reportSource, loadReport);
```

**Check:**

- Identify every signal, prop, store path, and memo read by the fetcher.
- Move incidental reads into render or derived presentation logic.
- Verify refetch count with logs, devtools, or a test around source changes.

References:

- [createResource](https://docs.solidjs.com/reference/basic-reactivity/create-resource)
- [createAsync](https://docs.solidjs.com/solid-router/reference/data-apis/create-async)
