---
title: Authenticate Server Functions And Actions
impact: HIGH
impactDescription: prevents client-callable server paths from bypassing authorization
tags: server, auth, actions, server-functions, security
---

## Authenticate Server Functions And Actions

**Impact: HIGH (prevents client-callable server paths from bypassing authorization)**

Treat server functions, actions, and API routes as callable boundaries. UI
visibility is not authorization. Re-check identity, tenant, role, ownership,
and mutation permissions inside the server path that reads or writes data.

**Incorrect (trusts hidden UI):**

```ts
export const deleteProject = action(async (projectId: string) => {
  "use server";
  await db.projects.delete(projectId);
}, "deleteProject");
```

If a user can call the action, they can attempt the mutation even when the
button was hidden.

**Correct (authorize inside the action):**

```ts
export const deleteProject = action(async (projectId: string) => {
  "use server";
  const user = await requireUser();
  const project = await db.projects.get(projectId);

  if (!project || project.accountId !== user.accountId || !user.canDeleteProjects) {
    throw new Response("Forbidden", { status: 403 });
  }

  await db.projects.delete(projectId);
}, "deleteProject");
```

**Check:**

- Verify auth on every server function/action/API route, not only in UI.
- Validate tenant/account ownership before reads and writes.
- Do not expose secrets or privileged data through serialized return values.

References:

- [SolidStart auth](https://docs.solidjs.com/solid-start/advanced/auth)
- [SolidStart data mutation](https://docs.solidjs.com/solid-start/building-your-application/data-mutation)
