import { escapeRegExp } from "./rules/rule-utils";

export type ReactiveSourceModel = {
  propsNames: Set<string>;
  signalGetters: Set<string>;
  signalSetters: Set<string>;
  stores: Set<string>;
  memos: Set<string>;
  resources: Set<string>;
  solidImports: Map<string, string>;
};

const SOLID_IMPORTS = new Set([
  "createEffect",
  "createSignal",
  "createMemo",
  "createResource",
  "onMount",
]);
const STORE_IMPORTS = new Set(["createStore"]);

export function analyzeReactiveSources(source: string): ReactiveSourceModel {
  const solidImports = findSolidImports(source);
  const propsNames = findPropsNames(source);
  const signalGetters = findTupleNames(source, localNameFor(solidImports, "createSignal"), 0);
  const signalSetters = findTupleNames(source, localNameFor(solidImports, "createSignal"), 1);
  const stores = findTupleNames(source, localNameFor(solidImports, "createStore"), 0);
  const memos = findAssignedNames(source, localNameFor(solidImports, "createMemo"));
  const resources = findTupleNames(source, localNameFor(solidImports, "createResource"), 0);

  return {
    propsNames,
    signalGetters,
    signalSetters,
    stores,
    memos,
    resources,
    solidImports,
  };
}

export function localNameFor(imports: Map<string, string>, importedName: string): string {
  return imports.get(importedName) ?? importedName;
}

function findSolidImports(source: string): Map<string, string> {
  const imports = new Map<string, string>();
  const pattern = /import\s*\{([^}]+)\}\s*from\s*["'](solid-js|solid-js\/store)["']/g;
  let match: RegExpExecArray | null;

  while ((match = pattern.exec(source))) {
    const specifiers = match[1];
    const sourceModule = match[2];

    if (!specifiers || !sourceModule) {
      continue;
    }

    for (const specifier of specifiers.split(",")) {
      const [imported, local] = specifier.trim().split(/\s+as\s+/);
      const importedName = imported?.trim();
      const localAlias = (local ?? imported)?.trim();

      if (!importedName || !localAlias) {
        continue;
      }

      if (
        (sourceModule === "solid-js" && SOLID_IMPORTS.has(importedName)) ||
        STORE_IMPORTS.has(importedName)
      ) {
        imports.set(importedName, localAlias);
      }
    }
  }

  return imports;
}

function findPropsNames(source: string): Set<string> {
  const propsNames = new Set<string>();
  const pattern = /\bfunction\s+[A-Z][A-Za-z0-9_$]*\s*\(\s*([A-Za-z_$][\w$]*)\b/g;
  let match: RegExpExecArray | null;

  while ((match = pattern.exec(source))) {
    if (match[1]) {
      propsNames.add(match[1]);
    }
  }

  return propsNames;
}

function findTupleNames(source: string, factoryName: string, tupleIndex: 0 | 1): Set<string> {
  const names = new Set<string>();
  const pattern = new RegExp(
    `\\bconst\\s*\\[\\s*([A-Za-z_$][\\w$]*)(?:\\s*,\\s*([A-Za-z_$][\\w$]*))?\\s*\\]\\s*=\\s*${escapeRegExp(factoryName)}\\b`,
    "g",
  );
  let match: RegExpExecArray | null;

  while ((match = pattern.exec(source))) {
    const name = match[tupleIndex + 1];
    if (name) {
      names.add(name);
    }
  }

  return names;
}

function findAssignedNames(source: string, factoryName: string): Set<string> {
  const names = new Set<string>();
  const pattern = new RegExp(
    `\\bconst\\s+([A-Za-z_$][\\w$]*)\\s*=\\s*${escapeRegExp(factoryName)}\\b`,
    "g",
  );
  let match: RegExpExecArray | null;

  while ((match = pattern.exec(source))) {
    if (match[1]) {
      names.add(match[1]);
    }
  }

  return names;
}
