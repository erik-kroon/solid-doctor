---
title: Clean Up Work Under The Right Owner
impact: HIGH
impactDescription: prevents leaked timers, listeners, subscriptions, and roots
tags: reactive, owner, cleanup, createRoot, subscriptions
---

## Clean Up Work Under The Right Owner

**Impact: HIGH (prevents leaked timers, listeners, subscriptions, and roots)**

Create timers, listeners, observers, external subscriptions, roots, and
imperative resources under a live Solid owner and dispose them with
`onCleanup`. Manual `createRoot` is appropriate only when the dispose function
is retained and called.

**Incorrect (interval survives component disposal):**

```tsx
function Tracker() {
  setInterval(() => sendHeartbeat(), 10000);
  return null;
}
```

**Correct (cleanup under component owner):**

```tsx
import { onCleanup } from "solid-js";

function Tracker() {
  const id = window.setInterval(() => sendHeartbeat(), 10000);
  onCleanup(() => window.clearInterval(id));
  return null;
}
```

**Correct (manual root with explicit disposal):**

```tsx
const dispose = createRoot((dispose) => {
  const [value, setValue] = createSignal(0);
  subscribe(setValue);
  onCleanup(() => unsubscribe(setValue));
  return dispose;
});

dispose();
```

**Check:**

- Every `setInterval`, `addEventListener`, observer, subscription, and manual
  root should have a paired cleanup.
- Avoid calling `onCleanup` outside an owner.
- Verify by mounting/unmounting the component and checking duplicate callbacks.

References:

- [onCleanup](https://docs.solidjs.com/reference/lifecycle/on-cleanup)
- [createRoot](https://docs.solidjs.com/reference/reactive-utilities/create-root)
