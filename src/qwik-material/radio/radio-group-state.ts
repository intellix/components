import {$, createContextId, type QRL, type Signal} from '@qwik.dev/core';
import type {MatRadioColor} from './radio-color';

/**
 * Per-instance context published by <MatRadioGroup> and consumed by every
 * descendant <MatRadioButton>. Carries the current selection, cascading
 * disabled/required/color/labelPosition state, the group's `name`, and the
 * change-routing QRL — the controlled-component analog of upstream's
 * `MatRadioGroup` class fields (src/material/radio/radio.ts lines 118-373).
 *
 * Unlike button-toggle, there is no `SelectionModel`/`_selected` object to
 * externalize: `value` IS the single source of truth (consumer-owned), and
 * each `<MatRadioButton>` derives its own `checked` as `state.value ===
 * props.value`. There's also no roving-tabindex "claim" mechanism needed —
 * upstream's actual `_updateTabIndex()` logic for a grouped radio is just
 * "disabled, or nothing in the group selected yet → use my own tabIndex;
 * otherwise, 0 if I'm the selected one, else -1" (see mat-radio-button.tsx).
 */
export interface MatRadioGroupState {
  /** Selected value for the radio group (consumer-owned). */
  value: unknown;
  /** Name shared by every grouped radio's native `<input>`. Always a real
   *  string — auto-generated via the id generator when the consumer doesn't
   *  provide one, matching upstream's `_name = inject(_IdGenerator)
   *  .getId('mat-radio-group-')` field initializer. */
  name: string;
  /** Group-level disabled — cascades to every child (OR'd with the child's own). */
  disabled: boolean;
  /** Group-level required — cascades to every child (OR'd with the child's own). */
  required: boolean;
  /** Group-level disabledInteractive — cascades to every child (OR'd with the child's own). */
  disabledInteractive: boolean;
  /** Label position fallback for children that don't set their own. */
  labelPosition: 'before' | 'after';
  /** Group's own color Input — a *fallback* for a child's own color, matching
   *  upstream's `this.radioGroup && this.radioGroup.color` link in the
   *  `color` getter. `undefined` when the group doesn't set `[color]`. */
  color: MatRadioColor | undefined;
  /**
   * Fires when a child's native input becomes checked (upstream
   * `radioGroup._controlValueAccessorChangeFn` + `_emitChangeEvent`).
   * Routed through the group so out-of-order rapid clicks (handler chunks
   * still loading) resolve by event time — see mat-radio-group.tsx.
   */
  onChange$: QRL<(value: unknown, at: number) => void>;
  /** True only for MAT_RADIO_GROUP_STATE_DEFAULTS (no real <MatRadioGroup>
   *  ancestor). <MatRadioButton> reads this boolean to detect standalone
   *  usage, exactly like button-toggle's analogous field — see
   *  button-toggle-group-state.ts for why a boolean (not reference-identity
   *  on `onChange$`) is required: it survives the SSR-to-resume boundary. */
  standalone: boolean;
}

/**
 * Context id used by <MatRadioButton> to read its parent's group state.
 * Carries a Signal<MatRadioGroupState> (not the state object directly) so
 * that dereferencing `.value` establishes a live subscription — a freshly
 * built plain object passed to useContextProvider() would NOT notify
 * existing consumers on a later group render (see
 * button-toggle-group-state.ts's doc comment for the full Task 11 finding
 * this mirrors).
 */
export const MAT_RADIO_GROUP_STATE = createContextId<Signal<MatRadioGroupState>>(
  'qwik-material/radio-group-state',
);

/**
 * Sensible defaults so a standalone <MatRadioButton> (used outside a
 * <MatRadioGroup> ancestor) still renders. The child reads the `standalone`
 * field — when true, it owns its own local `useSignal(...)` for checked
 * state (seeded once from its own `checked` prop) instead of deriving it
 * from context, and relies on the browser's native same-`name` grouping
 * (not a cross-component dispatcher) to uncheck siblings — see
 * mat-radio-button.tsx's doc comment.
 *
 * Every `useContext(MAT_RADIO_GROUP_STATE, ...)` call MUST pass a
 * Signal-wrapped form of these defaults (e.g. `{value:
 * MAT_RADIO_GROUP_STATE_DEFAULTS}`) as the second argument — a bare
 * useContext without a fallback throws QError_notFoundContext (Code 13) when
 * a button is rendered standalone.
 */
export const MAT_RADIO_GROUP_STATE_DEFAULTS: MatRadioGroupState = {
  value: undefined,
  name: '',
  disabled: false,
  required: false,
  disabledInteractive: false,
  labelPosition: 'after',
  color: undefined,
  onChange$: $((_value: unknown, _at: number) => {
    // No-op — standalone button owns its own local state via useSignal.
  }),
  standalone: true,
};
