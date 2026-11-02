# qwik-cdk sync log

Last fully-synced from angular/components commit: `7ef5967ff21070a1dfdb044132e7a3ee175688a1`
(the merge-base of the qwik-cdk-dialog-port branch with main, ie. the upstream tip when the
initial Dialog port landed).

## Per-entry-point sync state

| Entry-point | Last synced SHA | Status |
|---|---|---|
| platform | `7ef5967ff` | green — feature helpers ported verbatim with CDK-style `typeof document` guards |
| bidi     | `7ef5967ff` | green — Directionality ported with signal-backed `value` |
| coercion | `7ef5967ff` | green — pure function helpers ported verbatim |
| keycodes | `7ef5967ff` | green — key constants + `hasModifierKey` ported verbatim |
| portal   | `7ef5967ff` | green — collapsed Portal<P> type + `<CdkPortalOutlet>` only; ComponentPortal/TemplatePortal/DomPortal removed |
| a11y     | `7ef5967ff` | partial — Dialog-required subset plus `useFocusOrigin()`'s `focusVia()` companion (2026-10-27, for expansion); LiveAnnouncer + key managers + `cdkTrapFocus` directive deferred (see a11y/SYNC.md) |
| accordion | `7ef5967ff` | green (2026-10-27) — `useCdkAccordion`/`useCdkAccordionItem` hooks; `UniqueSelectionDispatcher` replaced by a per-instance `Signal` broadcast (see accordion/SYNC.md) |
| overlay  | `7ef5967ff` | green — `OverlayConfig`, `OverlayRef`, `Overlay` service, position strategies (Global + FlexibleConnected), four scroll strategies, both dispatchers; `_CdkOverlayStyleLoader` replaced by Vite SCSS import |
| dialog   | `7ef5967ff` | green — `Dialog`/`useDialog`/`DialogRef`/`DialogConfig`/`CdkDialogContainer` with `Promise<R>` + `QRL` callbacks replacing RxJS streams |

## Sync recipe

Replicates spec §11. Reproduced here so a syncer doesn't have to chase the spec:

1. Read this file to get `LAST_SHA`.
2. Run:
   ```
   git log <LAST_SHA>..main -- \
     src/cdk/dialog/ src/cdk/overlay/ src/cdk/portal/ src/cdk/a11y/ \
     src/cdk/platform/ src/cdk/bidi/ src/cdk/coercion/ src/cdk/keycodes/ src/cdk/accordion/
   ```
3. For each commit, inspect touched files. For each file:
   - Look it up in the relevant entry-point's `SYNC.md` "Synced files" table.
   - **Intentionally not ported** → record the commit ID under "Reviewed and skipped" in that SYNC.md, move on.
   - **Mirrored** → apply the diff conceptually using the design spec's §4 translation table (Angular → Qwik primitives).
   - Touches an "Open deviations" line → evaluate whether the deviation still holds. If yes, record `reviewed; deviation stands as of <new-sha>`. If no, update the deviation.
4. Run `pnpm test:qwik-cdk`. Fix until green.
5. Bump the `Last synced SHA` in this file and in every per-entry `SYNC.md` you touched.
6. Commit with message `sync(qwik-cdk): port up to <new-sha-short>`.

## Cadence

Sync after every Angular Components minor release (~6 weeks), or ad-hoc when an upstream
fix is urgent. **Not automated** — the conceptual translation step in §4 is too
judgment-heavy for a script.

## Future automation

A `pnpm qwik-cdk:sync-report` helper that produces the commit-by-touched-file report
automatically is desirable but deferred. Wait for the first real sync to surface the
rough edges worth automating.
