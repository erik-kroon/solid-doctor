---
title: Use Solid Control Flow For Conditions
impact: MEDIUM-HIGH
impactDescription: makes conditional DOM creation and tracking explicit
tags: render, Show, Switch, Match, conditionals
---

## Use Solid Control Flow For Conditions

**Impact: MEDIUM-HIGH (makes conditional DOM creation and tracking explicit)**

Use `<Show>`, `<Switch>`, and `<Match>` for reactive conditionals. They make
conditional subtrees, fallback UI, and keyed resets explicit and easier to
review than ad-hoc JSX expressions in non-trivial cases.

**Incorrect (nested conditional expression is hard to extend):**

```tsx
return user() ? user()!.admin ? <AdminPanel /> : <UserPanel /> : <LoginPrompt />;
```

**Correct (explicit branches):**

```tsx
<Switch fallback={<LoginPrompt />}>
  <Match when={user()?.admin}>
    <AdminPanel />
  </Match>
  <Match when={user()}>
    <UserPanel />
  </Match>
</Switch>
```

**Correct (simple condition with fallback):**

```tsx
<Show when={profile()} fallback={<ProfileSkeleton />}>
  {(profile) => <ProfileDetails profile={profile()} />}
</Show>
```

**Check:**

- Use `<Show>` for one condition and fallback.
- Use `<Switch>`/`<Match>` for mutually exclusive branches.
- Use keyed `<Show>` when subtree state must reset as the value changes.

References:

- [`<Show>`](https://docs.solidjs.com/reference/components/show)
- [`<Switch>` and `<Match>`](https://docs.solidjs.com/reference/components/switch-and-match)
