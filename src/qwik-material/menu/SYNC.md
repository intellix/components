# qwik-material/menu sync log

Tracks the sync state between this port and `src/material/menu/` upstream.
Companion to `src/qwik-material/tooltip/SYNC.md` (closest architectural precedent) and
`src/qwik-cdk/a11y/SYNC.md` (the new `FocusKeyManager` this port needed).

DOM parity verified against
`src/qwik-cdk-parity-tests/specs/material-menu/angular-parity.spec.ts` (18/18 scenario+root
combinations: basic, positions, overlap-trigger, icons, nested, no-backdrop, panel-class,
aria-label, lazy-content — each run against both `[data-parity-root]` and
`.cdk-overlay-container`), run 3 consecutive times with no flakes, per the 2026-10-27
DOM-parity-remediation design doc. Upstream commit synced: the `menu/` tree as of this repo's
current `src/material/menu/`.

## Upstream sync state

| File | Upstream path | Sync state | Notes |
|------|---------------|------------|-------|
| `scss/menu/menu.scss` | `src/material/menu/menu.scss` | synced with one deviation | `@use '@angular/cdk'` rewritten to `@use '../cdk-stub' as cdk` — same rewrite every other port's SCSS makes |
| `scss/menu/_m2-menu.scss` | `src/material/menu/_m2-menu.scss` | synced | byte-identical copy |
| `scss/menu/_m3-menu.scss` | `src/material/menu/_m3-menu.scss` | synced | byte-identical copy |
| `scss/menu/_menu-theme.scss` | `src/material/menu/_menu-theme.scss` | synced | byte-identical copy |
| `scss/menu/menu-prebuilt.scss` | n/a (qwik-material-specific) | new | `@use './menu'` + `:root` M3 token defaults — see its own doc comment for why these are needed (menu's color/typography tokens resolve to FURTHER `var(--mat-sys-*)` references, not literal fallbacks, unlike most of this stylesheet's other tokens) |
| `scss/core/style/_menu-common.scss` | `src/material/core/style/_menu-common.scss` | synced with one deviation | same `@use '@angular/cdk'` → `cdk-stub` rewrite (used by `item-submenu-icon`'s high-contrast block) |
| `scss/core/style/_button-common.scss` | `src/material/core/style/_button-common.scss` | synced | byte-identical copy (menu items use `button-common.reset`) |

## Mapped TypeScript/TSX files

Not a 1:1 file mapping — upstream's menu is spread across `menu.ts` (`MatMenu` + the
`ng-template` holding content) / `menu-item.ts` / `menu-trigger-base.ts` + `menu-trigger.ts` /
`menu-content.ts` / `menu-panel.ts` (the `MAT_MENU_PANEL` interface). This port reshapes that
around Qwik's constraints (see "Public API" below for why):

- `menu-ref.ts` ← `<mat-menu>` AS DATA: `createMatMenu(props)` builds a `MatMenuRef` — a plain
  object (xPosition/yPosition/overlapTrigger/hasBackdrop/panelClass/aria-*/backdropClass/
  overlayPanelClass + one `content$` QRL) that both `<MatMenuTrigger menu={…}>` and
  `<MatMenuItem menu={…}>` (submenu triggers) consume.
- `mat-menu.tsx` ← `MatMenu`'s HOST ELEMENT ONLY (`menu.html`'s outer `<mat-menu>` tag Angular
  renders at the declaration site — see its own doc comment) + `MatMenuContent` (the
  `matMenuContent` lazy-content extra-`<div>` wrapper, `menu-content.ts`'s `DomPortalOutlet`
  reduced to its one DOM-visible effect).
- `mat-menu-trigger.tsx` ← `MatMenuTrigger` (top-level triggers only) — polymorphic `as` host,
  same pattern as `MatTooltip`.
- `mat-menu-item.tsx` ← `MatMenuItem` (`menu-item.ts` + `menu-item.html`) AND, when given a
  `menu` prop, ALSO `MatMenuTrigger`'s submenu-specific behaviour (`triggersSubmenu()` branches
  of `menu-trigger.ts`/`menu-trigger-base.ts`) — upstream applies `[matMenuTriggerFor]` to the
  SAME element as `[mat-menu-item]` for a submenu trigger, so this port's `MatMenuItem` is the
  one component that needs both halves.
- `menu-runtime.ts` ← `MatMenuTriggerBase._openMenu`/`_destroyMenu`/`_createOverlay`/
  `_getOverlayConfig`/`_setPosition` + `MatMenu._handleKeydown` — free functions (`openMenu`/
  `closeMenu`/`resolveMenuConfig`/`computeHasBackdrop`/`computePositions`/
  `getParentInnerPadding`), same "pulled out of the component body" rationale as
  `tooltip-runtime.ts`'s own doc comment (both `MatMenuTrigger` and `MatMenuItem` need the exact
  same open/close logic).
- `menu-panel.tsx` ← `menu.html`'s `.mat-mdc-menu-panel`/`.mat-mdc-menu-content` + `MatMenu`'s
  `_isAnimating`/`_panelAnimationState`/`_onAnimationStart`/`_onAnimationDone` state machine.
  Rendered via `overlay.create(MenuPanel, props)`, same architecture as
  `qwik-material/tooltip`'s `TooltipPanel`.
- `mat-menu-tokens.ts` ← `MAT_MENU_DEFAULT_OPTIONS` (injection token + DI factory defaults) +
  `MatMenuDefaultOptions`.
- `menu-positions.ts` ← `menu-positions.ts` (verbatim 2-value unions).
- `menu-close-reason.ts` ← `MenuCloseReason` (narrowed to the 3 non-`void` string values this
  port's reason always carries explicitly).

## Public API

```tsx
const vertebrates = createMatMenu({
  content$: $(() => (
    <>
      <MatMenuItem>Fish</MatMenuItem>
      <MatMenuItem>Birds</MatMenuItem>
    </>
  )),
});
const animals = createMatMenu({
  content$: $(() => (
    <>
      <MatMenuItem menu={vertebrates}>Vertebrates</MatMenuItem>
      <MatMenuItem>Invertebrates</MatMenuItem>
    </>
  )),
});

<MatMenuTrigger as="button" menu={animals} aria-label="Open nested menu">
  Animals
</MatMenuTrigger>
<MatMenu />
<MatMenu />
```

`createMatMenu()` is a **plain function call, not JSX** — the Qwik-port equivalent of declaring
`<mat-menu #menu="matMenu">…</mat-menu>` and later referencing `#menu` via
`[matMenuTriggerFor]="menu"`. `<MatMenu>` (used as JSX, self-closing) renders ONLY the empty
placeholder host Angular leaves at the `<mat-menu>` declaration site; `createMatMenu()`'s
returned `MatMenuRef` carries the REAL config (including the lazily-invoked `content$`) and is
passed to whichever `<MatMenuTrigger>`/`<MatMenuItem>` opens it. One field — `panelClass` — is
written on BOTH (`createMatMenu({panelClass: …})` for the real panel, `<MatMenu panelClass={…}
/>` for the placeholder's `class=""` quirk — see mat-menu.tsx) since the placeholder needs to
know it independently of the trigger to decide its own `class=""`-vs-no-`class` rendering; every
other input lives only on `createMatMenu()`'s config.

**Why not a `<MatMenu>` JSX component that takes items as children directly** (closer to
Angular's literal template shape)? Two independent constraints rule it out, both explored and
confirmed in this port's own history:

1. **`<mat-menu>`'s content must render SOMEWHERE OTHER than its own declaration site** (inside
   the overlay, once a trigger opens it) — but ALSO an empty placeholder must render AT the
   declaration site (see mat-menu.tsx's doc comment). A Qwik `component$` cannot read what was
   written inside it at all (`children` is unconditionally stripped from a `component$`'s props
   — confirmed by `qwik-material/grid-list`'s `MatGridList`, the one other component in this
   package that hit this wall and solved it by being a **plain function** instead, which runs
   inline and CAN see its children — see `grid-list/mat-grid-list.tsx`'s header comment). A plain
   function `<MatMenu>` COULD read its children this way, but it still can't move them to a
   different physical subtree — Qwik has no `createPortal`; the only way content ends up rendered
   somewhere other than its JSX call site in this whole codebase is `qwik-cdk/overlay`'s own
   `OverlayHost` mounting a REAL, independent `component$` via `overlay.create(Component, props)`
   (confirmed by `qwik-cdk/portal/dom-portal-outlet.removed.md`: "no Qwik analogue … renders
   portal entries reactively via JSX instead").
2. Given (1), the menu's content must be expressed as a QRL the overlay's panel component can
   invoke on demand — `content$: QRL<() => JSXOutput>` is exactly upstream's own semantics too
   (`<mat-menu>`'s template is a *lone* `<ng-template>`, never rendered until a `TemplatePortal`
   attaches it — this port's `content$()` call, done once per open by `menu-runtime.ts`'s
   `openMenu`, is the direct Qwik analogue of that `TemplatePortal` instantiation).

**Alternative considered and rejected:** passing the ALREADY-BUILT items `JSXOutput` as a plain
(non-`content$`) prop directly on `MatMenuRef`/`<MatMenuTrigger>` — e.g.
`createMatMenu({content: <>…</>})` instead of `content$: $(() => <>…</>)`. Rejected because,
unlike `content$()`'s result (which is only ever produced INSIDE an already-client-side-only
code path — `openMenu` never runs during SSR), a `MatMenuRef` built at a route's top level WOULD
be part of that route's own SSR'd render pass, and nested scenarios (`nested`'s nesting
`vertebrates` inside `animals`'s `content$` closure) would then need a raw `JSXOutput` to survive
Qwik's QRL-closure serialization as a plain (non-`children`) prop crossing into a real
`component$` — untested, higher-risk territory this port didn't need to enter once `content$`
(a QRL — unambiguously safe to capture/serialize, used everywhere else in this codebase already)
turned out to satisfy both constraints above just as well.

## Intentionally not ported / simplified (see inline doc comments for the "why" on each)

- **No `_directDescendantItems` `QueryList` / live content-query.** `menu-runtime.ts`'s
  `FocusKeyManager` is built once, from the panel's RENDERED `.mat-mdc-menu-item` DOM elements,
  the first time the overlay attaches — not from a reactive query that re-derives as children
  change. Nothing in this port adds/removes items from an already-open menu.
- **No `PANELS_TO_TRIGGERS` multi-trigger-per-menu reassignment.** Upstream lets the SAME
  `MatMenuPanel` be opened by more than one trigger, closing whichever trigger currently owns it
  first. No scenario needs one `MatMenuRef` shared by two different `<MatMenuTrigger>`s; `openMenu`'s
  own `if (signals.overlayRef.value) return` guard (per-trigger state) is the only "already open"
  protection.
- **No close-chain cascade through `closed.emit('click'|'tab')` bubbling up to parent menus.**
  Upstream cascades a `'click'`/`'tab'` close reason from a leaf item all the way up through every
  ancestor submenu, dismissing the whole chain when a selection is made deep inside a nested menu.
  This port's menus are independent overlay entries (not nested in the same DOM/component subtree
  the way Angular's `TemplatePortal`s are), so there's no automatic bubbling; only the OTHER
  direction is reproduced — closing/unmounting a PARENT menu cascades down and closes any open
  CHILD submenu, via the submenu-trigger `MatMenuItem`'s own `useVisibleTask$` cleanup (see its
  doc comment) — because no `angular-parity.spec.ts` scenario ever selects a leaf item while a
  nested submenu is open, only the parent-closes-child direction is exercised/needed.
- **No general `_hovered()` stream / "hovering a different item closes any other open
  submenu".** Only the submenu-trigger item's OWN `mouseenter` (open its own submenu) is wired.
  `nested` is the only scenario with more than one potential submenu trigger per level, and it
  only ever has one.
- **Panel position classes (`mat-menu-before/after/above/below`) use the STATICALLY configured
  `xPosition`/`yPosition`**, not the position strategy's resolved connection pair (contrast
  `qwik-material/tooltip`'s `syncPositionClass`, which DOES track the live resolved position).
  Every parity scenario's preferred position always fits the viewport on the first try, so the
  two are always equal in practice; a future scenario that forces a fallback position (e.g. a
  menu pinned to a viewport edge) would need this added.
- **`addItem`/`removeItem`/`classList`/`setElevation`** — all upstream no-ops or deprecated
  aliases already marked `@deprecated` in `menu.ts` itself — not ported.
- **`MatMenuTriggerData`** (data passed to lazily-rendered content) has no equivalent prop: a
  `content$` QRL closure captures whatever data it needs directly (the Qwik-idiomatic shape),
  so there's nothing for a separate "data" channel to carry.
- **`ContextMenuTrigger`** (`context-menu-trigger.ts`, right-click-opens-menu) not ported — a
  separate upstream component from `MatMenuTrigger`, no scenario needs it.
- **No real `FocusMonitor.monitor(el, checkChildren)` engine for item focus classes.** Every
  `MatMenuItem` calls `useFocusOrigin()` on itself instead (the lazy, `useOn()`-based hook
  `qwik-material/button-toggle` established) — functionally equivalent for this port's purposes,
  zero eager JS per item.

## Ripple animation (2026-10-30, `core/ripple/` remediation)

`MatMenuItem`'s static `<div matripple class="mat-ripple mat-mdc-menu-ripple">` container (always
rendered) now also receives real `.mat-ripple-element` spans: `core/ripple/ripple-dom.ts`'s
`handleRippleEvent()` is wired to `onMouseDown$`/`onMouseUp$`/`onMouseLeave$`/`onTouchStart$`/
`onTouchEnd$`/`onTouchCancel$` on the item's own host `<button>` (upstream's
`[matRippleTrigger]="_getHostElement()"`); `onMouseDown$` carries the existing submenu
`handleMouseDown$` alongside the ripple handler via an array (`[handleMouseDown$, rippleEvent$]`
— harmless, since the fix this depends on is about the ripple handler itself seeing `mousedown`
before `mouseup`, unaffected by what else also runs on `mousedown`). See `core/SYNC.md`'s ripple
section for why every ripple-bearing component wires ONE shared `$()` reference to all six
events (a cross-chunk QRL-ordering race, not a style preference).

## Shared `qwik-cdk` additions/fixes this port needed

- **`qwik-cdk/a11y/key-manager/` (new).** `ListKeyManager`/`FocusKeyManager`/`Typeahead` ported
  from `src/cdk/a11y/key-manager/` as factory functions with callback-based (not RxJS)
  subscriptions — see `qwik-cdk/a11y/SYNC.md` for the full write-up, including the `this`-typing
  fix needed so a chained `createFocusKeyManager(items).withWrap().withHomeAndEnd()` keeps
  `setFocusOrigin()` in its static type, and the own-property-shadowing trick that makes
  `setActiveItem`'s focus-on-activate behaviour visible to EVERY internal call site (including
  ones from a later `.withTypeAhead()` chain call).
- **`focusVia()` is NOT safe to call unconditionally on an element nobody's `useFocusOrigin()`
  is watching.** Found restoring focus to a closed menu's TOP-LEVEL trigger (never
  `useFocusOrigin()`-monitored, confirmed live — "plain `.focus()`, no visible class"): calling
  qwik-cdk's `focusVia()` on it wrote a `data-cdk-pending-focus-origin` attribute that nothing
  ever consumes, leaking into the DOM permanently (a real, user-visible DOM diff upstream never
  has). `menu-runtime.ts`'s `openMenu` takes a caller-provided `restoreFocusTo(origin)` instead
  of calling `focusVia()` itself — `MatMenuTrigger` passes a plain `.focus()`, `MatMenuItem`
  (submenu triggers, which DO call `useFocusOrigin()`) passes a real `focusVia()` call. Flagged
  here because any future consumer restoring focus to an UNMONITORED element should do the same.
- **A `disabled="true"`-shaped JSX prop (the `qwik-material/button` `disabledAttr()` trick: cast
  the string `'true'` to `boolean` so the literal string attribute survives instead of the plain
  HTML boolean-attribute empty-string form) only works for SSR-rendered output.** `MatMenuItem`
  is rendered entirely client-side via `overlay.create()`; confirmed live that Qwik's client-side
  DOM patcher reflects the SAME trick as the native boolean property instead (`disabled=""`, not
  `disabled="true"`). Worked around by writing the attribute imperatively
  (`el.setAttribute('disabled', 'true')`) in a `useVisibleTask$` — justified despite rule 7
  ("no per-instance `useVisibleTask$` for interaction plumbing") because a `MatMenuItem` instance
  never exists until a menu has actually been opened; there is no "eagerly downloaded for every
  closed menu on the page" cost to avoid. Any future client-side-only-rendered component that
  needs a literal non-boolean attribute value on a recognized boolean DOM property should expect
  the same gap.

## Final verification

- `specs/material-menu/angular-parity.spec.ts`: 18/18 passing, 3 consecutive runs.
- `specs/material-menu/qwik-only.spec.ts` (new): typeahead letter-key selection,
  `restoreFocus={false}`, `onMenuOpened$`/`onMenuClosed$` — 3/3 passing.
- `menu-runtime.spec.ts`: 17 unit tests over `resolveMenuConfig`/`computeHasBackdrop`/
  `computePositions`/`getParentInnerPadding`.
- No regressions: full `cdk-dialog`, `material-dialog`, `material-bottom-sheet`,
  `material-snack-bar`, `material-tooltip`, `material-badge`, `material-button`,
  `material-button-toggle`, `material-card`, `material-checkbox`, `material-divider`,
  `material-expansion`, `material-form-field`, `material-grid-list`, `material-icon`,
  `material-list`, `material-progress-bar`, `material-progress-spinner`, `material-radio`,
  `material-sidenav`, `material-slide-toggle`, `material-sort`, `material-stepper`,
  `material-tabs`, `material-toolbar` parity/Qwik-only specs re-run green (one isolated
  `material-stepper` timeout under heavy parallel load reproduced as a pass in isolation —
  resource contention, not a regression).
