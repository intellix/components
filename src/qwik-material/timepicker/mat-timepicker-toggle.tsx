import {$, component$, useContext, type JSXOutput, type QRL} from '@builder.io/qwik';
import {useFocusOrigin} from '@angular-community/qwik-cdk/a11y';
import {QWIK_CDK} from '@angular-community/qwik-cdk';
import {useAnimationsDisabled} from '../dialog/use-animations-disabled';
import {FocusIndicator} from '../button/internal/focus-indicator';
import {TouchTarget} from '../button/internal/touch-target';
import {rippleLoaderHostAttrs, useRippleLoader} from '../button/internal/ripple-loader';
import {disabledAttr} from '../button/internal/disabled-attr';
import {openTimepickerPanel} from './timepicker-runtime';
import type {MatTimepickerHandle} from './use-mat-timepicker';

const DEFAULT_ARIA_LABEL = 'Open timepicker options';

/**
 * Props for `<MatTimepickerToggle>`. Mirrors upstream `MatTimepickerToggle`
 * (`src/material/timepicker/timepicker-toggle.ts` + `.html`) — a `matIconButton` host with
 * `aria-haspopup="listbox"`, mirroring `isOpen()` into `aria-expanded`, and a default inline SVG
 * icon, overridable via the `icon` prop (mirrors `<ng-content select="[matTimepickerToggleIcon]">`
 * — a NAMED prop, not `<Slot>`-projected content: `<Slot>default</Slot>` was tried first and
 * found, via a real parity-test failure, to never render its fallback children at all when
 * nothing is projected — Qwik's `<Slot>` default-content fallback doesn't apply here the way
 * `<ng-content>`'s does (confirmed live: the rendered button was missing the `<svg>` entirely,
 * off-by-one-ing every element after it). Same "named prop instead of `<Slot>`" pattern
 * `MatSelect`'s own `customTrigger` prop already establishes.
 *
 * The inner `<button>`'s ripple/focus-indicator/touch-target structure is built from
 * `qwik-material/button`'s own internal pieces (`FocusIndicator`/`TouchTarget`/
 * `rippleLoaderHostAttrs`/`useRippleLoader`/`disabledAttr` — see `../button/internal/`) rather
 * than rendering `<MatIconButton>` itself: `MatIconButton`'s own props don't expose
 * `aria-haspopup`/`aria-expanded`/a custom `tabIndex`, which this toggle needs on the SAME
 * `<button>` element. Reusing the internal pieces directly keeps the exact same DOM (ripple
 * spans, focus overlay, `mat-ripple-loader-*` attributes) without widening `MatIconButton`'s own
 * public props for one caller.
 *
 * `disabled` is NOT a prop here either — see `use-mat-timepicker.ts`'s doc comment: it's read
 * from the shared `picker.disabled` signal (mirrors upstream's `_isDisabled = this.disabled() ||
 * timepicker.disabled()`, minus the toggle's OWN separate `disabled` input, since nothing in
 * this project's scenarios needs the toggle disabled independently of its connected input).
 */
export interface MatTimepickerToggleProps<D = unknown> {
  picker: MatTimepickerHandle<D>;
  /** Custom icon content — mirrors `matTimepickerToggleIcon`-projected content. Defaults to
   *  upstream's own inline SVG clock icon. See this interface's doc comment for why this is a
   *  named prop, not `<Slot>`-projected content. */
  icon?: JSXOutput;
  ariaLabel?: string;
  ariaLabelledby?: string;
  tabIndex?: number | null;
  disableRipple?: boolean;
  class?: string | ReadonlyArray<string>;
  id?: string;
}

export const MatTimepickerToggle = component$<MatTimepickerToggleProps>(props => {
  const picker = props.picker;
  const ctx = useContext(QWIK_CDK);
  const animationsDisabled = useAnimationsDisabled();
  const disabled = picker.disabled.value;
  const disableRipple = props.disableRipple ?? picker.disableRipple.value;

  const focusOrigin = useFocusOrigin();
  const rippleInitialized = useRippleLoader();
  const rippleAttrs = rippleLoaderHostAttrs({
    className: 'mat-mdc-button-ripple',
    centered: true,
    disabled: disableRipple || disabled,
  });

  const getAriaLabel = (): string | null =>
    props.ariaLabelledby ? null : props.ariaLabel || DEFAULT_ARIA_LABEL;

  const onClick$: QRL<(event: Event) => void> = $(event => {
    if (!disabled) {
      openTimepickerPanel(picker, ctx, animationsDisabled.value);
      event.stopPropagation();
    }
  });

  const buttonClasses = [
    'mat-mdc-button-base',
    'mdc-icon-button',
    'mat-mdc-icon-button',
    'mat-unthemed',
    disabled && 'mat-mdc-button-disabled',
    disableRipple && 'mat-mdc-button-ripple-disabled',
    focusOrigin.value && 'cdk-focused',
    focusOrigin.value === 'touch' && 'cdk-touch-focused',
    focusOrigin.value === 'keyboard' && 'cdk-keyboard-focused',
    focusOrigin.value === 'mouse' && 'cdk-mouse-focused',
    focusOrigin.value === 'program' && 'cdk-program-focused',
  ].filter(Boolean) as string[];

  return (
    // Mirrors upstream's `'[attr.tabindex]': 'null'` host binding — the host element never
    // gets a `tabindex` attribute (only the inner `<button>` is focusable); simply omitting the
    // prop achieves the same "never present" result.
    <mat-timepicker-toggle
      id={props.id}
      class={['mat-timepicker-toggle', ...(props.class ? (Array.isArray(props.class) ? props.class : [props.class]) : [])] as string[]}
      onClick$={onClick$}
    >
      <button
        type="button"
        class={buttonClasses}
        aria-haspopup="listbox"
        aria-label={getAriaLabel() || undefined}
        aria-labelledby={props.ariaLabelledby}
        aria-expanded={picker.isOpen.value ? 'true' : 'false'}
        // Mirrors upstream's `_defaultTabIndex` quirk: `Number(null)` (no literal `tabindex`
        // attribute on the Angular template's `<mat-timepicker-toggle>`) evaluates to `0`, NOT
        // `NaN` — so EVERY toggle gets a default tabIndex of `0`, confirmed live, even though
        // nothing in this port's templates ever writes one explicitly.
        tabIndex={disabled ? -1 : props.tabIndex ?? 0}
        disabled={disabledAttr(disabled)}
        {...rippleAttrs}
        mat-ripple-loader-uninitialized={rippleInitialized.value ? undefined : ''}
      >
        <span class="mat-mdc-button-persistent-ripple mdc-icon-button__ripple" />
        {props.icon ?? (
          <svg
            class="mat-timepicker-toggle-default-icon"
            height="24px"
            width="24px"
            viewBox="0 -960 960 960"
            fill="currentColor"
            focusable="false"
            aria-hidden="true"
          >
            <path d="m612-292 56-56-148-148v-184h-80v216l172 172ZM480-80q-83 0-156-31.5T197-197q-54-54-85.5-127T80-480q0-83 31.5-156T197-763q54-54 127-85.5T480-880q83 0 156 31.5T763-763q54 54 85.5 127T880-480q0 83-31.5 156T763-197q-54 54-127 85.5T480-80Zm0-400Zm0 320q133 0 226.5-93.5T800-480q0-133-93.5-226.5T480-800q-133 0-226.5 93.5T160-480q0 133 93.5 226.5T480-160Z" />
          </svg>
        )}
        <FocusIndicator />
        <TouchTarget />
        {rippleInitialized.value && <span class="mat-ripple mat-mdc-button-ripple" />}
      </button>
    </mat-timepicker-toggle>
  );
});
