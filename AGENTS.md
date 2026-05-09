# Agent Guidance

Solid Doctor is an Oxlint-first code-health tool for Solid and SolidStart projects. The product thesis is: React-shaped Solid compiles, but often breaks Solid's fine-grained reactivity model. Solid Doctor should catch those bugs, explain the Solid mental model, and help humans and coding agents avoid repeating them.

## Start Here

- Read `README.md` for external product positioning and current commands.
- Read `CONTEXT.md` for domain vocabulary and product boundaries.
- Read `CONTEXT-MAP.md` for where implementation areas live.
- Read `docs/agents/workflow.md` for GitHub issue and skill conventions.
- Read `docs/adr/0001-oxlint-first-solid-doctor.md` before changing the rule engine or CLI architecture.

## Commands

- Install dependencies: `bun install`
- Run scan: `bun run scan -- fixtures/valid-solid`
- Test: `bun run test`
- Type check with tsgo: `bun run check-types`

All source and tests should be TypeScript. Do not add `.js`, `.mjs`, or `.cjs` files for repo code unless a tool integration genuinely requires generated JavaScript.

## Architecture Rules

- Keep the CLI product layer separate from rule detection.
- Rules emit raw findings and metadata; `src/rule-runner.ts` normalizes them into diagnostics.
- `src/diagnostics.ts` is the shared diagnostic contract. Extend it deliberately because reporters, scoring, docs, and agent output will depend on it.
- Prefer shared analyzer modules over duplicating AST or text heuristics inside each rule.
- Keep rules conservative. A diagnostic should represent a likely Solid correctness, SSR, lifecycle, or maintainability risk.
- Every new rule needs valid, invalid, and false-positive fixtures.
- Do not add formatting opinions. `oxfmt` owns formatting.

## Reference Repos

Use `/references` for inspiration only. Do not copy code blindly.

Important references:

- `/references/react-doctor`: CLI UX, score model, grouped diagnostics, agent install flow.
- `/references/oxc`: Oxlint config/plugin/rule infrastructure.
- `/references/eslint-plugin-solid`: existing Solid rules; avoid duplicating them unless improving detection.
- `/references/solid-docs`: canonical explanations for Solid reactivity, effects, props, resources, owners, SSR.
- `/references/solid`: runtime semantics for Solid's fine-grained reactivity.
- `/references/biome`: diagnostic formatting and Solid destructured-props rule behavior.
- `/references/solid-devtools`: reactivity graph terminology.
- `/references/oxlint-action`: GitHub Actions annotation behavior.
- `/references/knip`: dead code, dependency, export, and file scoring ideas.
- `/references/react/packages/eslint-plugin-react-hooks`: framework-semantics lint rule inspiration.

The project should feel Oxlint-native, not ESLint-first.

Prefer rules that catch React-shaped Solid:

- reactive snapshots
- prop/store destructuring
- derived state in effects
- async tracking gaps after `await`
- dynamic `array.map` in JSX
- browser globals in SSR-capable paths
- owner/root cleanup leaks

Optional references may be present for SolidStart, official templates, and Solid Query patterns. Treat those as fixture and pattern sources, not as primary architecture guides.

## Skill Guidance

- Use `repo-context-bootstrap` when repo-local context files drift or new contributors cannot orient quickly.
- Use `verticalize-work` when turning PRD sections or issues into independently executable slices.
- Use `test-first-delivery` for behavior-changing rules and bug fixes where a failing fixture can define the contract.
- Use `proof-repair` for regressions, false positives, broken scans, or CI failures.
- Use `contract-review` for reviews of rule boundaries, diagnostic contracts, CI behavior, and agent installation.
- Use `docs-sync` when product or architecture decisions should update README, CONTEXT, ADRs, and issue guidance together.
