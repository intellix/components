import {createContextId, type QRL, type Signal} from '@builder.io/qwik';
import type {Sort, SortDirection} from './sort-direction';

/**
 * Table-level config, OWNED and overwritten by <MatSort> on every one of
 * its own renders; <MatSortHeader> only ever reads it. Mirrors upstream's
 * `start`/`disableClear`/`disabled` `@Input()`s, which stay genuinely
 * reactive to the directive's bindings.
 */
export interface MatSortTableConfig {
  /** Table-level default start direction (`matSortStart`). Default 'asc'. */
  start: SortDirection;
  /** Table-level resolved disableClear (prop ?? config ?? false). */
  disableClear: boolean;
  /** Table-level disabled (`matSortDisabled`) — disables every header. */
  disabled: boolean;
  /** Forwarded from MatSort's `onSortChange$` prop. */
  onSortChange?: QRL<(sort: Sort) => void>;
}

/**
 * Per-instance state shared by <MatSort> and every descendant
 * <MatSortHeader> via MAT_SORT_STATE — split into two INDEPENDENT signals,
 * each with a single owner, rather than one combined signal both sides
 * read-and-rewrite:
 *
 *   - `sortValue` (active/direction): SELF-owned by the table, exactly
 *     mirroring upstream's `MatSort.active`/`.direction` plain mutable
 *     fields, which `MatSortHeader._toggleOnInteraction()` mutates directly
 *     via `this._sort.sort(this)` — there is no consumer round-trip (the
 *     `(matSortChange)` output is fire-and-forget; nothing requires the
 *     consumer to feed the new value back into `[matSortActive]`/
 *     `[matSortDirection]`, confirmed by every parity scenario's template).
 *     <MatSort> initializes it ONCE (lazy `useSignal`) and never writes to
 *     it again; only <MatSortHeader>'s `toggleOnInteraction$` writes
 *     `sortValue.value` thereafter — the most faithful port of "a child
 *     directly mutates its parent directive's own fields" is a child
 *     directly mutating a shared Signal's `.value`.
 *   - `tableConfig` (start/disableClear/disabled/onSortChange): OWNED by
 *     <MatSort>, which overwrites it with a freshly-computed object on
 *     EVERY one of its own renders (so it stays reactive to prop/config
 *     changes, matching upstream's `@Input()`s); <MatSortHeader> only reads
 *     it, never writes.
 *
 * Why split instead of one combined signal: <MatSort>'s own render needs to
 * keep `tableConfig` fresh every time it renders, which means WRITING to
 * that signal unconditionally. If `active`/`direction` lived in the SAME
 * signal, preserving them across that write would require reading the
 * signal's CURRENT value first (`{...state.value, start: ..., ...}`) —
 * which subscribes <MatSort> to its OWN signal. Since the write produces a
 * brand-new object (a different reference every time, even with identical
 * field values), Qwik's signal-change detection (reference-based) would
 * then re-schedule <MatSort> itself as a subscriber — which renders again,
 * reads-and-rewrites again, forever: an infinite reactive loop. This was
 * caught empirically (clicking a header froze the page; isolated via a
 * standalone Playwright script showing `page.locator(...).textContent()`
 * hanging past its 30s timeout — the main thread never yielded). Splitting
 * the two concerns into separately-owned signals means <MatSort> never
 * reads the signal it owns-and-rewrites (`tableConfig`), so writing to it
 * cannot re-trigger <MatSort> itself — only <MatSortHeader> instances,
 * which merely read it, re-render once and stop. See SYNC.md's "a real bug
 * found and fixed" entry for the full narrative.
 */
export interface MatSortSharedState {
  sortValue: Signal<Sort>;
  tableConfig: Signal<MatSortTableConfig>;
}

/**
 * Context id used by <MatSortHeader> to read its parent <MatSort>'s shared
 * state (two Signals — see MatSortSharedState's doc comment for why they're
 * split). The outer object itself need not be a Signal: `useContext` reads
 * it once per consuming render, and the REACTIVE primitives consumers
 * subscribe to are the two inner Signals themselves, not this wrapper.
 */
export const MAT_SORT_STATE = createContextId<MatSortSharedState>('qwik-material/sort-state');

/**
 * Sensible defaults for a <MatSortHeader> rendered without a <MatSort>
 * ancestor. Upstream throws `getSortHeaderNotContainedWithinSortError()` in
 * this situation (a dev-time guard); no parity scenario exercises a
 * standalone header, so this port renders an inert header instead of
 * crashing — see sort/SYNC.md deviation #1.
 */
export const MAT_SORT_TABLE_CONFIG_DEFAULTS: MatSortTableConfig = {
  start: 'asc',
  disableClear: false,
  disabled: false,
  onSortChange: undefined,
};

/** Combines the two shared signals' current values into one plain `Sort` +
 *  `MatSortTableConfig` snapshot — convenience for <MatSortHeader>, which
 *  needs to read both every render/interaction but must never cache this
 *  combined result anywhere (always re-read live). */
export function readSortState(state: MatSortSharedState): Sort & MatSortTableConfig {
  return {...state.sortValue.value, ...state.tableConfig.value};
}

/** Returns the sort direction cycle to use given the provided parameters of
 *  order and clear. Ported verbatim from upstream's `getSortDirectionCycle`
 *  (src/material/sort/sort.ts). */
export function getSortDirectionCycle(
  start: SortDirection,
  disableClear: boolean,
): SortDirection[] {
  const sortOrder: SortDirection[] = ['asc', 'desc'];
  if (start === 'desc') {
    sortOrder.reverse();
  }
  if (!disableClear) {
    sortOrder.push('');
  }
  return sortOrder;
}

/** Returns the next sort direction in the cycle for `current`. Ported from
 *  upstream's `MatSort.getNextSortDirection` (src/material/sort/sort.ts),
 *  minus the `MatSortable`-shaped parameter — callers resolve the effective
 *  `start`/`disableClear` (header override ?? table default) before calling
 *  this, see `computeNextSort` below. */
export function getNextSortDirection(
  current: SortDirection,
  start: SortDirection,
  disableClear: boolean,
): SortDirection {
  const cycle = getSortDirectionCycle(start, disableClear);
  let nextIndex = cycle.indexOf(current) + 1;
  if (nextIndex >= cycle.length) {
    nextIndex = 0;
  }
  return cycle[nextIndex];
}

/** A column's own sort overrides, read live from <MatSortHeader>'s props. */
export interface SortableOverrides {
  id: string;
  start?: SortDirection;
  disableClear?: boolean;
}

/**
 * Computes the next `Sort` state after a header is clicked/activated.
 * Ported from upstream's `MatSort.sort(sortable)` (src/material/sort/sort.ts):
 * switching to a new column adopts its own `start` override (falling back
 * to the table's `start`); re-activating the already-active column advances
 * the cycle, using the column's own `disableClear` override (falling back
 * to the table's resolved `disableClear`).
 */
export function computeNextSort(
  current: Sort,
  sortable: SortableOverrides,
  tableStart: SortDirection,
  tableDisableClear: boolean,
): Sort {
  if (current.active !== sortable.id) {
    return {active: sortable.id, direction: sortable.start || tableStart};
  }
  const effectiveStart = sortable.start || tableStart;
  const effectiveDisableClear = sortable.disableClear ?? tableDisableClear;
  return {
    active: current.active,
    direction: getNextSortDirection(current.direction, effectiveStart, effectiveDisableClear),
  };
}

/** Whether `id` is the currently-sorted column (ascending or descending —
 *  not cleared). Ported from upstream's `MatSortHeader._isSorted()`. */
export function isSorted(sort: Sort, id: string): boolean {
  return sort.active === id && (sort.direction === 'asc' || sort.direction === 'desc');
}
