# ADR 0002: TypeScript, Bun, And tsgo

## Status

Accepted.

## Context

The repository should keep implementation and tests in TypeScript. Bun can execute TypeScript directly, which avoids an early build step while the CLI and rule engine are still taking shape.

The user explicitly requested `tsgo` for type checks.

## Decision

- Source and tests are TypeScript-only.
- Bun is the runtime for local CLI execution and tests.
- Type checking runs through `@typescript/native-preview` via `bun run check-types`.

## Consequences

- Do not add repo-authored `.js`, `.mjs`, or `.cjs` files unless generated output or an external integration requires them.
- Keep imports compatible with Bun's TypeScript execution.
- Document command changes in README and AGENTS when scripts change.
