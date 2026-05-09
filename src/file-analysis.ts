import {
  analyzeReactiveReads,
  type JsxListSource,
  type PropSnapshot,
  type ReactiveRead,
  type SignalWrite,
  type StoreSnapshot,
} from "./reactive-read-model";
import {
  analyzeReactiveSources,
  localNameFor,
  type ReactiveSourceModel,
} from "./reactive-source-model";
import { positionAt } from "./source-location";
import {
  analyzeTrackingScopes,
  type TrackingScope,
  type TrackingScopeModel,
} from "./tracking-scope-model";

export type FileAnalysis = {
  sourceText(): string;
  positionAt(index: number): { line: number; column: number };
  localNameFor(importedName: string): string;
  propNames(): Set<string>;
  effectScopes(): TrackingScope[];
  trackingScopes(): TrackingScope[];
  sourceForRegion(region: { bodyStart: number; end: number }): string;
  readsAfterAwait(scope: TrackingScope): ReactiveRead[];
  writesInRegion(region: { bodyStart: number; end: number }): SignalWrite[];
  hasReadInRegion(region: { bodyStart: number; end: number }): boolean;
  reactiveJsxListSources(): JsxListSource[];
  propSnapshotsUsedInReturnedJsx(): PropSnapshot[];
  storeSnapshotsUsedInReturnedJsx(): StoreSnapshot[];
  isIndexInsideMount(index: number): boolean;
};

export function analyzeFile(sourceText: string): FileAnalysis {
  const reactiveSources = analyzeReactiveSources(sourceText);
  const trackingScopeModel = analyzeTrackingScopes(sourceText, reactiveSources);
  const reactiveReads = analyzeReactiveReads({
    source: sourceText,
    reactiveSources,
    trackingScopes: trackingScopeModel,
  });

  return createFileAnalysis({ sourceText, reactiveSources, trackingScopeModel, reactiveReads });
}

function createFileAnalysis({
  sourceText,
  reactiveSources,
  trackingScopeModel,
  reactiveReads,
}: {
  sourceText: string;
  reactiveSources: ReactiveSourceModel;
  trackingScopeModel: TrackingScopeModel;
  reactiveReads: ReturnType<typeof analyzeReactiveReads>;
}): FileAnalysis {
  return {
    sourceText() {
      return sourceText;
    },
    positionAt(index) {
      return positionAt(sourceText, index);
    },
    localNameFor(importedName) {
      return localNameFor(reactiveSources.solidImports, importedName);
    },
    propNames() {
      return reactiveSources.propsNames;
    },
    effectScopes() {
      return trackingScopeModel.effects;
    },
    trackingScopes() {
      return trackingScopeModel.scopes;
    },
    sourceForRegion(region) {
      return sourceText.slice(region.bodyStart, region.end);
    },
    readsAfterAwait(scope) {
      return reactiveReads.readsAfterAwait(scope);
    },
    writesInRegion(region) {
      return reactiveReads.writesInRegion(region);
    },
    hasReadInRegion(region) {
      return reactiveReads.hasReadInRegion(region);
    },
    reactiveJsxListSources() {
      return reactiveReads.reactiveJsxListSources();
    },
    propSnapshotsUsedInReturnedJsx() {
      return reactiveReads.propSnapshotsUsedInReturnedJsx();
    },
    storeSnapshotsUsedInReturnedJsx() {
      return reactiveReads.storeSnapshotsUsedInReturnedJsx();
    },
    isIndexInsideMount(index) {
      return reactiveReads.isIndexInsideMount(index);
    },
  };
}
