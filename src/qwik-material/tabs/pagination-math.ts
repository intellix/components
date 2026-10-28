/**
 * Pure pagination math mirroring `MatPaginatedTabHeader`
 * (`src/material/tabs/paginated-tab-header.ts`) — the base class shared by
 * `MatTabHeader` (tab group) and `MatTabNav` (nav bar). Extracted into plain
 * functions over numbers (no DOM) so the arithmetic is independently
 * unit-testable; the only DOM-touching part lives in `use-paginated-header.ts`,
 * which reads real `offsetWidth`/`scrollWidth` measurements and feeds them
 * through these functions.
 *
 * LTR only — RTL (`Directionality`) is out of scope for this port, same as
 * every other qwik-material component's keyboard/layout logic (see SYNC.md).
 */

/**
 * Mirrors `_checkPaginationEnabled()`'s threshold check: a 5px fudge factor
 * to avoid Safari rounding flip-flops (see upstream's own comment).
 */
export function isPaginationEnabled(tabListInnerScrollWidth: number, headerWidth: number): boolean {
  return tabListInnerScrollWidth - headerWidth >= 5;
}

/**
 * Mirrors `_getMaxScrollDistance()` verbatim, INCLUDING its `|| 0` quirk:
 * a negative difference (container wider than content) is NOT clamped to
 * zero by this expression alone — only an exact `0`/`NaN` is replaced.
 * Harmless in practice because `clampScrollDistance` always re-clamps the
 * distance itself to `>= 0` before it's used anywhere.
 */
export function getMaxScrollDistance(
  tabListInnerScrollWidth: number,
  tabListContainerWidth: number,
): number {
  return tabListInnerScrollWidth - tabListContainerWidth || 0;
}

/** Mirrors `_scrollTo()`'s clamp: `Math.max(0, Math.min(maxScrollDistance, position))`. */
export function clampScrollDistance(distance: number, maxScrollDistance: number): number {
  return Math.max(0, Math.min(maxScrollDistance, distance));
}

/**
 * Mirrors `_scrollHeader()`'s delta: a third of the container's viewport,
 * signed by direction.
 */
export function scrollAmount(direction: 'before' | 'after', tabListContainerWidth: number): number {
  return ((direction === 'before' ? -1 : 1) * tabListContainerWidth) / 3;
}

/**
 * Mirrors `_updateTabScrollPosition()`'s LTR branch:
 * `translateX(${Math.round(-scrollDistance)}px)`.
 */
export function translateXForScrollDistance(scrollDistance: number): number {
  // `|| 0` normalizes `-0` to `0` — harmless either way once stringified
  // (`String(-0) === '0'`), but keeping the numeric value itself non-negative
  // zero avoids surprises for any caller that checks `=== 0` directly.
  return Math.round(-scrollDistance) || 0;
}
