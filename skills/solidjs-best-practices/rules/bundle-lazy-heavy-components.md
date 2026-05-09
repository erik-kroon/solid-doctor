---
title: Lazy Load Heavy Or Rare Components
impact: HIGH
impactDescription: keeps expensive route islands out of the initial bundle
tags: bundle, lazy, preload, suspense
---

## Lazy Load Heavy Or Rare Components

**Impact: HIGH (keeps expensive route islands out of the initial bundle)**

Use `lazy(() => import(...))` for editors, charts, maps, modals, inspectors,
and other UI that is heavy or rare on the initial path. Preload on strong user
intent so the split does not become an interaction delay.

**Incorrect (heavy editor in the initial route bundle):**

```tsx
import ChartEditor from "./ChartEditor";

function Dashboard() {
  const [editing, setEditing] = createSignal(false);

  return (
    <Show when={editing()}>
      <ChartEditor />
    </Show>
  );
}
```

The editor code ships even when most users never open it.

**Correct (split and preload on intent):**

```tsx
import { createSignal, lazy, Show, Suspense } from "solid-js";

const ChartEditor = lazy(() => import("./ChartEditor"));

function Dashboard() {
  const [editing, setEditing] = createSignal(false);

  return (
    <>
      <button
        onMouseEnter={() => ChartEditor.preload()}
        onFocus={() => ChartEditor.preload()}
        onClick={() => setEditing(true)}
      >
        Edit chart
      </button>
      <Show when={editing()}>
        <Suspense fallback={<EditorSkeleton />}>
          <ChartEditor />
        </Suspense>
      </Show>
    </>
  );
}
```

**Check:**

- Split only code that is heavy, route-specific, or rarely used.
- Keep dynamic import paths statically analyzable.
- Verify with bundle analysis before and after for meaningful bundle work.

References:

- [lazy](https://docs.solidjs.com/reference/component-apis/lazy)
- [Suspense](https://docs.solidjs.com/reference/components/suspense)
