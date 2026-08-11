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
  // Read parent state; SSR-safe fallback for standalone toggles.
  const state = useContext(MAT_BUTTON_TOGGLE_GROUP_STATE, MAT_BUTTON_TOGGLE_GROUP_STATE_DEFAULTS);

  // Standalone detection — identity check on the no-op onToggle. If the
  // context returned the DEFAULTS, this toggle is not inside a group; own
  // local checked state via useSignal (initial value: false).
  const isStandalone = state.onToggle === MAT_BUTTON_TOGGLE_GROUP_STATE_DEFAULTS.onToggle;
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

  // Click handler — routes through parent's onToggle QRL when grouped,
  // or flips local signal when standalone.
  const onClick$ = $(async () => {
    if (effectiveDisabled) return;
    if (isStandalone) {
      localChecked.value = !localChecked.value;
    } else {
      await state.onToggle(props.value, !checked);
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
