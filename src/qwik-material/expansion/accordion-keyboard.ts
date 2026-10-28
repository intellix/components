/**
 * Pure index math mirroring CDK's `ListKeyManager`
 * (`src/cdk/a11y/key-manager/list-key-manager.ts`) as configured by
 * `MatAccordion` (`src/material/accordion.ts`):
 * `new FocusKeyManager(this._ownHeaders).withWrap().withHomeAndEnd()` —
 * vertical orientation only (LEFT/RIGHT are never enabled; `MatAccordion`
 * never calls `withHorizontalOrientation()`).
 *
 * Framed as plain functions over an index range + a disabled predicate (no
 * `QueryList`, no class) so the traversal logic is trivially unit-testable
 * without rendering anything; `MatAccordion`'s keydown handler supplies
 * `count`/`isDisabled` from a live DOM query of its own rendered headers.
 */

export type IsDisabled = (index: number) => boolean;

/** The only keys `MatAccordion`'s key manager configuration reacts to. */
export type AccordionNavKey = 'ArrowDown' | 'ArrowUp' | 'Home' | 'End';

/**
 * Starts at `fromIndex` and walks by `fallbackDelta` until it finds an
 * enabled item, stopping at either end of the range (never wraps). Mirrors
 * `ListKeyManager._setActiveItemByIndex`, which backs `setFirstItemActive()`
 * (`fromIndex: 0, fallbackDelta: 1`) and `setLastItemActive()`
 * (`fromIndex: count - 1, fallbackDelta: -1`) — i.e. Home/End, and also
 * `setNextItemActive()`/`setPreviousItemActive()`'s "no active item yet"
 * fallback (see `computeNextHeaderIndex` below).
 */
export function findBoundaryEnabledIndex(
  count: number,
  fromIndex: number,
  fallbackDelta: -1 | 1,
  isDisabled: IsDisabled,
): number | null {
  if (count === 0 || fromIndex < 0 || fromIndex >= count) return null;
  let index = fromIndex;
  while (isDisabled(index)) {
    index += fallbackDelta;
    if (index < 0 || index >= count) return null;
  }
  return index;
}

/**
 * Steps `delta` positions from `currentIndex`, wrapping around either end
 * of the range, stopping at the first enabled item found. Mirrors
 * `ListKeyManager._setActiveInWrapMode` — used for ArrowDown/ArrowUp when
 * there IS already an active item (`withWrap()` is in effect). Returns
 * `null` only if every item is disabled or the range is empty.
 */
export function findNextEnabledIndexWrapping(
  count: number,
  currentIndex: number,
  delta: -1 | 1,
  isDisabled: IsDisabled,
): number | null {
  if (count === 0) return null;
  for (let i = 1; i <= count; i++) {
    const index = (((currentIndex + delta * i) % count) + count) % count;
    if (!isDisabled(index)) return index;
  }
  return null;
}

/**
 * The full per-key decision `MatAccordion`'s keydown handler needs. Mirrors
 * `ListKeyManager.onKeydown`'s `DOWN_ARROW`/`UP_ARROW`/`HOME`/`END` cases
 * (all other keys are the caller's concern — e.g. Space/Enter toggle the
 * focused header directly and never reach this). Returns `null` when
 * nothing should move (e.g. Home while already on the first header, or
 * every item disabled) — the caller should leave focus where it is and
 * skip `preventDefault()` in that case, matching upstream's
 * `_setActiveItemByIndex` no-op-on-bounds behavior.
 */
export function computeNextHeaderIndex(
  key: AccordionNavKey,
  count: number,
  currentIndex: number,
  isDisabled: IsDisabled,
): number | null {
  switch (key) {
    case 'Home':
      return findBoundaryEnabledIndex(count, 0, 1, isDisabled);
    case 'End':
      return findBoundaryEnabledIndex(count, count - 1, -1, isDisabled);
    case 'ArrowDown':
      return currentIndex < 0
        ? findBoundaryEnabledIndex(count, 0, 1, isDisabled)
        : findNextEnabledIndexWrapping(count, currentIndex, 1, isDisabled);
    case 'ArrowUp':
      return currentIndex < 0
        ? findBoundaryEnabledIndex(count, count - 1, -1, isDisabled)
        : findNextEnabledIndexWrapping(count, currentIndex, -1, isDisabled);
  }
}
