import {describe, it, expect} from 'vitest';
import {
  DEFAULT_PAGE_SIZE,
  computeChangedPageIndex,
  computeDisplayedPageSizeOptions,
  defaultRangeLabel,
  getNumberOfPages,
  hasNextPage,
  hasPreviousPage,
  nextButtonsDisabled,
  normalizeLength,
  normalizePageIndex,
  normalizePageSize,
  previousButtonsDisabled,
  resolveInitialPageSize,
} from './paginator-math';

describe('normalizePageIndex', () => {
  it('floors negative/undefined/null to 0', () => {
    expect(normalizePageIndex(undefined)).toBe(0);
    expect(normalizePageIndex(null)).toBe(0);
    expect(normalizePageIndex(-5)).toBe(0);
    expect(normalizePageIndex(0)).toBe(0);
  });
  it('passes positive values through', () => {
    expect(normalizePageIndex(3)).toBe(3);
  });
});

describe('normalizeLength / normalizePageSize', () => {
  it('falls back falsy values to 0', () => {
    expect(normalizeLength(undefined)).toBe(0);
    expect(normalizeLength(0)).toBe(0);
    expect(normalizeLength(100)).toBe(100);
    expect(normalizePageSize(undefined)).toBe(0);
    expect(normalizePageSize(-10)).toBe(0);
    expect(normalizePageSize(10)).toBe(10);
  });
});

describe('getNumberOfPages', () => {
  it('is 0 when pageSize is 0', () => {
    expect(getNumberOfPages(100, 0)).toBe(0);
  });
  it('ceils length/pageSize', () => {
    expect(getNumberOfPages(100, 10)).toBe(10);
    expect(getNumberOfPages(91, 10)).toBe(10);
    expect(getNumberOfPages(0, 5)).toBe(0);
  });
});

describe('hasPreviousPage / hasNextPage', () => {
  it('previous page requires pageIndex >= 1 and a non-zero pageSize', () => {
    expect(hasPreviousPage(0, 10)).toBe(false);
    expect(hasPreviousPage(1, 10)).toBe(true);
    expect(hasPreviousPage(1, 0)).toBe(false);
  });
  it('next page requires pageIndex below the last page and a non-zero pageSize', () => {
    expect(hasNextPage(0, 10, 100)).toBe(true);
    expect(hasNextPage(9, 10, 100)).toBe(false); // last of 10 pages (0-indexed)
    expect(hasNextPage(0, 0, 100)).toBe(false);
    // length 0 / pageSize 5 => 0 pages => maxPageIndex -1 => never has a next page.
    expect(hasNextPage(0, 5, 0)).toBe(false);
  });
});

describe('previousButtonsDisabled / nextButtonsDisabled', () => {
  it('the global disabled flag overrides the per-page checks for both directions at once', () => {
    // pageIndex 1 of pageSize 10/length 100 is NOT a boundary — both would be enabled without
    // the override (mirrors the parity contract's `disabled` scenario).
    expect(hasPreviousPage(1, 10)).toBe(true);
    expect(hasNextPage(1, 10, 100)).toBe(true);
    expect(previousButtonsDisabled(1, 10, true)).toBe(true);
    expect(nextButtonsDisabled(1, 10, 100, true)).toBe(true);
  });
  it('falls through to the per-page checks when not globally disabled', () => {
    expect(previousButtonsDisabled(0, 10, false)).toBe(true); // no previous page
    expect(nextButtonsDisabled(9, 10, 100, false)).toBe(true); // last page
    expect(previousButtonsDisabled(1, 10, false)).toBe(false);
    expect(nextButtonsDisabled(1, 10, 100, false)).toBe(false);
  });
});

describe('computeChangedPageIndex', () => {
  it('keeps the first item of the old page visible under the new page size', () => {
    // Upstream's own doc example: pageSize 10, on page 1 (items 10-19, 0-indexed) -> pageSize 5
    // should land on page 2 (so item 10 is still the first item shown).
    expect(computeChangedPageIndex(1, 10, 5)).toBe(2);
  });
  it('matches the interactions scenario exactly (pageIndex 0, 10 -> 25, then 25 -> 5)', () => {
    expect(computeChangedPageIndex(0, 10, 25)).toBe(0);
    expect(computeChangedPageIndex(0, 25, 5)).toBe(0);
  });
  it('never returns a negative/NaN index', () => {
    expect(computeChangedPageIndex(0, 0, 10)).toBe(0);
  });
});

describe('computeDisplayedPageSizeOptions', () => {
  it('sorts numerically and includes the current page size even if absent', () => {
    expect(computeDisplayedPageSizeOptions(10, [5, 10, 25])).toEqual([5, 10, 25]);
    expect(computeDisplayedPageSizeOptions(7, [5, 10, 25])).toEqual([5, 7, 10, 25]);
  });
  it('sorts numerically, not lexicographically', () => {
    expect(computeDisplayedPageSizeOptions(5, [25, 5, 100])).toEqual([5, 25, 100]);
  });
  it('does not duplicate an already-present page size', () => {
    expect(computeDisplayedPageSizeOptions(25, [5, 10, 25])).toEqual([5, 10, 25]);
  });
});

describe('resolveInitialPageSize', () => {
  it('uses the explicit page size when truthy', () => {
    expect(resolveInitialPageSize(10, [5, 10, 25])).toBe(10);
  });
  it('falls back to the first page size option when unset', () => {
    expect(resolveInitialPageSize(undefined, [5, 10, 25])).toBe(5);
    expect(resolveInitialPageSize(0, [25])).toBe(25);
  });
  it('falls back to DEFAULT_PAGE_SIZE when neither is available', () => {
    expect(resolveInitialPageSize(undefined, [])).toBe(DEFAULT_PAGE_SIZE);
  });
});

describe('defaultRangeLabel', () => {
  it('is "0 of <length>" when length or pageSize is 0', () => {
    expect(defaultRangeLabel(0, 5, 0)).toBe('0 of 0');
    expect(defaultRangeLabel(1, 0, 100)).toBe('0 of 100');
  });
  it('formats the normal case with an EN DASH, not a hyphen', () => {
    expect(defaultRangeLabel(0, 10, 100)).toBe('1 – 10 of 100');
    expect(defaultRangeLabel(0, 10, 100)).toBe('1 – 10 of 100');
    expect(defaultRangeLabel(9, 10, 100)).toBe('91 – 100 of 100');
  });
  it('clamps the end index to length on the last (partial) page', () => {
    expect(defaultRangeLabel(3, 25, 100)).toBe('76 – 100 of 100');
  });
  it('does not try to fix the end index once the start index already exceeds length', () => {
    expect(defaultRangeLabel(50, 10, 100)).toBe('501 – 510 of 100');
  });
});
