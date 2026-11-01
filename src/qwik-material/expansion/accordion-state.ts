import {createContextId, type Signal} from '@qwik.dev/core';

/** `MatAccordion`'s display modes (`src/material/accordion-base.ts`). */
export type MatAccordionDisplayMode = 'default' | 'flat';

/** `MatAccordion`'s toggle positions (`src/material/accordion-base.ts`). */
export type MatAccordionTogglePosition = 'before' | 'after';

/**
 * State `MatAccordion` publishes for `MatExpansionPanel`/`MatExpansionPanelHeader`
 * descendants to fall back to — the Material-only layer on top of
 * `qwik-cdk/accordion`'s `CDK_ACCORDION_STATE` (which only knows about
 * `multi`; `displayMode`/`togglePosition`/`hideToggle` are all
 * `MatAccordion`'s own additions, not CDK's — see
 * `src/material/accordion.ts`).
 */
export interface MatAccordionState {
  multi: boolean;
  displayMode: MatAccordionDisplayMode;
  togglePosition: MatAccordionTogglePosition;
  hideToggle: boolean;
}

/**
 * Context published by `MatAccordion`. Carries a `Signal<MatAccordionState>`
 * — not the state object directly — for the same context-reactivity reason
 * `qwik-material/button-toggle`'s `MAT_BUTTON_TOGGLE_GROUP_STATE` does (see
 * that module's doc comment).
 *
 * No `DEFAULTS` export: a standalone `MatExpansionPanel` (no `MatAccordion`
 * ancestor) must be able to tell "no accordion" apart from "an accordion
 * with innocuous-looking defaults" — e.g. `togglePosition` is `undefined`
 * (no class at all) for a standalone panel but `'after'` for one inside a
 * default accordion (see `angular-parity.spec.ts`'s "basic" vs
 * "accordion-single" note). Consumers pass `{value: undefined}` as the
 * `useContext()` fallback and treat `undefined` as "standalone".
 */
export const MAT_ACCORDION_STATE = createContextId<Signal<MatAccordionState | undefined>>(
  'qwik-material/accordion-state',
);
