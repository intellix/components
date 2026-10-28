# qwik-cdk/accordion sync log

Tracks the sync state between this port and `src/cdk/accordion/` upstream. Ported alongside
`qwik-material/expansion` (its only consumer today) per
`docs/superpowers/specs/2026-10-27-qwik-material-remaining-components-roadmap.md` (wave 1).

## Upstream sync state

| File | Upstream path | Sync state | Notes |
| --- | --- | --- | --- |
| `accordion/use-cdk-accordion.ts` | `src/cdk/accordion/accordion.ts` (`CdkAccordion`) | ported | `multi` input + `openAll()`/`closeAll()` methods. `id` dropped (see deviations). `_stateChanges` (an `OnChanges`-driven `Subject<SimpleChanges>`) dropped — nothing in this port's `MatAccordion` needs to react to its OWN prop changes the way upstream's `MatExpansionPanelHeader` constructor subscribes to `panel.accordion._stateChanges` for `hideToggle`/`togglePosition` edits; `qwik-material/expansion`'s header instead re-reads the live `MAT_ACCORDION_STATE` context signal every render, which is already reactive. |
| `accordion/use-cdk-accordion-item.ts` | `src/cdk/accordion/accordion-item.ts` (`CdkAccordionItem`) | ported | Controlled-component surface: consumer owns `expanded` (a signal) + `onExpandedChange$`/`onOpened$`/`onClosed$` QRLs, mirroring the two-way-bindable `expanded` `@Input`/`expandedChange` `@Output` pair. `id` (`cdk-accordion-child-N`) via the shared `qwik-cdk/a11y` id generator. `setExpanded$` collapses upstream's `toggle()`/`open()`/`close()` trio into one function — see deviations for why it is unguarded on `disabled` (faithful to `MatExpansionPanel`'s override of all three, the only consumer of this hook). The unique-selection auto-close and `openAll()`/`closeAll()` reactions are both ported as `useTask$`s tracking the accordion's broadcast signals. |
| `accordion/accordion-state.ts` | (new — `src/cdk/collections/unique-selection-dispatcher.ts`'s role, reframed) | new | Per-accordion-instance `Signal`-based broadcast replacing the RxJS `UniqueSelectionDispatcher` global service. See README.md / `unique-selection.ts`. |
| `accordion/unique-selection.ts` | `src/cdk/accordion/accordion-item.ts`'s dispatcher `listen()` callback | new | Extracted pure predicate (`shouldAutoClose`), independently unit-tested in `unique-selection.spec.ts`. |

## Removed upstream files

- `accordion-module.ts` — Qwik has no module concept.
- `public-api.ts`/`index.ts` — replaced by this port's own (`§` shape matches every other entry point).
- `accordion.spec.ts`/`accordion-item.spec.ts` (Angular `TestBed`-based) — reframed as
  `unique-selection.spec.ts` (pure predicate, DOM-free) + `accordion-state.spec.ts` +
  `accordion-hooks.spec.ts` (export/shape sanity — see that file's own comment for why hook
  integration itself isn't vitest-rendered). Real interaction coverage (auto-close, keyboard nav,
  openAll/closeAll if ever exercised) lives in
  `src/qwik-cdk-parity-tests/specs/material-expansion/*.spec.ts` via `qwik-material/expansion`.
- `CDK_ACCORDION` `InjectionToken` — replaced by `CDK_ACCORDION_STATE` (a `createContextId`, the
  project's standard DI replacement throughout).

## Deviations from upstream

1. **`UniqueSelectionDispatcher` (RxJS `Subject`-backed, provided at the Angular root injector —
   a true cross-app singleton) replaced by a plain `Signal` broadcast scoped to one
   `useCdkAccordion()` instance.** Every real listener is already inside that same instance's
   subtree (reached via context), so the "same accordion" half of upstream's dispatcher condition
   (`this.accordion.id === accordionId`) is true by construction — nothing is lost functionally,
   and it avoids threading a `noSerialize()` listener-array service across the SSR/resume boundary
   for no behavioral gain. See README.md and `unique-selection.ts`'s doc comment.

2. **`CdkAccordion.id` (`cdk-accordion-N`) dropped entirely.** It existed upstream only to be the
   `name` half of dispatcher notifications (deviation #1 makes that comparison unnecessary) and is
   never rendered to the DOM (no `[attr.id]` host binding on `CdkAccordion` or `MatAccordion`).

3. **`CdkAccordion._stateChanges` (`OnChanges`-driven `Subject<SimpleChanges>`) dropped.** Its only
   upstream consumer, `MatExpansionPanelHeader`'s constructor-time subscription for
   `hideToggle`/`togglePosition` edits, is replaced by `qwik-material/expansion`'s header simply
   re-reading the live, already-reactive `MAT_ACCORDION_STATE` context signal on every render.

4. **`CdkAccordionItem.toggle()`/`open()`/`close()` collapsed into one `setExpanded$(next)`,
   unguarded on `disabled`.** Upstream's base versions DO check `disabled`, but
   `MatExpansionPanel` — this hook's only consumer — overrides all three to drop that check
   entirely (`src/material/expansion/expansion-panel.ts`); the guard moves one layer up, to
   `MatExpansionPanelHeader`'s click/keydown handler declining to call `setExpanded$` at all. A
   future second consumer that wants the base (guarded) behavior should check `disabled` itself
   before calling, same as upstream's header does. `openAll()`/`closeAll()`'s reaction (a
   *different* internal method, `_subscribeToOpenCloseAllActions`, which Material does NOT
   override) keeps its `disabled` guard.

5. **`ChangeDetectorRef.markForCheck()` calls dropped.** No change-detection system to notify;
   Qwik signal writes are their own reactivity trigger.

6. **`Directive` host metadata, `@Input`/`@Output` decorators, `booleanAttribute` transform,
   `inject()` DI → plain function parameters + Qwik hooks/QRLs.** `CDK_ACCORDION`
   `InjectionToken` → `CDK_ACCORDION_STATE` `createContextId`.

## Pipeline

`pnpm test:qwik-cdk` at the repo root runs `build && vitest && lint:no-ssr-leaks` for the whole
qwik-cdk package, covering platform + bidi + coercion + keycodes + portal + a11y + accordion +
overlay + dialog.
