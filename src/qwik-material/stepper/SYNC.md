# qwik-material/stepper sync log

Tracks the sync state between this port and `src/material/stepper/`
upstream. Every deviation from a verbatim copy is recorded here. Companion
to `src/qwik-material/dialog/SYNC.md`, `src/qwik-material/button/SYNC.md`,
`src/qwik-material/card/SYNC.md`, `src/qwik-material/toolbar/SYNC.md`,
`src/qwik-material/badge/SYNC.md`, `src/qwik-material/icon/SYNC.md`,
`src/qwik-material/progress-bar/SYNC.md`,
`src/qwik-material/progress-spinner/SYNC.md`,
`src/qwik-material/divider/SYNC.md`, `src/qwik-material/grid-list/SYNC.md`,
`src/qwik-material/list/SYNC.md`, `src/qwik-material/button-toggle/SYNC.md`,
`src/qwik-material/slide-toggle/SYNC.md`,
`src/qwik-material/expansion/SYNC.md`, `src/qwik-material/radio/SYNC.md`,
`src/qwik-material/checkbox/SYNC.md`, `src/qwik-material/sort/SYNC.md`,
`src/qwik-material/tabs/SYNC.md`, `src/qwik-material/sidenav/SYNC.md`,
`src/qwik-material/snack-bar/SYNC.md`, and `src/qwik-material/core/SYNC.md`.

Ported 2026-10-28 against upstream, following
`docs/superpowers/specs/2026-10-27-qwik-material-dom-parity-remediation-design.md`
and `...-remaining-components-roadmap.md` (wave 3). Gated from the start by
`src/qwik-cdk-parity-tests/specs/material-stepper/angular-parity.spec.ts`
(11/11 scenarios passing — horizontal-basic, vertical-basic,
linear-required, optional-step, editable-false, completed-step-icons,
custom-label, label-position-bottom, header-position-bottom,
selected-index-initial, error-state — run 3× clean). See that spec's long
header comment for the full DOM contract (shared structure, 10 numbered
"non-obvious behaviors verified live" notes, per-scenario render contract)
— it is the authoritative source this port was built against, not just
upstream's source code.

## Upstream sync state

| File | Upstream path | Sync state | Notes |
| --- | --- | --- | --- |
| `stepper/mat-stepper.tsx` | `src/material/stepper/stepper.ts` (`MatStepper`) + `stepper.html` + `src/cdk/stepper/stepper.ts` (`CdkStepper`, `CdkStep`) | ported | One component folding `MatStepper`+`MatStep`+`MatStepHeader`+`CdkStepper`+`CdkStep` together — upstream splits these into five classes across two packages, but nothing in the public API or DOM contract requires that split here (same reasoning as `MatTabGroup` folding in `MatTabHeader`/`MatPaginatedTabHeader`). Takes a `steps: MatStepDef[]` data-array prop instead of nested `<MatStep>` children — same migration-friendly, SSR-correct shape as `qwik-material/tabs`' `MatTabDef[]`, for the identical underlying reason (upstream renders each step TWICE, into a header subtree AND a body subtree, via `@ContentChildren`; Qwik has no equivalent and can't read a `<Slot>`'s children's props during SSR). Unlike tabs, step `content` is ALWAYS rendered (never lazily attached/detached) — matches angular-parity.spec.ts note 5. Houses the `trySelectIndex$` gating/selection QRL, the roving-tabindex (`focusIndexSig`) and sticky keyboard-origin-latch (`keyboardOriginSig`) state, the `isAnimating`/`mat-stepper-animations-enabled` timer (the same explicitly-sanctioned `useVisibleTask$` exception as `qwik-material/expansion/mat-expansion-panel.tsx`), and the `ariaDisabledQuirk` two-binding memoization (see Deviations) |
| `stepper/mat-step-header.tsx` (`MatStepHeaderItem`, internal) | `src/material/stepper/step-header.ts` (`MatStepHeader`) + `step-header.html` | ported | Not exported — one per step, rendered by `MatStepper`. Ripple container is a static `matripple`-attributed div that, since the 2026-10-30 `core/ripple/` remediation, also receives real `.mat-ripple-element` spans on pointer events (`core/ripple/ripple-dom.ts`'s `handleRippleEvent()`, wired to all six pointer events on the host `<mat-step-header>` — upstream's `[matRippleTrigger]="_getHostElement()"`). Gained a `disableRipple` prop, threaded from `MatStepper.disableRipple` (previously accepted there but had no DOM effect at all — matches upstream's `[matRippleDisabled]="disableRipple"`, which reads the STEPPER's input, not a per-step one). Icon content block (number/done/edit/error states incl. the `cdk-visually-hidden` labels) matches `_getDefaultTextForState`. `useFocusOrigin()` for `cdk-focused`/`cdk-*-focused` classes |
| `stepper/stepper-buttons.tsx` (`MatStepperNext`/`MatStepperPrevious`) | `src/material/stepper/stepper-button.ts` + `src/cdk/stepper/stepper-button.ts` | ported | `class`/`type` are the DIRECTIVES' OWN host bindings (`mat-stepper-next`/`mat-stepper-previous`, `submit`/`button` defaults) — not consumer-chosen, reproduced unconditionally. Reach the owning `MatStepper` via `MAT_STEPPER_ACTIONS` context (see `stepper-actions.ts`) since they're rendered anywhere inside a step's `content`, not as a direct JSX child of `<MatStepper>` |
| `stepper/stepper-actions.ts` | (new — Qwik context plumbing, the DI-equivalent of `CdkStepperNext`/`Previous`'s `inject(CdkStepper)`) | new | `MAT_STEPPER_ACTIONS` context carrying `{next$, previous$}` QRLs |
| `stepper/step-control.ts` | (new — see Deviations #1) | new | `useRequiredControl()`, a narrow, local stand-in for the shared reactive-forms primitive the design notes point at (`qwik-material/core`'s `useMatFormControl()`, added on the unmerged `port/form-field` branch) |
| `scss/stepper/stepper.scss`, `step-header.scss`, `_m2-stepper.scss`, `_m3-stepper.scss`, `_stepper-theme.scss`, `_stepper-variables.scss` | same names upstream | synced | Byte-for-byte copies; `stepper.scss`/`step-header.scss` are the only files needing the cdk-stub swap: `@use '@angular/cdk';` → `@use '../cdk-stub' as cdk;` (for `cdk.high-contrast`'s forced-colors rules) |
| `scss/stepper/stepper-prebuilt.scss` | (qwik-material-specific) | new | `@use`s the two structural partials only — no `:root` token defaults (removed 2026-10-30, see core/SYNC.md "Default theme"): every `--mat-stepper-*`/`--mat-step-header-*` token already resolves through a `token-utils.slot(..., var(--mat-sys-*))` fallback chain baked in at Sass-compile time, same as upstream. The one default theme now ships from `core/default-theme.scss` via `core-prebuilt.css` |

## Removed upstream files

- `stepper-module.ts` — Qwik has no module concept.
- `testing/` (`MatStepperHarness`/`MatStepHarness`/stepper-button harnesses) — Angular test harness surface; no equivalent needed.
- Upstream `public-api.ts`/`index.ts` — replaced with this port's own re-export shape.
- `step.html`/`step.ts` (`MatStep`) — replaced by the `MatStepDef` data-array entry; `<mat-step>` never appears in the live (non-SSR) DOM upstream either (angular-parity.spec.ts shared-structure note).
- `step-label.ts` (`MatStepLabel`/`CdkStepLabel`) — replaced by `MatStepDef.labelTemplate` (a plain `JSXOutput` prop); `label` covers the plain-string (`_stringLabel()`) branch.
- `step-content.ts` (`MatStepContent`) — ported as `MatStepDef.lazyContent` (2026-11-03, tier2/datanav). See "matStepperIcon overrides and matStepContent lazy content" below.
- `stepper-icon.ts` (`MatStepperIcon`) — ported as `MatStepperProps.stepperIcon` (2026-11-03, tier2/datanav), static-content-only (no context — see below).
- `stepper-intl.ts` (`MatStepperIntl`) — hardcoded English strings ('Optional'/'Completed'/'Editable') directly in `mat-step-header.tsx` instead; no i18n/Intl service exists anywhere in this port yet (not stepper-specific).
- `stepper.spec.ts` (Angular `TestBed`-based) — reframed as `mat-stepper-scenarios.spec.tsx` (export/shape sanity + `describe.skip` documentation, same convention as `qwik-material/expansion`/`tabs`) + the authoritative `angular-parity.spec.ts`. The CDK-level pure logic these would otherwise exercise is unit-tested directly in `qwik-cdk/stepper/step-logic.spec.ts`/`stepper-keyboard.spec.ts` — no DOM needed for those.

## Deviations from upstream

1. **No reactive-forms module.** `qwik-material/core`'s shared
   `useMatFormControl()` primitive (added on `port/form-field`,
   `1dacc215a595bba1890c33dafcf83073e87b43d9`) had NOT merged into this
   worktree's base at the time of this port (confirmed via `git log
   --oneline --all` / `git merge-base --is-ancestor`) — `qwik-material/
   core` here only has `mat-pseudo-checkbox`/`mat-internal-form-field`, no
   `mat-form-control.ts`. `step-control.ts`'s `useRequiredControl()` is a
   narrow local stand-in: a single required-text-field control
   (value/touched/dirty signals + the six `ng-*` `NgControlStatus` classes
   a bare `[formControl]` input gets, per angular-parity.spec.ts note 9),
   just enough to exercise `linear-required`/`error-state`'s gating. TODO
   once `port/form-field` merges: replace every call site with the shared
   primitive and delete this file.
2. **`aria-disabled` replicates an Angular two-`[attr.]`-binding
   change-detection quirk, not the naive `isNavigable() ? undefined :
   'true'` formula.** `stepper.html` has TWO `[attr.aria-disabled]`
   bindings on the step-header element: an earlier `orientation ===
   'vertical' && step.isSelected() ? 'true' : null` and the later, "real"
   `step.isNavigable() ? null : true`. Angular memoizes EACH binding
   against its own previous value and only writes the DOM when THAT
   SPECIFIC expression changes — not simply whichever is declared last.
   For a vertical, non-linear stepper (`isNavigable()` is always `true`,
   so the second binding's value never changes after the first render),
   this means a header that transitions from unselected to selected gets
   `aria-disabled="true"` **stuck** on it (the first binding firing, the
   second one skipped because unchanged) until it's deselected again —
   confirmed live (`vertical-basic`'s `click Next` step). `mat-stepper
   .tsx`'s `ariaDisabledQuirk` store replicates this exactly: it tracks
   each binding's own last-fired value per step and only updates the
   effective attribute value when ONE of them changes, applying binding2
   after binding1 when both change in the same render (their declaration
   order). Horizontal orientation is unaffected in practice (binding1 is
   permanently `null` there, so the simulation always reduces to
   binding2's current value — mathematically identical to the naive
   formula) but goes through the same simulation for consistency.
3. **`FocusKeyManager._origin`'s one-way `'program'`→`'keyboard'` latch,
   not the natural click/focus-event heuristic, governs focus classes on
   every SUCCESSFUL selection change.** Confirmed live: a cold mouse click
   on a step header (fresh page, no prior keyboard interaction) gives the
   newly-selected header `cdk-program-focused`, NOT `cdk-mouse-focused` —
   because `CdkStepper._updateSelectedItemIndex` always calls
   `this._keyManager.setActiveItem(newIndex)` on a successful change
   (click, button, or Enter/Space alike), and `FocusKeyManager
   .setActiveItem()` always calls `.focus(this._origin)` explicitly — an
   explicit, origin-forcing `FocusMonitor.focusVia()` call that overrides
   whatever the underlying click/native-focus event would otherwise have
   been classified as. `_origin` defaults to `'program'` and becomes
   `'keyboard'` PERMANENTLY (never reset) the first time any arrow-key/
   Home/End press reaches `CdkStepper._onKeydown`'s `else` branch —
   `keyboardOriginSig` in `mat-stepper.tsx` replicates this one-way latch;
   `trySelectIndex$`'s "move focus to the new header" step calls
   `focusVia(target, keyboardOriginSig.value)` instead of a plain
   `.focus()`. A BLOCKED click (gating fails, `setActiveItem` never runs)
   still gets its focus classes from the ordinary `useFocusOrigin()`
   pointerdown heuristic (confirmed by `editable-false`'s note 8) — this
   latch only applies on the SUCCESS path.
4. **`trySelectIndex$` (the `selectedIndex` setter equivalent) reads
   `props.steps`/`props.linear`/`props.selectedIndex` LIVE at call time,
   never through a per-render snapshot array.** `MatStepperNext`/
   `MatStepperPrevious` are leaf components with no props of their own
   that ever change, rendered inside a step's `content` — Qwik has no
   reason to re-render them when the ANCESTOR `MatStepper`'s provided
   `MAT_STEPPER_ACTIONS` context value changes, so their captured
   `{next$, previous$}` pair (and the `trySelectIndex$` it calls) can be
   from an EARLIER render. Confirmed live: clicking `matStepperNext` right
   after a `stepControl`'s validity flips, before any unrelated
   re-render, used a stale gating snapshot from before the fill. Fixed by
   having every value `trySelectIndex$` touches come from `props`
   directly (a live store reference, never stale) instead of the
   `editableFlags`/`controlValids`/… arrays `renderHeader` computes fresh
   each render for its own (synchronous, same-render) use.
5. **Every JSX attribute fed to the keyed `MatStepHeaderItem` that
   depends on a per-step comparison (`selectedIndex === i`) is computed
   INLINE, at the JSX prop site, never through a locally-precomputed
   array read back by index.** Empirically confirmed live (same category
   as `qwik-material/tabs/mat-tab-body.tsx`'s documented finding,
   itself quoting button-toggle's): a boolean computed via a comparison
   and stored in a `steps.map(i => ({selected: …}))`-style array, then
   read through `arr[i].selected` as a prop to a `component$` instantiated
   from a `.map()` with a `key`, froze at its initial value after the
   first client-side change (`aria-selected`/icon-selected class never
   updated past the very first render). `renderHeader(i)` recomputes
   `selectedIndex === i` directly at each attribute call site instead.
6. **`mat-stepper-animating` add/remove directly mutates the host's
   `classList`, in addition to the `isAnimating` signal.** Setting the
   signal synchronously inside the SAME click/keydown handler (mirroring
   upstream's `_isAnimating.set(true)`, which fires in the same
   change-detection cycle as `selectionChange`) is still not early enough
   for a test harness's `page.waitForFunction` to reliably observe on its
   very FIRST poll (right after `.click()` resolves) — Qwik's own
   re-render flush is scheduled (a microtask/rAF hop), and combined with
   a cold/lazily-resolved click handler (first interaction on a fresh
   page) this intermittently lost the race, confirmed live via isolated,
   deterministic repro (`vertical-basic`/`error-state`'s FIRST
   selection-changing click, 100% reproducible on a fresh page load
   outside the full suite). A direct `classList.add()`/`.remove()`
   alongside the signal (which still drives the class correctly on every
   regular/SSR render) makes the class change visible in the exact same
   synchronous turn as the handler. The test harness's own
   `waitForStepperSettled` (see `angular-parity.spec.ts`) was ALSO
   hardened to first wait, bounded, for the class to actually appear
   before waiting for it to clear — the same documented fix already
   applied for `qwik-material/checkbox` (see that entry's SYNC.md,
   "Known flakiness" / "First paint + handler timing").
7. **No `MatStepperIntl` i18n service, no RTL.** Neither is stepper-specific
   (no i18n service exists anywhere in this port; RTL is the same LTR-only
   cut as every other keyboard-handling component). `matStepperIcon`/
   `matStepContent` are now ported — see below.
8. **Angular-specific removals:** `@Component`/`@Directive` decorators,
   `@Input`/`@Output`/`booleanAttribute`/`numberAttribute`,
   `@ContentChild(ren)`/`@ViewChild(ren)`, `inject()` DI,
   `ChangeDetectorRef.markForCheck()`, `NgZone`/`Renderer2`,
   `AfterContentInit`/`AfterViewInit`/`OnDestroy`/`OnChanges` lifecycle →
   plain props, Qwik hooks/context/refs, `useOn`/`useVisibleTask$` where an
   actual mount-time or lazy-interaction equivalent was needed.
9. **2026-10-31: `MatStepperNext`/`MatStepperPrevious` gained a `matButton`
   prop** (`stepper-buttons.tsx`), added while porting material.angular.dev's
   `stepper-overview` docs example
   (`src/qwik-cdk-dev-app/src/routes/mat-stepper/example/`), whose Next/Back
   buttons are `<button matButton matStepperNext>`/`matStepperPrevious` —
   TWO upstream directives stacked on one native `<button>`, combining
   `matButton`'s own ripple/focus-indicator/touch-target/ripple-loader
   chrome with the stepper directive's class/click behavior. Neither
   `<MatButton>` nor `<MatStepperNext>`/`<MatStepperPrevious>` can be nested
   inside the other (both host-render their own `<button>` root — nesting
   adds a wrapper element, failing DOM parity), so `matButton: boolean |
   MatButtonAppearance` composes the combined markup directly in the SAME
   component, reusing `qwik-material/button/internal/*`'s
   `PersistentRipple`/`FocusIndicator`/`TouchTarget`/`rippleLoaderHostAttrs`/
   `useRippleLoader` — the identical precedent `qwik-material/paginator`'s
   `PaginatorNavButton` already set for combining `matIconButton` +
   `matTooltip` on one element. Omitted (default, every pre-existing parity
   scenario): unchanged bare-button rendering. Covered by
   `specs/examples/angular-parity.spec.ts`'s `mat-stepper/example`.

   **SUPERSEDED (2026-10-31, directive-hooks remediation).** The `matButton` prop above
   duplicated `MatButton`'s chrome inline — exactly the kind of workaround
   `docs/superpowers/specs/2026-10-31-qwik-material-directive-hooks-design.md` replaces.
   `use-stepper-buttons.ts` now holds the directive's actual logic as
   `useMatStepperNext()`/`useMatStepperPrevious(): {hostProps}` — spread onto `<MatButton>`
   directly instead:

   ```tsx
   const next = useMatStepperNext();
   return <MatButton {...next.hostProps}>Next</MatButton>;
   ```

   The `matButton` prop and its inline-chrome-duplicating branch are REMOVED from
   `MatStepperNext`/`MatStepperPrevious`; both are now thin wrappers around the hooks for the
   bare (no `matButton`) case. `mat-stepper/example` was rewritten to call the hooks via two small
   local components (`stepper-nav-buttons.tsx`'s `StepperNextButton`/`StepperPreviousButton`) —
   NOT inline in the route body, because `useContext(MAT_STEPPER_ACTIONS)` resolves by the actual
   rendered component tree, and the route itself is an ANCESTOR of `<MatStepper>`, not a
   descendant (see `use-stepper-buttons.ts`'s own doc comment and `stepper-actions.ts`'s). Full
   `specs/material-stepper` suite (13 scenarios) and `specs/examples`'s `mat-stepper/example`
   (including its interaction step) stay green across the refactor.

## Qwik v2 regression: step content's button labels going missing (2026-11-01)

Upgrading to `@qwik.dev/core@2.0.0-rc.4` broke 10/11 `material-stepper` parity scenarios (plus
`specs/examples`'s `mat-stepper/example`): `<MatStepperNext>`/`<MatStepperPrevious>`'s (and even a
plain `<MatButton>`'s, confirmed with a throwaway repro) `<Slot/>`-projected label text rendered
correctly in the SSR output, then went empty in the live DOM a few hundred ms after mount — timed
exactly to `animationsEnabledClass`'s own 200ms `useVisibleTask$` timer (see "Qwik limitations"
above). Root cause: `MatStepper` used to inline `{s.content}` (a `JSXOutput` VALUE the CONSUMER
builds once and stores in `props.steps` — see `MatStepDef.content`'s doc comment for why steps are
a data array, not nested children) directly in its own JSX. Every re-render of `MatStepper` for a
reason that has NOTHING to do with any step's content (the animations-enabled class flipping,
`isAnimating` toggling, …) re-diffed that content subtree too — and when the content contains a
component that itself projects children via `<Slot/>`, that re-diff silently emptied the slotted
text, even though `s.content` itself never changed (same `JSXOutput` object, since the CONSUMER's
own render — which built it — never re-ran).

Fixed by isolating `s.content` behind its own small `component$` (`StepContent`, in
`mat-stepper.tsx`) instead of inlining it: Qwik skips re-rendering a child component whose props
haven't changed by reference, so `<StepContent content={s.content} />` — same `content` object
every time — never re-renders (and therefore never re-diffs its nested `<Slot/>` projections) just
because `MatStepper` itself did. No API change for consumers; purely internal to how `MatStepper`
renders what it's given.

**This is a GENERAL Qwik v2 hazard, not stepper-specific** — ANY component that stores a
consumer-built `JSXOutput` in a data-array prop (`qwik-material/tabs`'s `MatTabDef.content` has
the exact same shape) and inlines it directly in its own re-rendering JSX is at risk, PROVIDED that
JSXOutput contains a nested `<Slot/>`-using component. `material-tabs`' own scenarios happen not to
exercise this today (every `tabs[].content`/`labelTemplate` in this port's scenarios is either a
plain string or plain HTML elements, never a component with its own `<Slot/>`) — flagging here in
case a future stepper/tabs scenario (or new "steps/tabs-as-data" component) adds one and needs the
same `StepContent`-style isolation wrapper.

## matStepperIcon overrides and matStepContent lazy content (2026-11-03, tier2/datanav)

Ported both previously-cut upstream directives. Gated by three new Qwik-only functional specs
(no upstream docs example exercised `matStepperIcon`'s CONTEXT parameter, and the one example
that DOES exercise both — `stepper-states`/`stepper-lazy-content`, see below — only needed
static override content) plus the existing `specs/examples-data-nav` Angular-parity harness.

**`matStepContent` (lazy content) — `MatStepDef.lazyContent`.** Mirrors `CdkStep._lazyContent`'s
attach gate (`step.ts`'s `ngAfterContentInit`): rendered ONLY once a step is first selected
(including on the VERY FIRST render if a step starts out selected — mirrors the subscription's
own `startWith(this._stepper.selected === this)`), then KEPT forever regardless of later
deselection (upstream never tears the attached `TemplatePortal` down either). A new
`everSelectedStore: boolean[]` in `mat-stepper.tsx` (seeded from the initial `selectedIndex`,
latched `true` by `trySelectIndex$` on every successful move) gates
`{everSelectedStore[i] && s.lazyContent !== undefined && <StepContent content={s.lazyContent} />}`
in both the vertical/horizontal content-rendering branches, appended AFTER the always-eager
`content` (matches `step.html`'s `<ng-content/>` followed by the portal outlet). Reuses the
existing `StepContent` reference-equality wrapper (see that component's own doc comment above) —
safe without `cloneJsxForReuse` for the identical reason `content` already is: each step's
`lazyContent` object is only ever embedded by ONE `StepContent` instance, never twice. `content`
is now OPTIONAL (`MatStepDef.content?: JSXOutput`) since a step can be lazy-only (no eager
children at all) — `stepper-lazy-content`'s steps 1-2 are exactly this shape.

Verified against the REAL upstream behavior this unlocks: `stepper-lazy-content` (see
`qwik-material-examples/stepper/stepper-lazy-content`) previously had to fake this feature —
every step's content rendered eagerly regardless, flagged as a documented, `test.fail()`-gated
gap in `specs/examples-data-nav/angular-parity.spec.ts`'s `EXPECTED_FAILURES`. Steps 1-2 now use
`lazyContent`, step 3 keeps `content` (eager) — matching upstream's own contrast exactly — and
the `test.fail()` gate was REMOVED: the example now passes real DOM parity (an unvisited lazy
step's content is genuinely absent from the DOM on both sides).

**`matStepperIcon` overrides — `MatStepperProps.stepperIcon`.** `Partial<Record<StepState,
JSXOutput>>`, keyed by the icon state it replaces ('number' | 'edit' | 'done' | 'error' | a
custom `step.state` string). `mat-stepper.tsx`'s `renderHeader` looks up
`props.stepperIcon?.[indicatorType]` (computed fresh, inline, at the JSX prop call site — same
rule as every other per-step value here) and passes it as `MatStepHeaderItem`'s new
`iconOverride` prop; `mat-step-header.tsx` renders `cloneJsxForReuse(props.iconOverride)` in
place of the ENTIRE default `.mat-step-icon-content` body (the number span / done-or-edit hidden
label + `<MatIcon>`) when set — mirrors `step-header.html`'s `@if (iconOverrides &&
iconOverrides[state])` branch. `cloneJsxForReuse` IS required here (unlike `content`/
`lazyContent`/`labelTemplate`): the SAME override object can be embedded by MULTIPLE different
`MatStepHeaderItem` instances within a single render whenever more than one step currently
resolves to that state.

**Scope cut: no per-occurrence `MatStepperIconContext` (`{index, active, optional}`).** Upstream
passes each override a FRESH context via `ngTemplateOutletContext`, re-evaluated per step that
reaches that state (any number of steps can share one override). Rendering that synchronously,
per-occurrence, inside `MatStepper`'s own render is not viable in Qwik — invoking a QRL is always
async (the identical finding that already rules out a per-row cell-render callback in
`qwik-material/table`'s SYNC.md), and a plain function captured from props into this port's
render path would not survive SSR→resume regardless (the project's own documented pitfall). So an
override here is a single, STATIC `JSXOutput`, shared by every step currently in that state — a
genuine, confirmed-sufficient simplification: material.angular.dev's OWN `stepper-states` example
(the only upstream docs example exercising `matStepperIcon`) uses purely static `<mat-icon>`
content for both of its overrides (`phone`/`chat`), never referencing `index`/`active`/
`optional`. No parity scenario needs the context either. See `qwik-material-examples/stepper/
stepper-states` (ported 2026-11-03) for the full worked example, including the real, confirmed-live
`STEPPER_GLOBAL_OPTIONS = {displayDefaultIndicatorType: false}` interaction with
`computeIndicatorType` (an initially-selected, editable, non-completed step shows an "edit"
pencil, NOT its number or override, until it's deselected — already correctly handled by the
pre-existing, faithfully-ported `step-logic.ts`, confirmed live against the real Angular app).

## Class count

`grep -rnE "^export class" src/qwik-material/stepper/ 2>/dev/null` → 0 (no
exported classes on the consumer surface).

## Pipeline

`pnpm test:qwik-material` at the repo root runs `build && vitest &&
lint:no-ssr-leaks && typecheck` for the whole qwik-material package,
covering dialog + button + card + toolbar + badge + icon + progress-bar +
progress-spinner + divider + grid-list + list + button-toggle +
slide-toggle + expansion + radio + checkbox + sort + tabs + sidenav +
snack-bar + core + stepper.

## Qwik-only Playwright specs

None added directly in `specs/material-stepper/` — `matStepperIcon`/`matStepContent` are instead
gated by the Angular-mirrored `specs/examples-data-nav/angular-parity.spec.ts` cases for
`stepper-states` (new, 2026-11-03) and `stepper-lazy-content` (now a real, non-`test.fail()`
pass — see this file's own entry above), which exercise both features against the real Angular
DOM, including an interaction step. `specs/material-stepper/angular-parity.spec.ts`'s 11
scenarios and their interaction steps (roving-tabindex keyboard nav with
wrap on arrows/no-wrap on Home-End, horizontal-arrows-work-in-both-
orientations, manual-activation Enter/Space, linear `stepControl` gating,
`editable:false` backward-navigation blocking with its focus-class
asymmetry, the four icon states, custom/plain-string labels, label/header
position, an initial non-zero `selectedIndex`, and the error-state icon +
sub-label) cover every other behavior this port implements against the
real Angular DOM. `qwik-cdk/stepper/
step-logic.spec.ts` (26 tests) and `stepper-keyboard.spec.ts` (5 tests)
cover the pure logic beneath it.
