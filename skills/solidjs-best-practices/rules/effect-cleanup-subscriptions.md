---
title: Clean Up Subscriptions In Effects And Mount Hooks
impact: MEDIUM
impactDescription: avoids duplicate handlers after remounts and reactive reruns
tags: effect, cleanup, onCleanup, subscriptions
---

## Clean Up Subscriptions In Effects And Mount Hooks

**Impact: MEDIUM (avoids duplicate handlers after remounts and reactive reruns)**

Whenever an effect or mount hook registers a listener, observer, timer, or
subscription, register cleanup in the same owner scope. Cleanup runs when the
scope disposes and before rerunning an effect that re-registers work.

**Incorrect (listener survives disposal):**

```tsx
onMount(() => {
  window.addEventListener("resize", updateLayout);
});
```

**Correct (paired cleanup):**

```tsx
onMount(() => {
  window.addEventListener("resize", updateLayout);
  onCleanup(() => window.removeEventListener("resize", updateLayout));
});
```

**Correct (reactive subscription changes with source):**

```tsx
createEffect(() => {
  const channel = roomId();
  const unsubscribe = subscribeToRoom(channel, handleMessage);
  onCleanup(unsubscribe);
});
```

**Check:**

- Pair every external registration with a cleanup.
- In reactive effects, ensure cleanup runs before a new subscription replaces
  the old one.
- Use stable handler references when removing native listeners.

References:

- [onCleanup](https://docs.solidjs.com/reference/lifecycle/on-cleanup)
- [createEffect](https://docs.solidjs.com/reference/basic-reactivity/create-effect)
