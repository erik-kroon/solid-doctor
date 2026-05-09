# GitHub Action

Solid Doctor ships a composite GitHub Action for pull request diagnostics, annotations and score gating.

```yaml
name: Solid Doctor

on:
  pull_request:

jobs:
  solid-doctor:
    runs-on: ubuntu-latest
    permissions:
      contents: read
      pull-requests: write
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0
      - uses: erik-kroon/solid-doctor@main
        id: solid-doctor
        with:
          directory: .
          diff-base: origin/${{ github.base_ref }}
          min-score: 80
          fail-on: score-or-diagnostics
          pr-comment: "true"
```

The action output `score` contains the overall Solid Doctor score. `diagnostics-count` contains the number of reported diagnostics after config, baselines and diff filtering.

## Inputs

- `directory`: project directory to scan. Defaults to `.`.
- `diff-base`: ref used for diff mode. Pull requests default to `origin/<base branch>` when omitted.
- `format`: summary format written to the GitHub step summary. Defaults to `markdown`.
- `min-score`: minimum score used by `fail-on: score` and `fail-on: score-or-diagnostics`. Defaults to `80`.
- `fail-on`: `score-or-diagnostics`, `diagnostics`, `score`, or `never`.
- `github-token`: token used for optional PR comments. Defaults to `${{ github.token }}`.
- `pr-comment`: set to `"true"` to post or update a pull request comment.
- `package`: package spec passed to `npx`. Defaults to `solid-doctor`.

Use `fetch-depth: 0` when using `diff-base` so GitHub Actions has the base branch history available.
