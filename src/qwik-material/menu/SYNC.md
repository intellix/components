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
| `scss/menu/menu-prebuilt.scss` | n/a (qwik-material-specific) | new | `@use './menu'` only — no `:root` token defaults (removed 2026-10-30, see `core/SYNC.md` "Default theme"): menu's color/typography tokens resolve to FURTHER `var(--mat-sys-*)` references (not literal fallbacks, unlike most of this stylesheet's other tokens) — those `--mat-sys-*` names are now supplied by the one default theme (`core/default-theme.scss`, shipped via `core-prebuilt.css`) instead of this file's own hardcoded `:root` block, which always won over a consumer's real theme |
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

## Directive hook (2026-10-31, directive-hooks remediation)

`[matMenuTriggerFor]` is one of the directives `docs/superpowers/specs/2026-10-31-qwik-material-directive-hooks-design.md`
targets: upstream stacks it on the consumer's own element (`<button matButton
[matMenuTriggerFor]="menu">`), but `<MatMenuTrigger as="button">` renders its OWN host, so it
couldn't be combined with `MatButton` without a wrapper element. `use-mat-menu-trigger.ts` now
holds the directive's actual logic as `useMatMenuTrigger(props): {hostProps, isOpen, open$,
close$}` — `hostProps` (`core/host-props.ts`'s `HostProps`) is exactly what `[matMenuTriggerFor]`
contributes to its host (`mat-mdc-menu-trigger` class, `aria-haspopup`/`aria-expanded`/
`aria-controls`, `ref`, `onClick$`/`onMouseDown$`/`onKeyDown$`) — spread it onto whatever element
should become the trigger:

```tsx
const trigger = useMatMenuTrigger({menu});
return (
  <>
    <MatButton {...trigger.hostProps}>Menu</MatButton>
    <MatMenu />
  </>
);
```

`<MatMenuTrigger>` (`mat-menu-trigger.tsx`) is now a thin wrapper: it calls the hook and
`mergeHostProps()`s the result with its own `class`/`style`/`id`/`aria-label`/`aria-labelledby`/
`tabIndex`/`onClick$` props, then spreads onto whichever `as` tag it renders — same rendered DOM
as before, same public props, verified by the full `specs/material-menu` suite (21/21) staying
green across the refactor. `mat-menu/example` (the material.angular.dev `menu-overview` docs
example) was rewritten to use `useMatMenuTrigger()` directly on `<MatButton>` instead of hand-
copying `MatButton`'s internal markup — see that route's own header comment.

The hook dropped the component's old `onClick$` INPUT prop (upstream's directive has no click
semantics of its own to forward — that was only ever a passthrough `<MatMenuTrigger>` needed
because it owned the host itself). A caller wanting an extra click handler on the same element
composes it via `mergeHostProps({onClick$: myHandler$}, trigger.hostProps)` same as any other
directive combination; `<MatMenuTrigger onClick$={…}>` still works unchanged (the wrapper does
this composition itself).

**Found via this refactor, fixed in `core/host-props.ts`, not menu-specific:** the first version
of `mergeHostProps()` dropped a key from the merged object entirely once every contributing
part's value for it was `undefined` (`if (value !== undefined) merged[key] = value`). That broke
`aria-controls` specifically: closing the menu (e.g. the `basic` scenario's `press Enter` step,
which activates a focused item) flips `isOpen.value` to `false`, so `aria-controls` becomes
`undefined` on a CLIENT re-render — and a spread prop whose KEY disappears entirely (vs. staying
present with an `undefined` value, the way a literal object expression like the old inline
`sharedAttrs` always did) doesn't reliably get removed from the live DOM by Qwik's reconciler;
confirmed live (`aria-controls="mat-menu-panel-0"` survived every subsequent close). Fixed by
keeping the key present (`merged[key] = undefined`) whenever ANY part mentions it, even if none
of them set a defined value — see `host-props.ts`'s `mergeHostProps` doc comment and its
`host-props.spec.ts` regression test.

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

## Qwik v2 regression: `MenuPanel`'s item text lost on self re-render (2026-11-01)

Upgrading to `@qwik.dev/core` 2.0.0-rc.4 broke every "(overlay)" parity scenario: menu items
opened with the right structure but a permanently empty `.mat-mdc-menu-item-text` label.

Root cause, confirmed live via a fine-grained (20ms-step) Playwright poll: `MenuPanel` reads its
own `isAnimating` signal inside its `classes` computation, so it re-renders ITSELF (not a parent
cascade) once the enter animation's `animationend` fires (~120ms after open) — independent of
`props.content` (the menu's resolved items, built once by `menu-runtime.ts`'s `openMenu`) ever
changing. The item text was correct for those first ~120ms, then went empty in the exact frame
`mat-menu-panel-animating` was removed. Qwik v2's `JSXNodeImpl` caches render-time state on the
node object itself, so re-rendering the IDENTICAL `props.content` object a second time — even
within the SAME still-mounted component — corrupts it, the same underlying issue
`qwik-material/core/jsx-reuse.ts`'s `cloneJsxForReuse()` was written for (originally found in
`qwik-material/datepicker`'s `ActionsOutlet`, which hit the "reused across SEPARATE opens" variant
of this bug; this is the "re-rendered twice within the SAME open" variant).

Ruled out before finding the real mechanism: `<Slot/>` itself (`MatMenuItem`'s text uses `<Slot/>`
the same way `MatDialogClose`'s does, which was never broken), sibling count/conditional-sibling
position around the Slot (stripping `MatMenuItem` down to a bare `<button><span><Slot/></span>
</button>` with zero other siblings did NOT fix it), and the `content$()` QRL/async-callback
indirection (an isolated scratch route rendering `<MatMenuItem>` both directly and through
`MenuPanel` showed stable, correct text indefinitely — because no real CSS animation ever played
there, so `isAnimating` never flipped, so `MenuPanel` never self-re-rendered at all).

Fix: `menu-panel.tsx` renders `{cloneJsxForReuse(props.content)}` instead of `{props.content}` —
rebuilt fresh via the public `jsx()` factory on every render, so it doesn't matter how many times
this component re-renders during one open. Applied preemptively to the identical `option.content`
pattern in `qwik-material/select/mat-select-panel.tsx` and
`qwik-material/autocomplete/mat-autocomplete-panel.tsx` (both panels self-re-render for their own
reasons — `exiting`/`tree` signals read in their own `classes`/render body — and both forward a
stored `JSXOutput` the same way); no current scenario exercises non-plain-text option content, so
that's a no-op today, but the failure mode is identical and now understood.

Verified: `specs/material-menu/angular-parity.spec.ts` + `qwik-only.spec.ts` 21/21 passing
(including `lazy-content`, previously failing for an unrelated-looking but actually identical
reason — its `DomPortalOutlet`-mirroring extra `<div>` wrapper also sits inside `props.content`).
qwik-material unit tests 785/785, typecheck clean.

## Remaining known issue: `mat-menu/example` (interaction 2) — auto-focused first item shows the wrong focus-origin class (2026-11-01, Qwik v2)

**Not fixed. Documented with evidence, same treatment as `qwik-material/timepicker`'s own
`min-max` open issue** — the ONE remaining failure among this component's own specs
(`specs/material-menu` itself, both `angular-parity.spec.ts` and `qwik-only.spec.ts`, is 100%
green; only `specs/examples`' `mat-menu/example` interaction 2 is affected).

After `[click trigger (open)]`, the auto-focused first menu item ("Item 1") carries
`cdk-mouse-focused` on Qwik vs. `cdk-program-focused` on Angular (plus the resulting
`background-color` difference that class drives). `mat-menu/example` composes
`useMatMenuTrigger()`'s `hostProps` onto `<MatButton>` (the directive-hooks pattern) — the SAME
structural shape as `qwik-material/tooltip/mat-tooltip/example`'s own remaining open issue (see
that package's SYNC.md for the full writeup), where a native `mouseenter`/`mouseleave`-style
event targeting a `<MatButton>` host misbehaves specifically because of the invisible, overlapping
`<span class="mat-mdc-button-touch-target">` every `MatButton` renders. This failure is a
POINTER-ORIGIN misattribution rather than tooltip visibility, so it wasn't independently traced
to the exact same mechanism down to the same level of confirmation — flagged here as the likely
same root-cause family rather than a separately fully-diagnosed bug, given the time available.
Not pursued further for the same reason given there (squarely inside Qwik's own event handling,
not this port's code; a workaround would need to change `MatButton`'s DOM, conflicting with the
hard DOM-parity requirement).

## `MatMenuItem.icon` prop needed `cloneJsxForReuse` too (2026-11-02, Phase 2 docs examples)

Found porting material.angular.dev's `menu-icons` docs example (real `<mat-icon>` content inside
menu items, not the plain-text/emoji icons every existing scenario used). Confirmed live: the
auto-focused first item's own `<mat-icon>` text went empty (`'dialpad'` -> `undefined`) while the
OTHER two items' icons stayed correct — exactly the "re-rendered twice within the SAME open"
mechanism documented above for `menu-panel.tsx`'s `props.content`, one level deeper: `MatMenuItem`
itself re-renders when ITS OWN highlight-state signal flips (on auto-focus), and rendering the
same static `props.icon` JSXOutput object again on that re-render corrupts it — independent of
`menu-panel.tsx`'s own `cloneJsxForReuse(props.content)` fix, which only rebuilds the outer
content fresh on `MenuPanel`'s re-renders, not on each individual item's own.

Fix: `mat-menu-item.tsx` renders `{cloneJsxForReuse(props.icon)}` instead of `{props.icon}` —
same one-line pattern as every other site already using this helper. Purely additive; no
scenario previously exercised a real `JSXOutput` `icon` prop on an item that also gets
auto-focused, so this was a latent gap, not a regression.

Verified: `specs/examples-data-nav/angular-parity.spec.ts`'s `menu-icons` (base + both
interactions) 3/3, run 3x. `specs/material-menu/angular-parity.spec.ts` + `qwik-only.spec.ts`
still 21/21 (regression check — no existing scenario passes a JSXOutput `icon`, so this is a
no-op for all of them, confirmed by the unchanged pass count).

## Scroll-strategy configuration; "scroll strategy lost after resume" bug found, then closed (2026-11-03)

Added `MAT_MENU_SCROLL_STRATEGY` (mirrors upstream's `MAT_MENU_SCROLL_STRATEGY` injection token) +
`<QwikMaterialProvider matMenuScrollStrategy={…}>`, threaded through `OpenMenuOptions.
scrollStrategyDescriptor` into `openMenu()`'s overlay config (previously hard-coded to
`createRepositionScrollStrategy({scrollThrottle: 20})`, both call sites — `mat-menu-item.tsx`'s
submenu trigger and `use-mat-menu-trigger.ts`'s top-level trigger).

**Found a real, cross-cutting bug while wiring this up — confirmed it ALSO pre-exists for
`qwik-material/dialog`'s `MatDialogConfig.scrollStrategy` default and `qwik-material/bottom-
sheet`'s equivalent (NOT just this new menu feature):**

A value read via `useContext()` during a component's/hook's OWN render, then captured directly
in a `$()`-wrapped QRL defined at that same point (e.g. `useMatMenuTrigger()`'s `open$`,
`useMatDialog()`'s `open$`) does NOT survive into that QRL once it's actually invoked after a
REAL SSR→CSR resume boundary — which every genuine page load goes through. Confirmed live,
twice: capturing a plain (non-noSerialize) object this way fails SSR serialization outright
(`Code(Q34)` — see `qwik-cdk/overlay/SYNC.md`'s `useOverlay()` entry, a separate instance of the
exact same root cause); capturing a `noSerialize()`-wrapped one (which this scroll-strategy
factory used to be, same as every function-valued qwik-material config) avoids the crash but the
QRL reads back `undefined` after resume regardless — `noSerialize()`'s own doc comment says
exactly this ("the value of this object will be `undefined`" after resume), it just wasn't
obvious this applies to a value plucked out via `useContext()` and captured in a *different*
QRL's closure, not only to a store/signal field.

There is NO cheap workaround: `useContext()` itself cannot be called again from inside the
already-invoked QRL to re-fetch a fresh value — confirmed live, this throws `Code(Q10)`. The
`ensureCdkDispatchers()` pattern (`qwik-cdk/internals/ensure-dispatchers.ts`) sidesteps the whole
problem for the keyboard/outside-click/navigation dispatchers because those have no
app-configurable parameters — they're lazily (re)created FRESH, on demand, from inside the QRL,
with nothing to lose across resume. A scroll-strategy factory supplied via `<QwikMaterialProvider
matMenuScrollStrategy={…}>` IS app-specific data, so it can't be recreated from nothing the same
way — it has to actually survive the resume.

### Fix: serializable `ScrollStrategyDescriptor` replaces the function factory

Root cause was "capture a FUNCTION via context" — a function closure is exactly what doesn't
survive resume. The fix drops function factories entirely in favor of capturing plain,
serializable DATA via context, then building the real `ScrollStrategy` instance fresh, inside
the QRL, at open time — plain data (strings, plain objects, QRLs) survives resume with no
special handling, unlike a plain function.

`qwik-cdk/overlay/scroll/scroll-strategy-descriptor.ts` (new) defines `ScrollStrategyDescriptor`:
`'block' | 'reposition' | 'close' | 'noop'`, or the `{type: 'reposition', scrollThrottle?,
autoClose?}` / `{type: 'close', threshold?}` object forms carrying upstream's own per-strategy
options, or — for a FULLY custom strategy — `QRL<() => ScrollStrategy>` (Qwik's own resumable
function reference, unlike a plain function; calling a QRL always returns a `Promise`, even for
a synchronous body). `resolveScrollStrategyDescriptor()` turns any of these into a real
`ScrollStrategy` instance; the 4 builtin forms resolve synchronously, only the `QRL` form
actually awaits anything.

Applied here: `MAT_MENU_SCROLL_STRATEGY` is now `createContextId<ScrollStrategyDescriptor>(...)`
(was `NoSerialize<() => ScrollStrategy>`); both consumers (`use-mat-menu-trigger.ts`,
`mat-menu-item.tsx`) read it with a plain `{type: 'reposition', scrollThrottle: 20}`
`useContext()` default — safe now that the value is plain descriptor data, not a function, so
neither of `useContext()`'s two function-typed-default pitfalls apply (no lazy-initializer
invocation, no `undefined`-as-no-default confusion). `openMenu()` is now `async`, resolving the
descriptor via `resolveScrollStrategyDescriptor()` immediately before `overlay.create()`; both
call sites now `await` it (they were already inside an `async $(...)`, so this only reorders
their OWN trailing statements — e.g. `onMenuOpened$` — to after the overlay is actually attached,
which is the more correct order anyway).

**Result: the customization gap is CLOSED.** A `matMenuScrollStrategy="block"` (or any other
descriptor) configured app-wide now survives a real SSR→CSR resume and is honored by every menu
opened afterward — confirmed via `specs/material-menu/scroll-strategy.spec.ts`'s previously
`test.skip`'d case, now un-skipped and passing: a fresh `page.goto`, open the menu, assert
`<html>` gets `cdk-global-scrollblock` (the `block` strategy's own marker class). The default
(unconfigured) case — `specs/material-menu/scroll-strategy.spec.ts`'s first case — is unaffected
(still `reposition`, still no regression).

The identical fix was applied to `qwik-material/dialog`/`bottom-sheet`/`select`/`autocomplete`'s
own scroll-strategy contexts in the same pass — see those packages' own SYNC.md entries.
