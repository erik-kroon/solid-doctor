export type CallBodyBlock = {
  callee: string;
  index: number;
  body: string;
  bodyStart: number;
};

export function findCallBodyBlocks(source: string, callee: string): CallBodyBlock[] {
  const blocks: CallBodyBlock[] = [];
  const pattern = new RegExp(`\\b${escapeRegExp(callee)}\\s*\\(`, "g");
  let match;

  while ((match = pattern.exec(source))) {
    if (isIndexInsideStringLiteral(source, match.index)) {
      continue;
    }

    const openBrace = source.indexOf("{", pattern.lastIndex);

    if (openBrace === -1) {
      continue;
    }

    const closeBrace = findMatchingBrace(source, openBrace);

    if (closeBrace === -1) {
      continue;
    }

    blocks.push({
      callee,
      index: match.index,
      body: source.slice(openBrace + 1, closeBrace),
      bodyStart: openBrace + 1,
    });

    pattern.lastIndex = closeBrace + 1;
  }

  return blocks;
}

export function isIndexInsideStringLiteral(source: string, targetIndex: number): boolean {
  let quote: "'" | '"' | "`" | null = null;
  let escaped = false;

  for (let index = 0; index < targetIndex; index += 1) {
    const character = source[index];

    if (escaped) {
      escaped = false;
      continue;
    }

    if (character === "\\") {
      escaped = true;
      continue;
    }

    if (quote) {
      if (character === quote) {
        quote = null;
      }

      continue;
    }

    if (character === "'" || character === '"' || character === "`") {
      quote = character;
    }
  }

  return quote !== null;
}

export function findSignalGetters(source: string): Set<string> {
  const getters = new Set<string>();
  const pattern =
    /\bconst\s*\[\s*([A-Za-z_$][\w$]*)\s*,\s*[A-Za-z_$][\w$]*\s*\]\s*=\s*createSignal\b/g;
  let match;

  while ((match = pattern.exec(source))) {
    if (match[1]) {
      getters.add(match[1]);
    }
  }

  return getters;
}

export function findSignalSetters(source: string): Set<string> {
  const setters = new Set<string>();
  const pattern =
    /\bconst\s*\[\s*[A-Za-z_$][\w$]*\s*,\s*([A-Za-z_$][\w$]*)\s*\]\s*=\s*createSignal\b/g;
  let match;

  while ((match = pattern.exec(source))) {
    if (match[1]) {
      setters.add(match[1]);
    }
  }

  return setters;
}

export function containsReactiveRead(source: string, signalGetters: Set<string>): boolean {
  if (/\bprops\.[A-Za-z_$][\w$]*/.test(source)) {
    return true;
  }

  for (const getter of signalGetters) {
    const getterPattern = new RegExp(`\\b${escapeRegExp(getter)}\\s*\\(`);
    if (getterPattern.test(source)) {
      return true;
    }
  }

  return false;
}

export function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function findMatchingBrace(source: string, openBrace: number): number {
  let depth = 0;

  for (let index = openBrace; index < source.length; index += 1) {
    const character = source[index];

    if (character === "{") {
      depth += 1;
    }

    if (character === "}") {
      depth -= 1;

      if (depth === 0) {
        return index;
      }
    }
  }

  return -1;
}
