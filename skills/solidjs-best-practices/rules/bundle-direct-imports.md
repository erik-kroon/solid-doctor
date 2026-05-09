---
title: Prefer Direct Imports Over Barrels
impact: HIGH
impactDescription: avoids pulling broad dependency graphs into Solid bundles
tags: bundle, imports, vite, tree-shaking
---

## Prefer Direct Imports Over Barrels

**Impact: HIGH (avoids pulling broad dependency graphs into Solid bundles)**

Import from the smallest stable module path available when a package or local
barrel re-exports heavy submodules. Solid's own runtime is small, so broad
third-party imports can dominate bundle size.

**Incorrect (convenience barrel may pull too much):**

```ts
import { DatePicker, RichTextEditor, Chart } from "@acme/ui";
```

**Correct (direct feature import):**

```ts
import { DatePicker } from "@acme/ui/date-picker";
```

**Correct (local direct import):**

```ts
import { formatCurrency } from "~/lib/format/currency";
```

**Check:**

- Inspect bundle output before changing imports broadly.
- Keep paths supported by the package's public exports.
- Do not deep-import private package internals that may break on upgrade.

References:

- [Vite build guide](https://vite.dev/guide/build)
