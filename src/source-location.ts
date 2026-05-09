export function positionAt(source: string, index: number): { line: number; column: number } {
  const before = source.slice(0, index);
  const lines = before.split("\n");
  const currentLine = lines.at(-1) ?? "";
  return {
    line: lines.length,
    column: currentLine.length + 1,
  };
}

export function lineStartAt(source: string, index: number): number {
  return source.lastIndexOf("\n", index) + 1;
}

export function lineEndAt(source: string, index: number): number {
  const lineEnd = source.indexOf("\n", index);
  return lineEnd === -1 ? source.length : lineEnd;
}
