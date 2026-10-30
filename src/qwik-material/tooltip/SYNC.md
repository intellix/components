# qwik-material/tooltip sync log

Tracks the sync state between this port and `src/material/tooltip/` upstream.

Last synced from angular/components commit: the commit this branch (`port/tooltip`) forked from.

## Upstream sync state

| File | Upstream path | Sync state | Notes |
|------|---------------|------------|-------|
| `scss/tooltip/tooltip.scss` | `src/material/tooltip/tooltip.scss` | synced | byte-identical copy (no `@angular/cdk` import to swap — only local `./m3-tooltip` / `../core/tokens/token-utils`) |
| `scss/tooltip/_m2-tooltip.scss` | `src/material/tooltip/_m2-tooltip.scss` | synced | byte-identical copy |
| `scss/tooltip/_m3-tooltip.scss` | `src/material/tooltip/_m3-tooltip.scss` | synced | byte-identical copy |
| `scss/tooltip/_tooltip-theme.scss` | `src/material/tooltip/_tooltip-theme.scss` | synced | byte-identical copy |
| `scss/tooltip/tooltip-prebuilt.scss` | n/a (qwik-material-specific) | new | `@use './tooltip'` only — no `:root` token defaults (removed 2026-10-30, see core/SYNC.md "Default theme"): every `--mat-tooltip-*` token already resolves through a `token-utils.slot(..., var(--mat-sys-*))` fallback chain baked in at Sass-compile time. The one default theme now ships from `core/default-theme.scss` via `core-prebuilt.css`. |

## Mapped TypeScript/TSX files

Not a 1:1 file mapping — upstream's single `tooltip.ts` (1180 LOC: the `MatTooltip` directive +
`TooltipComponent`) is split across several files for this port's different architecture:

- `mat-tooltip.tsx` ← `MatTooltip` (the `[matTooltip]` directive) — props, host rendering,
  `useFocusOrigin()`/`useOn()` wiring for hover/focus/touch/wheel.
- `tooltip-panel.tsx` ← `TooltipComponent` (the floating panel's template + show/hide-animation
  bookkeeping it owns).
- `tooltip-runtime.ts` ← `MatTooltip.show()`/`hide()`/`_createOverlay()`/`_detach()` — pulled out
  into free (non-closure) functions; see its own doc comment for why (Qwik's optimizer can't
  reliably capture a plain local closure across a `$()` boundary — same family of issue as
  `qwik-cdk/overlay/overlay-host.tsx`'s and `qwik-material/snack-bar/mat-snack-bar.tsx`'s own doc
  comments; `MatTooltip` has five call sites needing this logic — mouseenter, touchstart, the
  keyboard-focus task, Escape, outside-click — so it's centralized here instead of duplicated).
- `tooltip-position.ts` ← `MatTooltip._getOrigin`/`_getOverlayPosition`/`_addOffset`/
  `_invertPosition`/`_updateCurrentPositionClass`'s pure math, as standalone (and unit-tested)
  functions.
- `mat-tooltip-tokens.ts` ← `MAT_TOOLTIP_DEFAULT_OPTIONS` (the injection token + its DI factory's
  hardcoded defaults) + `MatTooltipDefaultOptions`.

## Public API

`<MatTooltip>` is a **component**, not a directive — see the design-doc rule (§5 rule 4,
restated in `mat-tooltip.tsx`'s own doc comment) that every directive Angular attaches to a
*consumer's own element* (`matBadge`, `matListItemAvatar`, …) becomes, in this port, a component
that renders that element itself via a polymorphic `as` prop — the same pattern `MatBadge`/
`MatListItem` already use. `matTooltip` is exactly that kind of directive (it never introduces a
wrapper), so:

```tsx
<MatTooltip as="button" message="Info about the action" position="above">
  Action
</MatTooltip>
```

renders a single `<button>` — no `<MatTooltip>` element of its own ever appears in the DOM.

**Alternative considered and rejected:** a `useMatTooltip(props)` hook returning spreadable props
(`{...useMatTooltip({message: '…'})}`) on the consumer's own JSX element. Rejected because Qwik's
`useOn()` (used for all of hover/focus/touch/wheel, kept lazy per design-doc rule 7) attaches to
*the calling component's own rendered root* — a hook called from inside the ROUTE's/consumer's
component would attach its listeners to whatever THAT component renders as a whole, not
specifically to the one element the hook's caller intends as the trigger, unless that consumer
component's entire render output IS the trigger element (at which point it's simplest for
`MatTooltip` to just be that component, i.e. the `as`-prop shape above).

Props mirror upstream's inputs 1:1 (`message` ← `[matTooltip]`, `position` ←
`[matTooltipPosition]`, `positionAtOrigin`, `disabled`, `showDelay`, `hideDelay`, `touchGestures`,
`tooltipClass`), plus the native pass-through props every polymorphic-host component in this port
accepts (`class`, `style`, `id`, `role`, `aria-*`, `tabIndex`, `href`, `type`, `onClick$`) and one
tooltip-specific addition, `onKeyDown$` — forwarded onto the host for the same reason
`MatListItem.onClick$` exists (upstream lets the consumer attach arbitrary extra listeners
directly on their own templated element; a `component$` that renders the host itself has no other
way to accept that). `MAT_TOOLTIP_DEFAULT_OPTIONS` is provided via
`<QwikMaterialProvider matTooltipDefaults={…}>`, same pattern as every other per-component config.

## Intentionally not ported / simplified (see inline doc comments for the "why" on each)

- **No real `AriaDescriber`.** `aria-describedby="cdk-describedby-message-N"` is rendered (via the
  same module-level `createIdGenerator()` singleton `MatBadge` already uses), but the actual
  hidden `cdk-describedby-message-container` + per-message `<div role="tooltip">` upstream's
  `AriaDescriber` creates in `document.body` is not — same simplification `MatBadge` made first.
  The parity harness's own normalization (`cdk-describedby-host` fully ignored; `aria-describedby`
  normalized by prefix, not exact value) means this is invisible to every parity scenario; a real
  app wanting the full hidden-description-element semantics would need a proper `AriaDescriber`
  port, which nothing has needed yet.
- **No `Platform.IOS`/`Platform.ANDROID` touch detection.** `isTouchPlatform()` defaults to
  "non-touch" unless `MAT_TOOLTIP_DEFAULT_OPTIONS.detectHoverCapability` opts into the
  `any-hover` media query (or a custom function) — matching upstream's OWN confirmed-live
  behaviour under Chromium (`touchGestures` never produces any DOM difference there regardless of
  this port's detection, since `_isTouchPlatform()` is false either way — see
  `angular-parity.spec.ts`'s header note). `_disableNativeGesturesIfNecessary()`'s inline-style
  mutations (`userSelect`/`webkitUserDrag`/`touchAction`/…) are not ported at all — they only run
  on the touch path, never exercised by any scenario.
- **Always creates a fresh `OverlayRef` per show(), instead of reusing one across repeated shows
  of the same (non-`positionAtOrigin`) trigger.** Upstream's `_createOverlay()` reuses the
  existing `OverlayRef` across show/hide cycles so `cdk-overlay-N`'s id is stable; this port's
  simplified `qwik-cdk` `OverlayRef` has no "reattach a previously-detached ref" capability (see
  `overlay-ref.ts`), and the parity harness normalizes every id's digits away regardless, so a new
  id each time is DOM-invisible. A hypothetical future consumer that shows/hides the SAME
  (non-origin-tracking) tooltip many times in quick succession would recreate the overlay each
  time instead of reusing it — a perf nuance, not a correctness one.
- **`_closeOnInteraction` simplified away.** Upstream only starts responding to outside clicks
  once the SHOW animation has actually finished (`_finalizeAnimation(true)` sets the flag); this
  port's outside-click handler (`tooltip-runtime.ts`'s `showTooltip()`) is wired as soon as the
  overlay is created, with no equivalent gate. No scenario clicks anywhere while a tooltip's show
  animation is still mid-flight, so this is unobserved in the parity suite; documented as a known
  gap rather than ported faithfully, since replicating it needs a real `animationend`-driven state
  machine shared between `mat-tooltip.tsx` and `tooltip-panel.tsx` for a behaviour nothing
  currently exercises.
- **`_isMultiline` hardcoded `false`.** Upstream computes it via a `getBoundingClientRect()` check
  once shown. Confirmed live against the Angular reference app that NO parity scenario — including
  `message-change`'s deliberately-longer replacement text — ever actually produces
  `mdc-tooltip--multiline`, so it's not computed at all here.
- **No scroll-container tracking.** Upstream's `_createOverlay()` calls
  `ScrollDispatcher.getAncestorScrollContainers()` and feeds the result to
  `withScrollableContainers()`, so a parent scrollable clipping the tooltip can close it. This
  port has no `ScrollDispatcher`; `withScrollableContainers()` is simply never called, so
  `isOverlayClipped` is always `false` and that auto-close path never fires. No scenario scrolls a
  container the tooltip is clipped by.
- **No imperative ref / `exportAs="matTooltip"` equivalent.** Upstream lets a template grab
  `#t="matTooltip"` and call `t.show()`/`t.hide()`/`t.toggle()` directly. Every parity scenario
  drives the tooltip purely through real hover/focus/keyboard interactions, so no such escape
  hatch is exposed yet; `showTooltip`/`hideTooltip` (`tooltip-runtime.ts`) are exported from the
  package's public API for a future caller that needs one, but `mat-tooltip.tsx` doesn't expose
  them itself.

## Shared `qwik-cdk` fixes this port needed (see `qwik-cdk/overlay/SYNC.md` and
`qwik-cdk/a11y/SYNC.md` for the full write-ups)

`MatTooltip` is the first consumer to exercise `FlexibleConnectedPositionStrategy` end-to-end in a
real browser (dialog/snack-bar/bottom-sheet all use `GlobalPositionStrategy`) and the first to
combine hover with a bare scripted `.focus()` call in one scenario. Both surfaced real,
previously-latent bugs in shared infrastructure, not tooltip-specific workarounds:

- `OverlayRef.addPanelClass`/`removePanelClass` called after `OverlayHost` had already mounted
  silently didn't re-render (panel classes stored in a plain, non-reactive `{value}` carrier) —
  fixed by giving `OverlayHost` a real signal for them, mirroring the existing
  `backdropShowing`/`backdropDetached` fix.
- `useOn()` event handlers must resolve `event.target`, never `event.currentTarget` — the latter
  is reset to `null` by the DOM once synchronous dispatch completes, and Qwik's lazy QRL
  resolution (at least one microtask, even for an already-cached chunk) means a handler reading
  `event.currentTarget` sees `null` by the time it actually runs. This silently fed `null` into
  `FlexibleConnectedPositionStrategy`'s origin, crashing the first `apply()`. (Fixed locally in
  `mat-tooltip.tsx`; flagged here because it's a trap any future `useOn()` consumer could hit.)
- `useFocusOrigin()`'s keyboard-vs-program heuristic — reworked twice to fix a real bug this
  port's `message-change` scenario caught without regressing the real-Tab-navigation case every
  existing consumer already depends on. Full writeup in `qwik-cdk/a11y/SYNC.md`.
- `FlexibleConnectedPositionStrategy`/`PositionStrategy.getPopoverInsertionPoint()`'s popover
  insertion-point support was defined but never wired into `OverlayHost` — added (with unit tests)
  as shared infrastructure for the upcoming select/autocomplete/datepicker ports, even though no
  tooltip scenario needs a non-`'global'` location. Full writeup in `qwik-cdk/overlay/SYNC.md`.
