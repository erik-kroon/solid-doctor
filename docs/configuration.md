# Configuration And Adoption

Solid Doctor reads `solid-doctor.config.json` from the project root and also supports a `solidDoctor` key in `package.json`.

```json
{
  "ignore": {
    "rules": ["solid/browser-global-in-ssr"],
    "files": ["src/legacy/**"]
  },
  "overrides": [
    {
      "files": ["src/routes/admin/**"],
      "ignore": {
        "rules": ["solid/dynamic-map-in-jsx"]
      }
    }
  ]
}
```

File ignores also honor `.solid-doctorignore` and non-negated `.gitignore` entries.

## Inline Suppressions

Suppress one named rule on the next physical line:

```tsx
// solid-doctor-disable-next-line solid/browser-global-in-ssr
const title = document.title;
```

JSX comments work the same way:

```tsx
{/* solid-doctor-disable-next-line solid/dynamic-map-in-jsx */}
{items().map((item) => <li>{item}</li>)}
```

Unused suppressions and unknown rule ids are reported as `suppressionHints` in JSON output.

## Incremental Adoption

```bash
solid-doctor scan . --write-baseline solid-doctor-baseline.json
solid-doctor scan . --baseline solid-doctor-baseline.json
solid-doctor scan . --changed-lines changed-lines.txt
solid-doctor scan . --diff main
solid-doctor scan . --staged
solid-doctor scan . --project apps/web --project @scope/ui
solid-doctor scan . --ci --min-score 80
```

The health score is `0-100`. Use category scores to decide which adoption surface to clean up first, then use baselines, diff filtering, staged scans, and project selection to keep new work from adding diagnostics before every legacy issue is fixed.
