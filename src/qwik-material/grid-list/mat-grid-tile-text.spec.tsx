import {describe, it, expect} from 'vitest';
import {MatGridTileFooter, MatGridTileHeader} from './mat-grid-tile-text';

describe('MatGridTileHeader / MatGridTileFooter (smoke)', () => {
  it('are exported and are function-shaped components', () => {
    expect(MatGridTileHeader).toBeDefined();
    expect(typeof MatGridTileHeader).toBe('function');
    expect(MatGridTileFooter).toBeDefined();
    expect(typeof MatGridTileFooter).toBe('function');
  });
});
