import {describe, expect, it} from 'vitest';
import {createNativeDateAdapter} from '../core/datetime/native-date-adapter';
import {MAT_NATIVE_DATE_FORMATS} from '../core/datetime/native-date-formats';
import {generateOptions, parseInterval} from './timepicker-util';

describe('parseInterval', () => {
  it('returns null for null/undefined/empty', () => {
    expect(parseInterval(null)).toBeNull();
    expect(parseInterval(undefined)).toBeNull();
    expect(parseInterval('')).toBeNull();
    expect(parseInterval('   ')).toBeNull();
  });

  it('passes a bare number through unchanged (seconds)', () => {
    expect(parseInterval(90)).toBe(90);
    expect(parseInterval(1800)).toBe(1800);
  });

  it('parses hour/minute/second units, long and short forms', () => {
    expect(parseInterval('2h')).toBe(2 * 3600);
    expect(parseInterval('2hour')).toBe(2 * 3600);
    expect(parseInterval('2hours')).toBe(2 * 3600);
    expect(parseInterval('30m')).toBe(30 * 60);
    expect(parseInterval('30min')).toBe(30 * 60);
    expect(parseInterval('30minutes')).toBe(30 * 60);
    expect(parseInterval('90s')).toBe(90);
    expect(parseInterval('90seconds')).toBe(90);
  });

  it('parses a numeric string with no unit as seconds', () => {
    expect(parseInterval('45')).toBe(45);
  });

  it('parses fractional amounts', () => {
    expect(parseInterval('1.5h')).toBe(1.5 * 3600);
  });

  it('is case-insensitive and tolerates whitespace between the number and unit', () => {
    expect(parseInterval('2H')).toBe(2 * 3600);
    expect(parseInterval('2 h')).toBe(2 * 3600);
  });

  it('returns null for unparseable strings', () => {
    expect(parseInterval('abc')).toBeNull();
    expect(parseInterval('h2')).toBeNull();
  });
});

describe('generateOptions', () => {
  const adapter = createNativeDateAdapter('en-US');
  const formats = MAT_NATIVE_DATE_FORMATS;

  function time(hours: number, minutes: number) {
    return adapter.setTime(new Date(2024, 0, 15), hours, minutes, 0);
  }

  it('generates 48 half-hour options for a full day at the default 30-minute interval', () => {
    const options = generateOptions(adapter, formats, time(0, 0), time(23, 59), 30 * 60);
    expect(options).toHaveLength(48);
    expect(options[0].label).toBe('12:00 AM');
    expect(options[1].label).toBe('12:30 AM');
    expect(options[47].label).toBe('11:30 PM');
  });

  it('generates the documented 2-hour-interval list', () => {
    const options = generateOptions(adapter, formats, time(0, 0), time(23, 59), 2 * 3600);
    expect(options.map(o => o.label)).toEqual([
      '12:00 AM',
      '2:00 AM',
      '4:00 AM',
      '6:00 AM',
      '8:00 AM',
      '10:00 AM',
      '12:00 PM',
      '2:00 PM',
      '4:00 PM',
      '6:00 PM',
      '8:00 PM',
      '10:00 PM',
    ]);
  });

  it('bounds the list by min/max (documented 9:00 AM - 5:00 PM, 30-minute interval)', () => {
    const options = generateOptions(adapter, formats, time(9, 0), time(17, 0), 30 * 60);
    expect(options).toHaveLength(17);
    expect(options[0].label).toBe('9:00 AM');
    expect(options[options.length - 1].label).toBe('5:00 PM');
  });

  it('includes both endpoints when min === max', () => {
    const options = generateOptions(adapter, formats, time(9, 0), time(9, 0), 30 * 60);
    expect(options).toHaveLength(1);
    expect(options[0].label).toBe('9:00 AM');
  });

  it('clamps an interval below 1 second to avoid an infinite loop', () => {
    const options = generateOptions(adapter, formats, time(0, 0), time(0, 1), 0);
    expect(options.length).toBeGreaterThan(0);
    expect(options.length).toBeLessThanOrEqual(61);
  });

  it('each option value round-trips through the adapter to the same time as its label', () => {
    const options = generateOptions(adapter, formats, time(0, 0), time(1, 0), 30 * 60);
    for (const option of options) {
      expect(adapter.format(option.value, formats.display.timeOptionLabel)).toBe(option.label);
    }
  });
});
