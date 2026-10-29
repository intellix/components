/**
 * The shared `<tbody mat-calendar-body>` table body rendered by month/year/multi-year-view — a
 * direct, presentational port of upstream `calendar-body.ts`/`.html` (the attribute-selector
 * `[mat-calendar-body]` component whose own host element IS the `<tbody>`). See
 * `calendar-math.ts` for every pure predicate this template calls.
 *
 * Scope cuts vs. upstream (see SYNC.md): no comparison-range cells/bridges, no drag-to-select,
 * no custom per-date CSS classes — none of this port's scenarios exercise them. The 4 hidden
 * `mat-calendar-body-hidden-label` spans are still always rendered (confirmed live on every
 * view, per the parity contract), with the comparison pair permanently empty.
 *
 * ## Foster parenting: the 4 hidden-label spans are created OUTSIDE JSX entirely
 *
 * Upstream's real template puts these 4 `<span>`s as plain siblings of the `<tr>` rows, direct
 * children of `<tbody>` — valid for Angular's LIVE DOM because Angular's renderer builds it via
 * imperative `createElement`/`appendChild` calls, which are never subject to HTML's parsing
 * rules. This port's SSR output is actual HTML TEXT that the browser parses on first load, and
 * the HTML5 "foster parenting" algorithm (building a `<tbody>` can only directly contain `<tr>`/
 * `<script>`/`<style>`/`<template>`) relocates any OTHER element — unconditionally, regardless of
 * its position — to a SIBLING of the enclosing `<table>`, BEFORE it. Confirmed live: rendering
 * these 4 spans as ordinary JSX children of this component's `<tbody>` puts them as children of
 * `<mat-month-view>` (etc.) instead, immediately before `<table>`.
 *
 * This is a browser HTML-parsing behavior, not a Qwik bug, and it is unavoidable through JSX
 * restructuring alone (position within tbody doesn't matter to the algorithm). The first fix
 * attempted here *moved* the misplaced JSX-rendered spans into the tbody after the fact (a
 * `useVisibleTask$` doing `tbody.appendChild(misplacedSpan)`) — this DOES fix the structural
 * diff, but confirmed, the hard way (a bisection that reproduced the failure with the move in
 * place and never without it): it corrupts Qwik's own reconciliation bookkeeping for this
 * component, because Qwik still believes those spans live at their ORIGINAL (JSX-declared)
 * position. The NEXT state-driven re-render of this same component instance (e.g. the next
 * keyboard-nav step moving the active cell) then hangs the page outright.
 *
 * The fix that works: don't give Qwik a JSX descriptor for these 4 spans AT ALL — create them
 * with plain `document.createElement`/`appendChild` calls in a `useVisibleTask$`, keyed by id so
 * later task re-runs (`startDateAccessibleName`/`endDateAccessibleName` changing) update existing
 * elements in place rather than duplicating. Since Qwik never rendered them via JSX, it has no
 * memory of them to reconcile against — no future render of this component can ever touch them,
 * regardless of how many times `rows`/`activeCell`/etc. change. This is the narrowest exception
 * this project's "no per-instance useVisibleTask$" rule (design doc rule 7) has needed so far:
 * that rule targets INTERACTIVITY plumbing (focus monitoring/ripple loading/keyboard handling) a
 * page's components might never need to load; this is a one-time-per-mount SSR-correctness
 * repair every instance needs regardless of interaction, the same category as the overlay
 * system's own `OverlayHost` lifecycle task.
 */
import {$, component$, useSignal, useVisibleTask$, type QRL} from '@builder.io/qwik';
import {useIdGenerator} from '@angular-community/qwik-cdk/a11y';
import {
  cellPaddingPercent,
  cellWidthPercent,
  firstRowOffset,
  isActiveCell,
  isInRange,
  isRangeEnd,
  isRangeStart,
  isSelected,
  type CalendarCell,
} from './calendar-math';
import {DATEPICKER_INTL} from './datepicker-intl';

const COMPARISON_DATE_LABEL = DATEPICKER_INTL.comparisonDateLabel;

export interface MatCalendarBodyProps<D = unknown> {
  label: string;
  rows: ReadonlyArray<ReadonlyArray<CalendarCell<D>>>;
  todayValue: number | null;
  startValue: number | null;
  endValue: number | null;
  previewStart: number | null;
  previewEnd: number | null;
  isRange: boolean;
  numCols?: number;
  cellAspectRatio?: number;
  /** Omit entirely for a view with no overall label (multi-year) — mirrors upstream leaving
   *  `[labelMinRequiredCells]` unbound, which defaults to `undefined` on calendar-body, making
   *  the `offset < labelMinRequiredCells` check always false (never JS-coerced to `0`). */
  labelMinRequiredCells?: number;
  activeCell: number;
  startDateAccessibleName?: string | null;
  endDateAccessibleName?: string | null;
  onCellClick$: QRL<(cell: CalendarCell<D>, event: MouseEvent) => void>;
  onCellFocus$: QRL<(cell: CalendarCell<D>) => void>;
  onCellMouseEnter$?: QRL<(cell: CalendarCell<D> | null) => void>;
  onGridMouseLeave$?: QRL<() => void>;
  onKeyDown$?: QRL<(event: KeyboardEvent) => void>;
  onKeyUp$?: QRL<(event: KeyboardEvent) => void>;
}

function describedBy(
  value: number,
  isRange: boolean,
  startValue: number | null,
  endValue: number | null,
  startId: string,
  endId: string,
): string | undefined {
  if (!isRange) return undefined;
  if (startValue === value && endValue === value) return `${startId} ${endId}`;
  if (startValue === value) return startId;
  if (endValue === value) return endId;
  return undefined;
}

// Declared generic on the props TYPE for documentation purposes only — like
// `MatTimepickerInputProps<D>`/`MatSelectProps<T>` elsewhere in this project, the `component$`
// itself is instantiated at the default `D = unknown` (a `component$` can't be generic per call
// site); passing a concrete `MatCalendarBodyProps<Date>` here still type-checks structurally.
export const MatCalendarBody = component$<MatCalendarBodyProps>(props => {
  const idGen = useIdGenerator();
  const startId = idGen.getId('mat-calendar-body-start-');
  const endId = idGen.getId('mat-calendar-body-end-');
  const comparisonStartId = idGen.getId('mat-calendar-body-comparison-start-');
  const comparisonEndId = idGen.getId('mat-calendar-body-comparison-end-');

  const numCols = props.numCols ?? 7;
  const cellAspectRatio = props.cellAspectRatio ?? 1;
  const offset = firstRowOffset(props.rows as unknown[][], numCols);
  const cellPadding = cellPaddingPercent(cellAspectRatio, numCols);
  const cellWidth = cellWidthPercent(numCols);
  const showDedicatedLabelRow =
    props.labelMinRequiredCells != null && offset < props.labelMinRequiredCells;

  const tbodyRef = useSignal<HTMLElement>();
  const startLabel = props.startDateAccessibleName ?? '';
  const endLabel = props.endDateAccessibleName ?? '';
  // See this file's own "Foster parenting" doc comment above. Confirmed (the hard way — an
  // earlier version of this fix *moved* the parser-misplaced JSX-rendered spans via
  // `appendChild`, which fixed the structural diff but corrupted Qwik's own reconciliation
  // bookkeeping for this component: a LATER re-render — e.g. the next keyboard-nav step — would
  // then hang the page, confirmed via a bisection that reproduced the hang with the move in place
  // and never reproduced it with the move removed) that these 4 elements must stay entirely
  // OUTSIDE Qwik's own JSX/vdom tracking, not just "fixed up after the fact": created here via
  // plain DOM APIs (never JSX), Qwik has no memory of them at all, so no future render of this
  // same component instance (new `rows`, new active cell, …) can ever try to reconcile them.
  // `useVisibleTask$` (client-only) rather than `useTask$`, since this needs a REAL DOM — this
  // never runs during SSR regardless, so there's no "runs once during SSR, skipped, never
  // reruns on the client" gap `useTask$` would have here (unlike the dateFilter-resolution tasks
  // in mat-month-view.tsx etc., which genuinely need the SSR-side run — see that file's doc
  // comment — and therefore must stay `useTask$`).
  useVisibleTask$(({track}) => {
    const start = track(() => startLabel);
    const end = track(() => endLabel);
    const tbody = tbodyRef.value;
    if (!tbody) return;
    const ensure = (id: string, text: string) => {
      let el = tbody.querySelector<HTMLSpanElement>(`#${CSS.escape(id)}`);
      if (!el) {
        el = document.createElement('span');
        el.id = id;
        el.className = 'mat-calendar-body-hidden-label';
        tbody.appendChild(el);
      }
      if (el.textContent !== text) el.textContent = text;
    };
    ensure(startId, start);
    ensure(endId, end);
    ensure(comparisonStartId, `${COMPARISON_DATE_LABEL} ${start}`);
    ensure(comparisonEndId, `${COMPARISON_DATE_LABEL} ${end}`);
  });

  return (
    <tbody
      ref={tbodyRef}
      {...{'mat-calendar-body': ''}}
      class="mat-calendar-body"
      onKeyDown$={props.onKeyDown$}
      onKeyUp$={props.onKeyUp$}
      onMouseLeave$={props.isRange ? props.onGridMouseLeave$ : undefined}
    >
      {showDedicatedLabelRow && (
        <tr aria-hidden="true">
          <td
            class="mat-calendar-body-label"
            colSpan={numCols}
            style={{paddingTop: cellPadding, paddingBottom: cellPadding}}
          >
            {props.label}
          </td>
        </tr>
      )}
      {props.rows.map((row, rowIndex) => (
        <tr role="row" key={rowIndex}>
          {rowIndex === 0 && offset > 0 && (
            <td
              class="mat-calendar-body-label"
              colSpan={offset}
              style={{paddingTop: cellPadding, paddingBottom: cellPadding}}
            >
              {props.labelMinRequiredCells != null && offset >= props.labelMinRequiredCells
                ? props.label
                : ''}
            </td>
          )}
          {row.map((cell, colIndex) => {
            const active = isActiveCell(rowIndex, colIndex, numCols, offset, props.activeCell);
            const selected = isSelected(cell.compareValue, props.startValue, props.endValue);
            const rangeStart = isRangeStart(cell.compareValue, props.startValue, props.endValue);
            const rangeEnd = isRangeEnd(cell.compareValue, props.startValue, props.endValue);
            const inRange = isInRange(
              cell.compareValue,
              props.startValue,
              props.endValue,
              props.isRange,
            );
            const previewStartCls = isRangeStart(
              cell.compareValue,
              props.previewStart,
              props.previewEnd,
            );
            const previewEndCls = isRangeEnd(
              cell.compareValue,
              props.previewStart,
              props.previewEnd,
            );
            const inPreview = isInRange(
              cell.compareValue,
              props.previewStart,
              props.previewEnd,
              props.isRange,
            );
            const isToday = props.todayValue === cell.compareValue;

            return (
              <td
                role="gridcell"
                class="mat-calendar-body-cell-container"
                style={{width: cellWidth, paddingTop: cellPadding, paddingBottom: cellPadding}}
                data-mat-row={rowIndex}
                data-mat-col={colIndex}
                key={cell.value}
              >
                <button
                  type="button"
                  class={
                    [
                      'mat-calendar-body-cell',
                      !cell.enabled && 'mat-calendar-body-disabled',
                      active && 'mat-calendar-body-active',
                      rangeStart && 'mat-calendar-body-range-start',
                      rangeEnd && 'mat-calendar-body-range-end',
                      inRange && 'mat-calendar-body-in-range',
                      previewStartCls && 'mat-calendar-body-preview-start',
                      previewEndCls && 'mat-calendar-body-preview-end',
                      inPreview && 'mat-calendar-body-in-preview',
                    ].filter(Boolean) as string[]
                  }
                  tabIndex={active ? 0 : -1}
                  aria-label={cell.ariaLabel}
                  aria-disabled={!cell.enabled ? 'true' : undefined}
                  aria-pressed={selected ? 'true' : 'false'}
                  aria-current={isToday ? 'date' : undefined}
                  aria-describedby={describedBy(
                    cell.compareValue,
                    props.isRange,
                    props.startValue,
                    props.endValue,
                    startId,
                    endId,
                  )}
                  onClick$={$((event: MouseEvent) => {
                    if (cell.enabled) props.onCellClick$(cell, event);
                  })}
                  onFocus$={$(() => {
                    if (cell.enabled) props.onCellFocus$(cell);
                  })}
                  onMouseEnter$={
                    props.isRange
                      ? $(() => props.onCellMouseEnter$?.(cell.enabled ? cell : null))
                      : undefined
                  }
                >
                  <span
                    class={
                      [
                        'mat-calendar-body-cell-content',
                        'mat-focus-indicator',
                        selected && 'mat-calendar-body-selected',
                        isToday && 'mat-calendar-body-today',
                      ].filter(Boolean) as string[]
                    }
                  >
                    {cell.displayValue}
                  </span>
                  <span class="mat-calendar-body-cell-preview" aria-hidden="true" />
                </button>
              </td>
            );
          })}
        </tr>
      ))}
    </tbody>
  );
});
