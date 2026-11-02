import {describe, it, expect} from 'vitest';
import {TileCoordinator} from './tile-coordinator';
import {FitTileStyler, FixedTileStyler, RatioTileStyler} from './tile-styler';

// Real behavioral coverage of the calc()-string construction ported from
// src/material/grid-list/tile-styler.ts. These strings are exactly what
// ends up in <mat-grid-tile>/<mat-grid-list>'s inline `style` — the
// Angular-vs-Qwik parity spec (specs/material-grid-list/angular-parity.spec.ts)
// is the end-to-end check; these pin the arithmetic in isolation.

describe('FixedTileStyler', () => {
  it('positions a 1x1 tile at (row 0, col 0) with no offset', () => {
    const tracker = new TileCoordinator();
    tracker.update(2, [{rowspan: 1, colspan: 1}]);
    const styler = new FixedTileStyler('100px');
    styler.init('1px', tracker, 2, 'ltr');

    expect(styler.getTileStyle({rowspan: 1, colspan: 1}, 0, 0)).toEqual({
      left: '0',
      width: 'calc(((50% - (1px * 0.5)) * 1) + (0 * 1px))',
      top: '0',
      height: 'calc((100px * 1) + (0 * 1px))',
    });
  });

  it('offsets a tile at col 1 with a calc() position (not "0")', () => {
    const tracker = new TileCoordinator();
    tracker.update(2, [
      {rowspan: 1, colspan: 1},
      {rowspan: 1, colspan: 1},
    ]);
    const styler = new FixedTileStyler('100px');
    styler.init('1px', tracker, 2, 'ltr');

    const style = styler.getTileStyle({rowspan: 1, colspan: 1}, 0, 1);
    expect(style.left).toBe('calc(((50% - (1px * 0.5)) + 1px) * 1)');
  });

  it('uses "right" instead of "left" in rtl', () => {
    const tracker = new TileCoordinator();
    tracker.update(1, [{rowspan: 1, colspan: 1}]);
    const styler = new FixedTileStyler('100px');
    styler.init('1px', tracker, 1, 'rtl');

    const style = styler.getTileStyle({rowspan: 1, colspan: 1}, 0, 0);
    expect(style.right).toBeDefined();
    expect(style.left).toBeUndefined();
  });

  it('normalizes a unitless fixedRowHeight to px', () => {
    const tracker = new TileCoordinator();
    tracker.update(1, [{rowspan: 1, colspan: 1}]);
    const styler = new FixedTileStyler('100');
    styler.init('1px', tracker, 1, 'ltr');
    expect(styler.fixedRowHeight).toBe('100px');
  });

  it('getComputedHeight sums tile span + gutter span for the list height', () => {
    const tracker = new TileCoordinator();
    tracker.update(2, [
      {rowspan: 1, colspan: 1},
      {rowspan: 1, colspan: 1},
    ]);
    const styler = new FixedTileStyler('100px');
    styler.init('1px', tracker, 2, 'ltr');
    expect(styler.getComputedHeight()).toEqual([
      'height',
      'calc(1 * (100px * 1) + (0 * 1px) + 1px * (1 - 1))',
    ]);
  });
});

describe('RatioTileStyler', () => {
  it('sets marginTop/paddingTop instead of top/height', () => {
    const tracker = new TileCoordinator();
    tracker.update(3, [{rowspan: 1, colspan: 1}]);
    const styler = new RatioTileStyler('4:3');
    styler.init('1px', tracker, 3, 'ltr');

    const style = styler.getTileStyle({rowspan: 1, colspan: 1}, 0, 0);
    expect(style.marginTop).toBe('0');
    expect(style.paddingTop).toBeDefined();
    expect(style.top).toBeUndefined();
    expect(style.height).toBeUndefined();
  });

  it('parses the W:H ratio into rowHeightRatio', () => {
    const styler = new RatioTileStyler('4:3');
    expect(styler.rowHeightRatio).toBeCloseTo(4 / 3);
  });

  it('getComputedHeight returns paddingBottom (not height)', () => {
    const tracker = new TileCoordinator();
    tracker.update(2, [{rowspan: 1, colspan: 1}]);
    const styler = new RatioTileStyler('1:1');
    styler.init('1px', tracker, 2, 'ltr');
    styler.getTileStyle({rowspan: 1, colspan: 1}, 0, 0); // populates baseTileHeight
    const [prop] = styler.getComputedHeight();
    expect(prop).toBe('paddingBottom');
  });
});

describe('FitTileStyler', () => {
  it('sets top/height like Fixed, derived from total row/rowspan counts', () => {
    const tracker = new TileCoordinator();
    tracker.update(2, [
      {rowspan: 1, colspan: 1},
      {rowspan: 1, colspan: 1},
    ]);
    const styler = new FitTileStyler();
    styler.init('1px', tracker, 2, 'ltr');

    const style = styler.getTileStyle({rowspan: 1, colspan: 1}, 0, 0);
    expect(style.top).toBe('0');
    expect(style.height).toBeDefined();
  });

  it('getComputedHeight is null — the consumer sizes the container', () => {
    const tracker = new TileCoordinator();
    tracker.update(1, [{rowspan: 1, colspan: 1}]);
    const styler = new FitTileStyler();
    styler.init('1px', tracker, 1, 'ltr');
    expect(styler.getComputedHeight()).toBeNull();
  });
});
