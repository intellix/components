import {useContextProvider} from '@qwik.dev/core';
import type {ScrollStrategyDescriptor} from '@angular-community/qwik-cdk/overlay';
import type {MatDialogConfig} from './mat-dialog-config';
import {MAT_DIALOG_DEFAULT_OPTIONS, MAT_DIALOG_SCROLL_STRATEGY} from './mat-dialog-tokens';

/** Options for {@link useMatDialogProvider}. */
export interface MatDialogProviderConfig {
  /** Defaults merged into every `useMatDialog().open()` config in this subtree. */
  defaults?: Partial<MatDialogConfig>;
  /**
   * Default `ScrollStrategy` descriptor for dialogs that don't specify their own
   * (`'block'`, `{type: 'reposition', scrollThrottle: 20}`, a `QRL<() =>
   * ScrollStrategy>`, …). Defaults to `'block'` (upstream's own default).
   */
  scrollStrategy?: ScrollStrategyDescriptor;
}

/**
 * Provides {@link MAT_DIALOG_DEFAULT_OPTIONS} and {@link MAT_DIALOG_SCROLL_STRATEGY} for this
 * subtree — call once near the root (or anywhere deeper, to override just that part of the
 * tree) so every `useMatDialog()` call resolves its defaults/scroll strategy from `config`
 * instead of the hardcoded fallbacks. Only these two contexts are provided; every other
 * qwik-material configuration context stays whatever an ancestor (or nothing) already
 * provided.
 *
 * A dialog opened from a component under this subtree automatically carries every visible
 * qwik-material configuration context (including this one) into the opened content — see
 * `core/mat-context-snapshot.ts`'s `useMatContextSnapshot()`.
 */
export function useMatDialogProvider(config?: MatDialogProviderConfig): void {
  useContextProvider(MAT_DIALOG_DEFAULT_OPTIONS, config?.defaults ?? {});
  // A plain, serializable descriptor — no noSerialize needed (unlike a function-factory
  // scroll strategy; see MAT_DIALOG_SCROLL_STRATEGY's own doc comment for why that wouldn't
  // survive into useMatDialog().open$).
  useContextProvider(MAT_DIALOG_SCROLL_STRATEGY, config?.scrollStrategy ?? 'block');
}
