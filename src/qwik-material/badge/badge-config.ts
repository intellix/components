import {createContextId, useContextProvider} from '@qwik.dev/core';
import type {MatBadgeColor} from './badge-color';
import type {MatBadgePosition} from './badge-position';
import type {MatBadgeSize} from './badge-size';

/**
 * Object that can be used to configure default options for every MatBadge
 * rendered inside a `useMatBadgeProvider(...)` subtree.
 *
 * See design spec §2.1 and §2.3 for full field semantics.
 */
export interface MatBadgeConfig {
  /** Default position. Defaults to 'above after' when unset. */
  position?: MatBadgePosition;
  /** Default size. Defaults to 'medium' when unset. */
  size?: MatBadgeSize;
  /**
   * Default color. Note: upstream never applies `mat-badge-<color>` from
   * this default — only an explicit per-instance `matBadgeColor` binding
   * runs the class-adding setter (see `mat-badge.tsx`'s `color` prop doc /
   * badge/SYNC.md). MatBadge preserves that quirk, so this field currently
   * has no visible effect; kept for API-shape parity with upstream.
   */
  color?: MatBadgeColor;
  /** Default overlap. Defaults to true when unset. */
  overlap?: boolean;
}

/**
 * Context token that installs default MatBadge options in a subtree.
 * Provided by `useMatBadgeProvider(...)`. Consumed by
 * MatBadge via `useContext(MAT_BADGE_CONFIG, DEFAULTS)`.
 */
export const MAT_BADGE_CONFIG = createContextId<MatBadgeConfig>('qwikMaterial/badgeConfig');

/**
 * Provides {@link MAT_BADGE_CONFIG} for this subtree — call once near the root (or anywhere
 * deeper, to override just that part of the tree) so every MatBadge
 * descendant resolves its defaults from `config` instead of its own hardcoded fallback.
 * Only this one context is provided; every other qwik-material configuration context
 * stays whatever an ancestor (or nothing) already provided — see README.md's
 * "Configuring the library" section.
 */
export function useMatBadgeProvider(config?: MatBadgeConfig): void {
  useContextProvider(MAT_BADGE_CONFIG, config ?? {});
}
