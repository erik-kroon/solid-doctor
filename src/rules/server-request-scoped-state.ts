import { CATEGORIES, CONFIDENCE, SEVERITIES, type RawFinding } from "../diagnostics";
import type { RunnableRule } from "../rule-catalog";
import { positionAt } from "./rule-utils";

const MODULE_MUTABLE_PATTERN = /\b(?:let|var)\s+([A-Za-z_$][\w$]*)\b/g;
const REQUEST_STATE_NAME_PATTERN =
  /(user|session|request|tenant|auth|cookie|locale|account|current)/i;

export const serverRequestScopedStateRule: RunnableRule = {
  id: "solid/server-request-scoped-state",
  meta: {
    category: CATEGORIES.server,
    defaultSeverity: SEVERITIES.error,
    confidence: CONFIDENCE.medium,
    impact: "high",
    impactDescription: "prevents SSR data leaks across users and requests",
    tags: ["server", "ssr", "request", "state", "security"],
    docsSlug: "server-request-scoped-state",
    description:
      "Detects suspicious module-level mutable request state in SSR-capable SolidStart files.",
    why: "SolidStart server modules can be shared by concurrent users in the same process. Request data stored at module scope can leak between requests.",
    badExample: "let currentUserId: string | undefined;",
    preferredExample:
      "export async function loadUser() { 'use server'; const userId = await readUserIdFromSession(); return db.users.get(userId); }",
    remediation:
      "Keep request-specific values local to server functions or request event locals instead of module-level mutable variables.",
    suppressionGuidance:
      "Suppress only for process-wide mutable state that never stores user, session, tenant, locale, cookie, auth, or request data.",
    references: [
      "https://docs.solidjs.com/solid-start/advanced/request-events",
      "https://docs.solidjs.com/solid-start/advanced/auth",
    ],
    fixable: false,
  },
  check(context) {
    const fileClassification = context.project.fileClassifications.get(context.relativeFilePath);

    if (!fileClassification?.serverCapable) {
      return [];
    }

    const findings: RawFinding[] = [];
    let match: RegExpExecArray | null;

    while ((match = MODULE_MUTABLE_PATTERN.exec(context.sourceText))) {
      const name = match[1];

      if (
        !name ||
        !REQUEST_STATE_NAME_PATTERN.test(name) ||
        !isTopLevel(context.sourceText, match.index)
      ) {
        continue;
      }

      findings.push({
        ...positionAt(context.sourceText, match.index),
        message: `Module-level mutable '${name}' can share request data across SSR users.`,
      });
    }

    return findings;
  },
};

function isTopLevel(source: string, index: number): boolean {
  let depth = 0;

  for (let cursor = 0; cursor < index; cursor += 1) {
    const character = source[cursor];

    if (character === "{") {
      depth += 1;
    }

    if (character === "}") {
      depth = Math.max(0, depth - 1);
    }
  }

  return depth === 0;
}
