# Installation

Solid Doctor is prepared as the `solid-doctor` npm package.

```bash
npm install --save-dev solid-doctor
npx solid-doctor scan .
```

With Bun:

```bash
bun add --dev solid-doctor
bunx solid-doctor scan .
```

Until the first npm publish, use the packed tarball smoke path from [package-release.md](package-release.md).

## Common Commands

```bash
solid-doctor scan .
solid-doctor scan . --format json
solid-doctor scan . --rules reactivity
solid-doctor explain solid/reactive-prop-snapshot
solid-doctor install-agents . --target all --dry-run
```

Use `scan` for local feedback and `check` when you want the same scanner path under a CI-oriented command name.
