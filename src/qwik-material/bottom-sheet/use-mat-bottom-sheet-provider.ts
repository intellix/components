import {useContextProvider} from '@qwik.dev/core';
import type {ScrollStrategyDescriptor} from '@angular-community/qwik-cdk/overlay';
import type {MatBottomSheetConfig} from './mat-bottom-sheet-config';
import {
  MAT_BOTTOM_SHEET_DEFAULT_OPTIONS,
  MAT_BOTTOM_SHEET_SCROLL_STRATEGY,
} from './mat-bottom-sheet-tokens';

/** Options for {@link useMatBottomSheetProvider}. */
export interface MatBottomSheetProviderConfig {
  /** Defaults merged into every `useMatBottomSheet().open()` config in this subtree. */
  defaults?: Partial<MatBottomSheetConfig>;
  /** Default `ScrollStrategy` descriptor for bottom sheets that don't specify their own.
   *  Defaults to `'block'` (matches upstream `MatBottomSheet.open()`'s own default). */
  scrollStrategy?: ScrollStrategyDescriptor;
}

/**
 * Provides {@link MAT_BOTTOM_SHEET_DEFAULT_OPTIONS} and
 * {@link MAT_BOTTOM_SHEET_SCROLL_STRATEGY} for this subtree — call once near the root (or
 * anywhere deeper) so every `useMatBottomSheet()` call resolves its defaults/scroll strategy
 * from `config` instead of the hardcoded fallbacks. Only these two contexts are provided;
 * every other qwik-material configuration context stays whatever an ancestor (or nothing)
 * already provided.
 *
 * A bottom sheet opened from a component under this subtree automatically carries every
 * visible qwik-material configuration context (including this one) into the opened content
 * — see `core/mat-context-snapshot.ts`'s `useMatContextSnapshot()`.
 */
export function useMatBottomSheetProvider(config?: MatBottomSheetProviderConfig): void {
  useContextProvider(MAT_BOTTOM_SHEET_DEFAULT_OPTIONS, config?.defaults ?? {});
  useContextProvider(MAT_BOTTOM_SHEET_SCROLL_STRATEGY, config?.scrollStrategy ?? 'block');
}
