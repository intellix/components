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
 */
import {$, component$, type QRL} from '@builder.io/qwik';
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

  return (
    <tbody
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
      <span id={startId} class="mat-calendar-body-hidden-label">
        {props.startDateAccessibleName}
      </span>
      <span id={endId} class="mat-calendar-body-hidden-label">
        {props.endDateAccessibleName}
      </span>
      <span id={comparisonStartId} class="mat-calendar-body-hidden-label" />
      <span id={comparisonEndId} class="mat-calendar-body-hidden-label" />
    </tbody>
  );
});
