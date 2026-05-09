# Package Release

Solid Doctor publishes as the unscoped npm package `solid-doctor`.

The package is a CLI-first artifact. Source is TypeScript and local development uses Bun, but the published `solid-doctor` binary is bundled to `dist/cli.js` with a Node shebang so both npm and Bun package runners can execute it:

```bash
npx solid-doctor scan .
bunx solid-doctor scan .
```

## Build Contract

- `package.json#bin.solid-doctor` points to `./dist/cli.js`.
- `package.json#files` includes `dist` and `README.md`.
- `bun run build` removes `dist`, bundles `src/cli.ts` for Node, and emits declarations under `dist/types`.
- `scan`, `check`, `explain`, and `install-agents` must work from the packed artifact.
- `doctor` and `inspect` remain source-checkout OpenTUI commands until the TUI is packaged separately.

## Smoke Test

Before publishing:

```bash
bun run test
bun run check-types
bun run build
bun pm pack --destination .context/package-smoke
npm exec --package .context/package-smoke/solid-doctor-0.1.0.tgz -- solid-doctor scan fixtures/valid-solid
bunx --package "$PWD/.context/package-smoke/solid-doctor-0.1.0.tgz" solid-doctor scan fixtures/valid-solid
```

The packed scanner should print `Health score: 100/100` for `fixtures/valid-solid`.

## Publish Checklist

1. Confirm `version` in `package.json`.
2. Run the smoke test above from a clean working tree.
3. Inspect package contents with `tar -tzf .context/package-smoke/solid-doctor-<version>.tgz`.
4. Publish the package with `npm publish`.
5. Create any source-only GitHub release separately from the npm publish.

GitHub source releases and npm package publishes are separate responsibilities. A source-only GitHub release can document repo changes without implying that a new npm package was published.
