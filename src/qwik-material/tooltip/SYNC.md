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

**UPDATE (2026-10-31, directive-hooks remediation) — superseded.** The note above rejected a
`useMatTooltip()` hook because `useOn()` attaches to "the calling component's own rendered root,"
which isn't reliably the right element once a hook is spread onto a DIFFERENT host component
(`<MatButton {...tip.hostProps}>`). That blocker is gone: `use-mat-tooltip.ts` now implements
`useMatTooltip(props): {hostProps}` WITHOUT using `useOn()`/`useFocusOrigin()` at all — every
listener (`mouseenter`/`mouseleave`/`wheel`/`touchstart`/`touchend`/`touchcancel`/`pointerdown`/
`focusin`/`focusout`) is returned as a plain JSX handler prop in `hostProps`
(`core/host-props.ts`), which Qwik threads through component layers unambiguously, the same
contract `class`/`onClick$` already rely on. `<MatTooltip>` is now a thin wrapper around this
hook (same rendered DOM, same public props — verified by the full `specs/material-tooltip` suite,
19/19, staying green across the refactor). See `core/host-props.ts` and
`docs/superpowers/specs/2026-10-31-qwik-material-directive-hooks-design.md` for the full
rationale, and `use-mat-tooltip.ts`'s own doc comment for exactly which parts of
`useFocusOrigin()`'s algorithm are reproduced (identically) rather than reused by reference.

```tsx
const tip = useMatTooltip({message: 'Info about the action', position: 'above'});
return <MatButton appearance="elevated" {...tip.hostProps}>Action</MatButton>;
```

**Load-bearing gotcha found porting this:** `<MatTooltip>`'s wrapper passes its OWN `props`
object straight into `useMatTooltip(props)`, NOT a rebuilt `{message: props.message, ...}`
literal. `useMatTooltip()`'s internal `useTask$`s `track()` live changes to `message`/`disabled`
(e.g. the `message-change` scenario's route swapping `message` on a keydown) — `track()` only
establishes a subscription by reading through Qwik's OWN reactive props proxy; a brand-new plain
object rebuilt from its fields every render is NOT that proxy, so tracking a field on it is a
silent no-op (the task runs once on mount and never again). Confirmed live: `message-change`'s
panel text stayed stuck on the original message forever with the rebuilt-object version, despite
`<MatTooltip>`'s OWN `props.message` updating correctly every render. `MatTooltipProps` is a
structural superset of `UseMatTooltipProps`'s fields (identical names/types), so passing `props`
straight through satisfies the hook's parameter type with no cast — this applies to any FUTURE
host component wrapping a directive hook that has its own `useTask$`-driven reactivity, not just
`MatTooltip`.

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

## Remaining known issue: `mat-tooltip/example`'s `onMouseEnter$` never fires when composed via `useMatTooltip()` onto `<MatButton>` (2026-11-01, Qwik v2)

**Not fixed. Documented here with evidence, same treatment as `qwik-material/timepicker`'s own
`min-max` open issue** — this is the ONE remaining failure among this component's own specs
(`specs/material-tooltip` itself is 100% green; only `specs/examples`' `mat-tooltip/example`
interactions 1 and 2 are affected).

`mat-tooltip/example` (`src/qwik-cdk-dev-app/src/routes/mat-tooltip/example/index.tsx`) spreads
`useMatTooltip()`'s `hostProps` onto `<MatButton appearance="elevated">` — the directive-hooks
composition pattern (`README.md`), proven elsewhere and unrelated to the bug. Hovering the
resulting button never shows the tooltip (`page.waitForFunction` for `.mat-mdc-tooltip-show`
times out at 5s, confirmed up to several seconds with a standalone script); the Angular
reference, same scenario, shows it within ~100ms.

Root cause, confirmed live via a temporary `console.log` inside `handleMouseEnter$`
(`use-mat-tooltip.ts`) plus native capture-phase `mouseover`/`mouseenter` listeners added via
`page.evaluate`: the real browser DOES dispatch a `mouseenter` to the `<button>` element itself
(confirmed: a document-level capture listener saw `target=BUTTON...mat-mdc-tooltip-trigger`),
and the button DOES carry the right `q-e:mouseenter="..."` attribute — but Qwik's own event
delegation never invokes `handleMouseEnter$` for it. The same hook, spread onto a BARE
`<button>` (`specs/material-tooltip/basic`, no `MatButton` wrapper), fires correctly every time.
The one structural difference: `MatButton` always renders an invisible
`<span class="mat-mdc-button-touch-target">` INSIDE the button, overlapping its visible content
area (the MDC "touch target" pattern, needed for its own DOM parity) — a native
`mouseover`/`mouseenter` trace confirmed the pointer transitions through BODY → the containing
`<div>`/custom element → the `<button>` → that `<span>`, each getting its own non-bubbling
`mouseenter`. `mouseenter`/`mouseleave` don't bubble, so Qwik's event delegation (which,
unlike bubbling events, can't just listen once at a high ancestor and walk up from
`event.target`) must synthesize them some other way — and that synthesis appears to break
specifically when a DIFFERENT, listener-less descendant element (the touch-target span)
overlaps the one that DOES have a `q-e:mouseenter` handler. `mat-menu/example`'s own remaining
failure (interaction 2: `cdk-mouse-focused` vs `cdk-program-focused` on the auto-focused first
item — see `qwik-material/menu/SYNC.md`) is the same `<MatButton>`-touch-target composition
and may well be the same underlying class of bug, affecting pointer-origin attribution instead
of tooltip visibility, though this wasn't separately confirmed down to the same level of detail.

Not pursued further in the time available: this is squarely inside Qwik's own qwikloader event
delegation, not this port's application code, and safely reproducing/patching it would need
either a Qwik core fix or a workaround that changes `MatButton`'s rendered DOM (removing/
restructuring the touch-target span), which would itself break the hard DOM-parity requirement
this port exists to satisfy. A workaround confined to `use-mat-tooltip.ts` (e.g. switching to
`onPointerOver$`/`onMouseOver$`, which DO bubble, with manual enter/leave bookkeeping) was
considered but not attempted — real behavior risk (every sub-element transition inside the
button re-fires `mouseover`) for a fix whose root cause lives one layer further down than this
port's own code, within the time remaining.

## Fixed: tooltips with a show delay only showed on the first hover (2026-11-04)

The trigger's `everShown` flag (which picks the show/hide animation class) was never reset, so the
pane created on a later hover rendered with the hide-animation class straight away and detached
when that animation ended, before any `showDelay` longer than the ~85ms hide animation elapsed.
Upstream attaches a fresh `TooltipComponent` per show, so its state always starts clean;
`showTooltip()` now resets `everShown` with the rest of the per-pane state. Guarded by
`specs/material-tooltip/repeat-show-delay.spec.ts` (three hovers, `showDelay: 300`). Verified
against the Angular reference: `tooltip-delay` (1000/2000ms) shows and hides on both hovers within
~20ms of Angular.

