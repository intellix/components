/**
 * Pure index math mirroring `CdkStepper`'s `FocusKeyManager` configuration
 * (`src/cdk/stepper/stepper.ts`, `ngAfterViewInit`):
 *
 * ```
 * new FocusKeyManager(this._sortedHeaders)
 *   .withWrap()
 *   .withHomeAndEnd()
 *   .withVerticalOrientation(this._orientation === 'vertical')
 * ```
 *
 * plus an unconditional `.withHorizontalOrientation(dir)` from its
 * `Directionality` subscription, which fires regardless of orientation (see
 * angular-parity.spec.ts note 7) — so ArrowLeft/ArrowRight work in BOTH
 * orientations, while ArrowUp/ArrowDown only work when vertical.
 *
 * No `skipPredicate` is ever configured (unlike
 * `qwik-material/expansion/accordion-keyboard.ts`'s disabled-skip
 * predicate) — every step header is keyboard-focusable regardless of
 * `aria-disabled`/`isNavigable()`, matching `qwik-material/tabs/
 * tab-group-keyboard.ts`'s identical no-skip configuration (see
 * angular-parity.spec.ts note 2: ARIA-disabled-ness never blocks keyboard
 * focus, only the later Enter/Space *selection* attempt can be silently
 * discarded by the stepper's own linear/editable gating).
 *
 * LTR only — same documented scope cut as every other qwik-material
 * keyboard handler.
 */

export type StepperNavKey = 'ArrowLeft' | 'ArrowRight' | 'ArrowUp' | 'ArrowDown' | 'Home' | 'End';

/** Mirrors `ListKeyManager`'s HOME/END handling (`withHomeAndEnd()`). */
function boundaryIndex(key: 'Home' | 'End', count: number): number | null {
  if (count === 0) return null;
  return key === 'Home' ? 0 : count - 1;
}

/**
 * Mirrors `ListKeyManager._setActiveInWrapMode` with `withWrap()` in effect:
 * steps one position, wrapping around either end. Falls back to the first/
 * last item when nothing is active yet, mirroring `onKeydown`'s "no active
 * item" branch.
 */
function wrappingStep(count: number, currentIndex: number, delta: 1 | -1): number | null {
  if (count === 0) return null;
  if (currentIndex < 0) return delta === 1 ? 0 : count - 1;
  return (((currentIndex + delta) % count) + count) % count;
}

/**
 * The focus-index decision for a navigation keypress. Returns `null` when
 * the key shouldn't move focus at all — either the list is empty, or the
 * key is a vertical-only arrow on a horizontal stepper (`ArrowUp`/
 * `ArrowDown` when `verticalOrientation` is false). Callers should leave
 * focus alone and skip `preventDefault()` in that case.
 */
export function computeNextStepFocusIndex(
  key: StepperNavKey,
  count: number,
  currentIndex: number,
  verticalOrientation: boolean,
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
    case 'ArrowDown':
      return verticalOrientation ? wrappingStep(count, currentIndex, 1) : null;
    case 'ArrowUp':
      return verticalOrientation ? wrappingStep(count, currentIndex, -1) : null;
  }
}
