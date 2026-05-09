import assert from "node:assert/strict";
import { test } from "bun:test";

import { analyzeReactiveSources } from "../src/reactive-source-model";
import { analyzeReactiveReads } from "../src/reactive-read-model";
import { TRACKING_SCOPE_KINDS, analyzeTrackingScopes } from "../src/tracking-scope-model";

test("reactive source model detects aliases and common Solid sources", () => {
  const source = `
    import { createEffect as fx, createMemo as memo, createResource, createSignal as signal } from "solid-js";
    import { createStore as store } from "solid-js/store";

    export function Counter(input: { count: number }) {
      const [count, setCount] = signal(0);
      const [state] = store({ items: [] });
      const doubled = memo(() => count() * 2);
      const [profile] = createResource(() => input.count, fetchProfile);
      fx(() => setCount(input.count));
      return <ul>{state.items.map(String)} {doubled()} {profile()}</ul>;
    }
  `;

  const model = analyzeReactiveSources(source);

  assert.equal(model.solidImports.get("createEffect"), "fx");
  assert.equal(model.solidImports.get("createSignal"), "signal");
  assert.equal(model.solidImports.get("createStore"), "store");
  assert.deepEqual(model.propsNames, new Set(["input"]));
  assert.deepEqual(model.signalGetters, new Set(["count"]));
  assert.deepEqual(model.signalSetters, new Set(["setCount"]));
  assert.deepEqual(model.stores, new Set(["state"]));
  assert.deepEqual(model.memos, new Set(["doubled"]));
  assert.deepEqual(model.resources, new Set(["profile"]));
});

test("reactive read model answers region and JSX list source questions", () => {
  const source = `
    import { createEffect, createSignal } from "solid-js";

    export function Counter(props: { count: number }) {
      const [count, setCount] = createSignal(0);
      const [items] = createSignal(["Ada"]);
      const initial = props.count;

      createEffect(async () => {
        setCount(props.count);
        await Promise.resolve();
        console.log(count());
      });

      return <ul>{items().map((item) => <li>{item}</li>)} {initial}</ul>;
    }
  `;
  const reactiveSources = analyzeReactiveSources(source);
  const trackingScopes = analyzeTrackingScopes(source, reactiveSources);
  const reads = analyzeReactiveReads({ source, reactiveSources, trackingScopes });
  const [effect] = trackingScopes.effects;

  assert.ok(effect);
  assert.equal(reads.hasReadInRegion(effect), true);
  assert.deepEqual(
    reads.writesInRegion(effect).map((write) => write.setterName),
    ["setCount"],
  );
  assert.deepEqual(
    reads.readsAfterAwait(effect).map((read) => read.expression),
    ["count("],
  );
  assert.deepEqual(
    reads.reactiveJsxListSources().map((listSource) => listSource.expression),
    ["items()"],
  );
  assert.deepEqual(
    reads.propSnapshotsUsedInReturnedJsx().map((snapshot) => snapshot.localName),
    ["initial"],
  );
});

test("reactive read model tracks store destructuring snapshots used in JSX", () => {
  const source = `
    import { createStore } from "solid-js/store";

    export function Profile() {
      const [state] = createStore({ profile: { name: "Ada" } });
      const { profile } = state;
      return <h1>{profile.name}</h1>;
    }
  `;
  const reactiveSources = analyzeReactiveSources(source);
  const trackingScopes = analyzeTrackingScopes(source, reactiveSources);
  const reads = analyzeReactiveReads({ source, reactiveSources, trackingScopes });

  assert.deepEqual(
    reads.storeSnapshotsUsedInReturnedJsx().map((snapshot) => snapshot.localName),
    ["profile"],
  );
});

test("tracking scope model exposes effects, resources, memos, mounts, and async regions", () => {
  const source = `
    import { createEffect as fx, createMemo, createResource, onMount as mounted } from "solid-js";

    fx(async () => {
      await Promise.resolve();
      console.log("after");
    });
    createMemo(() => "value");
    createResource(() => "key", fetcher);
    mounted(() => {
      console.log(window.location.href);
    });
  `;
  const reactiveSources = analyzeReactiveSources(source);
  const model = analyzeTrackingScopes(source, reactiveSources);

  assert.equal(model.scopes.length, 4);
  assert.equal(model.effects.length, 1);
  assert.equal(
    model.scopes.some((scope) => scope.kind === TRACKING_SCOPE_KINDS.memo),
    true,
  );
  assert.equal(
    model.scopes.some((scope) => scope.kind === TRACKING_SCOPE_KINDS.resource),
    true,
  );
  assert.equal(model.effects[0]?.asyncAfterAwaitStart === null, false);
  assert.equal(model.onMountRanges.length, 1);
});
