import { CATEGORIES, CONFIDENCE, SEVERITIES, type RawFinding } from "../diagnostics";
import type { RunnableRule } from "../rule-runner";
import { escapeRegExp, positionAt } from "./rule-utils";

type PropSnapshotDeclaration = {
  localName: string;
  propName: string;
  index: number;
  line: number;
  column: number;
};

export const reactivePropSnapshotRule: RunnableRule = {
  id: "solid/reactive-prop-snapshot",
  meta: {
    category: CATEGORIES.reactivity,
    defaultSeverity: SEVERITIES.warning,
    confidence: CONFIDENCE.high,
    docsSlug: "reactive-prop-snapshot",
    description: "Detects local snapshots of component props that are later used in JSX.",
    why: "Solid components run once, so copying props into a local value before JSX can disconnect the JSX read from prop updates.",
    badExample: "const name = props.name; return <h1>{name}</h1>;",
    preferredExample: "return <h1>{props.name}</h1>;",
    remediation:
      "Read the prop inside JSX, use a prop accessor, or wrap the derivation in createMemo.",
    suppressionGuidance:
      "Suppress only when the value is intentionally a one-time initial snapshot and is not expected to update.",
    references: ["https://docs.solidjs.com/concepts/components/props"],
    fixable: false,
  },
  check(context) {
    const findings: RawFinding[] = [];
    const declarations = findPropSnapshotDeclarations(
      context.sourceText,
      context.reactiveSources.propsNames,
    );

    for (const declaration of declarations) {
      if (!isUsedInReturnedJsx(context.sourceText, declaration)) {
        continue;
      }

      findings.push({
        line: declaration.line,
        column: declaration.column,
        message: `Local value '${declaration.localName}' snapshots props.${declaration.propName} before JSX can track it.`,
        remediation: `Read props.${declaration.propName} inside JSX, use a prop accessor, or wrap the derivation in createMemo.`,
      });
    }

    return findings;
  },
};

function findPropSnapshotDeclarations(
  source: string,
  propsNames: Set<string>,
): PropSnapshotDeclaration[] {
  const declarations: PropSnapshotDeclaration[] = [];
  const propsPattern = [...propsNames].map(escapeRegExp).join("|");

  if (!propsPattern) {
    return declarations;
  }

  const pattern = new RegExp(
    `\\b(?:const|let|var)\\s+([A-Za-z_$][\\w$]*)\\s*=\\s*(${propsPattern})\\.([A-Za-z_$][\\w$]*)\\b`,
    "g",
  );
  let match: RegExpExecArray | null;

  while ((match = pattern.exec(source))) {
    const localName = match[1];
    const propName = match[3];

    if (!localName || !propName) {
      continue;
    }

    declarations.push({
      localName,
      propName,
      index: match.index,
      ...positionAt(source, match.index),
    });
  }

  return declarations;
}

function isUsedInReturnedJsx(source: string, declaration: PropSnapshotDeclaration): boolean {
  const afterDeclaration = source.slice(declaration.index);
  const returnIndex = afterDeclaration.search(/\breturn\s*(?:\(|<)/);

  if (returnIndex === -1) {
    return false;
  }

  const returnedSource = afterDeclaration.slice(returnIndex);
  const usagePattern = new RegExp(`\\b${escapeRegExp(declaration.localName)}\\b`);
  return usagePattern.test(returnedSource);
}
