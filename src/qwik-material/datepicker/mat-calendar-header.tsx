/**
 * `<mat-calendar-header>` — ported from upstream `calendar-header.html` (the default header
 * class lives inline in `calendar.ts` upstream; this port splits it out as its own file, same
 * convention every other multi-component entry point in this project uses). Rendered directly by
 * `MatCalendar` (no `ComponentPortal`/custom-header seam — no scenario in this port's contract
 * needs a custom header, see SYNC.md).
 *
 * The period button reuses `qwik-material/button`'s `<MatButton>`. The prev/next buttons do NOT
 * use `<MatIconButton>` — confirmed live, upstream's real DOM has a literal `disabledinteractive`
 * attribute on these buttons (the bare, non-bracketed `disabledInteractive` attribute in
 * `calendar-header.html`'s template, echoed verbatim same as every other static-attribute-echo
 * case in this project), but `MatIconButton`'s own `disabledInteractive` prop is CONSUMED only
 * (drives `aria-disabled`/classes), never echoed as a literal attribute — the exact same gap
 * `qwik-material/paginator`'s `PaginatorNavButton` already works around for its own nav buttons
 * (see that file's doc comment) rather than widening `MatIconButton` itself for every existing
 * caller. `CalendarNavButton` below mirrors that same workaround, reusing `MatIconButton`'s own
 * internal pieces directly. No scenario in this port's contract ever hovers a prev/next button,
 * so (also matching `PaginatorNavButton`) the actual tooltip show/hide interaction is not wired —
 * only the static `mat-mdc-tooltip-trigger` class is reproduced.
 */
import {$, component$, type JSXOutput, type QRL} from '@builder.io/qwik';
import {useFocusOrigin, useIdGenerator} from '@angular-community/qwik-cdk/a11y';
import {MatButton} from '../button/mat-button';
import {FocusIndicator} from '../button/internal/focus-indicator';
import {TouchTarget} from '../button/internal/touch-target';
import {rippleLoaderHostAttrs, useRippleLoader} from '../button/internal/ripple-loader';
import type {DateAdapter} from '../core/datetime/date-adapter';
import {DEFAULT_DATE_ADAPTER} from '../core/datetime/native-date-adapter';
import {MAT_NATIVE_DATE_FORMATS} from '../core/datetime/native-date-formats';
import {
  getActiveYearOffset,
  nextPeriodEnabled,
  previousPeriodEnabled,
  YEARS_PER_PAGE,
  type CalendarView,
} from './calendar-math';
import {DATEPICKER_INTL, formatYearRange, formatYearRangeLabel} from './datepicker-intl';

interface CalendarNavButtonProps {
  class: string;
  label: string;
  disabled: boolean;
  onClick$: QRL<() => void>;
  icon: JSXOutput;
}

/** The prev/next nav button — see this file's own doc comment for why it doesn't reuse
 *  `<MatIconButton>`. Mirrors `qwik-material/paginator`'s `PaginatorNavButton` structure. */
const CalendarNavButton = component$<CalendarNavButtonProps>(props => {
  const focusOrigin = useFocusOrigin();
  const rippleInitialized = useRippleLoader();
  const rippleAttrs = rippleLoaderHostAttrs({
    className: 'mat-mdc-button-ripple',
    centered: true,
    disabled: props.disabled,
  });

  const classes = [
    'mat-mdc-button-base',
    'mdc-icon-button',
    'mat-mdc-icon-button',
    'mat-unthemed',
    props.disabled && 'mat-mdc-button-disabled',
    'mat-mdc-button-disabled-interactive',
    focusOrigin.value && 'cdk-focused',
    focusOrigin.value === 'touch' && 'cdk-touch-focused',
    focusOrigin.value === 'keyboard' && 'cdk-keyboard-focused',
    focusOrigin.value === 'mouse' && 'cdk-mouse-focused',
    focusOrigin.value === 'program' && 'cdk-program-focused',
    'mat-mdc-tooltip-trigger',
    props.class,
  ].filter(Boolean) as string[];

  return (
    <button
      type="button"
      class={classes}
      aria-label={props.label}
      aria-disabled={props.disabled ? 'true' : undefined}
      onClick$={props.onClick$}
      {...{disabledinteractive: ''}}
      {...rippleAttrs}
      mat-ripple-loader-uninitialized={rippleInitialized.value ? undefined : ''}
    >
      <span class="mat-mdc-button-persistent-ripple mdc-icon-button__ripple" />
      {props.icon}
      <FocusIndicator />
      <TouchTarget />
      {rippleInitialized.value && <span class="mat-ripple mat-mdc-button-ripple" />}
    </button>
  );
});

export interface MatCalendarHeaderProps<D = unknown> {
  currentView: CalendarView;
  activeDate: D;
  minDate?: D | null;
  maxDate?: D | null;
  onPeriodClick$: QRL<() => void>;
  onPrevious$: QRL<() => void>;
  onNext$: QRL<() => void>;
}

function minAndMaxYearLabels<D>(
  adapter: DateAdapter<D>,
  activeDate: D,
  minDate: D | null,
  maxDate: D | null,
) {
  const activeYear = adapter.getYear(activeDate);
  const offset = getActiveYearOffset(adapter, activeDate, minDate, maxDate);
  const minYear = activeYear - offset;
  const maxYear = minYear + YEARS_PER_PAGE - 1;
  return {
    minLabel: adapter.getYearName(adapter.createDate(minYear, 0, 1)),
    maxLabel: adapter.getYearName(adapter.createDate(maxYear, 0, 1)),
  };
}

const adapter = DEFAULT_DATE_ADAPTER as unknown as DateAdapter<unknown>;
const formats = MAT_NATIVE_DATE_FORMATS;

export const MatCalendarHeader = component$<MatCalendarHeaderProps>(props => {
  const idGen = useIdGenerator();
  const periodLabelId = idGen.getId('mat-calendar-period-label-');

  const minDate = props.minDate ?? null;
  const maxDate = props.maxDate ?? null;

  let periodButtonText: string;
  let periodButtonDescription: string;
  let periodButtonLabel: string;
  let prevButtonLabel: string;
  let nextButtonLabel: string;

  if (props.currentView === 'month') {
    const text = (
      adapter.format(props.activeDate, formats.display.monthYearLabel) as string
    ).toLocaleUpperCase();
    periodButtonText = text;
    periodButtonDescription = text;
    periodButtonLabel = DATEPICKER_INTL.switchToMultiYearViewLabel;
    prevButtonLabel = DATEPICKER_INTL.prevMonthLabel;
    nextButtonLabel = DATEPICKER_INTL.nextMonthLabel;
  } else if (props.currentView === 'year') {
    const text = adapter.getYearName(props.activeDate);
    periodButtonText = text;
    periodButtonDescription = text;
    periodButtonLabel = DATEPICKER_INTL.switchToMonthViewLabel;
    prevButtonLabel = DATEPICKER_INTL.prevYearLabel;
    nextButtonLabel = DATEPICKER_INTL.nextYearLabel;
  } else {
    const {minLabel, maxLabel} = minAndMaxYearLabels(adapter, props.activeDate, minDate, maxDate);
    periodButtonText = formatYearRange(minLabel, maxLabel);
    periodButtonDescription = formatYearRangeLabel(minLabel, maxLabel);
    periodButtonLabel = DATEPICKER_INTL.switchToMonthViewLabel;
    prevButtonLabel = DATEPICKER_INTL.prevMultiYearLabel;
    nextButtonLabel = DATEPICKER_INTL.nextMultiYearLabel;
  }

  const prevEnabled = previousPeriodEnabled(
    adapter,
    props.currentView,
    props.activeDate,
    minDate,
    maxDate,
  );
  const nextEnabled = nextPeriodEnabled(
    adapter,
    props.currentView,
    props.activeDate,
    minDate,
    maxDate,
  );

  return (
    <mat-calendar-header>
      <div class="mat-calendar-header">
        <div class="mat-calendar-controls">
          <span id={periodLabelId} class="cdk-visually-hidden" aria-live="polite">
            {periodButtonDescription}
          </span>
          <MatButton
            type="button"
            appearance="text"
            class="mat-calendar-period-button"
            ariaLabel={periodButtonLabel}
            ariaDescribedBy={periodLabelId}
            onClick$={props.onPeriodClick$}
          >
            <span aria-hidden="true">{periodButtonText}</span>
            <svg
              class={['mat-calendar-arrow', props.currentView !== 'month' && 'mat-calendar-invert']
                .filter(Boolean)
                .join(' ')}
              viewBox="0 0 10 5"
              focusable="false"
              aria-hidden="true"
            >
              <polygon points="0,0 5,5 10,0" />
            </svg>
          </MatButton>

          <div class="mat-calendar-spacer" />

          <CalendarNavButton
            class="mat-calendar-previous-button"
            label={prevButtonLabel}
            disabled={!prevEnabled}
            onClick$={$(() => {
              if (prevEnabled) props.onPrevious$();
            })}
            icon={
              <svg viewBox="0 0 24 24" focusable="false" aria-hidden="true">
                <path d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z" />
              </svg>
            }
          />

          <CalendarNavButton
            class="mat-calendar-next-button"
            label={nextButtonLabel}
            disabled={!nextEnabled}
            onClick$={$(() => {
              if (nextEnabled) props.onNext$();
            })}
            icon={
              <svg viewBox="0 0 24 24" focusable="false" aria-hidden="true">
                <path d="M10 6L8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z" />
              </svg>
            }
          />
        </div>
      </div>
    </mat-calendar-header>
  );
});
