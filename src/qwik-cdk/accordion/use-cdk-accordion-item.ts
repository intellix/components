import {$, useContext, useSignal, useTask$, type QRL} from '@qwik.dev/core';
import {useIdGenerator} from '../a11y/id-generator';
import {CDK_ACCORDION_STATE, CDK_ACCORDION_STATE_DEFAULTS} from './accordion-state';
import {shouldAutoClose} from './unique-selection';

export interface UseCdkAccordionItemProps {
  /**
   * Current expanded state. This port is a controlled component (design
   * doc: "API stays migration-friendly") — the consumer owns the boolean
   * (a signal fed through `onExpandedChange$`), mirroring upstream's
   * two-way-bindable `expanded` `@Input`/`expandedChange` `@Output` pair.
   * Default false.
   */
  expanded?: boolean;
  /** Mirrors `CdkAccordionItem.disabled`. Default false. */
  disabled?: boolean;
  /** Fires on every expansion-state change — the `expandedChange` half of
   *  upstream's two-way binding. */
  onExpandedChange$?: QRL<(expanded: boolean) => void>;
  /** Mirrors the `opened` `@Output`. */
  onOpened$?: QRL<() => void>;
  /** Mirrors the `closed` `@Output`. */
  onClosed$?: QRL<() => void>;
}

export interface CdkAccordionItemApi {
  /** `cdk-accordion-child-N`, minted once via the shared id generator —
   *  mirrors upstream's `readonly id = inject(_IdGenerator).getId(...)`
   *  field initializer. */
  id: string;
  /**
   * Sets the expanded state, firing `onExpandedChange$`/`onOpened$`/
   * `onClosed$` and (on open, in a non-multi accordion) the
   * unique-selection broadcast — all exactly as upstream's `expanded`
   * setter does. Passing the value the item is already at no-ops (mirrors
   * the setter's `if (this._expanded !== expanded)` guard).
   *
   * Deliberately NOT gated on `disabled` here: upstream's base
   * `CdkAccordionItem.toggle()/open()/close()` do check `disabled`, but
   * `MatExpansionPanel` (`src/material/expansion/expansion-panel.ts`)
   * overrides all three WITHOUT that check — disabled-ness is enforced one
   * layer up, by `MatExpansionPanelHeader`'s click/keydown handler
   * declining to call this at all. A caller that wants the base CDK
   * behavior should check `disabled` itself before calling, same as
   * upstream's header does.
   */
  setExpanded$: QRL<(expanded: boolean) => void>;
}

/**
 * Qwik port of `CdkAccordionItem` (`src/cdk/accordion/accordion-item.ts`).
 * Call once, from the component that renders an accordion item's own host
 * element (e.g. `MatExpansionPanel`) — pass `props` directly (not a
 * destructured copy), so the reactive tasks below always read the LIVE
 * current prop values instead of a stale closure from whichever render
 * last registered them (the same discipline
 * `qwik-material/button-toggle`'s `onClick$` follows — see that file's own
 * comment for why a destructured outer-scope const can go stale across
 * Qwik re-renders / replayed events).
 */
export function useCdkAccordionItem(props: UseCdkAccordionItemProps): CdkAccordionItemApi {
  const idGen = useIdGenerator();
  // Lazy initializer — runs exactly once per instance, mirroring upstream's
  // field initializer (which also runs exactly once, at construction).
  const id = useSignal(() => idGen.getId('cdk-accordion-child-'));

  const accordion = useContext(CDK_ACCORDION_STATE, {value: CDK_ACCORDION_STATE_DEFAULTS});

  // Unique-selection auto-close: mirrors the dispatcher `listen()` callback
  // CdkAccordionItem registers in `ngOnInit`. No `disabled` check here —
  // upstream's listener callback sets `this.expanded = false` directly
  // (the raw setter), which has none either.
  useTask$(({track}) => {
    const broadcast = track(() => accordion.value.opened.value);
    if (!broadcast) return;
    if (
      shouldAutoClose({
        multi: accordion.value.multi,
        selfId: id.value,
        openedId: broadcast.itemId,
        currentlyExpanded: props.expanded ?? false,
      })
    ) {
      props.onExpandedChange$?.(false);
      props.onClosed$?.();
    }
  });

  // openAll()/closeAll(): mirrors `_subscribeToOpenCloseAllActions()`,
  // which DOES check `disabled` (it is not one of the three methods
  // MatExpansionPanel overrides).
  useTask$(({track}) => {
    const broadcast = track(() => accordion.value.openCloseAll.value);
    if (!broadcast || props.disabled) return;
    const current = props.expanded ?? false;
    if (broadcast.open === current) return;
    props.onExpandedChange$?.(broadcast.open);
    if (broadcast.open) {
      props.onOpened$?.();
    } else {
      props.onClosed$?.();
    }
  });

  const setExpanded$ = $((next: boolean) => {
    const current = props.expanded ?? false;
    if (current === next) return;
    props.onExpandedChange$?.(next);
    if (next) {
      props.onOpened$?.();
      // Notify unconditionally, like upstream's dispatcher.notify() —
      // shouldAutoClose() on the listening side is what makes `multi`
      // accordions ignore it (see unique-selection.ts).
      accordion.value.opened.value = {itemId: id.value};
    } else {
      props.onClosed$?.();
    }
  });

  return {id: id.value, setExpanded$};
}
