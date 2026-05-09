---
title: Keep Browser APIs Out Of Server Paths
impact: HIGH
impactDescription: prevents SSR crashes and hydration-only data bugs
tags: server, browser-api, ssr, hydration, onMount
---

## Keep Browser APIs Out Of Server Paths

**Impact: HIGH (prevents SSR crashes and hydration-only data bugs)**

Server-rendered modules and component setup can run without `window`,
`document`, `localStorage`, layout APIs, observers, or browser-only globals.
Use `onMount`, dynamic imports, guards, or client-only boundaries for browser
work.

**Incorrect (browser API at module or setup time):**

```tsx
const theme = localStorage.getItem("theme") ?? "system";

export function ThemeLabel() {
  return <span>{theme}</span>;
}
```

This can crash during SSR and cannot react to client-side storage changes.

**Correct (read after mount):**

```tsx
import { createSignal, onMount } from "solid-js";

export function ThemeLabel() {
  const [theme, setTheme] = createSignal("system");

  onMount(() => {
    setTheme(localStorage.getItem("theme") ?? "system");
  });

  return <span>{theme()}</span>;
}
```

**Check:**

- Search server-rendered code for `window`, `document`, `navigator`,
  `localStorage`, `sessionStorage`, `ResizeObserver`, `IntersectionObserver`,
  `canvas`, and layout reads.
- Decide whether the value should be server data instead of client-only data.
- Avoid hydration mismatch by rendering a stable fallback or server-known value.

References:

- [onMount](https://docs.solidjs.com/reference/lifecycle/on-mount)
- [SolidStart rendering](https://docs.solidjs.com/solid-start)
