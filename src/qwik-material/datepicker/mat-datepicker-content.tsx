/**
 * The content `MatDatepickerBase._openOverlay()` attaches to its overlay — the literal
 * `<mat-datepicker-content>` element (`datepicker-content.html`'s template), rendered by
 * `qwik-cdk/overlay`'s `OverlayHost` as the sole child of `.cdk-overlay-pane`.
 *
 * Created once per `open()` session by `datepicker-runtime.ts`'s `openDatepickerPanel`/
 * `openDateRangePickerPanel` (same "fresh overlay per open" simplification `qwik-material/select`/
 * `tooltip`/`timepicker` already establish — a reopened picker gets a brand-new `MatCalendar`
 * instance, same as upstream's own `_destroyOverlay()`-then-reattach). `selected` is passed as
 * the ACTUAL `Signal` object the shared picker handle owns (the pending clone while an actions
 * row is registered, else the real committed value — resolved by the caller) — never `.value` —
 * which is what keeps this component's own renders live across the whole open session despite
 * living in a completely separate component tree from `MatDatepickerInput`/`MatDatepickerToggle`;
 * see `mat-timepicker-panel.tsx`'s own doc comment for the identical, already-proven pattern.
 * `onSelect`/`onClose` are plain (non-`$()`) callbacks — safe here because the whole overlay
 * subsystem is created and consumed client-side, within the same execution context, never
 * crossing an SSR→resume boundary (same reasoning `MatTimepickerPanelProps.onOptionSelect`'s own
 * doc comment gives).
 *
 * Deliberately NOT generic over `D` — same reason `MatTimepickerPanelProps` isn't: `Component<P>`
 * (`qwik-cdk/overlay`'s `Overlay.create<P>`) doesn't need to preserve the caller's `D`, and a
 * generic `component$` fights the Qwik optimizer's static analysis. `datepicker-runtime.ts` casts
 * through `unknown` at the two call sites that construct these props.
 *
 * ## Focus trap anchors: created imperatively by `useFocusTrap`, never JSX
 *
 * The two `cdk-visually-hidden cdk-focus-trap-anchor` sentinel `<div>`s the contract documents
 * flanking `.mat-datepicker-content-container` are `useFocusTrap`'s OWN `attachAnchors()` work
 * (`qwik-cdk/a11y`'s `createFocusTrap`, called with `containerRef` below) — they are NEVER
 * rendered as JSX children of this component. `autoFocus`/`restoreFocus` are deliberately left at
 * their "off" defaults: `<MatCalendar autoFocusActiveCell>` below does the OWN initial
 * focus-into-the-active-cell (mirrors `MatDatepickerContent.ngAfterViewInit`'s explicit
 * `this._calendar.focusActiveCell()`, NOT a generic "first tabbable element" — the period button
 * would win that race instead; see `mat-calendar.tsx`'s own doc comment for why this moved there,
 * not a task local to this component) and `datepicker-runtime.ts`'s `closeDatepickerPanel` does
 * its OWN focus-restore (via `focusVia(..., 'program')`, matching the contract's confirmed-live
 * `cdk-program-focused` class — see `use-mat-datepicker.ts`'s `_focusedElementBeforeOpen` doc
 * comment), so `useFocusTrap`'s own built-in restore (which doesn't know about `focusVia`) would
 * double up/race it.
 */
import {
  $,
  component$,
  useOn,
  useSignal,
  useVisibleTask$,
  type JSXOutput,
  type QRL,
  type Signal,
} from '@qwik.dev/core';
import {useFocusTrap} from '@angular-community/qwik-cdk/a11y';
import {MatButton} from '../button/mat-button';
import type {DateAdapter} from '../core/datetime/date-adapter';
import {DEFAULT_DATE_ADAPTER} from '../core/datetime/native-date-adapter';
import {MatCalendar} from './mat-calendar';
import {
  getCellCompareValue,
  type CalendarView,
  type MatCalendarCellClassFunction,
} from './calendar-math';
import {rangeCreatePreview, type DateRange} from './date-range-selection';

// Only used for the (adapter-agnostic) `getCellCompareValue` helper below, which only ever
// dereferences `getYear`/`getMonth`/`getDate` — matches `calendar-math.ts`'s own "cast through
// unknown" convention for a non-generic context.
const ADAPTER = DEFAULT_DATE_ADAPTER as unknown as DateAdapter<unknown>;

/** See this file's own doc comment for why every date-shaped field is `unknown`. */
export interface MatDatepickerContentProps {
  calendarId: string;
  startAt: unknown;
  startView: CalendarView;
  minDate: unknown;
  maxDate: unknown;
  dateFilter: QRL<(date: unknown) => boolean> | undefined;
  /** Mirrors `[dateClass]` — see `mat-month-view.tsx`'s own prop doc comment. */
  dateClass: QRL<MatCalendarCellClassFunction<unknown>> | undefined;
  /** See `mat-calendar.tsx`'s own `locale` prop doc comment — resolved by the caller
   *  (`datepicker-runtime.ts`) from `picker._locale.value` at `open()` time. */
  locale: string;
  isRange: boolean;
  /** The live, ACTIVE model signal — either the picker's pending clone (an actions row is
   *  registered) or its real committed value. See this file's own doc comment. */
  selected: Signal<unknown>;
  startDateAccessibleName: string | null;
  endDateAccessibleName: string | null;
  /** The registered `<mat-datepicker-actions>`/`<mat-date-range-picker-actions>` row, if any —
   *  mirrors the `[cdkPortalOutlet]="_actionsPortal"` template outlet. */
  actionsContent: JSXOutput | undefined;
  /** See `RippleLoaderMemory` — the picker's long-lived actions ripple state. */
  actionsRippleMemory: Signal<Record<number, boolean>>;
  touchUi: boolean;
  dialogLabelledBy: string | undefined;
  closeButtonLabel: string;
  entering: Signal<boolean>;
  exiting: Signal<boolean>;
  animationsDisabled: boolean;
  /** Written once this component mounts, so `datepicker-runtime.ts` can check "is there anything
   *  to animate the exit of" before deciding whether `close()` needs to wait. */
  contentElRef: Signal<Element | undefined>;
  onSelect: (date: unknown) => void;
  onClose: () => void;
}

/**
 * The `[cdkPortalOutlet]="_actionsPortal"` row. Upstream re-attaches the SAME actions view on every
 * open, so a button whose ripple was lazily initialized (hover/focus/press) stays initialized;
 * this port re-creates the buttons per open. The row records which buttons (by DOM position) got
 * initialized and, on re-open, replays a `mouseenter` to them so each button's own ripple loader
 * initializes exactly as it would have.
 */
const RIPPLE_TRIGGERS = ['mouseover', 'focusin', 'mousedown', 'touchstart'] as const;

const ActionsOutlet = component$<{
  memory: Signal<Record<number, boolean>>;
  content: JSXOutput | undefined;
}>(props => {
  const hostRef = useSignal<HTMLElement>();

  for (const type of RIPPLE_TRIGGERS) {
    useOn(
      type,
      $((event: Event) => {
        const host = hostRef.value;
        const button = (event.target as Element | null)?.closest?.('button');
        if (!host || !button) return;
        const index = Array.from(host.querySelectorAll('button')).indexOf(button);
        if (index >= 0 && !props.memory.value[index]) {
          props.memory.value = {...props.memory.value, [index]: true};
        }
      }),
    );
  }

  // Client-only by nature: the datepicker popup is only ever created on the client.
  useVisibleTask$(() => {
    const buttons = hostRef.value?.querySelectorAll('button') ?? [];
    buttons.forEach((button, index) => {
      if (props.memory.value[index]) button.dispatchEvent(new MouseEvent('mouseenter'));
    });
  });

  return (
    <div ref={hostRef} class="mat-datepicker-actions">
      {props.content}
    </div>
  );
});

export const MatDatepickerContent = component$<MatDatepickerContentProps>(props => {
  const containerRef = useSignal<HTMLElement>();
  // Pure tab-wrapping + anchors — see this file's own doc comment for why `autoFocus`/
  // `restoreFocus` are both left off.
  useFocusTrap(containerRef);

  // Range hover preview — purely local/visual, never touches the committed/pending model. See
  // this file's own doc comment: `MatCalendar`'s `previewStart`/`previewEnd` are plain
  // `compareValue` numbers, derived here from whichever date is currently hovered.
  const previewDate = useSignal<unknown>(null);
  const currentRange: DateRange<unknown> = props.isRange
    ? (props.selected.value as DateRange<unknown>)
    : {start: null, end: null};
  let previewStart: number | null = null;
  let previewEnd: number | null = null;
  if (props.isRange) {
    const preview = rangeCreatePreview(previewDate.value, currentRange);
    previewStart = preview.start != null ? getCellCompareValue(ADAPTER, preview.start) : null;
    previewEnd = preview.end != null ? getCellCompareValue(ADAPTER, preview.end) : null;
  }

  const onUserSelect$ = $((date: unknown) => props.onSelect(date));
  const onPreviewChange$ = $((date: unknown) => {
    previewDate.value = date;
  });
  const onClose$ = $(() => props.onClose());

  const animating = props.entering.value || props.exiting.value;
  const hasActions = props.actionsContent !== undefined;

  return (
    <mat-datepicker-content
      ref={props.contentElRef}
      class={
        [
          'mat-datepicker-content',
          'mat-primary',
          props.touchUi && 'mat-datepicker-content-touch',
          !props.animationsDisabled && 'mat-datepicker-content-animations-enabled',
          animating && 'mat-datepicker-content-animating',
          props.exiting.value && 'mat-datepicker-content-exit',
        ].filter(Boolean) as string[]
      }
    >
      <div
        ref={containerRef}
        {...{cdktrapfocus: ''}}
        role="dialog"
        aria-modal="true"
        aria-labelledby={props.dialogLabelledBy || undefined}
        class={
          [
            'mat-datepicker-content-container',
            hasActions && 'mat-datepicker-content-container-with-actions',
          ].filter(Boolean) as string[]
        }
      >
        <MatCalendar
          id={props.calendarId}
          autoFocusActiveCell
          startAt={props.startAt}
          startView={props.startView}
          selected={props.isRange ? currentRange : (props.selected.value as unknown)}
          minDate={props.minDate}
          maxDate={props.maxDate}
          dateFilter={props.dateFilter as QRL<(date: unknown) => boolean> | undefined}
          dateClass={props.dateClass as QRL<MatCalendarCellClassFunction<unknown>> | undefined}
          locale={props.locale}
          previewStart={previewStart}
          previewEnd={previewEnd}
          startDateAccessibleName={props.startDateAccessibleName}
          endDateAccessibleName={props.endDateAccessibleName}
          onUserSelect$={onUserSelect$}
          onPreviewChange$={props.isRange ? onPreviewChange$ : undefined}
        />
        {hasActions && (
          <ActionsOutlet memory={props.actionsRippleMemory} content={props.actionsContent} />
        )}
        {/* Invisible close button for screen reader users — always hidden in this port (no
            scenario ever tabs this far/focuses it; upstream only un-hides it on its OWN focus). */}
        <MatButton
          type="button"
          appearance="elevated"
          color="primary"
          class={['mat-datepicker-close-button', 'cdk-visually-hidden']}
          onClick$={onClose$}
        >
          {props.closeButtonLabel}
        </MatButton>
      </div>
    </mat-datepicker-content>
  );
});
