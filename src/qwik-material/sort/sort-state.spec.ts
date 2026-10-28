/**
 * Pure-logic port of the cycle-related `it()` blocks from
 * src/material/sort/sort.spec.ts. Unlike most of upstream's suite (DOM
 * fixtures via TestBed — `createDOM()` hangs this package's vitest worker,
 * see mat-button's scenario-port comment for the same finding across every
 * qwik-material entry point), the direction-cycle math itself is a pure
 * function here (`getSortDirectionCycle`/`getNextSortDirection`/
 * `computeNextSort` in sort-state.ts) and is fully testable without
 * rendering anything — a real DOM-free advantage this port's architecture
 * has over upstream's own Angular-coupled implementation.
 *
 * Remaining DOM/behavior coverage (aria-sort, arrow rendering, focus
 * classes, recently-cleared timing) lives in
 * specs/material-sort/angular-parity.spec.ts (Playwright, the authoritative
 * parity gate) — see mat-sort-scenarios.spec.tsx's describe.skip block for
 * the full catalog of what's covered there instead.
 */
import {describe, it, expect} from 'vitest';
import type {Sort, SortDirection} from './sort-direction';
import {MAT_SORT_CONFIG, type MatSortConfig, type SortHeaderArrowPosition} from './sort-config';
import {
  MAT_SORT_STATE,
  MAT_SORT_TABLE_CONFIG_DEFAULTS,
  computeNextSort,
  getNextSortDirection,
  getSortDirectionCycle,
  isSorted,
  readSortState,
} from './sort-state';

describe('getSortDirectionCycle', () => {
  it('start=asc, clear allowed: asc, desc, ""', () => {
    expect(getSortDirectionCycle('asc', false)).toEqual(['asc', 'desc', '']);
  });

  it('start=desc, clear allowed: desc, asc, ""', () => {
    expect(getSortDirectionCycle('desc', false)).toEqual(['desc', 'asc', '']);
  });

  it('start=asc, clear disabled: asc, desc', () => {
    expect(getSortDirectionCycle('asc', true)).toEqual(['asc', 'desc']);
  });

  it('start=desc, clear disabled: desc, asc', () => {
    expect(getSortDirectionCycle('desc', true)).toEqual(['desc', 'asc']);
  });
});

/** Walks `getNextSortDirection` through a fixed start/disableClear,
 *  mirroring upstream's `testSingleColumnSortDirectionSequence` helper. */
function walkCycle(start: SortDirection, disableClear: boolean, steps: number): SortDirection[] {
  const seq: SortDirection[] = [];
  let current: SortDirection = '';
  for (let i = 0; i < steps; i++) {
    current = getNextSortDirection(current, start, disableClear);
    seq.push(current);
  }
  return seq;
}

describe('getNextSortDirection — upstream testSingleColumnSortDirectionSequence equivalents', () => {
  it('should be able to cycle asc -> desc -> [none]', () => {
    expect(walkCycle('asc', false, 3)).toEqual(['asc', 'desc', '']);
  });

  it('should be able to cycle desc -> asc -> [none]', () => {
    expect(walkCycle('desc', false, 3)).toEqual(['desc', 'asc', '']);
  });

  it('should be able to cycle from asc -> desc from either start point (disableClear)', () => {
    expect(walkCycle('asc', true, 2)).toEqual(['asc', 'desc']);
    expect(walkCycle('desc', true, 2)).toEqual(['desc', 'asc']);
  });

  it('wraps back to the first entry after the last', () => {
    // asc -> desc -> '' -> asc (wraps)
    expect(walkCycle('asc', false, 4)).toEqual(['asc', 'desc', '', 'asc']);
  });
});

describe('computeNextSort — upstream MatSort.sort()/getNextSortDirection() combo', () => {
  it('should reset sort direction when a different column is sorted', () => {
    let sort: Sort = {active: '', direction: ''};
    sort = computeNextSort(sort, {id: 'defaultA'}, 'asc', false);
    expect(sort).toEqual({active: 'defaultA', direction: 'asc'});

    sort = computeNextSort(sort, {id: 'defaultA'}, 'asc', false);
    expect(sort).toEqual({active: 'defaultA', direction: 'desc'});

    sort = computeNextSort(sort, {id: 'defaultB'}, 'asc', false);
    expect(sort).toEqual({active: 'defaultB', direction: 'asc'});
  });

  it('a column with its own `start` override adopts it on first activation, falling back to the table start otherwise (upstream "overrideStart" column, start="desc")', () => {
    let sort: Sort = {active: '', direction: ''};
    const overrideStart = {id: 'overrideStart', start: 'desc' as SortDirection};
    sort = computeNextSort(sort, overrideStart, 'asc', false);
    expect(sort.direction).toBe('desc');
    sort = computeNextSort(sort, overrideStart, 'asc', false);
    expect(sort.direction).toBe('asc');
    sort = computeNextSort(sort, overrideStart, 'asc', false);
    expect(sort.direction).toBe('');
  });

  it('a column with its own `disableClear` override never reaches "" regardless of the table default (upstream "overrideDisableClear" column)', () => {
    let sort: Sort = {active: '', direction: ''};
    const overrideDisableClear = {id: 'overrideDisableClear', disableClear: true};
    sort = computeNextSort(sort, overrideDisableClear, 'asc', false);
    expect(sort.direction).toBe('asc');
    sort = computeNextSort(sort, overrideDisableClear, 'asc', false);
    expect(sort.direction).toBe('desc');
    sort = computeNextSort(sort, overrideDisableClear, 'asc', false);
    expect(sort.direction).toBe('asc'); // never '' — the column's own override wins
  });

  it('falsy (but explicit) header start is treated as "no override" (upstream `sortable.start ? ... : ...` truthy check)', () => {
    const sort: Sort = {active: 'x', direction: ''};
    const next = computeNextSort(sort, {id: 'y', start: ''}, 'desc', false);
    // Switching column: direction = sortable.start || tableStart = '' || 'desc' = 'desc'.
    expect(next).toEqual({active: 'y', direction: 'desc'});
  });
});

describe('isSorted', () => {
  it('true only when active matches AND direction is asc/desc (not "")', () => {
    expect(isSorted({active: 'a', direction: 'asc'}, 'a')).toBe(true);
    expect(isSorted({active: 'a', direction: 'desc'}, 'a')).toBe(true);
    expect(isSorted({active: 'a', direction: ''}, 'a')).toBe(false);
    expect(isSorted({active: 'a', direction: 'asc'}, 'b')).toBe(false);
  });
});

describe('MAT_SORT_CONFIG / MAT_SORT_STATE', () => {
  it('MAT_SORT_CONFIG has the expected context id string', () => {
    expect(MAT_SORT_CONFIG.id).toBe('qwik-material/sort-config');
  });

  it('MatSortConfig accepts an empty object and a fully-populated one', () => {
    const empty: MatSortConfig = {};
    expect(empty).toBeDefined();
    const full: MatSortConfig = {
      disableClear: true,
      arrowPosition: 'before' satisfies SortHeaderArrowPosition,
    };
    expect(full.arrowPosition).toBe('before');
  });

  it('MAT_SORT_STATE has the expected context id string', () => {
    expect(MAT_SORT_STATE.id).toBe('qwik-material/sort-state');
  });

  it('MAT_SORT_TABLE_CONFIG_DEFAULTS is an inert, enabled table config', () => {
    expect(MAT_SORT_TABLE_CONFIG_DEFAULTS).toEqual({
      start: 'asc',
      disableClear: false,
      disabled: false,
      onSortChange: undefined,
    });
  });

  it('readSortState combines the two shared signals into one Sort + MatSortTableConfig snapshot', () => {
    const state = {
      sortValue: {value: {active: 'name', direction: 'asc' as const}},
      tableConfig: {value: MAT_SORT_TABLE_CONFIG_DEFAULTS},
    };
    expect(readSortState(state)).toEqual({
      active: 'name',
      direction: 'asc',
      start: 'asc',
      disableClear: false,
      disabled: false,
      onSortChange: undefined,
    });
  });
});
