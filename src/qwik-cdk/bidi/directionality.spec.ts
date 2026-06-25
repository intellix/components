import {describe, it, expect} from 'vitest';
import {Directionality, isDirection} from './public-api';

describe('Directionality', () => {
  it('defaults to ltr', () => {
    const d = new Directionality();
    expect(d.value.value).toBe('ltr');
  });
  it('change() mutates the signal', () => {
    const d = new Directionality();
    d.change('rtl');
    expect(d.value.value).toBe('rtl');
  });
  it('isDirection narrows', () => {
    expect(isDirection('ltr')).toBe(true);
    expect(isDirection('rtl')).toBe(true);
    expect(isDirection('zz')).toBe(false);
  });
});
