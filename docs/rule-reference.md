# Rule Reference

Each rule emits raw findings and metadata. `src/rule-runner.ts` normalizes findings into diagnostics for reports, scoring, JSON, SARIF, GitHub annotations, TUI views, and agent output.

## `solid/reactive-prop-snapshot`

Slug: `reactive-prop-snapshot`

Detects local snapshots of component props that are later used in JSX.

Bad pattern:

```tsx
const name = props.name;
return <h1>{name}</h1>;
```

Preferred pattern:

```tsx
return <h1>{props.name}</h1>;
```

Suppression: only when the value is intentionally a one-time initial snapshot.

## `solid/store-destructure-snapshot`

Slug: `store-destructure-snapshot`

Detects destructured Solid store properties later used in returned JSX.

Bad pattern:

```tsx
const { profile } = state;
return <h1>{profile.name}</h1>;
```

Preferred pattern:

```tsx
return <h1>{state.profile.name}</h1>;
```

Suppression: only when the destructured value is intentionally a one-time snapshot.

## `solid/derived-state-in-effect`

Slug: `derived-state-in-effect`

Detects effects that mirror reactive inputs into another signal as derived state.

Bad pattern:

```tsx
createEffect(() => setFullName(`${props.first} ${props.last}`));
```

Preferred pattern:

```tsx
const fullName = createMemo(() => `${props.first} ${props.last}`);
```

Suppression: only when the write is a true side effect.

## `solid/async-tracking-gap`

Slug: `async-tracking-gap`

Detects reactive reads after `await` inside tracked scopes.

Bad pattern:

```tsx
createEffect(async () => {
  await load();
  console.log(props.id);
});
```

Preferred pattern:

```tsx
createEffect(() => {
  const id = props.id;
  void load(id);
});
```

Suppression: only when the post-await read is intentionally untracked.

## `solid/async-no-fetch-in-effect`

Slug: `async-no-fetch-in-effect`

Detects application data fetching started from effects.

Bad pattern:

```tsx
createEffect(() => {
  void fetch("/api/profile").then(setProfile);
});
```

Preferred pattern:

```tsx
const [profile] = createResource(() => props.userId, fetchProfile);
```

Suppression: only for imperative effects that are not app data loading.

## `solid/dynamic-map-in-jsx`

Slug: `dynamic-map-in-jsx`

Detects reactive arrays rendered with `.map()` directly in JSX.

Bad pattern:

```tsx
<ul>{items().map((item) => <li>{item}</li>)}</ul>
```

Preferred pattern:

```tsx
<ul><For each={items()}>{(item) => <li>{item}</li>}</For></ul>
```

Suppression: only for arrays known to be static for the component lifetime.

## `solid/render-stable-children`

Slug: `render-stable-children`

Detects repeated `props.children` reads without Solid's `children()` helper.

Bad pattern:

```tsx
return <><header>{props.children}</header><main>{props.children}</main></>;
```

Preferred pattern:

```tsx
const resolved = children(() => props.children);
return <><header>{resolved()}</header><main>{resolved()}</main></>;
```

Suppression: only when children are known to be static and cheap.

## `solid/browser-global-in-ssr`

Slug: `browser-global-in-ssr`

Detects browser globals read from SSR-capable files.

Bad pattern:

```tsx
const title = document.title;
```

Preferred pattern:

```tsx
onMount(() => {
  const title = document.title;
});
```

Suppression: only when the file is guaranteed to execute in the browser.

## `solid/server-request-scoped-state`

Slug: `server-request-scoped-state`

Detects mutable module state in SSR-capable files.

Bad pattern:

```tsx
let currentUser;
export function setUser(user) {
  currentUser = user;
}
```

Preferred pattern:

```tsx
export function createUserState() {
  const [user, setUser] = createSignal();
  return { user, setUser };
}
```

Suppression: only for immutable caches or constants.

## `solid/effect-cleanup-subscriptions`

Slug: `effect-cleanup-subscriptions`

Detects subscriptions, listeners, timers, observers, or roots without cleanup.

Bad pattern:

```tsx
createEffect(() => {
  window.addEventListener("resize", onResize);
});
```

Preferred pattern:

```tsx
createEffect(() => {
  window.addEventListener("resize", onResize);
  onCleanup(() => window.removeEventListener("resize", onResize));
});
```

Suppression: only when lifetime is managed elsewhere and documented.
