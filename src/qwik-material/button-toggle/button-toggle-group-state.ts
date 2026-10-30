import {$, createContextId, type QRL, type Signal} from '@builder.io/qwik';

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
  /** Group-level `disableRipple` — cascades to every child, OR'd with the
   *  child's own (upstream `MatButtonToggle._isRippleDisabled()`:
   *  `this.disableRipple || this.buttonToggleGroup?.disableRipple`). */
  disableRipple: boolean;
  /** Form-control name, mirrored onto the inner `<button>` of every
   *  single-select child (upstream `_getButtonName()`). Always a real
   *  string — auto-generated via the id generator when the consumer doesn't
   *  provide one, matching upstream's `_name = inject(_IdGenerator).getId(...)`
   *  field initializer. */
  name: string;
  /** Child's click handler. Group routes to onChange$ (single mode) or
   *  onValuesChange$ (multi mode) internally. */
  onToggle: QRL<(itemValue: unknown, checked: boolean, at?: number) => void>;
  /** True only for MAT_BUTTON_TOGGLE_GROUP_STATE_DEFAULTS (no real
   *  <MatButtonToggleGroup> ancestor). <MatButtonToggle> reads this boolean
   *  (NOT a reference-identity check on `onToggle`) to detect standalone
   *  usage — see Task 11 Playwright regression findings below. */
  standalone: boolean;
  /**
   * Single-select roving-tabindex bootstrap: upstream picks the first
   * non-disabled toggle as the sole tabbable one whenever nothing is
   * selected yet (`_setSelectionByValue`'s trailing "need at least one
   * enabled toggle to always be focusable" pass, run from a `QueryList` the
   * Qwik port has no equivalent of). Qwik children render in document order
   * within one synchronous SSR/CSR pass, so a plain (non-reactive) mutable
   * flag — reset to a fresh object every time the group recomputes state —
   * lets the first non-disabled child claim the slot and every later
   * sibling see it's taken. Irrelevant once something is selected: each
   * child then derives tabIndex straight from its own `checked`, exactly
   * mirroring upstream's `_clearSelection`/`_selectValue` invariant.
   */
  fallbackTabIndexClaimed: {value: boolean};
}

/**
 * Context id used by <MatButtonToggle> to read its parent's group state.
 * Stable id string.
 *
 * Carries a Signal<MatButtonToggleGroupState> rather than the state object
 * directly. Task 11 (runtime Playwright verification) found that a plain
 * object passed to useContextProvider() does NOT notify existing
 * <MatButtonToggle> consumers when <MatButtonToggleGroup> re-renders with
 * new props/state — Qwik's context reactivity requires the published value
 * to be a reactive primitive (Signal or Store) so that consumers who
 * dereference `.value` establish a live subscription; a freshly-built plain
 * object is inert. useStore() remains disallowed per project constraints
 * (see design spec + SYNC.md), so useSignal() is used to satisfy the same
 * "reactive context" requirement instead. Also fixed here: standalone
 * detection previously compared `onToggle` by reference identity against
 * MAT_BUTTON_TOGGLE_GROUP_STATE_DEFAULTS.onToggle — that comparison is
 * unstable across the SSR-to-resume boundary (Qwik reconstructs the
 * serialized fallback context value on client resume as a distinct object),
 * so it flipped from standalone to grouped after the very first client
 * re-render. Replaced with the explicit `standalone` boolean field above,
 * which survives serialization by value, not by reference.
 */
export const MAT_BUTTON_TOGGLE_GROUP_STATE = createContextId<Signal<MatButtonToggleGroupState>>(
  'qwik-material/button-toggle-group-state',
);

/**
 * Sensible defaults so a standalone <MatButtonToggle> (used outside a
 * <MatButtonToggleGroup> ancestor) still renders. The child reads the
 * `standalone` field — when true, the toggle owns its own local
 * `useSignal(false)` for checked state instead of deriving it from context.
 * Mirrors upstream's `buttonToggleGroup: MatButtonToggleGroup` (uninjected)
 * optional pattern.
 *
 * Every useContext(MAT_BUTTON_TOGGLE_GROUP_STATE, ...) call MUST pass a
 * Signal-wrapped form of these defaults (e.g. `{value: MAT_BUTTON_TOGGLE_GROUP_STATE_DEFAULTS}`)
 * as the second argument. A bare useContext without a fallback would throw
 * QError_notFoundContext (Code 13) when a toggle is rendered standalone.
 * See Progress Bar / Progress Spinner post-mortem.
 */
export const MAT_BUTTON_TOGGLE_GROUP_STATE_DEFAULTS: MatButtonToggleGroupState = {
  mode: 'single',
  value: undefined,
  values: [],
  disabled: false,
  disableRipple: false,
  name: '',
  onToggle: $((_value: unknown, _checked: boolean) => {
    // No-op — standalone toggle owns its own local state via useSignal.
  }),
  standalone: true,
  fallbackTabIndexClaimed: {value: true},
};
