---
title: Resolve Children Once
impact: MEDIUM
impactDescription: avoids duplicated child resolution and surprising reactive reads
tags: render, children, props
---

## Resolve Children Once

**Impact: MEDIUM (avoids duplicated child resolution and surprising reactive reads)**

Use `children(() => props.children)` before reading `props.children` multiple
times or passing it through logic. `props.children` can be a getter and may
create work when accessed.

**Incorrect (reads children repeatedly):**

```tsx
function Panel(props: { children: JSX.Element }) {
  return (
    <section>
      <div>{props.children}</div>
      <footer>{props.children}</footer>
    </section>
  );
}
```

**Correct (resolve once):**

```tsx
import { children, type JSX } from "solid-js";

function Panel(props: { children: JSX.Element }) {
  const resolved = children(() => props.children);

  return (
    <section>
      <div>{resolved()}</div>
      <footer>{resolved()}</footer>
    </section>
  );
}
```

**Check:**

- Use `children()` when children are read more than once or inspected.
- Do not evaluate children early when the subtree should remain lazy behind a
  condition.

References:

- [Props children](https://docs.solidjs.com/concepts/components/props)
