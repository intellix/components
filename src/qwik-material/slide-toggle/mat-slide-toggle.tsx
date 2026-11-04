import {$, component$, Slot, useContext, useSignal, type QRL} from '@qwik.dev/core';
import {useFocusOrigin, useIdGenerator} from '@angular-community/qwik-cdk/a11y';
import {useAnimationsDisabled} from '../dialog/use-animations-disabled';
import {MatInternalFormField} from '../core/mat-internal-form-field';
import {handleRippleEvent, rippleAnimationConfig} from '../core/ripple/ripple-dom';
import {useRippleGlobalOptions} from '../core/ripple/ripple-global-options';
import {MAT_SLIDE_TOGGLE_CONFIG, type MatSlideToggleConfig} from './slide-toggle-config';

/**
 * Props for <MatSlideToggle>. Rendered as the upstream DOM shape from
 * `slide-toggle.html`/`slide-toggle.ts` (`src/material/slide-toggle/`):
 * an outer `<mat-slide-toggle>` host wrapping a `<div mat-internal-form-field>`
 * that contains the real `<button class="mdc-switch" role="switch">` (the
 * slide-toggle's actual interactive element — upstream has no hidden
 * `<input>`) and a `<label>` projecting this component's children. See
 * `specs/material-slide-toggle/angular-parity.spec.ts`'s header for the
 * literal baseline tree and every scenario's diff from it.
 *
 * `checked` is a controlled prop, same pattern as MatButtonToggle(Group):
 * the consumer owns the signal and feeds the new value back through
 * `onChange$`.
 */
export interface MatSlideToggleProps {
  /** Whether the slide-toggle is checked. Consumer owns the state. */
  checked?: boolean;
  /** Whether the slide-toggle is disabled. */
  disabled?: boolean;
  /** Whether the slide toggle should remain interactive when disabled. */
  disabledInteractive?: boolean;
  /** Whether the slide-toggle has a ripple. Mirrors upstream's `disableRipple`
   *  input — OR'd with `disabled` into the ripple's `matRippleDisabled`. */
  disableRipple?: boolean;
  /** Whether the slide-toggle is required. Renders `aria-required` on the inner button. */
  required?: boolean;
  /** Whether to hide the icon inside of the slide toggle. Falls back to config, then false. */
  hideIcon?: boolean;
  /** Whether the label should appear after or before the slide-toggle. Default 'after'. */
  labelPosition?: 'before' | 'after';
  /**
   * Theme color. This API is supported in M2 themes only, it has no effect
   * in M3 themes. Falls back to config, then 'accent' — upstream's
   * constructor always assigns a non-empty color (`defaults.color ||
   * 'accent'`), so every instance carries a `mat-<color>` host class.
   */
  color?: string;
  /** Name applied to the inner `<button>`. */
  name?: string;
  /** A unique id. Auto-generated (`mat-mdc-slide-toggle-N`) when omitted. */
  id?: string;
  /** Tabindex of the inner `<button>`. Default 0. */
  tabIndex?: number;
  'aria-label'?: string;
  'aria-labelledby'?: string;
  'aria-describedby'?: string;
  /**
   * Fires with the new `checked` value whenever a click toggles it (i.e.
   * every click, unless the provider config's `disableToggleValue` is set).
   * Mirrors upstream's `change` output, flattened from `MatSlideToggleChange
   * {source, checked}` to the raw boolean — same simplification
   * MatButtonToggleGroup's `onChange$` already uses.
   */
  onChange$?: QRL<(checked: boolean) => void>;
  /**
   * Fires on every click regardless of whether `checked` changed — mirrors
   * upstream's `toggleChange` output.
   */
  onToggleChange$?: QRL<() => void>;
  class?: string | ReadonlyArray<string>;
  /**
   * Whether this toggle is bound to a reactive-forms-like primitive (`useMatFormControl()` or
   * equivalent) — mirrors upstream's `ngControl !== null` gate for `NgControlStatus`'s `ng-*`
   * classes, same contract as `MatCheckboxProps.formBound`. Plain, uncontrolled toggles leave
   * this `false`/undefined. See slide-toggle/SYNC.md's "Form state" section.
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
   * Fires when this toggle becomes "touched" — mirrors upstream's `_onTouched()` CVA callback,
   * invoked from the `FocusMonitor` subscription (`ngAfterContentInit`) once focus origin goes
   * to `null`, i.e. on blur of the inner `<button>`. A form library calls this to mark its own
   * field touched.
   */
  onTouched$?: QRL<() => void>;
}

const CONFIG_DEFAULTS: MatSlideToggleConfig = {
  disableToggleValue: false,
  hideIcon: false,
  disabledInteractive: false,
};

export const MatSlideToggle = component$<MatSlideToggleProps>(props => {
  // DEFAULTS fallback is REQUIRED — a bare useContext() throws Code 13 when
  // rendered with no provider hook ancestor (Progress Bar / Progress Spinner
  // post-mortem; see every other qwik-material config read for precedent).
  const config = useContext(MAT_SLIDE_TOGGLE_CONFIG, CONFIG_DEFAULTS);

  const idGen = useIdGenerator();
  // Computed once, lazily — mirrors upstream's constructor assignment
  // `this.id = this._uniqueId = inject(_IdGenerator).getId('mat-mdc-slide-toggle-')`,
  // which runs once and is only overwritten by a later *explicit* `[id]`
  // binding (the `id` getter's own fallback, `this.id || this._uniqueId`,
  // then always resolves to the current `id`). `_labelId`, by contrast, is
  // fixed to `_uniqueId + '-label'` in the constructor and never re-reads
  // `id` again afterwards — replicated below by deriving `labelId` from
  // `autoId` (the always-auto-generated value), not from the effective `id`.
  const autoId = useSignal(() => idGen.getId('mat-mdc-slide-toggle-'));
  const id = props.id ?? autoId.value;
  const buttonId = `${id}-button`;
  const labelId = `${autoId.value}-label`;

  // Upstream `_noopAnimations = _animationsDisabled()` — read once per
  // render via the shared hook (dialog/progress-bar/progress-spinner/
  // pseudo-checkbox all read the same context).
  const animationsDisabled = useAnimationsDisabled();
  const rippleGlobalOptions = useRippleGlobalOptions();

  // Upstream `ngAfterContentInit(): this._focusMonitor.monitor(this._elementRef,
  // true)`. `useFocusOrigin()` is the lazy, useOn()-based replacement (see
  // qwik-cdk/a11y/focus-origin/focus-origin.ts and
  // qwik-material/button-toggle/mat-button-toggle.tsx for the established
  // pattern this mirrors): it attaches `on:pointerdown`/`on:focusin`/
  // `on:focusout` references to this component's own host element
  // (<mat-slide-toggle>) at SSR time — no JS loads or runs until one of
  // those events actually fires. `focusin` bubbles, covering focus landing
  // on the inner <button> for free (upstream's `checkChildren: true`).
  const focusOrigin = useFocusOrigin();

  const checked = props.checked ?? false;
  const disabled = props.disabled ?? false;
  const disabledInteractive = props.disabledInteractive ?? config.disabledInteractive ?? false;
  const required = props.required ?? false;
  const hideIcon = props.hideIcon ?? config.hideIcon ?? false;
  const labelPosition = props.labelPosition ?? 'after';
  const color = props.color ?? config.color ?? 'accent';
  const tabIndexValue = props.tabIndex ?? 0;
  // Provider-only option — not exposed as a per-instance prop, matching
  // upstream (no `@Input()` for `disableToggleValue`; only
  // `MAT_SLIDE_TOGGLE_DEFAULT_OPTIONS`).
  const disableToggleValue = config.disableToggleValue ?? false;

  // Upstream's own `_focused` field (bound as `[class.mat-mdc-slide-toggle-focused]`)
  // is set true ONLY for keyboard/program FocusMonitor origins — separate
  // from (and in addition to) the generic `cdk-*-focused` classes FocusMonitor
  // itself applies to every monitored element regardless of origin kind.
  const focused = focusOrigin.value === 'keyboard' || focusOrigin.value === 'program';

  const hostClasses = [
    'mat-mdc-slide-toggle',
    focused && 'mat-mdc-slide-toggle-focused',
    checked && 'mat-mdc-slide-toggle-checked',
    animationsDisabled.value && '_mat-animation-noopable',
    // `[class]="color ? 'mat-' + color : ''"` — color always resolves
    // truthy here (see `color` above), so this is unconditional in practice.
    color && `mat-${color}`,
    // Mirrors `NgControlStatus` — only present when bound to a reactive-forms-like control. See
    // `MatSlideToggleProps.formBound`'s own doc comment.
    (props.formBound ?? false) && ((props.touched ?? false) ? 'ng-touched' : 'ng-untouched'),
    (props.formBound ?? false) && ((props.dirty ?? false) ? 'ng-dirty' : 'ng-pristine'),
    (props.formBound ?? false) && ((props.invalid ?? false) ? 'ng-invalid' : 'ng-valid'),
    // FocusMonitor's `_setClasses` toggles these on the monitored element
    // (here, this same host) for ANY origin, independent of the
    // component-specific `mat-mdc-slide-toggle-focused` class above.
    focusOrigin.value && 'cdk-focused',
    focusOrigin.value === 'touch' && 'cdk-touch-focused',
    focusOrigin.value === 'keyboard' && 'cdk-keyboard-focused',
    focusOrigin.value === 'mouse' && 'cdk-mouse-focused',
    focusOrigin.value === 'program' && 'cdk-program-focused',
    props.class,
  ].filter(Boolean) as string[];

  const buttonClasses = [
    'mdc-switch',
    checked && 'mdc-switch--selected',
    !checked && 'mdc-switch--unselected',
    checked && 'mdc-switch--checked',
    disabled && 'mdc-switch--disabled',
    disabledInteractive && 'mat-mdc-slide-toggle-disabled-interactive',
  ].filter(Boolean) as string[];

  // Upstream `_getAriaLabelledBy()`: an explicit `aria-labelledby` wins;
  // otherwise a bound `aria-label` SUPPRESSES it entirely (removed, not
  // re-pointed); otherwise it points at the `<label>` this component always
  // renders.
  const ariaLabelledBy = props['aria-labelledby']
    ? props['aria-labelledby']
    : props['aria-label']
      ? undefined
      : labelId;

  // Upstream `_handleClick()`: guards on `disabled` alone (never
  // `disabledInteractive` — see 'disabled-interactive' scenario: the inner
  // button stays natively focusable/clickable, but this handler still
  // no-ops). `toggleChange` always fires first; `change` (+ the actual
  // value flip) only fires when the provider hasn't disabled it.
  //
  // Reads `props.checked`/`props.disabled` LIVE (via the `props` object
  // itself) rather than the outer-scope `checked`/`disabled` consts: `$()`
  // captures outer-scope primitives BY VALUE at the render that created this
  // closure, frozen into that render's serialized QRL. Once qwikloader has
  // resumed and bound this exact closure client-side, a later render that
  // recomputes `checked`/`disabled` from new props does NOT get a chance to
  // refresh an ALREADY-RESOLVED closure's captured primitives — confirmed
  // empirically (a second click kept computing `!checked` against the FIRST
  // render's `checked=false` forever, even though the DOM had already
  // updated to `checked=true`). `props` itself, by contrast, is the
  // component's live reactive props store — reading `props.checked` inside
  // the closure always reflects the current value. Same root cause/fix as
  // MatButtonToggle's click handler (see mat-button-toggle.tsx's "re-read
  // live state inside the closure" comment).
  const rippleContainerRef = useSignal<HTMLElement>();

  // Upstream `slide-toggle.html`: `[matRippleTrigger]="switch"` — `#switch`
  // is this very `<button class="mdc-switch">` (the `switch` JSX below),
  // not the deeply-nested `.mat-mdc-slide-toggle-ripple` span itself. Reads
  // `props.disableRipple`/`props.disabled` live, matching `onButtonClick$`'s
  // own "re-read live" convention documented below. ONE shared `$()`
  // reference wired to all six pointer events — see
  // `core/ripple/ripple-renderer.ts`'s module doc comment for why that's
  // required, not just tidy (cross-chunk QRL ordering on a cold chunk).
  const rippleEvent$ = $((event: MouseEvent | TouchEvent) => {
    handleRippleEvent(
      event,
      rippleContainerRef.value,
      {
        rippleDisabled: !!(props.disableRipple || props.disabled),
        rippleConfig: {centered: true, animation: rippleAnimationConfig(animationsDisabled.value)},
      },
      rippleGlobalOptions,
    );
  });

  const onButtonClick$ = $(async () => {
    if (props.disabled ?? false) return;
    await props.onToggleChange$?.resolve();
    props.onToggleChange$?.();
    if (!disableToggleValue) {
      await props.onChange$?.resolve();
      props.onChange$?.(!(props.checked ?? false));
    }
  });

  // Mirrors upstream's `FocusMonitor.monitor(this._elementRef, true)` subscription
  // (`ngAfterContentInit`): the `!focusOrigin` branch (deferred one tick upstream purely to
  // dodge an Angular change-detection "changed after checked" error — irrelevant here) calls
  // `_onTouched()`. Attached directly to the inner `<button>`'s native blur (the only focusable
  // element this component renders), rather than a `FocusMonitor`-equivalent hook, since nothing
  // else needs the richer "which origin" information here — see `onTouched$`'s own doc comment.
  const onButtonBlur$ = $(() => {
    props.onTouched$?.();
  });

  // Upstream: "Clicking on the label will trigger another click event from
  // the button [a native `<label for>` referencing a labelable element like
  // `<button>` forwards its click]. Stop propagation here so other listeners
  // further up in the DOM don't execute twice."
  const onLabelClick$ = $((event: Event) => {
    event.stopPropagation();
  });

  return (
    <mat-slide-toggle id={id} class={hostClasses}>
      <MatInternalFormField labelPosition={labelPosition}>
        <button
          class={buttonClasses}
          role="switch"
          type="button"
          tabIndex={disabled && !disabledInteractive ? -1 : tabIndexValue}
          disabled={(disabled && !disabledInteractive) || undefined}
          id={buttonId}
          name={props.name || undefined}
          aria-label={props['aria-label'] || undefined}
          aria-labelledby={ariaLabelledBy}
          aria-describedby={props['aria-describedby']}
          aria-required={required ? 'true' : undefined}
          aria-checked={checked ? 'true' : 'false'}
          aria-disabled={disabled && disabledInteractive ? 'true' : undefined}
          onClick$={onButtonClick$}
          onBlur$={onButtonBlur$}
          onMouseDown$={rippleEvent$}
          onMouseUp$={rippleEvent$}
          onMouseLeave$={rippleEvent$}
          onTouchStart$={rippleEvent$}
          onTouchEnd$={rippleEvent$}
          onTouchCancel$={rippleEvent$}
        >
          <div class="mat-mdc-slide-toggle-touch-target" />
          <span class="mdc-switch__track" />
          <span class="mdc-switch__handle-track">
            <span class="mdc-switch__handle">
              <span class="mdc-switch__shadow">
                <span class="mdc-elevation-overlay" />
              </span>
              <span class="mdc-switch__ripple">
                {/* `mat-ripple` mirrors Angular's bare `mat-ripple` directive-selector
                    attribute (static, no value) left on the rendered DOM — upstream's
                    own template literally writes `mat-ripple` (not `matRipple`) here,
                    unlike button-toggle's `matRipple`/`matripple`. Cast past the
                    intrinsic <span> type since it's not a recognized HTML attr. Real
                    `.mat-ripple-element` spans launch here on `mousedown`/`touchstart`
                    of the `<button class="mdc-switch">` trigger below (`core/ripple/
                    ripple-dom.ts`) — see slide-toggle/SYNC.md. */}
                <span
                  ref={rippleContainerRef}
                  {...({'mat-ripple': ''} as Record<string, string>)}
                  class="mat-ripple mat-mdc-slide-toggle-ripple mat-focus-indicator"
                />
              </span>
              {!hideIcon && (
                <span class="mdc-switch__icons">
                  <svg
                    class="mdc-switch__icon mdc-switch__icon--on"
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                  >
                    <path d="M19.69,5.23L8.96,15.96l-4.23-4.23L2.96,13.5l6,6L21.46,7L19.69,5.23z" />
                  </svg>
                  <svg
                    class="mdc-switch__icon mdc-switch__icon--off"
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                  >
                    <path d="M20 13H4v-2h16v2z" />
                  </svg>
                </span>
              )}
            </span>
          </span>
        </button>
        <label class="mdc-label" for={buttonId} id={labelId} onClick$={onLabelClick$}>
          <Slot />
        </label>
      </MatInternalFormField>
    </mat-slide-toggle>
  );
});
