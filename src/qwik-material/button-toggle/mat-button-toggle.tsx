import {$, component$, Slot, useContext, useSignal} from '@builder.io/qwik';
import {useFocusOrigin, useIdGenerator} from '@angular-community/qwik-cdk/a11y';
import {useAnimationsDisabled} from '../dialog/use-animations-disabled';
import {MatPseudoCheckbox} from '../core/mat-pseudo-checkbox';
import {
  MAT_BUTTON_TOGGLE_GROUP_STATE,
  MAT_BUTTON_TOGGLE_GROUP_STATE_DEFAULTS,
} from './button-toggle-group-state';

/**
 * Props for <MatButtonToggle>. Rendered as <mat-button-toggle role="presentation">
 * wrapping an inner <button> matching upstream's button-toggle.html template
 * for CSS-selector parity. Reads parent group state via
 * MAT_BUTTON_TOGGLE_GROUP_STATE (or falls back to DEFAULTS when standalone).
 * See design spec §3.2 for rendered DOM.
 */
export interface MatButtonToggleProps {
  /** The value this button represents in the group's selection. Required. */
  value: unknown;
  /** Individually disables this button (in addition to group-level disabled). */
  disabled?: boolean;
  /** Optional id. Auto-generated (`mat-button-toggle-N`) when omitted,
   *  matching upstream's `id = id || idGenerator.getId('mat-button-toggle-')`. */
  id?: string;
  /** Individual name override — used only outside single-select mode
   *  (standalone or multi-select); single-select mode always uses the
   *  group's name (upstream `_getButtonName()`). */
  name?: string;
  'aria-label'?: string;
  'aria-labelledby'?: string;
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
  const animationsDisabled = useAnimationsDisabled();

  const idGen = useIdGenerator();
  // Computed once, lazily — mirrors upstream's `this.id = this.id ||
  // this._idGenerator.getId('mat-button-toggle-')` (ngOnInit, runs once).
  const autoId = useSignal(() => idGen.getId('mat-button-toggle-'));
  const id = props.id ?? autoId.value;
  const buttonId = `${id}-button`;

  // Standalone detection — the DEFAULTS fallback carries `standalone: true`.
  // If the context returned the DEFAULTS, this toggle is not inside a
  // group; own local checked state via useSignal (initial value: false).
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

  // isSingleSelector() upstream: grouped AND group.multiple === false.
  // Governs role/aria-checked-vs-pressed AND the inner button's `name`.
  const isSingleSelector = !isStandalone && state.mode === 'single';

  // Roving tabIndex (single-select grouped only — upstream only calls
  // `_initializeTabIndex()` `if (!this.multiple)`; multi-select and
  // standalone toggles keep their construction-time default of 0 forever).
  // See button-toggle-group-state.ts for the fallback-claim mechanism.
  //
  // The claim decision must be made EXACTLY ONCE per group render (i.e. once
  // per distinct `state` object — the group only produces a new one when ITS
  // OWN props/state change) and then stay stable, cached in `amFallbackClaimant`,
  // across any OTHER reason this toggle itself re-renders (e.g. `focusOrigin`
  // changing below). Re-deciding on every render would re-run the condition
  // against `state.fallbackTabIndexClaimed.value`, which THIS toggle may have
  // already flipped to `true` on a previous render of itself — making the
  // "can I claim it" check always fail the second time around.
  const lastSeenState = useSignal<unknown>(undefined);
  const amFallbackClaimant = useSignal(false);
  if (lastSeenState.value !== state) {
    lastSeenState.value = state;
    amFallbackClaimant.value =
      isSingleSelector &&
      !checked &&
      state.value === undefined &&
      !effectiveDisabled &&
      !state.fallbackTabIndexClaimed.value;
    if (amFallbackClaimant.value) {
      state.fallbackTabIndexClaimed.value = true;
    }
  }
  const tabIndexValue = isSingleSelector ? (checked || amFallbackClaimant.value ? 0 : -1) : 0;
  // Upstream template: `[attr.tabindex]="disabled && !disabledInteractive ?
  // -1 : tabIndex"`. disabledInteractive isn't ported (always false), so the
  // disabled override always wins when disabled.
  const renderedTabIndex = effectiveDisabled ? -1 : tabIndexValue;

  const role = isSingleSelector ? 'radio' : 'button';
  const buttonName = isSingleSelector ? state.name : props.name || undefined;

  // Upstream `ngAfterViewInit(): this._focusMonitor.monitor(this._elementRef,
  // true)`. `useFocusOrigin()` is the lazy, useOn()-based replacement (see
  // qwik-cdk/a11y/focus-origin/focus-origin.ts): it attaches `on:pointerdown`
  // / `on:focusin` / `on:focusout` references to this component's own host
  // element (this one, <mat-button-toggle>) at SSR time — no JS loads or
  // runs until one of those events actually fires, unlike a `useVisibleTask$`
  // (which would load+run eagerly on every resumed instance). `focusin`
  // bubbles, so it covers focus landing on the inner <button> for free
  // (upstream's `checkChildren: true`).
  const focusOrigin = useFocusOrigin();

  // Host class ladder — matches upstream button-toggle.ts host bindings.
  // `mat-button-toggle-disabled-interactive` is never applied
  // (disabledInteractive out of scope — no scenario exercises it).
  const hostClasses = [
    'mat-button-toggle',
    isStandalone && 'mat-button-toggle-standalone',
    checked && 'mat-button-toggle-checked',
    effectiveDisabled && 'mat-button-toggle-disabled',
    'mat-button-toggle-appearance-standard',
    // Upstream only adds this class in `ngAfterViewInit` (so pre-checked
    // toggles don't animate their first paint) — functionally equivalent to
    // computing it directly in SSR output here, since this component has no
    // "first paint without the class, then add it" transition of its own.
    !animationsDisabled.value && 'mat-button-toggle-animations-enabled',
    // Focus-origin classes (upstream FocusMonitor sets these directly via
    // classList, bypassing Angular's change detection). Derived declaratively
    // from `focusOrigin` (a real Qwik signal) instead, so they're recomputed
    // correctly on every render — Qwik's `class` prop replaces `className`
    // wholesale each time (not an additive classList diff), so anything set
    // outside this array wouldn't survive an unrelated re-render anyway.
    focusOrigin.value && 'cdk-focused',
    focusOrigin.value === 'touch' && 'cdk-touch-focused',
    focusOrigin.value === 'keyboard' && 'cdk-keyboard-focused',
    focusOrigin.value === 'mouse' && 'cdk-mouse-focused',
    focusOrigin.value === 'program' && 'cdk-program-focused',
    props.class,
  ].filter(Boolean) as string[];

  const onClick$ = $(async (event: Event) => {
    // Re-read live state inside the closure — a sibling's click can cause
    // this toggle to re-render (context change) without its own primitives
    // changing, leaving a stale captured value if we used the outer-scope
    // consts. See Task 11 Playwright regression findings.
    const live = stateSignal.value;
    const liveDisabled = live.disabled || (props.disabled ?? false);
    if (liveDisabled) return;
    if (live.standalone) {
      localChecked.value = !localChecked.value;
      return;
    }
    if (live.mode === 'single') {
      // Radio semantics — always select; never deselect by re-clicking.
      await live.onToggle(props.value, true, event.timeStamp);
    } else {
      const liveChecked = live.values.includes(props.value);
      await live.onToggle(props.value, !liveChecked, event.timeStamp);
    }
  });

  return (
    <mat-button-toggle id={id} class={hostClasses} role="presentation">
      <button
        id={buttonId}
        type="button"
        class="mat-button-toggle-button mat-focus-indicator"
        tabIndex={renderedTabIndex}
        role={role}
        aria-checked={isSingleSelector ? (checked ? 'true' : 'false') : undefined}
        aria-pressed={!isSingleSelector ? (checked ? 'true' : 'false') : undefined}
        disabled={effectiveDisabled || undefined}
        name={buttonName}
        aria-label={props['aria-label']}
        aria-labelledby={props['aria-labelledby']}
        onClick$={onClick$}
      >
        {!isStandalone && (
          <div class="mat-button-toggle-checkbox-wrapper">
            {/* state is ALWAYS "checked" here, even when this toggle isn't
                — matches upstream's literal `state="checked"` (not a
                binding) in button-toggle.html. The checkmark is only ever
                visually revealed via button-toggle.scss's `width: 0;
                overflow: hidden` on `.mat-button-toggle-checkbox-wrapper`,
                expanded by the ancestor `.mat-button-toggle-checked`
                selector — not by this component's own checked/unchecked
                state. */}
            <MatPseudoCheckbox
              disabled={effectiveDisabled}
              state="checked"
              aria-hidden="true"
              appearance="minimal"
            />
          </div>
        )}
        <span class="mat-button-toggle-label-content">
          <Slot />
        </span>
      </button>
      <span class="mat-button-toggle-focus-overlay" />
      {/* `matripple` mirrors Angular's bare `matRipple` directive-selector
          attribute (static, no value) left on the rendered DOM; cast past
          the intrinsic <span> type since it's not a recognized HTML attr. */}
      <span
        {...({matripple: ''} as Record<string, string>)}
        class="mat-ripple mat-button-toggle-ripple"
      />
    </mat-button-toggle>
  );
});
