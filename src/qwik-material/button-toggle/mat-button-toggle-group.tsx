import {
  $,
  component$,
  Slot,
  useContext,
  useContextProvider,
  useSignal,
  type QRL,
} from '@builder.io/qwik';
import {useIdGenerator} from '@angular-community/qwik-cdk/a11y';
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
  /** Fires when a child toggle is clicked. Receives the new selected value. */
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
  /**
   * Form-control name — mirrored onto the inner `<button>` of every
   * single-select child (upstream always has *some* name here; when omitted,
   * one is auto-generated via the id generator, matching upstream's
   * `_name = inject(_IdGenerator).getId('mat-button-toggle-group-')` field
   * initializer).
   */
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

/** Keys recognized by native <button> keyboard activation (Space / Enter). */
function isActivationKey(key: string): boolean {
  return key === ' ' || key === 'Enter';
}

/** Finds the next non-disabled toggle, wrapping around, skipping `startIndex`. */
function findNextEnabledIndex(
  toggleButtons: readonly (HTMLButtonElement | null)[],
  startIndex: number,
  offset: number,
): number | null {
  const n = toggleButtons.length;
  for (let i = 1; i <= n; i++) {
    const idx = (((startIndex + offset * i) % n) + n) % n;
    const btn = toggleButtons[idx];
    if (btn && !btn.disabled) return idx;
  }
  return null;
}

export const MatButtonToggleGroup = component$<MatButtonToggleGroupProps>(props => {
  // Read config for family-shape consistency, even though it currently has
  // no fields to resolve. DEFAULTS fallback is REQUIRED (Progress Bar /
  // Progress Spinner post-mortem — bare useContext throws Code 13 when
  // rendered outside <QwikMaterialProvider>).
  useContext(MAT_BUTTON_TOGGLE_CONFIG, CONFIG_DEFAULTS);

  const idGen = useIdGenerator();
  // Computed once, lazily — mirrors upstream's `_name = inject(_IdGenerator)
  // .getId(...)` field initializer, which runs once at construction and is
  // only ever overwritten by a later *explicit* `[name]` binding.
  const autoName = useSignal(() => idGen.getId('mat-button-toggle-group-'));

  const mode: MatButtonToggleGroupMode = props.multiple ? 'multi' : 'single';
  const onChange$ = props.onChange$;
  const onValuesChange$ = props.onValuesChange$;
  const propValue = props.value;
  const propValues = props.values;
  const name = props.name ?? autoName.value;
  const groupDisabled = props.disabled ?? false;

  // Route-once QRL that children fire — internally forks by mode. Captured
  // props are re-resolved each render, so mode switches and callback swaps
  // just work.
  const onToggle = $((itemValue: unknown, checked: boolean) => {
    if (mode === 'single') {
      // Radio semantics: clicking a toggle always selects it (upstream
      // `_onButtonClick`: `newChecked = isSingleSelector() ? true : ...` —
      // re-clicking the already-selected toggle in single mode is a no-op,
      // it never deselects). `checked` is passed through defensively.
      onChange$?.(checked ? itemValue : undefined);
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
    disabled: groupDisabled,
    name,
    onToggle,
    standalone: false,
    // Fresh object every render — see button-toggle-group-state.ts for why.
    fallbackTabIndexClaimed: {value: false},
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

  // Matches upstream `button-toggle.ts` host: static 'mat-button-toggle-group'
  // + '[class.mat-button-toggle-group-appearance-standard]' (always true —
  // appearance is 'standard' only in this port) + '[class.mat-button-toggle-
  // vertical]' (never true — vertical mode out of scope). There is NO
  // "mat-button-toggle-group-multiple" class upstream.
  const classes = [
    'mat-button-toggle-group',
    'mat-button-toggle-group-appearance-standard',
    props.class,
  ].filter(Boolean) as string[];

  const role = props.role ?? (mode === 'single' ? 'radiogroup' : 'group');

  const groupRef = useSignal<Element>();

  // Roving-tabindex keyboard nav — upstream `_keydown()`. Only meaningful in
  // single-select mode (upstream: `if (this.multiple || this.disabled ||
  // hasModifierKey(event)) return;`). Reads/mutates the real DOM directly
  // (via the group's own ref) rather than Angular's `QueryList`, since Qwik
  // has no content-children introspection; `.click()` on the target button
  // re-enters the SAME onClick$ handler a real pointer click would.
  const onKeyDown$ = $((event: KeyboardEvent) => {
    if (mode === 'multi' || groupDisabled) return;
    if (event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) return;

    const root = groupRef.value;
    if (!root) return;
    const toggles = Array.from(root.querySelectorAll('mat-button-toggle'));
    const toggleButtons = toggles.map(t =>
      t.querySelector<HTMLButtonElement>('button.mat-button-toggle-button'),
    );
    const activeButton = (event.target as HTMLElement | null)?.closest<HTMLButtonElement>(
      'button.mat-button-toggle-button',
    );
    const activeHost = activeButton?.closest('mat-button-toggle') ?? null;
    const index = activeHost ? toggles.indexOf(activeHost) : -1;
    if (index === -1) return;

    let nextIndex: number | null = null;
    if (isActivationKey(event.key)) {
      nextIndex = index;
    } else if (event.key === 'ArrowUp' || event.key === 'ArrowLeft') {
      nextIndex = findNextEnabledIndex(toggleButtons, index, -1);
    } else if (event.key === 'ArrowDown' || event.key === 'ArrowRight') {
      nextIndex = findNextEnabledIndex(toggleButtons, index, 1);
    } else {
      return;
    }

    if (nextIndex == null) return;
    event.preventDefault();
    const nextButton = toggleButtons[nextIndex];
    nextButton?.click();
    nextButton?.focus();
  });

  return (
    <mat-button-toggle-group
      ref={groupRef}
      id={props.id}
      class={classes}
      role={role}
      // Upstream `[attr.aria-disabled]='disabled'` is a plain ATTRIBUTE
      // binding (not a DOM boolean-property binding): Angular stringifies
      // ANY non-null/undefined value, including the boolean `false` — it
      // does NOT omit the attribute when `disabled` is false. Always render
      // 'true'/'false', never omit.
      aria-disabled={groupDisabled ? 'true' : 'false'}
      aria-label={props['aria-label']}
      aria-labelledby={props['aria-labelledby']}
      aria-describedby={props['aria-describedby']}
      onKeyDown$={onKeyDown$}
    >
      <Slot />
    </mat-button-toggle-group>
  );
});
