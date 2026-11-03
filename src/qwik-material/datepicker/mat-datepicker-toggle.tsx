/**
 * `<MatDatepickerToggle>` — ported from upstream `datepicker-toggle.ts`/`.html`. Shared by both
 * a single-date and a date-range picker (mirrors `[for]`'s own `MatDatepickerPanel<...>` union
 * type upstream) — `isRangeHandle()` below is this port's own cheap runtime discriminator
 * (checks for the range handle's own `_startInputRef` field), since Qwik's `component$<P>` can't
 * be generic over "pick the right `open...Panel` function" the way upstream's shared base class
 * method dispatch does for free.
 *
 * Click is bound to the HOST element (mirrors upstream's own `'(click)': '_open($event)'` on the
 * `mat-datepicker-toggle` host, not the inner `<button>`) so `stopPropagation()` doesn't also
 * swallow a consumer's own click handler on the inner button — matches upstream's own comment
 * ("so the input doesn't get focused automatically by the form field").
 *
 * The inner `<button>`'s ripple/focus-indicator/touch-target structure is built from
 * `qwik-material/button`'s own internal pieces rather than rendering `<MatIconButton>` directly —
 * same reasoning (and same reused pieces) as `qwik-material/timepicker`'s own
 * `MatTimepickerToggle`: `MatIconButton`'s public props don't expose `aria-haspopup`/
 * `aria-expanded`/a custom default `tabIndex`.
 */
import {$, component$, useContext, type JSXOutput, type QRL} from '@qwik.dev/core';
import {useFocusOrigin} from '@angular-community/qwik-cdk/a11y';
import {QWIK_CDK, type QwikCdkInternals} from '@angular-community/qwik-cdk';
import {FocusIndicator} from '../button/internal/focus-indicator';
import {TouchTarget} from '../button/internal/touch-target';
import {rippleLoaderHostAttrs, useRippleLoader} from '../button/internal/ripple-loader';
import {disabledAttr} from '../button/internal/disabled-attr';
import {openDatepickerPanel, openDateRangePickerPanel} from './datepicker-runtime';
import {DATEPICKER_INTL} from './datepicker-intl';
import type {MatDatepickerHandle, MatDateRangePickerHandle} from './use-mat-datepicker';
import {cloneJsxForReuse} from '../core/jsx-reuse';

export type AnyDatepickerHandle<D = unknown> = MatDatepickerHandle<D> | MatDateRangePickerHandle<D>;

function isRangeHandle<D>(picker: AnyDatepickerHandle<D>): picker is MatDateRangePickerHandle<D> {
  return '_startInputRef' in picker;
}

/** Dispatches to whichever `open...Panel` function matches `picker`'s actual shape — see this
 *  file's own doc comment. */
export function openAnyDatepickerPanel<D>(
  picker: AnyDatepickerHandle<D>,
  ctx: QwikCdkInternals,
): void {
  if (isRangeHandle(picker)) {
    openDateRangePickerPanel(picker, ctx);
  } else {
    openDatepickerPanel(picker, ctx);
  }
}

export interface MatDatepickerToggleProps<D = unknown> {
  picker: AnyDatepickerHandle<D>;
  ariaLabel?: string;
  ariaLabelledby?: string;
  tabIndex?: number | null;
  disableRipple?: boolean;
  /** Mirrors upstream's `<mat-datepicker-toggle [for]="picker" disabled>` — overrides
   *  `picker.disabled` for THIS toggle only (the input and calendar are unaffected). Falls back
   *  to `picker.disabled.value` when omitted (every pre-existing usage). See
   *  `datepicker/SYNC.md`'s "independent per-element disabled" entry. */
  disabled?: boolean;
  /** Custom icon content — mirrors `matDatepickerToggleIcon`-projected content. Defaults to
   *  upstream's own inline SVG calendar icon. Named prop, not `<Slot>`-projected content — same
   *  "default content fallback doesn't apply" finding `MatTimepickerToggle`'s own `icon` prop
   *  doc comment documents. */
  icon?: JSXOutput;
  class?: string | ReadonlyArray<string>;
  id?: string;
}

export const MatDatepickerToggle = component$<MatDatepickerToggleProps>(props => {
  const picker = props.picker;
  const ctx = useContext(QWIK_CDK);
  const disabled = props.disabled ?? picker.disabled.value;
  const disableRipple = props.disableRipple ?? false;

  const focusOrigin = useFocusOrigin();
  const rippleInitialized = useRippleLoader();
  const rippleAttrs = rippleLoaderHostAttrs({
    className: 'mat-mdc-button-ripple',
    centered: true,
    disabled: disableRipple || disabled,
  });

  const getAriaLabel = (): string | null =>
    props.ariaLabelledby ? null : props.ariaLabel || DATEPICKER_INTL.openCalendarLabel;

  const onClick$: QRL<(event: Event) => void> = $(event => {
    if (!disabled) {
      openAnyDatepickerPanel(picker, ctx);
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
    // Mirrors upstream's `'[attr.tabindex]': 'null'` host binding — the host element never gets
    // a `tabindex` attribute (only the inner `<button>` is focusable).
    <mat-datepicker-toggle
      id={props.id}
      class={
        [
          'mat-datepicker-toggle',
          picker.isOpen.value && 'mat-datepicker-toggle-active',
          ...(props.class ? (Array.isArray(props.class) ? props.class : [props.class]) : []),
        ].filter(Boolean) as string[]
      }
      {...{'data-mat-calendar': picker.id}}
      onClick$={onClick$}
    >
      <button
        type="button"
        class={buttonClasses}
        aria-haspopup="dialog"
        aria-label={getAriaLabel() || undefined}
        aria-labelledby={props.ariaLabelledby}
        aria-expanded={picker.isOpen.value ? 'true' : 'false'}
        // Mirrors `_defaultTabIndex`'s `Number(null)` quirk — see `MatTimepickerToggle`'s
        // identical doc comment: every toggle gets a default `tabindex="0"`.
        tabIndex={disabled ? -1 : (props.tabIndex ?? 0)}
        {...disabledAttr(disabled)}
        {...rippleAttrs}
        mat-ripple-loader-uninitialized={rippleInitialized.value ? undefined : ''}
      >
        <span class="mat-mdc-button-persistent-ripple mdc-icon-button__ripple" />
        {cloneJsxForReuse(props.icon) ?? (
          <svg
            class="mat-datepicker-toggle-default-icon"
            viewBox="0 0 24 24"
            width="24px"
            height="24px"
            fill="currentColor"
            focusable="false"
            aria-hidden="true"
          >
            <path d="M19 3h-1V1h-2v2H8V1H6v2H5c-1.11 0-1.99.9-1.99 2L3 19c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V8h14v11zM7 10h5v5H7z" />
          </svg>
        )}
        <FocusIndicator />
        <TouchTarget />
        {rippleInitialized.value && <span class="mat-ripple mat-mdc-button-ripple" />}
      </button>
    </mat-datepicker-toggle>
  );
});
