import type { ReactiveSourceModel } from "./reactive-source-model";
import type { TrackingScope, TrackingScopeModel } from "./tracking-scope-model";
import { escapeRegExp } from "./rules/rule-utils";
import { lineEndAt, lineStartAt, positionAt } from "./source-location";

export type ReactiveReadKind = "prop" | "signal" | "store" | "memo" | "resource";

export type ReactiveRead = {
  kind: ReactiveReadKind;
  name: string;
  expression: string;
  index: number;
  line: number;
  column: number;
};

export type SignalWrite = {
  setterName: string;
  index: number;
  line: number;
  column: number;
};

export type JsxListSource = {
  expression: string;
  index: number;
  line: number;
  column: number;
};

export type PropSnapshot = {
  localName: string;
  propName: string;
  sourceName: string;
  index: number;
  line: number;
  column: number;
};

export type ReactiveReadModel = {
  reads: ReactiveRead[];
  signalWrites: SignalWrite[];
  jsxListSources: JsxListSource[];
  propSnapshots: PropSnapshot[];
  readsInRegion(region: { bodyStart: number; end: number }): ReactiveRead[];
  writesInRegion(region: { bodyStart: number; end: number }): SignalWrite[];
  readsAfterAwait(scope: TrackingScope): ReactiveRead[];
  hasReadInRegion(region: { bodyStart: number; end: number }): boolean;
  reactiveJsxListSources(): JsxListSource[];
  propSnapshotsUsedInReturnedJsx(): PropSnapshot[];
  isIndexTracked(index: number): boolean;
  isIndexPostAwait(index: number): boolean;
  isIndexInsideMount(index: number): boolean;
};

export function analyzeReactiveReads({
  source,
  reactiveSources,
  trackingScopes,
}: {
  source: string;
  reactiveSources: ReactiveSourceModel;
  trackingScopes: TrackingScopeModel;
}): ReactiveReadModel {
  const reads = findReactiveReads(source, reactiveSources);
  const signalWrites = findSignalWrites(source, reactiveSources);
  const jsxListSources = findJsxListSources(source, reactiveSources);
  const propSnapshots = findPropSnapshots(source, reactiveSources);

  return {
    reads,
    signalWrites,
    jsxListSources,
    propSnapshots,
    readsInRegion(region) {
      return reads.filter((read) => isInsideRegion(read.index, region));
    },
    writesInRegion(region) {
      return signalWrites.filter((write) => isInsideRegion(write.index, region));
    },
    readsAfterAwait(scope) {
      const afterAwaitStart = scope.asyncAfterAwaitStart;

      if (afterAwaitStart === null) {
        return [];
      }

      return reads.filter((read) => read.index >= afterAwaitStart && read.index <= scope.end);
    },
    hasReadInRegion(region) {
      return reads.some((read) => isInsideRegion(read.index, region));
    },
    reactiveJsxListSources() {
      return jsxListSources;
    },
    propSnapshotsUsedInReturnedJsx() {
      return propSnapshots.filter((snapshot) => isUsedInReturnedJsx(source, snapshot));
    },
    isIndexTracked(index) {
      return trackingScopes.scopes.some((scope) => isInsideRegion(index, scope));
    },
    isIndexPostAwait(index) {
      return trackingScopes.scopes.some((scope) => {
        const afterAwaitStart = scope.asyncAfterAwaitStart;
        return afterAwaitStart !== null && index >= afterAwaitStart && index <= scope.end;
      });
    },
    isIndexInsideMount(index) {
      return trackingScopes.onMountRanges.some(
        (range) => index >= range.start && index <= range.end,
      );
    },
  };
}

function findReactiveReads(source: string, reactiveSources: ReactiveSourceModel): ReactiveRead[] {
  const reads: ReactiveRead[] = [];

  for (const propsName of reactiveSources.propsNames) {
    collectMatches({
      source,
      pattern: new RegExp(`\\b${escapeRegExp(propsName)}\\.([A-Za-z_$][\\w$]*)`, "g"),
      kind: "prop",
      name: propsName,
      reads,
    });
  }

  for (const getter of reactiveSources.signalGetters) {
    collectMatches({
      source,
      pattern: new RegExp(`\\b${escapeRegExp(getter)}\\s*\\(`, "g"),
      kind: "signal",
      name: getter,
      reads,
    });
  }

  for (const store of reactiveSources.stores) {
    collectMatches({
      source,
      pattern: new RegExp(`\\b${escapeRegExp(store)}\\.([A-Za-z_$][\\w$]*)`, "g"),
      kind: "store",
      name: store,
      reads,
    });
  }

  for (const memo of reactiveSources.memos) {
    collectMatches({
      source,
      pattern: new RegExp(`\\b${escapeRegExp(memo)}\\s*\\(`, "g"),
      kind: "memo",
      name: memo,
      reads,
    });
  }

  for (const resource of reactiveSources.resources) {
    collectMatches({
      source,
      pattern: new RegExp(`\\b${escapeRegExp(resource)}\\s*\\(`, "g"),
      kind: "resource",
      name: resource,
      reads,
    });
  }

  return reads.sort((left, right) => left.index - right.index);
}

function collectMatches({
  source,
  pattern,
  kind,
  name,
  reads,
}: {
  source: string;
  pattern: RegExp;
  kind: ReactiveReadKind;
  name: string;
  reads: ReactiveRead[];
}): void {
  let match: RegExpExecArray | null;

  while ((match = pattern.exec(source))) {
    reads.push({
      kind,
      name,
      expression: match[0],
      index: match.index,
      ...positionAt(source, match.index),
    });
  }
}

function findSignalWrites(source: string, reactiveSources: ReactiveSourceModel): SignalWrite[] {
  const writes: SignalWrite[] = [];

  for (const setterName of reactiveSources.signalSetters) {
    const pattern = new RegExp(`\\b${escapeRegExp(setterName)}\\s*\\(`, "g");
    let match: RegExpExecArray | null;

    while ((match = pattern.exec(source))) {
      writes.push({
        setterName,
        index: match.index,
        ...positionAt(source, match.index),
      });
    }
  }

  return writes.sort((left, right) => left.index - right.index);
}

function findJsxListSources(source: string, reactiveSources: ReactiveSourceModel): JsxListSource[] {
  const sources: JsxListSource[] = [];
  const pattern = /\b([A-Za-z_$][\w$]*(?:\(\)|(?:\.[A-Za-z_$][\w$]*)+))\.map\s*\(/g;
  let match: RegExpExecArray | null;

  while ((match = pattern.exec(source))) {
    const line = source.slice(lineStartAt(source, match.index), lineEndAt(source, match.index));
    const expression = match[1];

    if (
      !expression ||
      !line.includes("{") ||
      !isReactiveMapExpression(expression, reactiveSources)
    ) {
      continue;
    }

    sources.push({
      expression,
      index: match.index,
      ...positionAt(source, match.index),
    });
  }

  return sources;
}

function findPropSnapshots(source: string, reactiveSources: ReactiveSourceModel): PropSnapshot[] {
  const propsPattern = [...reactiveSources.propsNames].map(escapeRegExp).join("|");

  if (!propsPattern) {
    return [];
  }

  const snapshots: PropSnapshot[] = [];
  const pattern = new RegExp(
    `\\b(?:const|let|var)\\s+([A-Za-z_$][\\w$]*)\\s*=\\s*(${propsPattern})\\.([A-Za-z_$][\\w$]*)\\b`,
    "g",
  );
  let match: RegExpExecArray | null;

  while ((match = pattern.exec(source))) {
    const localName = match[1];
    const sourceName = match[2];
    const propName = match[3];

    if (!localName || !sourceName || !propName) {
      continue;
    }

    snapshots.push({
      localName,
      sourceName,
      propName,
      index: match.index,
      ...positionAt(source, match.index),
    });
  }

  return snapshots;
}

function isReactiveMapExpression(
  expression: string,
  reactiveSources: ReactiveSourceModel,
): boolean {
  const trimmed = expression.trim();

  for (const propsName of reactiveSources.propsNames) {
    if (trimmed.startsWith(`${propsName}.`)) {
      return true;
    }
  }

  for (const getter of [
    ...reactiveSources.signalGetters,
    ...reactiveSources.memos,
    ...reactiveSources.resources,
  ]) {
    if (trimmed === `${getter}()`) {
      return true;
    }
  }

  for (const store of reactiveSources.stores) {
    if (trimmed.startsWith(`${store}.`)) {
      return true;
    }
  }

  return false;
}

function isUsedInReturnedJsx(source: string, snapshot: PropSnapshot): boolean {
  const afterSnapshot = source.slice(snapshot.index);
  const returnIndex = afterSnapshot.search(/\breturn\s*(?:\(|<)/);

  if (returnIndex === -1) {
    return false;
  }

  const returnedSource = afterSnapshot.slice(returnIndex);
  const usagePattern = new RegExp(`\\b${escapeRegExp(snapshot.localName)}\\b`);
  return usagePattern.test(returnedSource);
}

function isInsideRegion(index: number, region: { bodyStart: number; end: number }): boolean {
  return index >= region.bodyStart && index <= region.end;
}
