import {describe, it, expect} from 'vitest';
import {UP_ARROW, DOWN_ARROW, ESCAPE, ENTER, SPACE} from './public-api';

describe('keycodes', () => {
  it('exports the expected constants', () => {
    expect(UP_ARROW).toBe(38);
    expect(DOWN_ARROW).toBe(40);
    expect(ESCAPE).toBe(27);
    expect(ENTER).toBe(13);
    expect(SPACE).toBe(32);
  });
});
