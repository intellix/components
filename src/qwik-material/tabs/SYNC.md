# qwik-material/tabs sync log

Tracks the sync state between this port and `src/material/tabs/` upstream.
Every deviation from a verbatim copy is recorded here. Companion to
`src/qwik-material/dialog/SYNC.md`, `src/qwik-material/button/SYNC.md`,
`src/qwik-material/card/SYNC.md`, `src/qwik-material/toolbar/SYNC.md`,
`src/qwik-material/badge/SYNC.md`, `src/qwik-material/icon/SYNC.md`,
`src/qwik-material/progress-bar/SYNC.md`,
`src/qwik-material/progress-spinner/SYNC.md`,
`src/qwik-material/divider/SYNC.md`, `src/qwik-material/grid-list/SYNC.md`,
`src/qwik-material/list/SYNC.md`, `src/qwik-material/button-toggle/SYNC.md`,
`src/qwik-material/slide-toggle/SYNC.md`, `src/qwik-material/expansion/SYNC.md`,
`src/qwik-material/radio/SYNC.md`, `src/qwik-material/checkbox/SYNC.md`, and
`src/qwik-material/core/SYNC.md`.

Ported 2026-10-28 against upstream, following
`docs/superpowers/specs/2026-10-27-qwik-material-dom-parity-remediation-design.md`.
Gated from the start by `specs/material-tabs/angular-parity.spec.ts`
(12/12 scenarios passing — basic, selected-index-initial, disabled-tab,
custom-label, lazy-content, preserve-content, align, header-below,
dynamic-height, pagination, nav-bar, aria-label — run 3× clean).

## 2026-11-02 rebaseline to v21.2.14 (8fe4d6a8ffcf)

Upstream split one `--mat-tab-animation-duration` CSS custom property
into `--mat-tab-body-animation-duration` + `--mat-tab-header-
animation-duration` (and added a `{body, header}` object form to
`MatTabGroup.animationDuration`) after v21.2.14 — this port had
already picked up the new var names (though not the new object-typed
input) from the 22.1-next base it was built against. Reverted
`mat-tab-group.tsx`/`mat-tab-nav.tsx` to set/read the single
v21.2.14 var name, resynced `_tabs-common.scss`/`tab-body.scss` to
match, and updated every doc comment/test description naming the old
split vars (including the Playwright parity spec's documented DOM
baseline). No other deviation found; `tab-group.html`'s only other
upstream diff (`_bodyAnimationsDisabled()`/`_animationsDisabled()`
renaming an internal method) has no DOM effect.

## Upstream sync state

| File | Upstream path | Sync state | Notes |
| --- | --- | --- | --- |
| `tabs/mat-tab-group.tsx` | `src/material/tabs/tab-group.ts` (`MatTabGroup`) + `tab-group.html` + `tab-header.ts`/`.html` (`MatTabHeader`) + `paginated-tab-header.ts` (`MatPaginatedTabHeader`) | ported | One component combining the group, header and paginated-header base class — upstream splits these into three `@docs-private` classes, but nothing in the public API or DOM contract requires that split in Qwik. Takes a `tabs: MatTabDef[]` data prop instead of nested `<MatTab>` children (see that interface's own doc comment for why — Qwik has no `@ContentChildren` and can't read a `<Slot>`'s children's props during SSR, the same underlying constraint `qwik-material/list` hit in a narrower form). Controlled component: `selectedIndex` + `onSelectedIndexChange$` (+ `onFocusChange$`). Renders the ink-bar `<span class="mdc-tab-indicator">` statically per label (see `mat-tab-label.tsx`) instead of mirroring `InkBarItem`'s imperative `document.createElement` — deterministic and always present (parity spec note 2), and the FLIP-animation transform is skipped entirely (synchronous within one click handler, never observable at any snapshot — same note). `mat-align-tabs` reflected as a literal host attribute only when `alignTabs` is set (note 7); `--mat-tab-body-animation-duration`/`--mat-tab-header-animation-duration` always both set (unlike `MatTabNav` — note 10) |
| `tabs/mat-tab-label.tsx` (`MatTabLabelItem`, internal) | `tab-header.html`'s `@for` body + `MatTabLabelWrapper` (`tab-label-wrapper.ts`) + `CdkMonitorElementFocus`/`InkBarItem` | ported | Not exported. One `.mdc-tab` div per tab, rendered by `MatTabGroup` from its `tabs` prop. `mattablabelwrapper`/`cdkmonitorelementfocus` attributes reproduced literally (Material's own template directives, not consumer-written — unlike `mat-ripple`'s category but handled the same way: a literal attribute via the established `{...({'attr': ''} as Record<string,string>)}` cast). Focus classes via `useFocusOrigin()`. Click handler reads the element via the handler's SECOND parameter (`(event, element) => …`), not `event.currentTarget` — see "Deviations" #2 |
| `tabs/mat-tab-body.tsx` (`MatTabBodyItem`, internal) | `tab-body.ts` (`MatTabBody`/`MatTabBodyPortal`) + `tab-body.html` | ported | Not exported. Content attach/detach (parity note 3): a tab's `content` prop only renders once `position === 0` (centered) for the first time, and is removed again on leaving unless `preserveContent` — implemented as a plain conditional, no portal needed. No separate "lazy content" prop (see "Deviations" #1 for why `lazyContent$` was tried and removed). Every JSX attribute that depends on centeredness re-evaluates `props.position === 0` INLINE rather than through a shared local `const` — see "Deviations" #3, a load-bearing Qwik workaround, not a style choice. Transient `mat-tab-body-animating` class and the dynamic-height wrapper resize are both out of scope (see "Deviations" #4) |
| `tabs/pagination-math.ts` + `.spec.ts` | `paginated-tab-header.ts`'s arithmetic (`_checkPaginationEnabled`, `_getMaxScrollDistance`, `_scrollTo`, `_scrollHeader`, `_updateTabScrollPosition`) | new | Pure functions extracted from the DOM-measuring methods, independently unit-tested (9 tests) — LTR only, including upstream's `|| 0` quirk in `_getMaxScrollDistance` reproduced verbatim |
| `tabs/use-paginated-header.ts` | `paginated-tab-header.ts`'s DOM-measuring half | new | Thin hook wrapping `pagination-math.ts` with real `offsetWidth`/`scrollWidth` reads via three refs (header root / tab-list container / tab-list inner — matching upstream's three distinct `ElementRef`s). The initial measurement runs once in a `useVisibleTask$` (`strategy: 'document-ready'`) — a justified, commented exception to "no per-instance `useVisibleTask$`" (design doc rule 7): upstream's own `afterNextRender(realign)` is equally a mount-time, non-interaction-driven measurement, and the unconditional `translateX` (note 1) and pagination-enabled state must be correct before any snapshot can be taken. `_scrollToLabel` (scroll-into-view on keyboard focus while paginated) is NOT ported — no scenario this port is gated on exercises it (see "Deviations" #5) |
| `tabs/tab-group-keyboard.ts` + `.spec.ts` | `paginated-tab-header.ts`'s `FocusKeyManager` configuration (`withHorizontalOrientation().withHomeAndEnd().withWrap().skipPredicate(() => false)`) + `_handleKeydown()`'s ENTER/SPACE branch | new | Pure index math (10 tests): `computeNextTabFocusIndex` (Home/End jump, Left/Right wrap, LTR only) and `shouldActivateOnKey` (focused ≠ selected AND not disabled). Disabled tabs ARE reachable by arrow-key focus (`skipPredicate(() => false)`) — only activation (Enter/Space) checks `disabled`. Simpler than `qwik-material/expansion/accordion-keyboard.ts` (vertical, WITH a disabled-skip predicate) so written separately rather than shared |
| `tabs/mat-tab-nav.tsx` | `tab-nav-bar/tab-nav-bar.ts` (`MatTabNav`) + `tab-nav-bar.html` | ported | Reuses `use-paginated-header.ts` (header root = the `<nav>` itself). `MatTabLink` children are ordinary nested `<Slot/>` children (NOT a data array like the group's labels) — see `tab-nav-state.ts`'s doc comment for why links don't hit the same cross-location-rendering constraint. `tabPanelId` is an explicit prop (Qwik has no `[tabPanel]`-style component-instance injection — see "Deviations" #6) and `MatTabNav` deliberately never sets `--mat-tab-header-animation-duration` unless `animationDuration` is explicitly provided (note 10 — no config fallback, unlike the group) |
| `tabs/mat-tab-link.tsx` | `tab-nav-bar/tab-nav-bar.ts` (`MatTabLink`) + `tab-link.html` | ported | `active`/`disabled`/`tabIndex` as plain props (controlled — `active` drives `aria-selected`/classes directly, never derived from focus, per note 12). Roving-tabindex focus tracked by DOM-element IDENTITY via `MAT_TAB_NAV_STATE.focusedLink` (a shared context signal), not index — see that module's doc comment. Falls back to `active` when nothing has been explicitly focused yet (covers SSR, where no ref exists, and the pre-interaction client state alike). Enter/Space synthesize a real `.click()` when a `tabPanel` is bound (note 12); mouse clicks rely on the native anchor's own focus-on-click behavior (note 13) — no explicit `.focus()` call needed, unlike the tab-group's `.mdc-tab` label divs |
| `tabs/mat-tab-nav-panel.tsx` | `tab-nav-bar/tab-nav-bar.ts` (`MatTabNavPanel`) | ported | `activeTabId` is a plain prop the consumer computes and passes directly (e.g. from ids it minted itself) — no automatic nav→panel wiring, since Qwik has no equivalent of Angular's `tabPanel._activeTabId = ...` direct-instance-mutation (see "Deviations" #6) |
| `tabs/tab-nav-state.ts` | (new — Qwik context plumbing, partial `MAT_TAB_NAV_STATE` InjectionToken equivalent) | new | `MAT_TAB_NAV_STATE` context (`focusedLink`/`hasTabPanel`/`tabPanelId`), `Signal`-wrapped per the project's established context-reactivity pattern (see `button-toggle-group-state.ts`) |
| `tabs/tab-config.ts` | `tab-config.ts` (`MatTabsConfig` + `MAT_TABS_CONFIG`) | new | Same shape as upstream; folded into `QwikMaterialProvider.matTabsConfig`. `backgroundColor`/`mat-background-*` theming inputs not ported (deprecated upstream, no scenario exercises them) |
| `scss/tabs/tab-group.scss`, `tab-header.scss`, `tab-body.scss`, `tab-nav-bar/tab-nav-bar.scss`, `tab-nav-bar/tab-link.scss`, `_tabs-common.scss`, `_m2-tabs.scss`, `_m3-tabs.scss`, `_tabs-theme.scss` | same names upstream | synced | Byte-for-byte copies; `tab-header.scss` is the only file needing the cdk-stub swap: `@use '@angular/cdk';` → `@use '../cdk-stub' as cdk;` (for the `cdk.high-contrast` disabled-tab forced-colors rule) |
| `scss/tabs/tabs-prebuilt.scss` | (qwik-material-specific) | new | `@use`s the five structural partials only — no `:root` token defaults (removed 2026-10-30, see core/SYNC.md "Default theme"): every `--mat-tab-*` token already resolves through a `token-utils.slot(..., var(--mat-sys-*))` fallback chain baked in at Sass-compile time. The one default theme now ships from `core/default-theme.scss` via `core-prebuilt.css`. `--mat-tab-background-color`/`--mat-tab-foreground-color` deliberately left undefined, matching the M3 token function's own `null` entries (`mat-tabs-with-background` is never exercised) |

## Removed upstream files

- `tabs-module.ts` — Qwik has no module concept.
- `testing/` (`MatTabGroupHarness`/`MatTabHarness`/`MatTabLinkHarness`/`MatTabNavBarHarness`/`MatTabNavPanelHarness`) — Angular test harness surface; no equivalent needed.
- Upstream `public-api.ts`/`index.ts` — replaced with this port's own re-export shape.
- `tab.ts`/`tab.html` (`MatTab`) — replaced by the `MatTabDef` data-array entry; no DOM of its own anyway (absent from the live, non-SSR DOM upstream too — note 9).
- `tab-label.ts` (`MatTabLabel`/`MAT_TAB_LABEL`) — replaced by `MatTabDef.labelTemplate` (a plain `JSXOutput` prop).
- `tab-content.ts` (`MatTabContent`/`MAT_TAB_CONTENT`) — see "Deviations" #1: not needed, folded into `MatTabDef.content`.
- `ink-bar.ts` (`MatInkBar`/`InkBarItem`/`_MatInkBarPositioner`) — the ink bar is rendered as static, always-present JSX per label/link instead of an imperatively-created+positioned element (note 2).
- `tab-group.spec.ts`/`tab-header.spec.ts`/`tab-nav-bar.spec.ts`/`tab-body.spec.ts` (Angular `TestBed`-based) — reframed as `mat-tabs-scenarios.spec.tsx` (export sanity + `describe.skip` documentation) + `pagination-math.spec.ts`/`tab-group-keyboard.spec.ts` (real unit tests of the extracted pure logic) + `specs/material-tabs/angular-parity.spec.ts` (the authoritative Angular-vs-Qwik DOM/behavior gate) — same "`createDOM()` can't reliably render/interact" constraint as every other entry point.
- `fitInkBarToContent`'s DOM repositioning (ink bar inside `.mdc-tab__content` vs directly in `.mdc-tab`) — the prop is accepted but only the default (`false`) placement is implemented; no scenario sets it true.

## Deviations from upstream

1. **No separate "lazy content" prop.** An earlier version accepted `lazyContent$: QRL<() => JSXOutput>` (mirroring `<ng-template matTabContent>`) and resolved it into a `useSignal` for later use in the render. This broke SSR outright: `serializeQRL: Cannot resolve symbol s0 in …` — a `JSXOutput`/vnode is not a value Qwik's resumability serializer can persist as component *state*; it only ever flows as a render function's own return value. A `component$` render function also cannot be `async` (`OnRenderFn<PROPS> = (props: PROPS) => JSXOutput`, no `Promise` allowed — confirmed by `tsc`, not just a runtime guess). Fixed by removing the mechanism rather than working around it: upstream's `matTabContent` and plain inline content are **observably identical** from the DOM's perspective (angular-parity.spec.ts note 3 says so explicitly), and a `content: JSXOutput` prop already gets the "don't render until attached, detach-and-rerender-from-scratch on leave" behavior for free from `MatTabBodyItem`'s existing `attached` gate — a `<ExpensiveThing/>` JSX descriptor is only ever rendered (its `component$` body invoked) once Qwik includes it in the returned tree, i.e. exactly when `attached` flips true.

2. **`MatTabLabelItem`'s click handler reads the target element from the handler's second argument, not `event.currentTarget`.** `EventHandler<EV, EL> = (event: EV, element: EL) => any` is Qwik's own documented shape (`core.d.ts`); `event.currentTarget` looked equivalent and typechecked, but silently never fired `onActivate$` with the right element after qwikloader's delegated dispatch — clicking any tab appeared to be a complete no-op. Switching to the second parameter fixed it immediately. No other handler in this port used `currentTarget`, so this is scoped to tabs.

3. **Every JSX attribute in `MatTabBodyItem` that depends on "is this tab centered" re-evaluates `props.position === 0` inline, rather than reading a shared `const isCenter = …` local.** Empirically bisected with a minimal standalone repro (not just this component): in a `component$` instantiated from a parent's `.map()` with a `key`, for an attribute that can toggle to/from `undefined` (here, `inert` — present while off-screen, absent while centered), a local `const` computed via a comparison operator (`=== 0`, or even `=== true` on a plain boolean prop) and then fed into that attribute fails to update on the client after the component's first props change — the attribute is simply never touched again (confirmed via `MutationObserver`: `class`/`aria-hidden` on the SAME element update correctly every time; `inert` never receives a single mutation once stuck). The identical comparison, inlined directly at each attribute's own call site instead of hoisted into a local, updates correctly. Looks like a Qwik optimizer/diffing edge case specific to this shape, not a logic bug in this component. No regression risk elsewhere in this port: no other component here feeds a comparison-derived local into an `undefined`-toggling attribute inside a keyed list.

4. **Not implemented (no parity scenario exercises or asserts them):**
   - The transient `mat-tab-body-animating` class and its `transitionstart`/`transitionend`/`transitioncancel` wiring. Upstream's own timing means this class is never present at any snapshot the parity spec takes — the spec itself (`waitForTabSwitchSettled`) waits it out *before* every comparison, by design, matching the same accepted-limitation category as checkbox's `mdc-checkbox--anim-*` classes.
   - The dynamic-height wrapper's transient inline `height` (`_setTabBodyWrapperHeight`/`_removeTabBodyWrapperHeight`) — the `dynamic-height` scenario's own doc comment confirms this is cleared before any snapshot regardless.
   - `fitInkBarToContent`'s effect on ink-bar placement (see "Removed upstream files").
   - `backgroundColor`/`mat-background-*` (deprecated upstream, `@breaking-change 20.0.0`).

5. **`_scrollToLabel` (scroll a focused-but-off-screen tab into view while paginated) not ported.** No scenario combines pagination with keyboard focus landing outside the visible window. `updatePagination()`'s other two responsibilities (`_checkPaginationEnabled`/`_checkScrollingControls`/`_updateTabScrollPosition`, i.e. everything `use-paginated-header.ts` actually implements) are fully ported and gate the `pagination` scenario.

6. **No automatic `MatTabNav` ↔ `MatTabNavPanel` instance wiring.** Upstream's `[tabPanel]` binding gives `MatTabNav` a direct object reference to the `MatTabNavPanel` instance, which it then mutates (`tabPanel._activeTabId = items[i].id`) and reads (`tabPanel.id`) directly — Angular DI/template-variable machinery with no Qwik equivalent (components aren't individually addressable objects the same way). This port threads a plain `tabPanelId: string` prop into `MatTabNav` (for `aria-controls`/role on every link) and a plain `activeTabId: string` prop into `MatTabNavPanel` (for `aria-labelledby`), both computed and supplied by the consumer — the same controlled-component shape as every other cross-component relationship in this port. The `nav-bar` dev-app route mints its links' ids itself (via `useIdGenerator()`) so it can compute the active one's id directly, with no need for a reactive link→nav→panel callback chain.

7. **Angular-specific removals:** `@Component`/`@Directive` decorators, `@Input`/`@Output`/`booleanAttribute`/`numberAttribute`, `@ContentChildren`/`@ViewChild(ren)`, `HostAttributeToken`, `inject()` DI, `ChangeDetectorRef.markForCheck()`, `NgZone`/`Renderer2`, `AfterContentInit`/`AfterContentChecked`/`AfterViewInit`/`OnDestroy` lifecycle → plain props, Qwik hooks/context/refs, and `useOn`/`useTask$`/`useVisibleTask$` where an actual mount-time or lazy-interaction equivalent was needed. `exportAs` → N/A. `Directionality`/RTL support dropped (LTR only), same scope cut as every other keyboard-handling component in this port (button-toggle, expansion).

## Ripple animation (2026-10-30, `core/ripple/` remediation)

Every static ripple container this package already rendered now also receives real
`.mat-ripple-element` spans via `core/ripple/ripple-dom.ts`'s `handleRippleEvent()`, wired to all
six pointer events (`onMouseDown$`/`onMouseUp$`/`onMouseLeave$`/`onTouchStart$`/`onTouchEnd$`/
`onTouchCancel$` — see `core/SYNC.md`'s ripple section for why ONE shared `$()` reference per
trigger is required, not a style choice):

- **`MatTabLabelItem`** (per-tab label, in `mat-tab-group.tsx`'s rendering): container
  `.mat-mdc-tab-ripple`, trigger = the label's own host div (upstream's `[matRippleTrigger]
  ="tabNode"`, a template reference on that SAME div). Gained a `rippleDisabled` prop —
  pre-combined by `MatTabGroup` (`tab.disabled || groupDisableRipple`), mirroring the
  `disabledFlags` precomputation that component already does for the per-tab `disabled` class.
- **`MatTabGroup`'s own two pagination buttons** (`tab-header.html`'s `mat-ripple` divs, no
  `matRippleTrigger` override — trigger === container): the handler reads the event's own
  `element` (second) argument directly as the container, no separate ref needed.
- **`MatTabLink`**: container `.mat-mdc-tab-ripple`, trigger = the link's own host `<a>`
  (upstream's `[matRippleTrigger]="elementRef.nativeElement"`). `rippleDisabled` combines
  `disabled || disableRipple || nav.disableRipple` (`MatTabLink.rippleDisabled`'s getter, global-
  options term omitted — no global-options system in this port).
- **`MatTabNav`'s own two pagination buttons** — same trigger===container pattern as
  `MatTabGroup`'s. `MAT_TAB_NAV_STATE` (`tab-nav-state.ts`) gained a `disableRipple: boolean`
  field (`MatTabNav.disableRipple`, OR'd into every link's `rippleDisabled`) — previously had no
  representation at all since nothing read it.

## Qwik v2 regression: roving-tabindex attribute going missing (2026-11-01)

Upgrading to `@qwik.dev/core@2.0.0-rc.4` broke 9/12 `material-tabs` parity scenarios: after
ArrowRight/clicking a tab, the newly-active (or newly-inactive) tab's `tabindex` attribute was
sometimes entirely MISSING from the DOM, rather than `"0"`/`"-1"`. Two separate, stacked v2 bugs
in `MatTabLabelItem` (`mat-tab-label.tsx`):

1. A plain `tabIndex={props.tabIndex}` JSX prop is only re-applied to the DOM when THIS component
   re-renders — and `useFocusOrigin()`'s `focusin` listener causes exactly such an unrelated
   re-render on every roving-tabindex move (`MatTabGroup.onKeyDown$`/`onActivate$` write the new
   `focusIndex` signal and synchronously call `.focus()` on the target tab in the same handler, so
   native `focusin` can resolve before the parent's re-render passes the new prop down). Same
   category as `qwik-material/radio/mat-radio-button.tsx`'s `checkedSig` fix.
2. Fixing that by tracking `props.tabIndex` from a `useTask$` and reading it back via a dedicated
   `Signal` (`tabIndex={tabIndexSig.value}`, mirroring `checkedSig` exactly — needed so SSR still
   gets a value, since the task's own imperative write has no effect on a server mock element)
   surfaced a SECOND, different bug: a bare `sig.value` JSX attribute expression gets hoisted into
   its own dedicated subscription, bypassing the regular per-render attribute diff for that one
   prop — but that diff's OWN "remove attributes no longer in this render's props" cleanup pass
   doesn't know about the hoisted prop, and v2 never gets the chance to normalize its
   case-mismatched bookkeeping for it either (SSR serializes the literal JSX casing `tabIndex="0"`;
   the browser parses/stores HTML attribute names lowercased as `tabindex`; that normalization
   only happens inside the very attribute-diff loop the hoisted prop now bypasses). Confirmed
   live: ANY unrelated re-render of this component removed the `tabindex` attribute outright.

Fixed by reading the tracked signal into a plain local (`const tabIndexValue = tabIndexSig.value;`)
and using THAT identifier in JSX — syntactically no longer a bare signal access, so it is not
hoisted, and goes through the regular per-render diff on every render like any other plain prop
(always included, always correctly cased) — while staying correct because the underlying SIGNAL
(not a per-render recompute) is what the `useTask$` keeps in sync, decoupled from unrelated
re-renders. See `mat-tab-label.tsx`'s own doc comment for the blow-by-blow.

A separate, THIRD v2 regression (`mat-tabs/basic`'s last remaining failure after the above) was in
shared `qwik-cdk/a11y` code, not this component — see `qwik-cdk/a11y/SYNC.md`'s 2026-11-01 entry on
`useFocusOrigin()`'s pointer-modality tracking.

## Class count

`grep -rnE "^export class" src/qwik-material/tabs/ 2>/dev/null` → 0 (no exported classes on the consumer surface).

## Pipeline

`pnpm test:qwik-material` at the repo root runs `build && vitest && lint:no-ssr-leaks && typecheck` for the whole qwik-material package, covering dialog + button + card + toolbar + badge + icon + progress-bar + progress-spinner + divider + grid-list + list + button-toggle + slide-toggle + expansion + radio + checkbox + core + tabs.

## Qwik-only Playwright specs

None added. `specs/material-tabs/angular-parity.spec.ts`'s 12 scenarios and
their interaction steps (keyboard roving-tabindex with wrap/no-wrap,
manual-activation Enter/Space, disabled-tab reachability, pagination
chevron scrolling, lazy/plain content attach-detach, preserve-content,
align/stretch, header position, dynamic height, nav-bar Enter-synthesizes-
click) already cover every behavior this port implements against the real
Angular DOM — the strongest test available. `pagination-math.spec.ts` and
`tab-group-keyboard.spec.ts` cover the pure logic beneath it.

## `MatTabLabelItem`'s `labelTemplate` needed `cloneJsxForReuse` too (2026-11-02, Phase 2 docs examples)

Found porting material.angular.dev's `tab-group-custom-label` docs example (a real `JSXOutput`
`labelTemplate` with a `<mat-icon>`, not plain text). Confirmed live: switching tabs left EVERY
tab's icon text empty (`'thumb_up'` -> `undefined`), not just the ones whose selected state
changed — the same "re-rendered twice within the same mount corrupts a reused JSXOutput" Qwik v2
issue already documented and fixed in `qwik-material/menu` (`menu-panel.tsx`'s `props.content`,
`mat-menu-item.tsx`'s `props.icon`): `MatTabLabelItem` re-renders on its own
selected/focus/ripple-state signals, and rendering the SAME static `props.labelTemplate` object
again on that re-render corrupts it for every label, not just the directly-affected one (plausibly
because all labels share one parent re-render pass).

Fix: `mat-tab-label.tsx` renders `{cloneJsxForReuse(props.labelTemplate)}` instead of
`{props.labelTemplate}` (falling back to plain `props.label` text when no template is given) —
same one-line pattern as every other site using this helper. Purely additive; no existing
scenario in this port's own `specs/material-tabs/` passes a JSXOutput `labelTemplate`, so this is
a no-op for all of them (confirmed: 12/12 unaffected).

Verified: `specs/examples-data-nav/angular-parity.spec.ts`'s tabs scenarios (10 cases) pass, run
3x as part of the full 33-case suite.
