---
title: Keep Props Live
impact: HIGH
impactDescription: prevents silent stale snapshots
tags: reactive, props, splitProps, mergeProps
---

## Keep Props Live

**Impact: HIGH (prevents silent stale snapshots)**

Solid props are reactive proxies. Destructuring or assigning a prop to a plain
value usually captures a snapshot and stops updates. Use `props.*`, accessor
functions, `splitProps`, or `mergeProps`.

**Incorrect (prop snapshot):**

```tsx
function Greeting(props: { name: string }) {
  const { name } = props;
  return <p>Hello {name}</p>;
}
```

**Correct (direct prop read):**

```tsx
function Greeting(props: { name: string }) {
  return <p>Hello {props.name}</p>;
}
```

**Correct (local accessor):**

```tsx
function Greeting(props: { name: string }) {
  const name = () => props.name;
  return <p>Hello {name()}</p>;
}
```

**Correct (reactive prop splitting):**

```tsx
import { splitProps } from "solid-js";

function Field(props: { label: string; name: string; disabled?: boolean }) {
  const [local, input] = splitProps(props, ["label"]);

  return (
    <label>
      {local.label}
      <input {...input} />
    </label>
  );
}
```

**Check:**

- Search for `const { ... } = props` and `const value = props.value`.
- Do not replace `splitProps` with object rest destructuring.
- Preserve reactivity when setting default props with `mergeProps`.

References:

- [Props](https://docs.solidjs.com/concepts/components/props)
