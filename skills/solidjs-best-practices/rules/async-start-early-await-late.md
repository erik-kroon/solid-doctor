---
title: Start Promises Early And Await Late
impact: HIGH
impactDescription: removes avoidable sequential latency
tags: async, promises, waterfalls, server-functions
---

## Start Promises Early And Await Late

**Impact: HIGH (removes avoidable sequential latency)**

When independent async work is required for the same route, action, or server
function, start the promises before branching or rendering decisions and await
them only where their values are needed. Do not serialize independent network,
database, or file-system calls.

**Incorrect (sequential latency):**

```ts
export async function loadDashboard(userId: string) {
  "use server";
  const user = await db.users.get(userId);
  const projects = await db.projects.forUser(userId);
  const alerts = await db.alerts.forUser(userId);

  return { user, projects, alerts };
}
```

Each call waits for the previous call even though the requests are independent.

**Correct (start independent work together):**

```ts
export async function loadDashboard(userId: string) {
  "use server";
  const userPromise = db.users.get(userId);
  const projectsPromise = db.projects.forUser(userId);
  const alertsPromise = db.alerts.forUser(userId);

  const [user, projects, alerts] = await Promise.all([userPromise, projectsPromise, alertsPromise]);

  return { user, projects, alerts };
}
```

**Check:**

- Draw the dependency graph before parallelizing.
- Keep dependent calls sequential when one result shapes the next request.
- Preserve authorization and failure semantics.

References:

- [SolidStart data fetching](https://docs.solidjs.com/solid-start/building-your-application/data-fetching)
