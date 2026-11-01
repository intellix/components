import {createContextId, type Signal} from '@qwik.dev/core';

/**
 * Broadcast written by `useCdkAccordionItem()`'s `setExpanded$` whenever an
 * item transitions to expanded. The Qwik-signal equivalent of upstream's
 * `UniqueSelectionDispatcher.notify(id, accordionId)`
 * (`src/cdk/collections/unique-selection-dispatcher.ts`), scoped to one
 * accordion instance via context instead of a global listener array — see
 * `unique-selection.ts` for why that scoping makes the id comparison free.
 * A fresh object literal on every write guarantees signal subscribers
 * re-run even if the same item broadcasts twice in a row (object identity
 * always differs; Qwik signals do not deep-compare).
 */
export interface CdkAccordionOpenedBroadcast {
  itemId: string;
}

/**
 * Broadcast written by `useCdkAccordion()`'s `openAll$`/`closeAll$` — the
 * signal equivalent of upstream's `CdkAccordion._openCloseAllActions` RxJS
 * `Subject<boolean>`.
 */
export interface CdkAccordionOpenCloseAllBroadcast {
  open: boolean;
}

export interface CdkAccordionState {
  /** Whether the accordion allows more than one expanded item at a time. */
  multi: boolean;
  /** Latest "an item opened" broadcast, or `null` before the first one. */
  opened: Signal<CdkAccordionOpenedBroadcast | null>;
  /** Latest `openAll()`/`closeAll()` broadcast, or `null` before the first one. */
  openCloseAll: Signal<CdkAccordionOpenCloseAllBroadcast | null>;
}

/**
 * Context published by `useCdkAccordion()`. Carries a `Signal<CdkAccordionState>`
 * — not the state object directly — so a descendant that dereferences
 * `.value` sees a later accordion render's state even though
 * `useCdkAccordion()` rebuilds the state object fresh on every render. A
 * plain object passed straight to `useContextProvider()` would not notify
 * already-resumed consumers when the producer re-renders with a new object;
 * see `qwik-material/button-toggle`'s `MAT_BUTTON_TOGGLE_GROUP_STATE` for
 * the fuller rationale this mirrors.
 */
export const CDK_ACCORDION_STATE = createContextId<Signal<CdkAccordionState>>(
  'qwik-cdk/accordion-state',
);

/**
 * Fallback for `useCdkAccordionItem()` used without a `useCdkAccordion()`
 * ancestor (a standalone item — upstream's `accordion` field is `undefined`
 * in that case). `multi: true` so a standalone item's own broadcast (there
 * is no sibling to coordinate with) can never auto-close it.
 */
export const CDK_ACCORDION_STATE_DEFAULTS: CdkAccordionState = {
  multi: true,
  opened: {value: null} as Signal<CdkAccordionOpenedBroadcast | null>,
  openCloseAll: {value: null} as Signal<CdkAccordionOpenCloseAllBroadcast | null>,
};
