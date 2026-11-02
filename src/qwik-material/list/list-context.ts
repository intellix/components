import {createContextId} from '@qwik.dev/core';

/**
 * Per-instance context published by <MatList> / <MatNavList> /
 * <MatActionList> and consumed by every descendant <MatListItem>.
 *
 * Mirrors upstream `MatListBase._isNonInteractive`: plain `<mat-list>` is
 * non-interactive (`true`); `<mat-nav-list>` and `<mat-action-list>`
 * override it to `false`. MatListItem reads this to decide whether to add
 * the `mat-mdc-list-item-interactive` class — added synchronously by
 * upstream's constructor (`_initInteractiveListItem`), so it is present in
 * the very first render, not just after an interaction.
 */
export interface MatListBaseState {
  /** `false` for nav-list/action-list items; `true` (default) otherwise. */
  isNonInteractive: boolean;
}

/** Context id used by <MatListItem> to read its container's interactivity. */
export const MAT_LIST_BASE_STATE = createContextId<MatListBaseState>('qwikMaterial/listBaseState');

/**
 * Default used when a <MatListItem> is rendered without a <MatList> /
 * <MatNavList> / <MatActionList> ancestor. Mirrors upstream's own default
 * (`MatListBase._isNonInteractive = true`) so a standalone item behaves
 * like a plain, non-interactive list item. Every
 * `useContext(MAT_LIST_BASE_STATE, ...)` call MUST pass this as the second
 * argument — a bare `useContext` throws `QError_notFoundContext` outside a
 * provider (Progress Bar / Progress Spinner post-mortem).
 */
export const MAT_LIST_BASE_STATE_DEFAULTS: MatListBaseState = {
  isNonInteractive: true,
};
