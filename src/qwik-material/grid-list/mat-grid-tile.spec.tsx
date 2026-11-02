import {describe, it, expect} from 'vitest';
import {MatGridTile} from './mat-grid-tile';

describe('MatGridTile (smoke)', () => {
  it('is exported and is a function-shaped component', () => {
    expect(MatGridTile).toBeDefined();
    expect(typeof MatGridTile).toBe('function');
  });
});
