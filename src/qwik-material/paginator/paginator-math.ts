/**
 * Pure range/page math ported from `MatPaginator` (`src/material/paginator/paginator.ts`) and
 * `MatPaginatorIntl`'s default `getRangeLabel` (`src/material/paginator/paginator-intl.ts`). Kept
 * free of Qwik entirely (no signals, no `$()`) so it is trivially unit-testable — see
 * `paginator-math.spec.ts` — and so `mat-paginator.tsx`'s `$()` handlers can call it directly with
 * plain values read live from signals/props at the moment they run (never a value hoisted/baked in
 * at render time — see this port's SYNC.md "reading state inside `$()` handlers" note).
 */

/** Mirrors `PageEvent` (`src/material/paginator/paginator.ts`). */
export interface PageEvent {
  pageIndex: number;
  /** @breaking-change 8.0.0 To be made into a required property, mirroring upstream's own note. */
  previousPageIndex?: number;
  pageSize: number;
  length: number;
}

/** The default page size if there is no page size and there are no provided page size options. */
export const DEFAULT_PAGE_SIZE = 50;

/** Mirrors the `pageIndex` setter: `Math.max(value || 0, 0)`. */
export function normalizePageIndex(value: number | undefined | null): number {
  return Math.max(value || 0, 0);
}

/** Mirrors the `length` setter: `value || 0`. */
export function normalizeLength(value: number | undefined | null): number {
  return value || 0;
}

/** Mirrors the `pageSize` setter: `Math.max(value || 0, 0)`. */
export function normalizePageSize(value: number | undefined | null): number {
  return Math.max(value || 0, 0);
}

/** Mirrors `getNumberOfPages()`. */
export function getNumberOfPages(length: number, pageSize: number): number {
  if (!pageSize) {
    return 0;
  }
  return Math.ceil(length / pageSize);
}

/** Mirrors `hasPreviousPage()`. */
export function hasPreviousPage(pageIndex: number, pageSize: number): boolean {
  return pageIndex >= 1 && pageSize !== 0;
}

/** Mirrors `hasNextPage()`. */
export function hasNextPage(pageIndex: number, pageSize: number, length: number): boolean {
  const maxPageIndex = getNumberOfPages(length, pageSize) - 1;
  return pageIndex < maxPageIndex && pageSize !== 0;
}

/** Mirrors `_previousButtonsDisabled()`. */
export function previousButtonsDisabled(
  pageIndex: number,
  pageSize: number,
  disabled: boolean,
): boolean {
  return disabled || !hasPreviousPage(pageIndex, pageSize);
}

/** Mirrors `_nextButtonsDisabled()`. */
export function nextButtonsDisabled(
  pageIndex: number,
  pageSize: number,
  length: number,
  disabled: boolean,
): boolean {
  return disabled || !hasNextPage(pageIndex, pageSize, length);
}

/**
 * Mirrors `_changePageSize()`'s new-page-index arithmetic: navigates to the page containing the
 * previous page's first item. `newPageSize` must be a real, positive page size (every scenario's
 * select options are always positive numbers, same as upstream's own `_displayedPageSizeOptions`).
 */
export function computeChangedPageIndex(
  pageIndex: number,
  pageSize: number,
  newPageSize: number,
): number {
  const startIndex = pageIndex * pageSize;
  return Math.floor(startIndex / newPageSize) || 0;
}

/**
 * Mirrors `_updateDisplayedPageSizeOptions()`'s list-shaping half (sorted, deduplicated, always
 * includes the current page size). Does NOT mirror the "pick a default page size when none is set"
 * half — see {@link resolveInitialPageSize} for that, which this port applies once, at mount
 * (`pageIndex`/`pageSize` are owned internally thereafter — see `mat-paginator.tsx`'s doc comment).
 */
export function computeDisplayedPageSizeOptions(
  pageSize: number,
  pageSizeOptions: ReadonlyArray<number>,
): number[] {
  const displayed = pageSizeOptions.slice();
  if (displayed.indexOf(pageSize) === -1) {
    displayed.push(pageSize);
  }
  displayed.sort((a, b) => a - b);
  return displayed;
}

/**
 * Mirrors `_updateDisplayedPageSizeOptions()`'s "if no page size is provided, use the first page
 * size option or the default page size" branch — applied once, at mount, to seed this port's
 * internally-owned `pageSize` signal (see {@link computeDisplayedPageSizeOptions}'s doc comment).
 */
export function resolveInitialPageSize(
  pageSize: number | undefined,
  pageSizeOptions: ReadonlyArray<number>,
): number {
  if (pageSize) {
    return pageSize;
  }
  return pageSizeOptions.length !== 0 ? pageSizeOptions[0] : DEFAULT_PAGE_SIZE;
}

/**
 * Mirrors `MatPaginatorIntl`'s default `getRangeLabel` (`paginator-intl.ts`). Uses an EN DASH
 * (U+2013, `–`), not a hyphen — confirmed live against the real Angular dev-app (see
 * `src/dev-app/qwik-parity/paginator.ts`'s header).
 */
export function defaultRangeLabel(page: number, pageSize: number, length: number): string {
  if (length === 0 || pageSize === 0) {
    return `0 of ${length}`;
  }

  const safeLength = Math.max(length, 0);
  const startIndex = page * pageSize;
  const endIndex =
    startIndex < safeLength ? Math.min(startIndex + pageSize, safeLength) : startIndex + pageSize;

  return `${startIndex + 1} – ${endIndex} of ${safeLength}`;
}
