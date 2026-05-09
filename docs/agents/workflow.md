# Agent Workflow

## Work Tracking

GitHub issues are the source of truth for product work.

- `#1`: optimal end-state PRD and parent issue.
- `#2` through `#10`: completed implementation slices with verification comments.

When starting work from an issue, read the issue body and the relevant context files before editing. Keep implementation slices vertical: every slice should produce observable scan, report, or workflow behavior.

## Labels And States

No formal label taxonomy has been adopted yet. Until one exists, use issue titles and comments for state:

- `Blocked`: include the concrete missing decision or dependency.
- `Ready`: scope is clear enough for an agent.
- `Done`: implementation and verification commands are included in the closing comment or PR.

Do not invent a large label system until triage volume justifies it.

## Skill Conventions

- Use `verticalize-work` for breaking PRD or roadmap work into implementation issues.
- Use `test-first-delivery` for new diagnostic rules when a fixture can express the failing behavior first.
- Use `proof-repair` for false positives, broken scanner behavior, or failing CI.
- Use `contract-review` before changing diagnostic contracts, rule-runner contracts, scoring semantics, or agent installation behavior.
- Use `docs-sync` after major product, architecture, or roadmap changes.
- Use `repo-context-bootstrap` when context files become stale or incomplete.

## Verification Expectations

For scanner or rule changes, run:

```bash
bun run test
bun run check-types
```

For optional TUI changes, also run:

```bash
bun run --cwd apps/tui check-types
```

OpenTUI verification is terminal verification, not browser verification. Do not use Playwright, MCP browser checks, HTML previews, or browser screenshots to claim OpenTUI behavior works. Use the installed `opentui` skill for API guidance, `bun test` for logic and layout coverage, and a renderer-level or PTY snapshot harness with fixed terminal size and mocked input for interactive behavior. If no such harness exists, report terminal UI behavior as unverified.

For CLI behavior changes, also run at least one clean and one diagnostic fixture:

```bash
bun run scan -- fixtures/valid-solid
bun src/cli.ts scan fixtures/invalid-prop-snapshot
```

When a command cannot be run, state why and what residual risk remains.
