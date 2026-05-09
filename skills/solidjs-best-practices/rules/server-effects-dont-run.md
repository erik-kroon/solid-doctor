---
title: Do Not Rely On Effects For Server Output
impact: HIGH
impactDescription: prevents missing SSR data, redirects, metadata, and authorization checks
tags: server, effects, ssr, auth, metadata
---

## Do Not Rely On Effects For Server Output

**Impact: HIGH (prevents missing SSR data, redirects, metadata, and authorization checks)**

Effects and mount hooks are not the right place for server-rendered data,
authorization, redirects, metadata, cookies, headers, or SEO-critical output.
Put critical work in route data, server functions, API routes, middleware, or
SolidStart metadata paths.

**Incorrect (authorization after render):**

```tsx
export default function AdminPage() {
  createEffect(async () => {
    const user = await getCurrentUser();
    if (!user.admin) navigate("/login");
  });

  return <AdminPanel />;
}
```

The protected UI can render before the check, and server output cannot depend
on this effect.

**Correct (authorize in a server query and block streaming when needed):**

```tsx
import { createAsync, query, redirect } from "@solidjs/router";

const requireAdmin = query(async () => {
  "use server";
  const user = await getCurrentUser();
  if (!user?.admin) throw redirect("/login");
  return user;
}, "requireAdmin");

export default function AdminPage() {
  const user = createAsync(() => requireAdmin(), { deferStream: true });
  return <AdminPanel user={user()} />;
}
```

**Check:**

- Move security and response decisions out of effects.
- Keep `onMount` for DOM APIs and client integrations only.
- Verify SSR output, redirects, headers, and metadata without waiting for
  client hydration.

References:

- [SolidStart data fetching](https://docs.solidjs.com/solid-start/building-your-application/data-fetching)
- [SolidStart data mutation](https://docs.solidjs.com/solid-start/building-your-application/data-mutation)
