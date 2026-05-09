---
title: Use Query For Repeatable Route Reads
impact: HIGH
impactDescription: deduplicates route data by function name and serialized arguments
tags: async, router, query, cache, revalidate
---

## Use Query For Repeatable Route Reads

**Impact: HIGH (deduplicates route data by function name and serialized arguments)**

Wrap repeatable route loaders in `query()`. Solid Router caches by query name
and serialized arguments, reuses preloaded data briefly, reuses active cache
subscriptions, and provides `key`/`keyFor` handles for targeted revalidation.

**Incorrect (uncached loader function):**

```tsx
async function getProjectTasks(projectId: string) {
  const res = await fetch(`/api/projects/${projectId}/tasks`);
  return (await res.json()) as Task[];
}

function ProjectTasks(props: { projectId: string }) {
  const tasks = createAsync(() => getProjectTasks(props.projectId));
  return <TaskList tasks={tasks() ?? []} />;
}
```

Multiple callers cannot share by router cache key, and mutation invalidation has
no stable target.

**Correct (named query and targeted refresh):**

```tsx
import { createAsync, query, revalidate } from "@solidjs/router";

const getProjectTasks = query(async (projectId: string) => {
  const res = await fetch(`/api/projects/${projectId}/tasks`);
  if (!res.ok) throw new Error("Failed to load tasks");
  return (await res.json()) as Task[];
}, "projectTasks");

function ProjectTasks(props: { projectId: string }) {
  const tasks = createAsync(() => getProjectTasks(props.projectId), {
    initialValue: [],
  });

  return (
    <>
      <button onClick={() => void revalidate(getProjectTasks.keyFor(props.projectId))}>
        Refresh
      </button>
      <TaskList tasks={tasks()} />
    </>
  );
}
```

**Check:**

- Use stable, unique query names.
- Pass arguments that serialize consistently.
- Use `query.key` for all argument sets and `query.keyFor(...)` for one
  argument set.
- In SolidStart server actions, prefer preloaded queries so single-flight
  mutation revalidation can happen automatically.

References:

- [query](https://docs.solidjs.com/solid-router/reference/data-apis/query)
- [revalidate](https://docs.solidjs.com/solid-router/reference/data-apis/revalidate)
- [SolidStart data mutation](https://docs.solidjs.com/solid-start/building-your-application/data-mutation)
