---
title: Isolate Browser-Only Components
impact: HIGH
impactDescription: prevents server crashes and avoids shipping browser-only code too early
tags: bundle, client-only, browser-api, solidstart
---

## Isolate Browser-Only Components

**Impact: HIGH (prevents server crashes and avoids shipping browser-only code too early)**

Browser-only libraries often touch `window`, `document`, layout APIs, canvas,
WebGL, or storage at module evaluation time. Keep them out of server-rendered
paths with client-only boundaries, dynamic imports, or mount-time setup.

**Incorrect (browser-only package evaluated on the server):**

```tsx
import Mapbox from "mapbox-gl";

export default function MapPanel() {
  return <div ref={(el) => new Mapbox.Map({ container: el })} />;
}
```

If the package reads browser globals during import, SSR can crash before the
component body even runs.

**Correct (load after mount or behind a client boundary):**

```tsx
import { onCleanup, onMount } from "solid-js";

export default function MapPanel() {
  let container!: HTMLDivElement;
  let map: { remove(): void } | undefined;

  onMount(async () => {
    const { default: mapboxgl } = await import("mapbox-gl");
    map = new mapboxgl.Map({ container });
  });

  onCleanup(() => map?.remove());

  return <div ref={container} />;
}
```

**Check:**

- Search package docs or built output for browser-global reads at import time.
- Prefer mount-time dynamic imports for imperative browser integrations.
- Keep fallback dimensions stable so client-only UI does not shift layout.

References:

- [onMount](https://docs.solidjs.com/reference/lifecycle/on-mount)
- [onCleanup](https://docs.solidjs.com/reference/lifecycle/on-cleanup)
