import {describe, it, expect} from 'vitest';
import {
  coerceBooleanProperty,
  coerceNumberProperty,
  coerceArray,
  coerceStringArray,
  coerceCssPixelValue,
  coerceElement,
} from './public-api';

describe('coercion', () => {
  it('coerceBooleanProperty', () => {
    expect(coerceBooleanProperty('')).toBe(true);
    expect(coerceBooleanProperty('false')).toBe(false);
    expect(coerceBooleanProperty(null)).toBe(false);
    expect(coerceBooleanProperty(undefined)).toBe(false);
    expect(coerceBooleanProperty(true)).toBe(true);
  });
  it('coerceNumberProperty', () => {
    expect(coerceNumberProperty('5')).toBe(5);
    expect(coerceNumberProperty('not-a-number', 9)).toBe(9);
  });
  it('coerceArray', () => {
    expect(coerceArray('a')).toEqual(['a']);
    expect(coerceArray(['a', 'b'])).toEqual(['a', 'b']);
  });
  it('coerceCssPixelValue', () => {
    expect(coerceCssPixelValue(10)).toBe('10px');
    expect(coerceCssPixelValue('10vh')).toBe('10vh');
    expect(coerceCssPixelValue(null)).toBe('');
  });
  it('coerceElement passes raw element through', () => {
    const el = document.createElement('div');
    expect(coerceElement(el)).toBe(el);
  });
  it('coerceElement unwraps { nativeElement }', () => {
    const el = document.createElement('div');
    const ref = {nativeElement: el};
    expect(coerceElement(ref)).toBe(el);
  });
  it('coerceStringArray splits CSV', () => {
    expect(coerceStringArray('a,b,c', ',')).toEqual(['a', 'b', 'c']);
    expect(coerceStringArray(['a', 'b'])).toEqual(['a', 'b']);
  });
});
