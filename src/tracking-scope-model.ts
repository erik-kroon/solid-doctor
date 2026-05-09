import { type ReactiveSourceModel, localNameFor } from "./reactive-source-model";
import { findCallBodyBlocks } from "./rules/rule-utils";

export const TRACKING_SCOPE_KINDS = {
  effect: "effect",
  memo: "memo",
  resource: "resource",
  mount: "mount",
} as const;

export type TrackingScopeKind = (typeof TRACKING_SCOPE_KINDS)[keyof typeof TRACKING_SCOPE_KINDS];

export type TrackingScope = {
  kind: TrackingScopeKind;
  start: number;
  bodyStart: number;
  end: number;
  body: string;
  asyncAfterAwaitStart: number | null;
};

export type TrackingScopeModel = {
  scopes: TrackingScope[];
  effects: TrackingScope[];
  onMountRanges: Array<{ start: number; end: number }>;
};

export function analyzeTrackingScopes(
  source: string,
  reactiveSources: ReactiveSourceModel,
): TrackingScopeModel {
  const scopes = [
    ...findScopes(
      source,
      localNameFor(reactiveSources.solidImports, "createEffect"),
      TRACKING_SCOPE_KINDS.effect,
    ),
    ...findScopes(
      source,
      localNameFor(reactiveSources.solidImports, "createMemo"),
      TRACKING_SCOPE_KINDS.memo,
    ),
    ...findScopes(
      source,
      localNameFor(reactiveSources.solidImports, "createResource"),
      TRACKING_SCOPE_KINDS.resource,
    ),
    ...findScopes(
      source,
      localNameFor(reactiveSources.solidImports, "onMount"),
      TRACKING_SCOPE_KINDS.mount,
    ),
  ];

  return {
    scopes,
    effects: scopes.filter((scope) => scope.kind === TRACKING_SCOPE_KINDS.effect),
    onMountRanges: scopes
      .filter((scope) => scope.kind === TRACKING_SCOPE_KINDS.mount)
      .map((scope) => ({ start: scope.bodyStart, end: scope.end })),
  };
}

function findScopes(source: string, callee: string, kind: TrackingScopeKind): TrackingScope[] {
  return findCallBodyBlocks(source, callee).map((block) => {
    const awaitIndex = block.body.indexOf("await ");
    return {
      kind,
      start: block.index,
      bodyStart: block.bodyStart,
      end: block.bodyStart + block.body.length,
      body: block.body,
      asyncAfterAwaitStart: awaitIndex === -1 ? null : block.bodyStart + awaitIndex,
    };
  });
}
