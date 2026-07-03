import {describe, it, expect} from 'vitest';
import {parseCssTime} from './parse-css-time';

describe('parseCssTime', () => {
  it('returns null for undefined/null', () => {
    expect(parseCssTime(undefined)).toBe(null);
    expect(parseCssTime(null)).toBe(null);
  });
  it('passes through finite numbers as ms', () => {
    expect(parseCssTime(150)).toBe(150);
    expect(parseCssTime(0)).toBe(0);
  });
  it('returns null for NaN or Infinity', () => {
    expect(parseCssTime(NaN)).toBe(null);
    expect(parseCssTime(Infinity)).toBe(null);
  });
  it('parses ms strings', () => {
    expect(parseCssTime('150ms')).toBe(150);
    expect(parseCssTime('0ms')).toBe(0);
    expect(parseCssTime('75.5ms')).toBe(75.5);
  });
  it('parses s strings and converts to ms', () => {
    expect(parseCssTime('0.15s')).toBeCloseTo(150);
    expect(parseCssTime('1s')).toBe(1000);
  });
  it('parses bare number strings as ms', () => {
    expect(parseCssTime('150')).toBe(150);
  });
  it('rejects garbage', () => {
    expect(parseCssTime('abc')).toBe(null);
    expect(parseCssTime('150px')).toBe(null);
    expect(parseCssTime('')).toBe(null);
  });
});
