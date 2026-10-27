import {describe, it, expect} from 'vitest';
import {TileCoordinator, TilePosition} from './tile-coordinator';

// Port of (a subset of) src/material/grid-list/grid-list.spec.ts's
// TileCoordinator-adjacent assertions. Pure TS, no Qwik involved — real
// behavioral coverage, not a smoke test.

function tiles(...spans: Array<[rowspan: number, colspan: number]>) {
  return spans.map(([rowspan, colspan]) => ({rowspan, colspan}));
}

describe('TileCoordinator', () => {
  it('positions 1x1 tiles left-to-right, top-to-bottom', () => {
    const tc = new TileCoordinator();
    tc.update(3, tiles([1, 1], [1, 1], [1, 1], [1, 1]));
    expect(tc.positions).toEqual([
      new TilePosition(0, 0),
      new TilePosition(0, 1),
      new TilePosition(0, 2),
      new TilePosition(1, 0),
    ]);
    expect(tc.rowCount).toBe(2);
    expect(tc.rowspan).toBe(2);
  });

  it('greedily fills the gap a rowspan tile leaves behind', () => {
    // cols=4: a 2x2 hero at (0,0) occupies cols 0-1 for 2 rows. The next two
    // 1x1 tiles fill the rest of row 0 (cols 2,3). The 4th 1x1 can't go to
    // row-1-col-0 (still occupied by the hero for one more row) — the first
    // open gap in row 1 is col 2.
    const tc = new TileCoordinator();
    tc.update(4, tiles([2, 2], [1, 1], [1, 1], [1, 1]));
    expect(tc.positions).toEqual([
      new TilePosition(0, 0),
      new TilePosition(0, 2),
      new TilePosition(0, 3),
      new TilePosition(1, 2),
    ]);
  });

  it('rowspan/rowCount account for a tile spanning past the last tracked row', () => {
    const tc = new TileCoordinator();
    // Single 1x1 tile in a 1-col grid with rowspan 3: occupies rows 0-2,
    // but rowIndex only ever reaches 0 (one tile placed, no second row
    // needed to find a gap) — rowspan getter corrects for the overhang.
    tc.update(1, tiles([3, 1]));
    expect(tc.rowCount).toBe(1);
    expect(tc.rowspan).toBe(3);
  });

  it('throws when a tile is wider than the grid', () => {
    const tc = new TileCoordinator();
    expect(() => tc.update(2, tiles([1, 3]))).toThrow(/wider than grid/);
  });

  it('handles zero tiles', () => {
    const tc = new TileCoordinator();
    tc.update(4, []);
    expect(tc.positions).toEqual([]);
    expect(tc.rowCount).toBe(1);
  });
});
