# qwik-material/chips sync log

Tracks the sync state between this port and `src/material/chips/` upstream.
Every deviation from a verbatim copy is recorded here. Companion to
`src/qwik-material/dialog/SYNC.md`, `src/qwik-material/button/SYNC.md`,
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
`src/qwik-material/snack-bar/SYNC.md`, `src/qwik-material/stepper/SYNC.md`,
and `src/qwik-material/core/SYNC.md`.

Ported 2026-10-28 against upstream, following
`docs/superpowers/specs/2026-10-27-qwik-material-dom-parity-remediation-design.md`
and `...-remaining-components-roadmap.md`. Gated from the start by
`src/qwik-cdk-parity-tests/specs/material-chips/angular-parity.spec.ts`
(11/11 scenarios passing — basic, avatar-trailing-icon, removable,
listbox-single, listbox-multiple, listbox-hide-indicator,
listbox-not-selectable, colors, grid-input, grid-disabled,
listbox-vertical — run 3× clean). See that spec's long header comment for
the full DOM contract (shared structure, role split across the three
container types, action-class rules, the ripple-loader contract, id
generation) — it is the authoritative source this port was built against,
not just upstream's source code.

## Upstream sync state

| File | Upstream path | Sync state | Notes |
| --- | --- | --- | --- |
| `chips/mat-chip.tsx` | `src/material/chips/chip.ts` (`MatChip`) + `chip.html` | ported | The base, non-selectable, non-removable-by-default chip. Reproduces several base `MatChip` host bindings that `MatChipOption`/`MatChipRow` inherit via Ivy's host-metadata inheritance across `@Component` subclassing (confirmed live) even though those subclasses' own `host: {}` objects never redeclare them — see this file's own `rippleDisabledInitial` doc comment for the upstream construction-time ripple-disabled quirk (frozen `true` at first paint, corrected only by some LATER change-detection pass triggered elsewhere on the page) |
| `chips/mat-chip-set.tsx` | `src/material/chips/chip-set.ts` (`MatChipSet`) | ported | Takes `chips: MatChipDef[]` instead of nested `<MatChip>` children — see this file's own module doc comment for why (the container's `role`/the subclasses' `tabIndex`/`aria-required` all depend on child COUNT at SSR time, which a `component$` can never discover from `<Slot>`-projected children; same reasoning as `qwik-material/tabs`' `MatTabDef[]` and `stepper`'s `MatStepDef[]`). Owns `fixupRippleDisabled$`, the container-level imperative correction for `MatChip`'s construction-time ripple-disabled quirk, deferred one frame via `requestAnimationFrame` and triggered by `pointerdown`/`keydown`/`focusin` |
| `chips/mat-chip-option.tsx` | `src/material/chips/chip-option.ts` (`MatChipOption`) + `chip-option.html` | ported | Reads selection from the `MAT_CHIP_LISTBOX_SELECTION` context signal (see `internal/listbox-selection.ts`) instead of trusting its own `selected` prop whenever nested in a `<MatChipListbox>` — a real Qwik reactivity gap, found live, where a `.map()`-rendered child with a stable key does not reliably re-render when only a field value changes. Primary action is always `tabIndex={-1}` (`allowFocusWhenDisabled` is always `true` upstream for the listbox case) |
| `chips/mat-chip-listbox.tsx` | `src/material/chips/chip-listbox.ts` (`MatChipListbox`) | ported | Takes `options: MatChipOptionDef[]`. Provides `MAT_CHIP_LISTBOX_SELECTION`, recomputed fresh every render. Keyboard nav (`ArrowLeft`/`Up` back, `ArrowRight`/`Down` forward, `Home`/`End`) queries `button[role="option"]` elements directly and clamps at the ends — upstream's `FocusKeyManager` is configured with both orientations regardless of `aria-orientation` but never `.withWrap()`. Multi-select's `onChange$` value is computed in DOM order (`options.filter(...).map(o => o.value)`), not selection order — confirmed live this differs from append order |
| `chips/mat-chip-row.tsx` | `src/material/chips/chip-row.ts` (`MatChipRow`) + `chip-row.html` | ported | Primary action is a `<span role="gridcell" matChipAction>`, never a `<button>` (unlike `MatChipOption`). Unlike `MatChipSet`'s chips, the primary gridcell's class string merges the `mdc-evolution-chip__cell`/`--primary` classes onto the SAME element as the action classes — confirmed live this is how upstream combines them for rows specifically. `onRemoved$` receives the triggering `FocusOrigin` explicitly (see Deviations #2) |
| `chips/mat-chip-grid.tsx` | `src/material/chips/chip-grid.ts` (`MatChipGrid`) + `src/material/chips/chip-input.ts` (`MatChipInputFor`, folded in as the `input` prop) | ported | Takes `rows: MatChipRowDef[] \| Signal<MatChipRowDef[]>` (see Deviations #1 for why the `Signal` escape hatch exists) and an `input: MatChipGridInputDef` descriptor folding in `matChipInputFor`'s behavior (separator-key handling via `MAT_CHIPS_CONFIG.separatorKeys`, Backspace-focuses-last-row, `onTokenEnd$`). Wired as a `MatFormFieldControl` via `MAT_FORM_FIELD_CONTROL_STATE`, same mechanism `MatInput` already uses — the grid's OWN `id` defaults to `mat-chip-grid-#`, but once given an `input`, delegates to the input's id instead (`controlType="mat-chip-grid"` must be set explicitly by the consumer; see this file's own module doc comment for why `MatFormField`'s `controlType ?? 'mat-input'` fallback assumes `MatInput`) |
| `chips/tokens.ts` | `src/material/chips/tokens.ts` (`MAT_CHIPS_DEFAULT_OPTIONS`) | ported | `separatorKeys` uses plain `KeyboardEvent.key` strings (`'Enter'`, …) instead of upstream's keycode-based `SeparatorKey`/number shape — this port has no keycode table to mirror and `event.key` is the direct, non-deprecated equivalent. Provided via `<QwikMaterialProvider matChipsConfig={...}>` → `MAT_CHIPS_CONFIG` |
| `chips/internal/listbox-selection.ts` | (new — Qwik-specific plumbing) | new | `MAT_CHIP_LISTBOX_SELECTION` context-provided signal — see its own extensive doc comment for the Qwik reactivity gap it exists to work around |
| `chips/internal/ripple-loader.ts` | `src/material/core/private/ripple-loader.ts` (`MatRippleLoader`) | ported | Identical mechanism to `qwik-material/button/internal/ripple-loader.ts` (see that file + `button/SYNC.md`), duplicated per this package's "each entry point owns its own `internal/` helpers" convention. Qualifying events are `focusin` (not `focus` — doesn't bubble from the descendant button/gridcell that actually receives it) + `mousedown`/`mouseenter`/`touchstart`, plus (2026-10-30 ripple-animation remediation, `core/ripple/`) `mouseup`/`mouseleave`/`touchend`/`touchcancel` on the SAME shared `$()` reference — real `.mat-ripple-element` spans now launch via `core/ripple/ripple-dom.ts`'s `handleRippleEvent()` once the lazily-created `.mat-ripple` span exists; see `core/SYNC.md`'s new ripple section for the full writeup, including the cross-chunk pointer-up race this shared-reference requirement fixes |
| `scss/chips/chip.scss`, `chip-set.scss`, `_m2-chip.scss`, `_m3-chip.scss`, `_chips-theme.scss` | same names upstream | synced | Byte-for-byte copies; `chip.scss` is the only file needing the cdk-stub swap: `@use '@angular/cdk';` → `@use '../cdk-stub' as cdk;` |
| `scss/chips/chips-prebuilt.scss` | (qwik-material-specific) | new | `@use`s the structural partials + `:root` defaults for every `--mat-chip-*`/`--mat-sys-*` custom property they reference, following the established prebuilt-reconciliation pattern (e.g. `button-toggle-prebuilt.scss`) |

## Removed upstream files

- `chips-module.ts` — Qwik has no module concept.
- `testing/` (`MatChipHarness` and friends) — Angular test harness surface; no equivalent needed.
- Upstream `public-api.ts`/`index.ts` — replaced with this port's own re-export shape.
- `chip-action.ts` (`MatChipAction`/`MatChipContent`) — no standalone component; the primary cell is rendered directly by `MatChip`/`MatChipOption`/`MatChipRow` with the `matchipcontent`/`matchipaction` marker attributes the parity harness expects (see `CONSUMER_SELECTOR_ATTRS` vs. the template's own attrs in the parity spec header).
- `chip-icons.ts` (`MatChipAvatar`/`MatChipTrailingIcon`/`MatChipRemove`/`MatChipEditInput`/the edit-related directives) — reduced to plain `JSXOutput` props (`avatar`, `trailingIcon`, `removeButton: {content, 'aria-label', disabled}`) on the owning chip, following the same "directive → prop" pattern used throughout this port (e.g. card's `MatCardImage`). `matChipEdit`/inline editing (`MAT_CHIP_EDIT`, `chip-edit-input.ts`) is NOT implemented at all — no parity scenario exercises it (see Deviations #3).
- `chip-text-control.ts` (`_MatChipTextControl` interface) — a TypeScript-only structural interface; no runtime behavior to port.
- `chip.spec.ts`/`chip-set.spec.ts`/`chip-option.spec.ts`/`chip-row.spec.ts`/`chip-listbox.spec.ts`/`chip-input.spec.ts`/`chip-remove.spec.ts`/`chip-edit-input.spec.ts`/`chip-grid.spec.ts` (Angular `TestBed`-based) — not ported 1:1; their behavioral surface is covered far more rigorously by `angular-parity.spec.ts`'s live DOM diffing against the real Angular reference app than a reimplemented `TestBed` spec could achieve in this port. The pure, non-component pieces introduced by this port (`MAT_CHIPS_CONFIG_DEFAULTS`, `MAT_CHIP_LISTBOX_SELECTION`'s shape, `rippleLoaderHostAttrs()`) are unit-tested directly in `tokens.spec.ts`/`internal/listbox-selection.spec.ts`/`internal/ripple-loader.spec.ts` instead — same convention `button-toggle/button-toggle-state.spec.ts` set.

## Deviations from upstream

1. **`MatChipGrid.rows` accepts `MatChipRowDef[] | Signal<MatChipRowDef[]>`, not a plain array.**
   `<MatChipGrid>`'s one real upstream use is nested as `<MatFormField control={<MatChipGrid
   rows={...} .../>}>`. A plain array value passed there is **frozen after the very first
   render** — confirmed live via a repro that reproduces `form-field/SYNC.md`'s documented
   "touched/dirty/invalid" nested-prop-staleness finding one level further down: the whole
   `<MatChipGrid rows={...}/>` JSX descriptor is itself the VALUE of `<MatFormField>`'s
   `control` prop, and only that SPECIFIC prop value stays stuck at whatever it was on the very
   first render — `<MatFormField>` itself, and even `<MatChipGrid>`'s OWN re-renders (triggered
   for an unrelated reason), keep running correctly the whole time. Any consumer whose rows can
   change after mount (add/remove — e.g. `grid-input`) must pass a `Signal<MatChipRowDef[]>`
   instead, created once and reassigned on every one of the OWNING route/component's own
   renders — the same "signal reassigned on every provider render" pattern
   `MatButtonToggleGroup`/`MatChipListbox`'s own selection context already use.
2. **`MatChipRow.onRemoved$` receives the triggering `FocusOrigin` explicitly, not read back
   off the DOM afterward.** `<MatChipGrid>` needs to know which origin (`'mouse'` for a click,
   `'keyboard'` for Enter/Space on the remove button or Backspace/Delete on the row itself)
   caused a removal, to correctly replay it via `focusVia()` on whichever row slides into the
   removed one's place. Reading it back off the removed row's own `cdk-*-focused` class, after
   the fact, races the SAME click's own pending `focusin`-triggered class update and isn't
   reliable (confirmed live) — so `onRemoved$`'s signature carries `(origin?: FocusOrigin) =>
   void` and all three remove-trigger call sites pass it directly. `MatChipGrid`'s
   redirect additionally strips stale `cdk-*-focused` classes from every surviving row first,
   since a SIBLING row re-rendering for an unrelated reason (the array itself changing, not its
   own focus event) can leave an earlier class assignment in place.
3. **Inline editing (`matChipEdit`/`MatChipEditInput`) is not implemented.** No parity scenario
   in `src/dev-app/qwik-parity/chips.ts` exercises it. `MatChipRow`'s Enter-key handling is a
   documented no-op (would otherwise start/finish an edit upstream).
4. **The construction-time `mat-ripple-loader-disabled` correction only ever applies to rows/
   chips that existed at mount.** Upstream's `_isRippleDisabled()` runs once in the base
   `MatChip`'s constructor, before `@ContentChild`/`@ViewChild` queries resolve, so a chip is
   ripple-disabled at first paint regardless of its actual interactive-action content —
   corrected only once SOME LATER Angular change-detection pass (triggered by any event
   anywhere on the page) re-evaluates it. Confirmed live this correction does NOT apply
   uniformly: `MatChipOption` never exhibits it at all (always ripple-enabled from the first
   render); `MatChipRow`/base `MatChip` do; and a row added dynamically AFTER a grid's initial
   mount (`grid-input`'s "Mango", added via `onTokenEnd$`) is NEVER corrected within this test's
   scope, unlike the rows present at mount. `MatChipSet`/`MatChipGrid` both reproduce this with
   an imperative, `requestAnimationFrame`-deferred, idempotent container-level fix-up
   (`fixupRippleDisabled$`) scoped to a `mountedRowKeys`/equivalent set computed once at mount,
   matching what's actually observed rather than guessing at upstream's exact trigger.
5. **Qwik reactivity note: selection state flows to each `<MatChipOption>` through a
   context-provided signal, not its own `selected` prop.** See `internal/listbox-selection.ts`'s
   own doc comment — a real, reproducible Qwik gap: a `.map()`-rendered child with a stable
   `key` does not reliably re-render when only a field value changes (array length/keys
   unchanged). A context signal, reassigned by the provider on every one of ITS OWN renders and
   read fresh by the consumer, is the one mechanism proven reliable elsewhere in this port
   (`MatButtonToggleGroup`/`MatButtonToggle`, `MatFormField`/`MAT_FORM_FIELD_CONTROL_STATE`) and
   is used here too.
6. **`useOn()`'s registered handler can hold a stale QRL closure across re-renders.** Found
   while fixing `MatChipGrid`'s `fixupRippleDisabled$`: closing over outer-scope `rows`/
   `disabled` consts captured at an earlier render caused an index-mismatch once the rows array
   changed shape (one row removed, a different one added) between the render that created the
   listener and the later event that actually fired it. Fixed by re-reading `props.rows`/
   `props.disabled` live inside the handler body on every invocation — the same lesson
   `MatButtonToggleGroup`'s own `onClick$` doc comment already documents ("re-read live state
   inside the closure"), now confirmed to also apply to `useOn()`-registered handlers, not just
   click handlers.
7. **Icon-like content is always a plain `JSXOutput` prop, never a dedicated icon component.**
   `qwik-material/icon` is out of scope for this port's chips scenarios — avatars/trailing
   icons/remove glyphs are plain text/spans, matching the parity spec's own stated scope.
8. **RESOLVED. A genuine Qwik 1.20 CORE bug — not a chips- or form-field-specific issue —
   could intermittently destroy `<mat-chip-grid>` without recreating it on ANY rows change
   (add OR remove).** Originally found via repeated (40+ back-to-back) stress-testing of
   `grid-input`'s "type Mango + Enter" step: roughly 1 in 15-30 runs, Qwik logs "Rendering
   promises in JSX signals is not supported" (a swallowed, not thrown, error) and
   `<mat-chip-grid>` itself goes missing from the DOM afterward, never recreated.

   **Root cause, confirmed by instrumenting Qwik's own built dist (not inferred from reading
   source alone).** `<MatChipGrid>` is the JSX VALUE of `<MatFormField control={...}>`'s
   `control` prop. `MatFormField` renders that prop directly (`{props.control}`), and Qwik's
   optimizer compiles a directly-forwarded prop like that into a `_fnSignal`-wrapped binding
   (`a((l) => l.control, [e])` in the compiled output) so that updating `control` does NOT
   require a full `MatFormField` re-render — this is the SAME mechanism `form-field/SYNC.md`'s
   architecture section documents as load-bearing ("a prop directly on an element returned
   from a component's own JSX tree... updates correctly"). Every time the `grid-input` route
   re-rendered (e.g. because `fruits.value` changed) it constructed a BRAND NEW
   `<MatChipGrid .../>` JSX object for `control` — a different reference every time, even
   though the actual row data flows through a stable `Signal`. That reference change fires
   the `_fnSignal` binding, which runs through Qwik core's `executeSignalOperation`
   (`packages/qwik/src/core` — search dist for the exact error string). When the OLD and NEW
   vnode being compared there don't structurally match — which, confirmed via instrumented
   logging, is true on effectively every invocation of this path once a deep component
   subtree like `MatChipGrid`/`ChipGridRows`/`MatChipRow` is involved — it falls into a
   "fully replace the element" branch that calls `createElm()` and collects whatever async
   QRL-resolution promises that produces into an array... which is **never awaited**:
   ```js
   const promises = []; // TODO(misko): hook this up
   const newElm = createElm(rCtx, newVnode, 0, promises);
   if (promises.length) logError('Rendering promises in JSX signals is not supported');
   insertBefore(rCtx.$static$, elm.parentElement, newElm, oldNode);
   oldNode && removeNode(staticCtx, oldNode);
   ```
   That `// TODO(misko): hook this up` is Qwik's own maintainer leaving this path
   unfinished. `insertBefore`/`removeNode` run immediately regardless of whether
   `promises.length` is nonzero. Direct `isConnected` checks around that exact call
   (instrumented into the running dist) confirmed the replacement element is briefly
   DISCONNECTED from the live DOM — it normally self-heals within about 1ms once the dangling
   promise resolves, but nothing guarantees that: if anything else touches the DOM in that
   window, the replacement is permanently orphaned. This reproduced at roughly the same
   1-in-15-to-30 rate originally documented, via 40+ repeated runs of a throwaway Playwright
   script against the instrumented dist (reproduced both the "error logged, self-heals" case
   and, separately, confirmed the mechanism explains the rarer permanent-loss case).

   Extracting the row list into its own `component$` boundary (`ChipGridRows`), switching
   `rows`' delivery mechanism between a prop-`Signal` and a dedicated context, and several
   bounded self-healing retries written INSIDE `MatChipGrid` (all tried in earlier passes at
   this bug, before the root cause above was found) correctly did NOT reduce the failure
   rate — the failure is in Qwik core's handling of the `control`-prop-forwarding binding
   itself, genuinely above anything `MatChipGrid` can influence from inside itself. A targeted
   test that gave `<MatChipGrid key="...">` a stable key also did NOT help — the mismatch
   `executeSignalOperation` detects is NOT about JSX `key` matching; `getVnodeFromEl()`
   (reconstructing a vnode from live DOM state) can never recover a component's internal
   auto-key, so the "replace" branch is taken regardless of what explicit key the element has.

   **The fix: never let `control`'s own JSX-object REFERENCE change after `MatFormField`'s
   first render**, so the `_fnSignal` binding for it never fires again and the broken replace
   path is never reached. Implemented entirely in `form-field/mat-form-field.tsx`: `props.control`
   is snapshotted ONCE into a `useSignal` on `MatFormField`'s first render, and that frozen
   reference is used for both the static `readControlProps()` read AND the actual
   `{controlSnapshot.value}` render — see that signal's own doc comment there for the full
   write-up. This is consistent with, not a new constraint on top of, the EXISTING documented
   architecture: `control`'s nested prop values were already "read once, never again" for
   everything that matters there (`disabled`/`required`/`controlType`/`formBound`; anything
   that must change later already goes through a top-level prop or
   `MAT_FORM_FIELD_CONTROL_STATE`, never through re-reading `control` itself), so freezing the
   reference too changes nothing for any already-supported use case. Rows/value updates still
   flow correctly because `<MatChipGrid>` dereferences its OWN `rows` `Signal` on every one of
   ITS OWN re-renders (Deviation #1) — a completely separate, ordinary reactive update that
   never touches this `control`-forwarding binding at all.

   `grid-input`'s dev-app route no longer needs (and no longer has) ANY special workaround —
   the `formFieldRemountNonce`/rAF-polling self-healing remount that previously lived there
   has been removed; the route now constructs `<MatChipGrid rows={rowsSignal} .../>` inline,
   the natural way any consumer would write it. **Verified:** `grid-input` with
   `--repeat-each=20` passes 20/20 (previously intermittently failing); the full
   `specs/material-chips` (11 scenarios) and `specs/material-form-field` (16 scenarios,
   including `error-state`, which exercises the OTHER half of this same architecture — the
   top-level `touched`/`dirty`/`invalid` live-reactivity path — confirming the snapshot
   doesn't regress it) both pass 3× clean; a throwaway 40-iteration Playwright stress script
   (fresh page load, type "Mango" + Enter, Backspace) shows 0/40 failures, down from a
   reproducible ~15% failure rate on the pre-fix build using the identical script.

   This was previously flagged as affecting a LATER step too (the same recreation firing
   again during removes, leaving focus on neither chip) — since the fix removes the
   recreation entirely (not just the add-step symptom), that residual failure mode is also
   resolved; the 3× full-suite `grid-input` runs above exercise the add-then-remove sequence
   in full and are clean.
9. **`MatChipSet`'s `fixupRippleDisabled$` had the SAME stale-`useOn()`-closure bug as
   `MatChipGrid`'s, independently.** Closed over the outer-scope `chips`/`disabled` consts
   instead of re-reading `props.chips`/`props.disabled` live inside the handler — found live
   via repeated-run testing of `removable`'s "click remove(0)" step mismatching a surviving
   chip's `mat-ripple-loader-disabled` attribute once the chip count changed between when the
   listener was registered and when it actually fired. Fixed the same way `MatChipGrid`'s own
   version already was (see Deviation #6) — confirmed this specific scenario stopped failing
   across repeated runs once fixed.

   This recreation ALSO broke `fixupRippleDisabled$`'s original "mountedRowKeys" design (a
   `useSignal` seeded once from `rows` at THIS component instance's own mount): a fresh
   instance's "rows I saw at my own mount" wrongly includes a row that was genuinely added
   dynamically, well before that particular instance existed, incorrectly applying the
   construction-time ripple-disabled correction to it. Fixed by replacing that local,
   per-instance set with an explicit, consumer-set `MatChipRowDef.dynamicallyAdded` flag,
   which survives the instance being recreated because it lives in the consumer's own state,
   never recomputed by `MatChipGrid` itself. (Also confirmed live via a 40-run repeat: briefly
   tried applying the ripple-disabled correction unconditionally to every row instead of
   excluding dynamically-added ones — this was dramatically WORSE, not a timing-dependent
   wash. Upstream reliably does NOT correct a dynamically-added row within this suite's
   interaction window, so excluding it is the right default.)

## Shared infrastructure touched by this port

- **`qwik-material/form-field/mat-form-field.tsx`** — added a conditional `useVisibleTask$`
  (gated on `hasOutline && initialControlShouldFloat && hasFloatingLabel`, matching
  `tabs/use-paginated-header.ts`'s precedent for a scoped, eslint-disabled visible task) right
  after the existing notch-width `useTask$`. That task's first run is during SSR, with no real
  DOM to measure `scrollWidth` against; for a control that starts ALREADY floating (a chip-grid
  seeded with existing chips never "flips" `shouldLabelFloat` again), the task never gets a
  second chance once real DOM exists. Zero-cost for every other form-field scenario, none of
  which start floated.
- **`qwik-cdk-parity-tests/lib/material-parity.ts`** — `snapshotParityRoot()` now also waits
  (generically, `.catch(() => {})`-guarded, 3s timeout) for `.mat-form-field-animations-enabled`
  on every `.mat-mdc-form-field` before every snapshot, mirroring
  `material-form-field/angular-parity.spec.ts`'s own local `settle` step. The harness opens
  Angular first, then Qwik, so Angular's 300ms `ngAfterViewInit` timer always has a head start
  by the time both pages are ready — this generalizes form-field's fix to any component that
  merely embeds a form field (chips' `grid-input`/`grid-disabled`), the same way the
  ripple-element wait just above it already does for ripples. A no-op (`Array.prototype.every`
  on an empty NodeList) for every scenario with zero form fields.
- **`qwik-material/dialog/qwik-material-provider.tsx`** — added `matChipsConfig?: MatChipsConfig`
  prop, providing `MAT_CHIPS_CONFIG`.
- **`qwik-material/package.json`/`vite.config.ts`** — new `"./chips"` + `"./chips-prebuilt.css"`
  export entries.
- **`qwik-cdk-dev-app/src/root.tsx`** — imports `chips-prebuilt.css`.

## Dev-app routes

`src/qwik-cdk-dev-app/src/routes/mat-chips/<scenario>/` for all 11 scenarios: `basic`,
`avatar-trailing-icon`, `removable`, `colors`, `listbox-single`, `listbox-multiple`,
`listbox-hide-indicator`, `listbox-not-selectable`, `listbox-vertical`, `grid-input`,
`grid-disabled` — each mirroring `src/dev-app/qwik-parity/chips.ts`'s corresponding scenario
exactly, with `<div data-parity-root>` wrapping the parity-compared markup and `<main
data-scenario-ready>ready</main>` outside it.
