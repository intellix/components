# qwik-material sync state

Repo root: this file lives at src/qwik-material/SYNC.md.

## Per-entry-point state

| Entry-point | Upstream base | Last sync commit | Notes |
|---|---|---|---|
| dialog | src/material/dialog | (unsynced — initial port) | See dialog/SYNC.md |
| expansion | src/material/expansion | (unsynced — initial port, 2026-10-27) | Built on `@angular-community/qwik-cdk/accordion`. See expansion/SYNC.md |
| menu | src/material/menu | (unsynced — initial port, 2026-10-28) | Built on `@angular-community/qwik-cdk/a11y`'s new `FocusKeyManager`. See menu/SYNC.md |

## Sync recipe

See `dialog/SYNC.md` for the entry-scoped sync recipe. This file rolls up which entry-points exist and where each was last synced.
