import {$, useContextProvider, useSignal, type QRL} from '@builder.io/qwik';
import {
  CDK_ACCORDION_STATE,
  type CdkAccordionOpenCloseAllBroadcast,
  type CdkAccordionOpenedBroadcast,
  type CdkAccordionState,
} from './accordion-state';

export interface UseCdkAccordionOptions {
  /**
   * Whether more than one item may be expanded at once. Mirrors
   * `CdkAccordion.multi` (`src/cdk/accordion/accordion.ts`). Default false.
   */
  multi?: boolean;
}

export interface CdkAccordionApi {
  multi: boolean;
  /**
   * Opens every enabled descendant item. No-op unless `multi` — mirrors
   * upstream's `openAll()`, which only forwards the request when
   * `this.multi`.
   */
  openAll$: QRL<() => void>;
  /**
   * Closes every enabled descendant item. Mirrors upstream's `closeAll()`,
   * which (unlike `openAll()`) works regardless of `multi`.
   */
  closeAll$: QRL<() => void>;
}

/**
 * Qwik port of `CdkAccordion` (`src/cdk/accordion/accordion.ts`): manages
 * the expanded state of `useCdkAccordionItem()` descendants reached through
 * `CDK_ACCORDION_STATE` context. Call once, from the component that renders
 * the accordion's own host element (e.g. `MatAccordion`).
 *
 * `id` (upstream's `_IdGenerator`-minted `cdk-accordion-N`) is intentionally
 * not ported: it is pure internal bookkeeping for the unique-selection
 * dispatcher's cross-accordion id comparison, which this port's
 * per-instance-context scoping makes unnecessary (see `unique-selection.ts`),
 * and it is never rendered to the DOM (`MatAccordion`'s host bindings never
 * reference it).
 */
export function useCdkAccordion(options: UseCdkAccordionOptions = {}): CdkAccordionApi {
  const multi = options.multi ?? false;
  const opened = useSignal<CdkAccordionOpenedBroadcast | null>(null);
  const openCloseAll = useSignal<CdkAccordionOpenCloseAllBroadcast | null>(null);

  const state: CdkAccordionState = {multi, opened, openCloseAll};
  const stateSignal = useSignal<CdkAccordionState>(state);
  stateSignal.value = state;
  useContextProvider(CDK_ACCORDION_STATE, stateSignal);

  return {
    multi,
    openAll$: $(() => {
      if (multi) {
        openCloseAll.value = {open: true};
      }
    }),
    closeAll$: $(() => {
      openCloseAll.value = {open: false};
    }),
  };
}
