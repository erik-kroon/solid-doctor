---
title: Place Suspense Around Async Subtrees
impact: HIGH
impactDescription: lets stable UI render while async regions wait or stream
tags: async, suspense, streaming, createAsync, createResource
---

## Place Suspense Around Async Subtrees

**Impact: HIGH (lets stable UI render while async regions wait or stream)**

Put `<Suspense>` around the subtree that reads suspense-tracked async data.
Keep the stable shell outside the boundary when it can render immediately. In
SolidStart streaming SSR, independent Suspense boundaries let slow regions
stream separately instead of blocking the whole route.

**Incorrect (route shell reads async data directly):**

```tsx
function Page() {
  const profile = createAsync(() => getProfile());

  return (
    <main>
      <Header />
      <h1>{profile()?.name}</h1>
    </main>
  );
}
```

The page shell and data panel are coupled. Pending behavior becomes harder to
control and may block more UI than necessary.

**Correct (only the async panel waits):**

```tsx
function Page() {
  return (
    <main>
      <Header />
      <Suspense fallback={<ProfileSkeleton />}>
        <ProfilePanel />
      </Suspense>
    </main>
  );
}

function ProfilePanel() {
  const profile = createAsync(() => getProfile());
  return <h1>{profile()?.name}</h1>;
}
```

**Check:**

- Keep navigation chrome, layout, and known dimensions outside slow boundaries.
- Use nested boundaries for independent slow regions.
- Avoid boundaries so granular that loading states flicker or fragment the
  experience.

References:

- [Suspense](https://docs.solidjs.com/reference/components/suspense)
- [createResource](https://docs.solidjs.com/reference/basic-reactivity/create-resource)
