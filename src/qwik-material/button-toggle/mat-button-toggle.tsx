import {component$, Slot, useContext, useSignal, $} from '@builder.io/qwik';
import {
  MAT_BUTTON_TOGGLE_GROUP_STATE,
  MAT_BUTTON_TOGGLE_GROUP_STATE_DEFAULTS,
} from './button-toggle-group-state';

/**
 * Props for <MatButtonToggle>. Rendered as <mat-button-toggle> with an inner
 * <button type="button"> wrapper matching upstream's template for CSS-selector
 * parity. Reads parent group state via MAT_BUTTON_TOGGLE_GROUP_STATE (or falls
 * back to DEFAULTS when standalone). See design spec §3.2 for rendered DOM.
 */
export interface MatButtonToggleProps {
  /** The value this button represents in the group's selection. Required. */
  value: unknown;
  /** Individually disables this button (in addition to group-level disabled). */
  disabled?: boolean;
  /** Optional id. If omitted, no id is emitted (no auto-generated `mat-button-toggle-N`
   *  — spec §5 deviation #10 dropped _IdGenerator). */
  id?: string;
  /** Individual name override — falls back to group's `name` prop. */
  name?: string;
  'aria-label'?: string;
  'aria-labelledby'?: string;
  'aria-describedby'?: string;
  class?: string | ReadonlyArray<string>;
}

export const MatButtonToggle = component$<MatButtonToggleProps>(props => {
  // Read parent state; SSR-safe fallback for standalone toggles. The
  // context carries a Signal<MatButtonToggleGroupState> (not the state
  // object directly) — see button-toggle-group-state.ts for why context
  // reactivity requires a Signal wrapper. Dereference `.value` to read the
  // current group state.
  const stateSignal = useContext(MAT_BUTTON_TOGGLE_GROUP_STATE, {
    value: MAT_BUTTON_TOGGLE_GROUP_STATE_DEFAULTS,
  });
  const state = stateSignal.value;

  // Standalone detection — the DEFAULTS fallback carries `standalone: true`.
  // If the context returned the DEFAULTS, this toggle is not inside a
  // group; own local checked state via useSignal (initial value: false).
  // (NOT a reference-identity check on `onToggle` — QRL-bearing fallback
  // objects are not guaranteed to preserve reference identity across the
  // SSR-to-resume boundary. See Task 11 Playwright regression findings.)
  const isStandalone = state.standalone;
  const localChecked = useSignal(false);

  // Compute effective checked state.
  const checked = isStandalone
    ? localChecked.value
    : state.mode === 'single'
      ? state.value === props.value
      : state.values.includes(props.value);

  // Compute effective disabled (group + individual).
  const effectiveDisabled = state.disabled || (props.disabled ?? false);

  // Compute effective role.
  const role = isStandalone ? 'button' : state.mode === 'single' ? 'radio' : 'checkbox';

  // Class ladder.
  const classes = ['mat-button-toggle', checked && 'mat-button-toggle-checked', props.class].filter(
    Boolean,
  ) as string[];

  // Form-name: individual name overrides group name.
  const effectiveName = props.name ?? state.name;

  // Click handler — routes through parent's onToggle QRL when grouped, or
  // flips local signal when standalone.
  //
  // Recomputes disabled/standalone/checked fresh from `state` INSIDE the
  // closure rather than reusing the outer-scope `effectiveDisabled` /
  // `isStandalone` / `checked` primitives captured at render time. Task 11
  // Playwright regression: in a multi-select group, a toggle that is
  // re-rendered by a SIBLING's click (context change) without its OWN
  // `checked` value changing can end up with a stale captured `checked`
  // primitive in its `onClick$` QRL scope, while `state` (object-typed,
  // reached through the context Signal) stays live — recomputing every
  // primitive from `state` at invocation time sidesteps the mismatch.
  const onClick$ = $(async () => {
    const currentDisabled = state.disabled || (props.disabled ?? false);
    if (currentDisabled) return;
    if (state.standalone) {
      localChecked.value = !localChecked.value;
    } else {
      const currentChecked =
        state.mode === 'single' ? state.value === props.value : state.values.includes(props.value);
      await state.onToggle(props.value, !currentChecked);
    }
  });

  return (
    <mat-button-toggle
      id={props.id}
      class={classes}
      role={role}
      aria-checked={!isStandalone ? (checked ? 'true' : 'false') : undefined}
      aria-pressed={isStandalone ? (checked ? 'true' : 'false') : undefined}
      aria-disabled={effectiveDisabled ? 'true' : 'false'}
      aria-label={props['aria-label']}
      aria-labelledby={props['aria-labelledby']}
      aria-describedby={props['aria-describedby']}
      tabIndex={0}
    >
      <button type="button" class="mat-button-toggle-button" tabIndex={-1} onClick$={onClick$}>
        <span class="mat-button-toggle-label-content">
          <Slot />
        </span>
      </button>
      {!isStandalone && effectiveName && checked && (
        <input type="hidden" name={effectiveName} value={String(props.value)} />
      )}
    </mat-button-toggle>
  );
});
