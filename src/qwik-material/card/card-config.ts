import {createContextId, useContextProvider} from '@qwik.dev/core';
import type {MatCardAppearance} from './card-appearance';

/**
 * Object that can be used to configure default options for every MatCard
 * rendered inside a `useMatCardProvider(...)` subtree.
 *
 * See design spec §2.1 and §2.3 for full field semantics.
 */
export interface MatCardConfig {
  /** Default appearance for cards. Defaults to 'raised' when unset. */
  appearance?: MatCardAppearance;
}

/**
 * Context token that installs default MatCard options in a subtree.
 * Provided by `useMatCardProvider(...)`. Consumed by
 * MatCard via `useContext(MAT_CARD_CONFIG, DEFAULTS)`.
 */
export const MAT_CARD_CONFIG = createContextId<MatCardConfig>('qwikMaterial/cardConfig');

/**
 * Provides {@link MAT_CARD_CONFIG} for this subtree — call once near the root (or anywhere
 * deeper, to override just that part of the tree) so every MatCard
 * descendant resolves its defaults from `config` instead of its own hardcoded fallback.
 * Only this one context is provided; every other qwik-material configuration context
 * stays whatever an ancestor (or nothing) already provided — see README.md's
 * "Configuring the library" section.
 */
export function useMatCardProvider(config?: MatCardConfig): void {
  useContextProvider(MAT_CARD_CONFIG, config ?? {});
}
