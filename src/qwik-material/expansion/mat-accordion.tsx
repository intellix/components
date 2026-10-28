import {$, component$, Slot, useContextProvider, useSignal} from '@builder.io/qwik';
import {isBrowser} from '@builder.io/qwik/build';
import {useCdkAccordion} from '@angular-community/qwik-cdk/accordion';
import {focusVia} from '@angular-community/qwik-cdk/a11y';
import {
  MAT_ACCORDION_STATE,
  type MatAccordionDisplayMode,
  type MatAccordionState,
  type MatAccordionTogglePosition,
} from './accordion-state';
import {computeNextHeaderIndex, type AccordionNavKey} from './accordion-keyboard';

/**
 * Props for `<MatAccordion>`. Mirrors `src/material/accordion.ts`'s
 * `@Input`s. See design spec: Angular DOM is the contract — renders
 * `<mat-accordion class="mat-accordion [mat-accordion-multi]">`, matching
 * upstream's `@Directive` host bindings exactly (no other host attributes).
 */
export interface MatAccordionProps {
  /** Whether more than one panel may be expanded at once. Default false. */
  multi?: boolean;
  /** 'default' places a gutter + elevation around the expanded panel;
   *  'flat' never does (no `mat-expansion-panel-spacing`, ever). Default
   *  'default'. */
  displayMode?: MatAccordionDisplayMode;
  /** Position of every descendant panel's expansion indicator, unless a
   *  panel sets its own. Default 'after'. */
  togglePosition?: MatAccordionTogglePosition;
  /** Default `hideToggle` for every descendant panel that doesn't set its
   *  own. Default false. */
  hideToggle?: boolean;
  class?: string | ReadonlyArray<string>;
  id?: string;
}

const NAV_KEYS: ReadonlySet<string> = new Set(['ArrowDown', 'ArrowUp', 'Home', 'End']);

/**
 * Qwik port of `MatAccordion` (`src/material/accordion.ts`), layered on
 * `qwik-cdk/accordion`'s `useCdkAccordion()` for `multi` + the
 * unique-selection broadcast. `displayMode`/`togglePosition`/`hideToggle`
 * and the `FocusKeyManager`-equivalent arrow-key navigation below are all
 * Material-only additions — CDK's `CdkAccordion` knows nothing about
 * headers.
 */
export const MatAccordion = component$<MatAccordionProps>(props => {
  const multi = props.multi ?? false;
  const displayMode = props.displayMode ?? 'default';
  const togglePosition = props.togglePosition ?? 'after';
  const hideToggle = props.hideToggle ?? false;

  useCdkAccordion({multi});

  const state: MatAccordionState = {multi, displayMode, togglePosition, hideToggle};
  const stateSignal = useSignal<MatAccordionState | undefined>(state);
  stateSignal.value = state;
  useContextProvider(MAT_ACCORDION_STATE, stateSignal);

  const rootRef = useSignal<HTMLElement>();

  // Mirrors `_handleHeaderKeydown` + the `FocusKeyManager` it delegates to
  // (`new FocusKeyManager(this._ownHeaders).withWrap().withHomeAndEnd()`).
  // A single bubbling listener on the accordion's own host element, found
  // via its own `ref`, stands in for upstream's `QueryList` of headers
  // (Qwik has no `@ContentChildren` equivalent) — same DOM-query approach
  // `qwik-material/button-toggle`'s group-level arrow-key handler uses.
  // `document.activeElement` at keydown time IS the focused header (it's
  // what received the event), so there is no need to separately track an
  // "active item" the way upstream's key manager does via
  // `_handleHeaderFocus` — real Tab-driven focus changes need no extra
  // bookkeeping here.
  const onKeyDown$ = $((event: KeyboardEvent) => {
    if (!isBrowser) return;
    const key = event.key;
    if (!NAV_KEYS.has(key)) return;
    const root = rootRef.value;
    if (!root) return;
    const headers = Array.from(root.querySelectorAll<HTMLElement>('.mat-expansion-panel-header'));
    if (headers.length === 0) return;
    const active = document.activeElement as HTMLElement | null;
    const currentIndex = active ? headers.indexOf(active) : -1;
    const isDisabled = (i: number) => headers[i]!.getAttribute('aria-disabled') === 'true';
    const targetIndex = computeNextHeaderIndex(
      key as AccordionNavKey,
      headers.length,
      currentIndex,
      isDisabled,
    );
    if (targetIndex == null) return;
    event.preventDefault();
    // Origin is always 'program' here — `FocusKeyManager` never calls
    // `setFocusOrigin('keyboard')`, even though a real keydown triggered
    // this (see angular-parity.spec.ts's behavior note).
    focusVia(headers[targetIndex]!, 'program');
  });

  const classes = ['mat-accordion', multi && 'mat-accordion-multi', props.class].filter(
    Boolean,
  ) as string[];

  return (
    <mat-accordion ref={rootRef} id={props.id} class={classes} onKeyDown$={onKeyDown$}>
      <Slot />
    </mat-accordion>
  );
});
