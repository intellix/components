# qwik-material/snack-bar sync log

Tracks the sync state between this port and `src/material/snack-bar/` upstream.

Last synced from angular/components commit: f35961a095dc2fbee6bfeb09878a82d391932cf7

## Upstream sync state

| File | Upstream path | Sync state | Notes |
|------|---------------|------------|-------|
| `scss/snack-bar/snack-bar.scss` | `src/material/snack-bar/snack-bar-container.scss` | synced with one deviation | `@use '@angular/cdk'` rewritten to `@use '../cdk-stub' as cdk` (same stub-import-swap rule as every other entry) |
| `scss/snack-bar/simple-snack-bar.scss` | `src/material/snack-bar/simple-snack-bar.scss` | synced | byte-identical copy (no `@angular/cdk` import to swap) |
| `scss/snack-bar/_m2-snack-bar.scss` | `src/material/snack-bar/_m2-snack-bar.scss` | synced | byte-identical copy |
| `scss/snack-bar/_m3-snack-bar.scss` | `src/material/snack-bar/_m3-snack-bar.scss` | synced | byte-identical copy |
| `scss/snack-bar/_snack-bar-theme.scss` | `src/material/snack-bar/_snack-bar-theme.scss` | synced | byte-identical copy |

## Synced TypeScript/TSX files

Synced files (mapped from src/material/snack-bar/):
- `snack-bar-config.ts` ← `snack-bar-config.ts`
- `mat-snack-bar-ref.ts` ← `snack-bar-ref.ts`
- `mat-snack-bar-container.tsx` ← `snack-bar-container.ts` + `snack-bar-container.html`
- `mat-snack-bar.tsx` ← `snack-bar.ts`
- `mat-snack-bar-content.tsx` ← `snack-bar-content.ts` (all three directives:
  `MatSnackBarLabel`/`MatSnackBarActions`/`MatSnackBarAction`)
- `simple-snack-bar.tsx` ← `simple-snack-bar.ts` + `simple-snack-bar.html`

## Shared qwik-cdk addition

- `qwik-cdk/a11y/live-announcer/live-announcer.ts` ← `src/cdk/a11y/live-announcer/live-announcer.ts`
  (the `LiveAnnouncer` service portion only — see that file's own doc comment for deviations).
  Added by this port (previously deferred, per `qwik-cdk/a11y/README.md`) because
  `MatSnackBar.open()`'s `announcementMessage` support needs it; reusable by any future consumer.

## Intentionally not ported

- `snack-bar-module.ts` (NgModules don't exist in Qwik).
- `snack-bar-container.html` (folded into `mat-snack-bar-container.tsx`'s JSX).
- `snack-bar.zone.spec.ts` (NgZone-specific change-detection test — no Qwik analogue).
- `testing/snack-bar-harness.ts` + `testing/snack-bar-harness-filters.ts` (harness deferred, same
  precedent as `qwik-material/dialog`'s deferred `MatDialogHarness`).
- `CdkAriaLive` (`[cdkAriaLive]` directive) — not ported as part of the shared
  `qwik-cdk/a11y` `LiveAnnouncer` addition; out of scope for this port.

## API deviations from upstream `MatSnackBar`/`MatSnackBarRef`/`MatSnackBarConfig`

- No parent/child injector hierarchy (`inject(MatSnackBar, {skipSelf: true})`) — "only one snack
  bar visible at a time" is tracked per `useMatSnackBar()` call, not as a true app-wide singleton
  (see `mat-snack-bar.tsx`'s `MatSnackBar` interface doc comment for the full rationale — every
  scenario in this port calls `useMatSnackBar()` once per route and drives every trigger off the
  same returned object, which is sufficient for the invariant the parity spec exercises).
- `MatSnackBarConfig.viewContainerRef` removed (no Angular DI view-container concept) —
  `MatSnackBarConfig.context`/`OverlayContextOverride[]` (the `qwik-material/dialog` precedent)
  was not added either, since no scenario needs it; can be added later the same way dialog did.
- `MatSnackBar.open(message, action, config)` / `openFromComponent(component, config)` →
  `open$` / `openFromComponent$`: QRL-returning methods (Qwik's resumability story), matching
  `useMatDialog()`'s `open$` precedent.
- `MatSnackBar.openFromTemplate(templateRef, config)` → `openFromTemplate$(component, config)`:
  no `TemplateRef` in Qwik — accepts a Qwik `Component`, identical mechanism to
  `openFromComponent$`. The DOM difference upstream's `TemplatePortal` produces (no wrapping host
  element, vs. `ComponentPortal`'s implicit host) is entirely a function of what the content
  component itself renders, not of this method — see the `from-template` dev-app scenario's
  `FromTemplateContent`, which renders bare text with no host tag at all, vs.
  `ParitySnackBarContent` (used by `custom-component`), which renders its own
  `<parity-snack-bar-content>` host tag.
- `MatSnackBarRef.afterDismissed()` / `.afterOpened()` / `.onAction()`: `Observable` → one-shot
  `Promise` (`afterDismissed`/`afterOpened`/`onAction`, not functions) — matches
  `MatDialogRef.afterClosed`/`afterOpened` precedent.
- `MatSnackBarRef.containerInstance` removed — no public handle to the Qwik container component
  (there's no `ComponentRef` concept to expose).
- `MatSnackBarRef.instance` (renamed from upstream's implicit typed generic result) is a
  `Signal<T | null>` that stays `null` in practice — Qwik has no `ComponentRef` to read a live
  content-component instance from (same already-accepted deviation as
  `MatDialogRef.componentInstance`).
- `MatSnackBar.ngOnDestroy()` removed (no Angular lifecycle).
- `BreakpointObserver`/handset-mode (`mat-mdc-snack-bar-handset` toggled on the overlay pane) not
  ported — `qwik-cdk` has no `BreakpointObserver` port yet, and no scenario exercises it (the
  parity spec's default 1280×720 Playwright viewport never matches `HandsetPortrait` either side).
  Flagged in the design doc as "not exercised/asserted"; add when a `qwik-cdk/layout` port exists.
- `announcementMessage` delivery timing approximated: upstream waits for the container's own
  `_onAnnounce` (the ~150ms screen-reader-announce move) before calling
  `LiveAnnouncer.announce()`; this port calls it off `ref.afterOpened` (enter-animation complete)
  instead, since threading a dedicated "announced" signal through `MatSnackBarRef` for an
  untested code path (no scenario sets `announcementMessage`) wasn't worth the surface area.
  `LiveAnnouncer` itself is created lazily, on the first `open()`/`openFromComponent()`/
  `openFromTemplate()` call that actually sets `announcementMessage` — not eagerly when
  `useMatSnackBar()` is first called — unlike upstream, which eagerly creates the
  `cdk-live-announcer-element` the moment `MatSnackBar` (which injects `LiveAnnouncer`) is
  injected. This keeps with remediation rule 7's lazy-loading philosophy; genuinely untestable
  either way by the Playwright spec, since that element lives outside `.cdk-overlay-container`.

## Implementation notes (non-upstream, port-specific)

- **No `'void'` animation state.** Upstream's `MatSnackBarContainer._animationState` has three
  values (`'void'` → `'visible'` → `'hidden'`); `'void'` is painted only for the brief window
  before `MatSnackBar._attach()` synchronously calls `containerInstance.enter()` — in practice
  never actually observable (see `mat-snack-bar-container.tsx`'s class doc comment for the full
  reasoning). This port's service (`attachSnackBar` in `mat-snack-bar.tsx`) only ever mounts the
  container at the moment it's already time to enter, so the container always renders
  already-entering; `exiting` (a plain boolean signal) is the only state it tracks.
- **No 200ms JS animation fallback.** Upstream's `enter()`/`exit()` each set a `setTimeout(200ms)`
  fallback in case the real CSS `animationend` never fires (apps that do
  `* { animation: none !important }`). Not ported — `[MARK_OPENED]`/`[MARK_DISMISSED]` are driven
  purely by the real `animationend`/`animationcancel` events, or, when animations are disabled via
  `<QwikMaterialProvider animationsDisabled>`, by an immediate `queueMicrotask`. No scenario
  exercises the pathological case the fallback guards against.
- **Replace path creates the new overlay immediately, not deferred.** See `mat-snack-bar.tsx`'s
  `attachSnackBar` doc comment: upstream's `_attach()` attaches the new container's overlay
  *before* `_animateSnackBar()` even looks at whether to dismiss a previous one — verified
  directly against the running Angular app (not just by reading the source) that both the old
  (exiting) and new (entering) containers really are briefly both present. An earlier draft of
  this port deferred the whole creation until the old ref's `afterDismissed`, which is observably
  different (a window with only the stale, already-settled old container) and broke the parity
  spec's `waitSettled()` polling — see that spec's header comment, point 2, and the matching
  correction in `src/dev-app/qwik-parity/snack-bar.ts`'s "REPLACEMENT" comment (both previously
  claimed "never two containers at once" from reading the source alone; that was wrong).
- **`open$`/`openFromComponent$`/`openFromTemplate$` each independently inline the full "attach"
  sequence** (via the module-level `attachSnackBar` helper, which takes all state as explicit
  arguments) rather than one being `$()`-wrapped and calling into a second, shared `$()` QRL. An
  earlier draft shared one; each `$()` boundary resolves via at least one microtask (dynamic
  `import()`, even for an already-loaded chunk), and chaining `onClick$` → `open$` → a shared
  `attach$` pushed the real DOM mutations out past the parity spec's `waitSettled()` helper's
  very first (effectively immediate) poll — see
  `specs/material-snack-bar/angular-parity.spec.ts`'s header comment, point 2, for the full
  explanation (a Qwik `on:click` is never run synchronously within the browser's own `click`
  event dispatch, unlike Angular's directly-bound `(click)`, so the very first settle-check can
  observe the pre-click, already-settled state). `attachSnackBar` stays a plain function (not
  `$()`-wrapped) because Qwik's optimizer can't handle one being referenced from three separate
  `$()` scopes either — the same family of issue documented on `qwik-cdk/overlay/overlay-host.tsx`'s
  `OverlayHost`.
- **Test-harness fix (not this component's business logic):** that same `waitSettled()`-timing
  investigation led to adding a short (50ms) `settleClick()` delay after each click in
  `specs/material-snack-bar/angular-parity.spec.ts`'s `open()`/`dismissByButton()`/
  `dismissByAction()` steps, before the first settle-poll — see that file's header comment for
  the full justification. This doesn't weaken what's asserted (the structural diff stays exactly
  as strict); it only avoids a false-positive "already settled" read before a Qwik click handler
  has had any chance to run.
- `MatSnackBarLabel`/`MatSnackBarActions` ported as polymorphic components (`as="div"|"span"`,
  default `'div'`) rather than attribute directives — matches the `MatListItemAvatar`/
  `MatListItemIcon` precedent (design doc rule 4: a directive the consumer applies to its own
  element becomes a component that renders that host element itself, no extra wrapper).
  `MatSnackBarAction` is a thin wrapper around `MatButton` (reused directly from
  `qwik-material/button`) that adds the two extra classes — both of `SimpleSnackBar`'s and the
  `custom-component` scenario's usages always pair `matSnackBarAction` with `matButton` on the
  same element, and reusing the real `MatButton` keeps its full DOM contract (ripple-loader
  attributes, focus indicator, touch target) instead of risking drift from a hand-rolled button.
- The real `matSnackBarLabel`/`matSnackBarActions`/`matSnackBarAction` selector attributes
  themselves are not rendered (consumer-written directive selectors, not part of the DOM
  contract) — already listed in `CONSUMER_SELECTOR_ATTRS` in
  `qwik-cdk-parity-tests/lib/material-parity.ts` before this port started.

## Class count

Consumer-facing public API surface: **0 exported classes**. All types are `interface`s; all
constructors are `create*` factories. Verified by:

    grep -nE "^export class" src/qwik-material/snack-bar/public-api.ts src/qwik-material/snack-bar/index.ts

## Pipeline

Run `pnpm -C src/qwik-material test` (filter: `snack-bar`) to verify the package, and
`pnpm -C src/qwik-cdk-parity-tests` with `QWIK_URL` pointed at a running preview server to run
`specs/material-snack-bar/angular-parity.spec.ts`.
