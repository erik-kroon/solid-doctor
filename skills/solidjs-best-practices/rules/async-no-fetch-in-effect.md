---
title: Do Not Fetch Application Data In Effects
impact: HIGH
impactDescription: avoids duplicate requests, missing Suspense integration, and stale writes
tags: async, createEffect, resources, router, query
---

## Do Not Fetch Application Data In Effects

**Impact: HIGH (avoids duplicate requests, missing Suspense integration, and stale writes)**

Use route data, `createResource`, `createAsync`, `query`, actions, and Suspense
for application data. `createEffect` is for side effects and integrations; data
fetching inside effects tends to miss router cache reuse, server rendering,
Suspense fallbacks, cancellation shape, and error boundaries.

**Incorrect (manual fetch and state synchronization):**

```tsx
const [profile, setProfile] = createSignal<Profile>();

createEffect(async () => {
  const res = await fetch(`/api/users/${props.userId}`);
  setProfile(await res.json());
});
```

This starts async work from an effect, writes later into local state, and gives
the UI no structured pending/error state.

**Correct (resource owns the async state):**

```tsx
const [profile] = createResource(
  () => props.userId,
  async (userId) => {
    const res = await fetch(`/api/users/${encodeURIComponent(userId)}`);
    if (!res.ok) throw new Error("Failed to load profile");
    return (await res.json()) as Profile;
  },
);
```

**Correct (router query is cacheable and preloadable):**

```tsx
import { createAsync, query } from "@solidjs/router";

const getProfile = query(async (userId: string) => {
  const res = await fetch(`/api/users/${encodeURIComponent(userId)}`);
  if (!res.ok) throw new Error("Failed to load profile");
  return (await res.json()) as Profile;
}, "profile");

function ProfileView(props: { userId: string }) {
  const profile = createAsync(() => getProfile(props.userId));
  return <h1>{profile()?.name}</h1>;
}
```

**Check:**

- Keep effects for logging, subscriptions, imperative browser APIs, and
  third-party integrations.
- Prefer route preload plus `query()` when data is shared across navigation,
  server rendering, or mutations.
- Verify pending and error UI through Suspense and ErrorBoundary where
  relevant.

References:

- [createResource](https://docs.solidjs.com/reference/basic-reactivity/create-resource)
- [query](https://docs.solidjs.com/solid-router/reference/data-apis/query)
