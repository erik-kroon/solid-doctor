---
title: Use RunWithOwner Only For Narrow Bridges
impact: LOW
impactDescription: avoids orphaned computations and async owner mistakes
tags: advanced, owner, runWithOwner, integrations
---

## Use RunWithOwner Only For Narrow Bridges

**Impact: LOW (avoids orphaned computations and async owner mistakes)**

Use `getOwner` and `runWithOwner` only when an integration callback must create
Solid computations later and cannot be structured inside the component body.
`runWithOwner` restores the owner synchronously; code after `await` does not
continue with the same owner or dependency tracking.

**Incorrect (creates computations from an unowned callback):**

```tsx
function Bridge() {
  subscribe((value) => {
    createEffect(() => {
      console.log(value, settings());
    });
  });

  return null;
}
```

The effect is created outside the component's owner and may not clean up.

**Correct (owner bridge kept synchronous):**

```tsx
import { createEffect, getOwner, onCleanup, runWithOwner } from "solid-js";

function Bridge() {
  const owner = getOwner();
  const unsubscribe = subscribe((value) => {
    if (!owner) return;
    runWithOwner(owner, () => {
      createEffect(() => {
        console.log(value, settings());
      });
    });
  });

  onCleanup(unsubscribe);
  return null;
}
```

**Prefer (create computation in component and update a signal):**

```tsx
function Bridge() {
  const [value, setValue] = createSignal<string>();
  const unsubscribe = subscribe(setValue);
  onCleanup(unsubscribe);

  createEffect(() => {
    console.log(value(), settings());
  });

  return null;
}
```

**Check:**

- Prefer signal updates over creating computations in callbacks.
- Keep `runWithOwner` callbacks synchronous.
- Pair external subscriptions with `onCleanup`.

References:

- [runWithOwner](https://docs.solidjs.com/reference/reactive-utilities/run-with-owner)
- [getOwner](https://docs.solidjs.com/reference/reactive-utilities/get-owner)
