/**
 * Pure index math for the roving-tabindex, manual-activation keyboard model
 * shared by `MatTabHeader` (tab group) and `MatTabNav` (nav bar) — both
 * extend `MatPaginatedTabHeader`, whose `FocusKeyManager` is configured as:
 *
 * ```
 * new FocusKeyManager(this._items)
 *   .withHorizontalOrientation(this._getLayoutDirection())
 *   .withHomeAndEnd()
 *   .withWrap()
 *   .skipPredicate(() => false)
 * ```
 *
 * `skipPredicate(() => false)` means arrow-key/Home/End FOCUS navigation
 * never skips disabled items — disabled tabs ARE reachable by keyboard focus
 * (see angular-parity.spec.ts note 6). Only ACTIVATING the focused item
 * (Enter/Space) checks `disabled` — see `shouldActivateOnKey` below.
 *
 * LTR only (no `withHorizontalOrientation('rtl')` support) — same scope cut
 * as every other qwik-material keyboard handler (see SYNC.md).
 *
 * Similar in shape to `qwik-material/expansion/accordion-keyboard.ts`, which
 * configures the same `ListKeyManager` machinery vertically and WITH a
 * disabled-skip predicate; tabs' horizontal, skip-nothing configuration is
 * simpler, so it's written directly rather than sharing that module.
 */

export type TabFocusKey = 'ArrowLeft' | 'ArrowRight' | 'Home' | 'End';

/**
 * Mirrors `ListKeyManager`'s HOME/END handling (`withHomeAndEnd()`): jump to
 * the first/last item outright, no wrap concept needed since there's nowhere
 * further to wrap to. Returns `null` for an empty list.
 */
function boundaryIndex(key: 'Home' | 'End', count: number): number | null {
  if (count === 0) return null;
  return key === 'Home' ? 0 : count - 1;
}

/**
 * Mirrors `ListKeyManager._setActiveInWrapMode` for LEFT/RIGHT
 * (`withHorizontalOrientation('ltr')` maps RIGHT to "next", LEFT to
 * "previous") with `withWrap()` in effect: steps one position, wrapping
 * around either end. When nothing is focused yet (`currentIndex < 0`),
 * mirrors `ListKeyManager.onKeydown`'s "no active item" branch, which falls
 * back to `setFirstItemActive()`/`setLastItemActive()` instead of stepping
 * relative to a nonexistent position.
 */
function wrappingStep(count: number, currentIndex: number, delta: 1 | -1): number | null {
  if (count === 0) return null;
  if (currentIndex < 0) return delta === 1 ? 0 : count - 1;
  return (((currentIndex + delta) % count) + count) % count;
}

/**
 * The focus-index decision for a navigation keypress. Returns `null` when
 * the list is empty (nothing to focus) — callers should leave focus alone
 * and skip `preventDefault()` in that case, matching
 * `ListKeyManager.onKeydown`'s implicit no-op when `_items` is empty.
 */
export function computeNextTabFocusIndex(
  key: TabFocusKey,
  count: number,
  currentIndex: number,
): number | null {
  switch (key) {
    case 'Home':
      return boundaryIndex('Home', count);
    case 'End':
      return boundaryIndex('End', count);
    case 'ArrowRight':
      return wrappingStep(count, currentIndex, 1);
    case 'ArrowLeft':
      return wrappingStep(count, currentIndex, -1);
  }
}

/**
 * Mirrors `MatPaginatedTabHeader._handleKeydown()`'s ENTER/SPACE branch:
 * activate the focused item only when it differs from the already-selected
 * one AND isn't disabled. `focusIndex` is `null` when nothing has been
 * focused via this keyboard model yet (falls back to the selected tab
 * itself elsewhere, which is never a valid activation target since it's
 * already selected).
 */
export function shouldActivateOnKey(
  focusIndex: number | null,
  selectedIndex: number,
  isFocusedDisabled: boolean,
): boolean {
  return focusIndex !== null && focusIndex !== selectedIndex && !isFocusedDisabled;
}
