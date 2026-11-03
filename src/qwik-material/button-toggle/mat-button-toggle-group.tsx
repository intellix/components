import {
  $,
  component$,
  Slot,
  useContext,
  useContextProvider,
  useSignal,
  useTask$,
  type QRL,
} from '@qwik.dev/core';
import {useIdGenerator} from '@angular-community/qwik-cdk/a11y';
import {
  MAT_BUTTON_TOGGLE_CONFIG,
  MAT_BUTTON_TOGGLE_CONFIG_DEFAULTS,
  type MatButtonToggleConfig,
} from './button-toggle-config';
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
  /** Disables ripples for every child; OR'd with the child's own `disableRipple`. */
  disableRipple?: boolean;
  /** Mirrors `[hideSingleSelectionIndicator]`. Falls back to
   *  `MAT_BUTTON_TOGGLE_CONFIG.hideSingleSelectionIndicator`, then upstream's own
   *  `false` default. Only meaningful when `multiple` is falsy. */
  hideSingleSelectionIndicator?: boolean;
  /** Mirrors `[hideMultipleSelectionIndicator]`. Falls back to
   *  `MAT_BUTTON_TOGGLE_CONFIG.hideMultipleSelectionIndicator`, then upstream's own
   *  `false` default. Only meaningful when `multiple` is truthy. */
  hideMultipleSelectionIndicator?: boolean;
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
  /**
   * Whether this group is bound to a reactive-forms-like primitive (`useMatFormControl()` or
   * equivalent) — mirrors upstream's `ngControl !== null` gate for `NgControlStatus`'s `ng-*`
   * classes, same contract as `MatCheckboxProps.formBound`. `NgControlStatus` attaches to
   * whatever element carries `[formControlName]`/`[ngModel]`/`[formControl]` — for a button
   * toggle group, that's this directive's own host, `<mat-button-toggle-group>` (never an
   * individual `<mat-button-toggle>`). Plain, uncontrolled groups leave this `false`/undefined.
   * Upstream has no `required`/validator concept for this control at all (no `@Input() required`
   * anywhere in `button-toggle.ts`), so there is no matching `required` prop here either — see
   * button-toggle/SYNC.md's "Form state" section.
   */
  formBound?: boolean;
  /** Mirrors `NgControlStatus`'s touched (only meaningful when `formBound` is true). */
  touched?: boolean;
  /** Mirrors `NgControlStatus`'s dirty (only meaningful when `formBound` is true). */
  dirty?: boolean;
  /** Mirrors `NgControlStatus`'s validity (only meaningful when `formBound` is true).
   *  Pre-computed by the consumer. */
  invalid?: boolean;
  /**
   * Fires when the group becomes "touched" — mirrors upstream's `_onTouched()`. See
   * button-toggle-group-state.ts's `onTouched$` doc comment for the exact (click-driven, NOT
   * blur-driven) timing. A form library calls this to mark its own field touched.
   */
  onTouched$?: QRL<() => void>;
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
  // DEFAULTS fallback is REQUIRED (Progress Bar / Progress Spinner post-mortem —
  // bare useContext throws Code 13 when rendered outside <QwikMaterialProvider>).
  const config = useContext(MAT_BUTTON_TOGGLE_CONFIG, CONFIG_DEFAULTS);

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
  const groupDisableRipple = props.disableRipple ?? false;
  const hideSingleSelectionIndicator =
    props.hideSingleSelectionIndicator ??
    config.hideSingleSelectionIndicator ??
    MAT_BUTTON_TOGGLE_CONFIG_DEFAULTS.hideSingleSelectionIndicator;
  const hideMultipleSelectionIndicator =
    props.hideMultipleSelectionIndicator ??
    config.hideMultipleSelectionIndicator ??
    MAT_BUTTON_TOGGLE_CONFIG_DEFAULTS.hideMultipleSelectionIndicator;

  // Multi-select selection this group last emitted but the consumer has not
  // yet fed back as `values`. Toggles fired before that round-trip re-renders
  // the group (e.g. two quick clicks while the handler chunk is still loading)
  // would otherwise each start from the same stale `values` and drop the
  // earlier change; upstream updates its SelectionModel synchronously.
  const pendingValues = useSignal<readonly unknown[] | undefined>(undefined);
  // Qwik v2 regression: this task used to clear `pendingValues`
  // UNCONDITIONALLY whenever `props.values` changed (any round trip
  // completing meant "we're caught up, drop the overlay"). Under v2, two
  // rapid clicks on DIFFERENT toggles can have the SECOND one's `onClick$`
  // read `stateSignal.value` (capturing a STALE `onToggle` closure, with
  // a stale closed-over `propValues`) before the FIRST click's
  // `onValuesChange$` round trip has landed — and if Qwik also serializes
  // concurrent invocations of the SAME QRL to full completion before
  // starting the next queued one (confirmed live via instrumentation:
  // the second call's `onToggle` body doesn't even START running until
  // the first one's `await onValuesChange$?.resolve()` — and everything
  // after it — has entirely finished), that stale closure's capture
  // happened BEFORE the first click, yet its body runs AFTER. By the time
  // it finally runs, this task has ALREADY cleared `pendingValues` to
  // `undefined` (reacting to the first click's own round trip), so the
  // second call falls through to its OWN stale `propValues` fallback —
  // which doesn't contain the first click's change either — and
  // overwrites it, discarding it. Confirmed live: rapid clicks on toggle
  // 0 then toggle 1 non-deterministically left toggle 0 unchecked, even
  // after fixing `onToggle`'s own read-compute-write to be atomic (see
  // its doc comment) — the clicks were never actually interleaved at
  // that level; this reset was the real culprit.
  //
  // Clearing only when the incoming `props.values` already matches
  // `pendingValues.value` exactly (both as sets) keeps the ORIGINAL
  // intent — stop overriding `propValues` once the consumer has
  // genuinely caught up — while leaving `pendingValues` in place for a
  // round trip that's STILL in flight for a newer click, so a late,
  // stale-closured call like the one above still finds the fresher
  // selection through the shared signal instead of its own stale capture.
  useTask$(({track}) => {
    const incoming = track(() => props.values) ?? [];
    const pending = pendingValues.value;
    if (pending === undefined) return;
    const matches =
      pending.length === incoming.length && pending.every(v => incoming.includes(v));
    if (matches) pendingValues.value = undefined;
  });

  // Route-once QRL that children fire — internally forks by mode. Captured
  // props are re-resolved each render, so mode switches and callback swaps
  // just work.
  // Event time of the click that produced the current single selection.
  const lastSelectedAt = useSignal(-1);

  const onToggle = $(async (itemValue: unknown, checked: boolean, at?: number) => {
    if (mode === 'single') {
      // Upstream `_onButtonClick`: `_onTouched()` fires only when the CLICKED toggle's own
      // checked state actually changes — re-clicking the already-selected toggle is a complete
      // no-op (never fires it). Computed from `props.value` (the live prop) BEFORE anything
      // below awaits/mutates it — see button-toggle-group-state.ts's `onTouched$` doc comment.
      const wasAlreadySelected = props.value === itemValue;
      // Clicks can resume out of order while chunks load; the latest click
      // (by event time) wins, as it would with upstream's synchronous model.
      await onChange$?.resolve();
      if (at !== undefined) {
        if (at < lastSelectedAt.value) return;
        lastSelectedAt.value = at;
      }
      // Radio semantics: clicking a toggle always selects it (upstream
      // `_onButtonClick`: `newChecked = isSingleSelector() ? true : ...` —
      // re-clicking the already-selected toggle in single mode is a no-op,
      // it never deselects). `checked` is passed through defensively.
      onChange$?.(checked ? itemValue : undefined);
      if (!wasAlreadySelected) props.onTouched$?.();
    } else {
      // Upstream: every non-disabled click in multi-select mode always flips that toggle's own
      // checked state, so `_onTouched()` fires unconditionally (the caller already guards
      // disabled before ever invoking `onToggle` — see mat-button-toggle.tsx's `onClick$`).
      props.onTouched$?.();
      // Read-compute-write `pendingValues` BEFORE any `await` — Qwik v2
      // regression: this used to `await onValuesChange$?.resolve()` FIRST
      // (see the removed comment's reasoning below), but under v2 every
      // QRL resolves through a microtask-deferred `import()` even when
      // already cached, which widens that await into a real yield point.
      // Two rapid clicks on DIFFERENT toggles each reach their own
      // `onToggle` call synchronously from `onClick$` (no await before
      // it), but if the FIRST call's own body yields at that leading
      // `await` before touching `pendingValues` at all, the SECOND call's
      // body can run its own read-then-write of `pendingValues` in the
      // gap — then the FIRST call resumes and reads the SAME stale
      // `pendingValues`/`propValues` the second one already read,
      // computing a `next` that doesn't include the second click's
      // change, and overwrites it. Confirmed live: rapid clicks on toggle
      // 0 then toggle 1 non-deterministically left toggle 0 unchecked.
      // Reading, computing and writing `pendingValues` here with NO
      // intervening `await` makes that whole step atomic with respect to
      // any other `onToggle` invocation (JS never interleaves synchronous
      // code) — two such calls can still run in either order, but neither
      // can observe the other's read "mid-write" anymore.
      // `props.values` (the LIVE prop, read fresh here), NOT the
      // destructured-at-render-top `propValues` local: `onToggle` is a
      // `$()` closure, captured by SOME specific render of this group, but
      // a call to it can run much later (e.g. queued behind an earlier
      // click's own handler — Qwik appears to process one event's handler
      // to full completion, awaits included, before starting the next
      // queued one) — by then, `propValues` is whatever THAT render saw,
      // which can predate an EARLIER click's round trip that has since
      // landed. `props` itself is the same live reactive object across
      // every render of this component instance, so reading `props.values`
      // here always reflects the CURRENT value regardless of which render
      // created this particular closure. Confirmed live: this, not the
      // `pendingValues` read/write atomicity above, was the actual reason
      // rapid clicks on two different toggles could still drop one —
      // `pendingValues` had, correctly, already been cleared (the earlier
      // click's round trip HAD landed), but the fallback below was reading
      // a stale snapshot of it from before that click happened at all.
      const current = pendingValues.value ?? props.values ?? [];
      const next = current.includes(itemValue)
        ? current.filter(v => v !== itemValue)
        : [...current, itemValue];
      pendingValues.value = next;
      // NOW it's safe to await loading the consumer's callback.
      await onValuesChange$?.resolve();
      // Re-read `pendingValues` (not the locally-captured `next`): a LATER
      // call's own atomic read-compute-write above may have landed while
      // this call was awaiting — emit whatever is current, not a
      // snapshot from before this call yielded, so the last call to
      // actually run this line emits the complete, up-to-date set.
      onValuesChange$?.(pendingValues.value ?? next);
    }
  });

  // Derive state fresh each render — Qwik's fine-grained reactivity re-runs
  // this component when consumer-owned value/values signals change.
  const nextState: MatButtonToggleGroupState = {
    mode,
    value: mode === 'single' ? propValue : undefined,
    values: mode === 'multi' ? (propValues ?? []) : [],
    disabled: groupDisabled,
    disableRipple: groupDisableRipple,
    hideSingleSelectionIndicator,
    hideMultipleSelectionIndicator,
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
    // Mirrors `NgControlStatus` — only present when bound to a reactive-forms-like control. See
    // `MatButtonToggleGroupProps.formBound`'s own doc comment.
    (props.formBound ?? false) && ((props.touched ?? false) ? 'ng-touched' : 'ng-untouched'),
    (props.formBound ?? false) && ((props.dirty ?? false) ? 'ng-dirty' : 'ng-pristine'),
    (props.formBound ?? false) && ((props.invalid ?? false) ? 'ng-invalid' : 'ng-valid'),
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
