# Oxlint Plugin

Solid Doctor exposes a JavaScript plugin-compatible entrypoint for Oxlint workflows:

```json
{
  "jsPlugins": ["./node_modules/solid-doctor/dist/oxlint-plugin.js"],
  "rules": {
    "solid-doctor/reactive-prop-snapshot": "error"
  }
}
```

The plugin name is `solid-doctor`. Rule names use the same docs slug as CLI diagnostics, so `solid/reactive-prop-snapshot` becomes `solid-doctor/reactive-prop-snapshot`.

## Current Rule Surface

The plugin currently exposes rules that can run from Oxlint's per-file source text without Solid Doctor project classification:

- `reactive-prop-snapshot`
- `derived-state-in-effect`
- `async-tracking-gap`
- `async-no-fetch-in-effect`
- `dynamic-map-in-jsx`
- `render-stable-children`
- `effect-cleanup-subscriptions`

SSR classification-dependent rules remain CLI-only until the plugin surface can receive equivalent project/file classification.
