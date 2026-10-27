import {
  $,
  component$,
  Slot,
  useContext,
  useContextProvider,
  useSignal,
  type QRL,
} from '@builder.io/qwik';
import {MAT_BUTTON_TOGGLE_CONFIG, type MatButtonToggleConfig} from './button-toggle-config';
import {
  MAT_BUTTON_TOGGLE_GROUP_STATE,
  type MatButtonToggleGroupMode,
  type MatButtonToggleGroupState,
} from './button-toggle-group-state';

/**
 * Props for <MatButtonToggleGroup>. Controlled component pair with
 * <MatButtonToggle> — consumer owns selection state via signals; the group
 * takes value/values + onChange$/onValuesChange$ QRLs. See design spec §3.1
 * for rendered DOM shape.
 */
export interface MatButtonToggleGroupProps {
  /** Selection mode. `false` (default) = single-select; `true` = multi-select. */
  multiple?: boolean;

  // ── SINGLE mode props ──
  /** Currently-selected value. Consumer owns the state. */
  value?: unknown;
  /** Fires when a child toggle is clicked. Receives the new selected value
   *  (or undefined if the clicked toggle was the currently-selected one being
   *  deselected — matches upstream). */
  onChange$?: QRL<(value: unknown) => void>;

  // ── MULTI mode props ──
  /** Currently-selected values. Consumer owns the state. */
  values?: readonly unknown[];
  /** Fires when a child toggle is clicked. Receives the new set of selected
   *  values (already deduped, order preserved). */
  onValuesChange$?: QRL<(values: readonly unknown[]) => void>;

  // ── Shared ──
  /** Disables the whole group; cascades to every child via context. */
  disabled?: boolean;
  /** Form-control name — set on hidden `<input>` inside each checked button so
   *  the group participates in standard HTML form submission. */
  name?: string;
  /** ARIA role override. Defaults to "radiogroup" (single) or "group" (multi). */
  role?: string;
  'aria-label'?: string;
  'aria-labelledby'?: string;
  'aria-describedby'?: string;
  class?: string | ReadonlyArray<string>;
  id?: string;
}

const CONFIG_DEFAULTS: MatButtonToggleConfig = {};

export const MatButtonToggleGroup = component$<MatButtonToggleGroupProps>(props => {
  // Read config for family-shape consistency, even though it currently has
  // no fields to resolve. DEFAULTS fallback is REQUIRED (Progress Bar /
  // Progress Spinner post-mortem — bare useContext throws Code 13 when
  // rendered outside <QwikMaterialProvider>).
  useContext(MAT_BUTTON_TOGGLE_CONFIG, CONFIG_DEFAULTS);

  const mode: MatButtonToggleGroupMode = props.multiple ? 'multi' : 'single';
  const onChange$ = props.onChange$;
  const onValuesChange$ = props.onValuesChange$;
  const propValue = props.value;
  const propValues = props.values;

  // Route-once QRL that children fire — internally forks by mode. Captured
  // props are re-resolved each render, so mode switches and callback swaps
  // just work.
  const onToggle = $((itemValue: unknown, checked: boolean) => {
    if (mode === 'single') {
      // Clicking the currently-selected item deselects it (matches upstream).
      const newValue = checked ? itemValue : undefined;
      onChange$?.(newValue);
    } else {
      const current = propValues ?? [];
      const next = checked ? [...current, itemValue] : current.filter(v => v !== itemValue);
      onValuesChange$?.(next);
    }
  });

  // Derive state fresh each render — Qwik's fine-grained reactivity re-runs
  // this component when consumer-owned value/values signals change.
  const nextState: MatButtonToggleGroupState = {
    mode,
    value: mode === 'single' ? propValue : undefined,
    values: mode === 'multi' ? (propValues ?? []) : [],
    disabled: props.disabled ?? false,
    name: props.name ?? '',
    onToggle,
    standalone: false,
  };
  // Published via a Signal (not a plain object) so <MatButtonToggle>
  // descendants reactively re-render when this state changes on a later
  // render. useContextProvider() with a freshly-built plain object every
  // render does NOT notify existing context consumers in Qwik — only
  // replacing a Signal's `.value` does. useStore() remains disallowed per
  // project constraints; useSignal() satisfies the same "reactive context"
  // requirement instead. See button-toggle-group-state.ts + Task 11
  // Playwright regression findings.
  const stateSignal = useSignal<MatButtonToggleGroupState>(nextState);
  stateSignal.value = nextState;
  useContextProvider(MAT_BUTTON_TOGGLE_GROUP_STATE, stateSignal);

  const classes = [
    'mat-button-toggle-group',
    mode === 'multi' && 'mat-button-toggle-group-multiple',
    'mat-button-toggle-standard',
    props.class,
  ].filter(Boolean) as string[];

  const role = props.role ?? (mode === 'single' ? 'radiogroup' : 'group');

  return (
    <mat-button-toggle-group
      id={props.id}
      class={classes}
      role={role}
      aria-disabled={props.disabled ? 'true' : undefined}
      aria-label={props['aria-label']}
      aria-labelledby={props['aria-labelledby']}
      aria-describedby={props['aria-describedby']}
    >
      <Slot />
    </mat-button-toggle-group>
  );
});
