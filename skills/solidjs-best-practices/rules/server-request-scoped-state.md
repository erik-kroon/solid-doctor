---
title: Keep Request State Request Scoped
impact: HIGH
impactDescription: prevents SSR data leaks across users and requests
tags: server, ssr, request, state, security
---

## Keep Request State Request Scoped

**Impact: HIGH (prevents SSR data leaks across users and requests)**

Never store request-specific data in module-level mutable variables. SolidStart
server code may serve concurrent users in the same process. Module state is
shared unless the framework or runtime explicitly scopes it to the request.

**Incorrect (module-level current user):**

```ts
let currentUserId: string | undefined;

export async function loadUser() {
  "use server";
  currentUserId = await readUserIdFromSession();
  return db.users.get(currentUserId);
}
```

One request can overwrite the value another request expects.

**Correct (local request data):**

```ts
export async function loadUser() {
  "use server";
  const userId = await readUserIdFromSession();
  return db.users.get(userId);
}
```

**Correct (request event locals):**

```ts
import { getRequestEvent } from "solid-js/web";

export async function loadAccount() {
  "use server";
  const event = getRequestEvent();
  const session = await getSession(event);
  return db.accounts.get(session.accountId);
}
```

**Check:**

- Search server modules for `let`, mutable maps, and singleton objects that hold
  user, session, cookie, tenant, locale, auth, or request data.
- Allow module-level immutable config and process-wide caches only when they do
  not contain request-specific values.

References:

- [SolidStart request events](https://docs.solidjs.com/solid-start/advanced/request-events)
- [SolidStart auth](https://docs.solidjs.com/solid-start/advanced/auth)
