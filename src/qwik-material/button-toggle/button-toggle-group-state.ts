import {$, createContextId, type QRL} from '@builder.io/qwik';

/**
 * Selection mode for MatButtonToggleGroup. Drives the child's role
 * (radio/checkbox) and the group's default role (radiogroup/group).
 */
export type MatButtonToggleGroupMode = 'single' | 'multi';

/**
 * Per-instance context published by <MatButtonToggleGroup> and consumed by
 * every descendant <MatButtonToggle>. Carries the current selection, mode,
 * cascading disabled state, form-control name, and the child's click handler.
 *
 * First port on the branch to carry a QRL callback in a per-instance context.
 * Precedent-setting for future forms-tier ports (checkbox, radio, slide-toggle).
 * See design spec §3.4.
 */
export interface MatButtonToggleGroupState {
  /** Which of the 2 modes is active. */
  mode: MatButtonToggleGroupMode;
  /** In single mode: currently-selected value (or undefined if none).
   *  In multi mode: undefined (children read `values` instead). */
  value: unknown;
  /** In multi mode: currently-selected values (readonly to signal
   *  consumer-owned state).
   *  In single mode: empty ReadonlyArray. */
  values: readonly unknown[];
  /** Group-level disabled — cascades to every child. */
  disabled: boolean;
  /** Form-control name for hidden inputs. Empty string = no hidden input. */
  name: string;
  /** Child's click handler. Group routes to onChange$ (single mode) or
   *  onValuesChange$ (multi mode) internally. */
  onToggle: QRL<(itemValue: unknown, checked: boolean) => void>;
}

/**
 * Context id used by <MatButtonToggle> to read its parent's group state.
 * Stable id string.
 */
export const MAT_BUTTON_TOGGLE_GROUP_STATE = createContextId<MatButtonToggleGroupState>(
  'qwik-material/button-toggle-group-state',
);

/**
 * Sensible defaults so a standalone <MatButtonToggle> (used outside a
 * <MatButtonToggleGroup> ancestor) still renders. The child does an identity
 * check on `onToggle` — if it matches the DEFAULTS' no-op, the toggle owns
 * its own local `useSignal(false)` for checked state. Mirrors upstream's
 * `buttonToggleGroup: MatButtonToggleGroup` (uninjected) optional pattern.
 *
 * Every useContext(MAT_BUTTON_TOGGLE_GROUP_STATE, ...) call MUST pass these
 * defaults as the second argument. A bare useContext without a fallback
 * would throw QError_notFoundContext (Code 13) when a toggle is rendered
 * standalone. See Progress Bar / Progress Spinner post-mortem.
 */
export const MAT_BUTTON_TOGGLE_GROUP_STATE_DEFAULTS: MatButtonToggleGroupState = {
  mode: 'single',
  value: undefined,
  values: [],
  disabled: false,
  name: '',
  onToggle: $((_value: unknown, _checked: boolean) => {
    // No-op — standalone toggle owns its own local state via useSignal.
    // MatButtonToggle detects this identity to know it's standalone.
  }),
};
