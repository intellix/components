import {createContextId, type NoSerialize} from '@qwik.dev/core';
import type {ScrollStrategy} from '@angular-community/qwik-cdk/overlay';
import type {MenuPositionX, MenuPositionY} from './menu-positions';

/**
 * Default `mat-menu` options that can be overridden. Mirrors upstream
 * `MatMenuDefaultOptions` (`src/material/menu/menu.ts`).
 */
export interface MatMenuDefaultOptions {
  /** The x-axis position of the menu. */
  xPosition?: MenuPositionX;
  /** The y-axis position of the menu. */
  yPosition?: MenuPositionY;
  /** Whether the menu should overlap the menu trigger. */
  overlapTrigger?: boolean;
  /** Class to be applied to the menu's backdrop. */
  backdropClass?: string;
  /** Class or list of classes to be applied to the menu's overlay panel. */
  overlayPanelClass?: string | string[];
  /** Whether the menu has a backdrop. */
  hasBackdrop?: boolean;
}

/** Upstream's hardcoded defaults (`MAT_MENU_DEFAULT_OPTIONS`'s DI factory). */
export const MAT_MENU_DEFAULT_OPTIONS_FACTORY: Required<
  Pick<MatMenuDefaultOptions, 'overlapTrigger' | 'xPosition' | 'yPosition' | 'backdropClass'>
> = {
  overlapTrigger: false,
  xPosition: 'after',
  yPosition: 'below',
  backdropClass: 'cdk-overlay-transparent-backdrop',
};

/**
 * Context token that installs default `mat-menu` options in a subtree.
 * Provided by `<QwikMaterialProvider matMenuDefaults={…}>`. Consumed by
 * `createMatMenu()` via `useContext(MAT_MENU_DEFAULT_OPTIONS, {})`.
 */
export const MAT_MENU_DEFAULT_OPTIONS = createContextId<MatMenuDefaultOptions>(
  'qwikMaterial/menuDefaultOptions',
);

/**
 * Factory that returns the default `ScrollStrategy` for a menu panel that
 * doesn't specify one — mirrors upstream's `MAT_MENU_SCROLL_STRATEGY`
 * injection token. Provided by `<QwikMaterialProvider
 * matMenuScrollStrategyFactory={…}>`. Default:
 * `createRepositionScrollStrategy({scrollThrottle: 20})` (pre-existing,
 * previously hard-coded behaviour).
 *
 * KNOWN GAP — see `menu/SYNC.md`'s "scroll strategy lost after resume"
 * entry: a CUSTOM factory does not survive a real SSR→CSR resume
 * boundary before `openMenu()` actually reads it, so it's silently
 * ignored on every menu opened after a genuine page load. The default
 * (unconfigured) case is unaffected.
 */
export const MAT_MENU_SCROLL_STRATEGY = createContextId<NoSerialize<() => ScrollStrategy>>(
  'qwikMaterial/menuScrollStrategy',
);
