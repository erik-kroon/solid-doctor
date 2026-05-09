---
title: Use Promise.all For Independent Work
impact: HIGH
impactDescription: collapses independent async latency into one wait
tags: async, promise-all, server, api
---

## Use Promise.all For Independent Work

**Impact: HIGH (collapses independent async latency into one wait)**

Use `Promise.all()` when every independent operation must succeed. Use
`Promise.allSettled()` when partial results are acceptable and the UI or API can
represent failures explicitly.

**Incorrect (independent work awaited one by one):**

```ts
const comments = await db.comments.forPost(postId);
const reactions = await db.reactions.forPost(postId);
const related = await db.posts.related(postId);
```

**Correct (all must succeed):**

```ts
const [comments, reactions, related] = await Promise.all([
  db.comments.forPost(postId),
  db.reactions.forPost(postId),
  db.posts.related(postId),
]);
```

**Correct (partial results allowed):**

```ts
const [comments, reactions, related] = await Promise.allSettled([
  db.comments.forPost(postId),
  db.reactions.forPost(postId),
  db.posts.related(postId),
]);
```

**Check:**

- Use `Promise.all()` only when shared failure handling is correct.
- Use `Promise.allSettled()` only when downstream code handles rejected entries.
- Avoid parallelizing calls that depend on rate limits, locks, or ordering.

References:

- [SolidStart data fetching](https://docs.solidjs.com/solid-start/building-your-application/data-fetching)
