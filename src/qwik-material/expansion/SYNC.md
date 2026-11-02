# qwik-material/expansion sync log

Tracks the sync state between this port and `src/material/expansion/` upstream. Built on
`@angular-community/qwik-cdk/accordion` (ported alongside this entry point — see its own
SYNC.md). Ported per
`docs/superpowers/specs/2026-10-27-qwik-material-remaining-components-roadmap.md` (wave 1) and
gated by `src/qwik-cdk-parity-tests/specs/material-expansion/angular-parity.spec.ts` from the
start, per
`docs/superpowers/specs/2026-10-27-qwik-material-dom-parity-remediation-design.md`.

## Upstream sync state

| File | Upstream path | Sync state | Notes |
| --- | --- | --- | --- |
| `expansion/mat-accordion.tsx` | `src/material/accordion.ts` + `accordion-base.ts` | ported | `multi`/`displayMode`/`togglePosition`/`hideToggle` props; publishes `MAT_ACCORDION_STATE`. `multi` + unique-selection delegated entirely to `useCdkAccordion()`. The `FocusKeyManager`-equivalent arrow-key/Home/End navigation is a single bubbling `keydown` listener on the accordion's own rendered DOM (queried via its own `ref`, mirroring `qwik-material/button-toggle`'s group-level arrow-key handler — Qwik has no `@ContentChildren`/`QueryList`), using `document.activeElement` at keydown time as the "active item" instead of separately tracking one via a `_handleHeaderFocus`-equivalent subscription (every header already receives real focus events the normal way; there's nothing upstream's extra bookkeeping buys here that a live DOM read doesn't already give for free) |
| `expansion/accordion-keyboard.ts` | `src/cdk/a11y/key-manager/list-key-manager.ts` (as configured by `MatAccordion`) | new | Extracted pure index math (`findBoundaryEnabledIndex`, `findNextEnabledIndexWrapping`, `computeNextHeaderIndex`), independently unit-tested in `accordion-keyboard.spec.ts` — see that file's own doc comment |
| `expansion/mat-expansion-panel.tsx` | `src/material/expansion/expansion-panel.ts` (`MatExpansionPanel` class) + `expansion-panel.html` | ported | Controlled-component surface (`expanded` + `onExpandedChange$`/`onOpened$`/`onClosed$`/`onAfterExpand$`/`onAfterCollapse$`), layered on `useCdkAccordionItem()`. `hideToggle`/`togglePosition` fallback-to-accordion getters ported verbatim as plain expressions. `_hasSpacing()` ported verbatim. The ~200ms `mat-expansion-panel-animations-enabled` delayed class-add (`_setupAnimationEvents`) is the one explicitly-sanctioned `useVisibleTask$` exception to the "no per-instance `useVisibleTask$`" rule — there is no user interaction to lazily hang a zero-click, mount-driven timer on; the same task also attaches the `transitionend` listener backing `onAfterExpand$`/`onAfterCollapse$` (only fires when animations are enabled — see deviation #3). Header/title/description/action-row/lazy-content are `q:slot`-tagged children (not nested JSX props) consuming `MAT_EXPANSION_PANEL_STATE` context — see the component's own doc comment for why (same reason as `qwik-material/card`'s `MatCardHeader` / `qwik-material/list`'s `MatListItem`) |
| `expansion/mat-expansion-panel-header.tsx` | `src/material/expansion/expansion-panel-header.ts` (`MatExpansionPanelHeader` class) + `expansion-panel-header.html` | ported | `expandedHeight`/`collapsedHeight` props falling back to `MatExpansionConfig`. Focus classes via `useFocusOrigin()` (not the heavier `FocusMonitor` engine — see `qwik-cdk/a11y/SYNC.md`'s 2026-10-27 note). Space/Enter toggle directly; every other key is left unhandled so it bubbles to `MatAccordion`'s own listener — mirrors `_keydown()`'s default-case delegation to `panel.accordion._handleHeaderKeydown(event)`, reframed as ordinary DOM bubbling instead of an explicit method call (there is no `panel.accordion` reference to call through in a slot-based tree) |
| `expansion/mat-panel-title.tsx` | `src/material/expansion/expansion-panel-header.ts` (`MatExpansionPanelTitle` directive) | ported | Render with `q:slot="title"` |
| `expansion/mat-panel-description.tsx` | `src/material/expansion/expansion-panel-header.ts` (`MatExpansionPanelDescription` directive) | ported | Render with `q:slot="description"` |
| `expansion/mat-action-row.tsx` | `src/material/expansion/expansion-panel.ts` (`MatExpansionPanelActionRow` directive) | ported | Render with `q:slot="actionRow"` |
| `expansion/mat-expansion-panel-content.tsx` | `src/material/expansion/expansion-panel-content.ts` (`MatExpansionPanelContent` directive) + the `ng-template`/`cdkPortalOutlet` it feeds | ported | Regular (unnamed-slot) child of `MatExpansionPanel`; renders nothing until `hasEverOpened` (panel context) flips true, then forever. See deviation #4 for the `TemplatePortal`/`cdkPortalOutlet` removal |
| `expansion/accordion-state.ts`, `panel-state.ts`, `expansion-config.ts` | (new — Qwik context plumbing) | new | `MAT_ACCORDION_STATE`/`MAT_EXPANSION_PANEL_STATE` follow the `Signal`-wrapped-context pattern established by `qwik-material/button-toggle`'s `MAT_BUTTON_TOGGLE_GROUP_STATE` (see that module's doc comment for the full reactivity rationale); `MAT_EXPANSION_CONFIG` folds into `QwikMaterialProvider.matExpansionConfig` for family-shape parity, mirroring `MAT_EXPANSION_PANEL_DEFAULT_OPTIONS` |
| `scss/expansion/expansion-panel.scss` | `src/material/expansion/expansion-panel.scss` | synced | Byte-for-byte copy with the one allowed edit: `@use '@angular/cdk';` → `@use '../cdk-stub' as cdk;` |
| `scss/expansion/expansion-panel-header.scss` | `src/material/expansion/expansion-panel-header.scss` | synced | Same cdk-stub swap |
| `scss/expansion/_expansion-variables.scss`, `_m2-expansion.scss`, `_m3-expansion.scss`, `_expansion-theme.scss` | same names upstream | synced | Byte-identical copies; no `@angular/cdk` references, no edits needed |
| `scss/expansion/expansion-prebuilt.scss` | (qwik-material-specific) | new | `@use` the two synced files only — no `:root` token defaults (removed 2026-10-30, see core/SYNC.md "Default theme"): every `--mat-expansion-*` name already carries a real M3 fallback to `--mat-sys-*` baked in via `token-utils.slot()`. The one default theme now ships from `core/default-theme.scss` via `core-prebuilt.css`. |

## Removed upstream files

- `expansion-module.ts` — Qwik has no module concept.
- `accordion-base.ts`'s `MatAccordionBase` interface + `MAT_ACCORDION` `InjectionToken` — replaced
  by `MAT_ACCORDION_STATE` (`createContextId`), the project's standard DI replacement.
- `expansion-panel-base.ts`'s `MatExpansionPanelBase` interface + `MAT_EXPANSION_PANEL`
  `InjectionToken` — `MatExpansionPanelContent`'s only use for it (reading `_expansionPanel` to
  compare against the panel it's nested in, which upstream needs because a `TemplateRef` can be
  re-hosted elsewhere) has no equivalent need here — a `q:slot`-tagged child is unconditionally
  the panel's own descendant.
- `accordion.spec.ts`/`accordion-item.spec.ts`/`expansion.spec.ts` (Angular `TestBed`-based) —
  reframed as `accordion-keyboard.spec.ts` (pure keyboard math) + `*-state.spec.ts`/
  `expansion-config.spec.ts` (context id + shape sanity) + `mat-expansion-scenarios.spec.tsx`
  (export sanity + `describe.skip` documentation of what's Playwright-verified instead) — same
  "vitest can't reliably render/interact with DOM" constraint as every other entry point (see
  `qwik-material/button-toggle`'s own scenario-port comment). Real interaction coverage lives in
  `src/qwik-cdk-parity-tests/specs/material-expansion/angular-parity.spec.ts`.
- `testing/` (`MatExpansionPanelHarness`/`MatAccordionHarness`) — Angular test harness surface; no
  equivalent needed.
- Upstream `public-api.ts`/`index.ts` — replaced with this port's own re-export shape.

## Deviations from upstream

1. **`TemplatePortal`/`CdkPortalOutlet` (`@angular/cdk/portal`) removed.** Lazy content
   (`MatExpansionPanelContent`) is a plain conditional `<Slot>` gated on a `hasEverOpened` signal
   instead of constructing/attaching a portal into a `ViewContainerRef` — Qwik has no portal
   primitive for this and doesn't need one: the content is already physically present in the
   component tree (as a `q:slot`-less, regular child of `MatExpansionPanel`), it's just not
   *rendered* (returns `null`) until the gate flips. Functionally identical DOM outcome (nothing,
   then the content, forever) with none of the view-container machinery.

2. **`Directionality` (`@angular/cdk/bidi`) dependency removed.** The arrow-key handler and the
   `[dir='rtl']` SCSS selectors (kept, byte-synced) only matter together; no parity scenario
   exercises RTL. A future RTL pass would need to thread `dir` through
   `MatAccordion`'s keydown handler the same way `qwik-material/button-toggle`'s deviation #9
   notes for itself.

3. **`afterExpand`/`afterCollapse` only fire via the CSS `transitionend` listener — never when
   `MAT_ANIMATIONS_DISABLED` is true.** Upstream's `_setupAnimationEvents()` has two branches:
   animations-enabled waits for `transitionend`; animations-disabled fires both events
   synchronously from `opened`/`closed` instead (there is no CSS transition to wait for in that
   mode — the `mat-expansion-panel-animations-enabled` class, which gates every transition in the
   synced SCSS, is simply never added). This port only implements the first branch. No parity
   scenario sets `animationsDisabled`, and firing these two low-priority completeness events
   synchronously on every toggle when disabled was judged not worth a second code path for zero
   test coverage; a future consumer that needs them with animations off should add the
   `opened`/`closed`-driven branch back.

4. **`ChangeDetectorRef.markForCheck()` calls dropped; `SimpleChanges`/`OnChanges`/`_inputChanges`
   `Subject` dropped.** No change-detection system to notify; Qwik signal/prop reactivity is its
   own trigger. The one upstream consumer of `_inputChanges` (`MatExpansionPanelHeader`'s
   constructor, re-subscribing on `hideToggle`/`disabled`/`togglePosition` edits) is unnecessary
   here — the header already re-reads the live `MAT_EXPANSION_PANEL_STATE` context signal on every
   render.

5. **`Renderer2`/`NgZone` dropped.** `_renderer.listen(...)` → plain
   `addEventListener`/`removeEventListener` inside the `useVisibleTask$`'s `cleanup()`;
   `_ngZone.runOutsideAngular`/`.run()` → no-ops (no zones).

6. **Angular-specific removals:** `@Component`/`@Directive` decorators, `@Input`/`@Output`
   decorators, `booleanAttribute`/`numberAttribute` transforms, `HostAttributeToken`, `inject()`
   DI, `ViewChild`/`ContentChild`/`ContentChildren` → plain props + Qwik hooks/context/refs.
   `exportAs` → N/A.

## Class count

`grep -rnE "^export class" src/qwik-material/expansion/ 2>/dev/null` → 0 (no exported classes on
the consumer surface).

## Pipeline

`pnpm test:qwik-material` at the repo root runs `build && vitest && lint:no-ssr-leaks &&
typecheck` for the whole qwik-material package, covering dialog + button + card + toolbar +
badge + icon + progress-bar + progress-spinner + divider + grid-list + list + button-toggle +
core + expansion.
