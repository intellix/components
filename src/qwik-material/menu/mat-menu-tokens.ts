import {createContextId} from '@qwik.dev/core';
import type {ScrollStrategyDescriptor} from '@angular-community/qwik-cdk/overlay';
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
 * Default `ScrollStrategy` descriptor for a menu panel that doesn't
 * specify its own — mirrors upstream's `MAT_MENU_SCROLL_STRATEGY`
 * injection token. Provided by `<QwikMaterialProvider
 * matMenuScrollStrategy={…}>`. Default: `{type: 'reposition',
 * scrollThrottle: 20}` (pre-existing, previously hard-coded behaviour).
 *
 * A plain, serializable `ScrollStrategyDescriptor` — NOT a function
 * factory; see `qwik-material/dialog/mat-dialog-tokens.ts`'s
 * `MAT_DIALOG_SCROLL_STRATEGY` for why that distinction matters (a
 * factory function doesn't survive a real SSR→CSR resume — this was a
 * real, confirmed bug here until fixed; see `menu/SYNC.md`'s "scroll
 * strategy lost after resume" entry).
 */
export const MAT_MENU_SCROLL_STRATEGY = createContextId<ScrollStrategyDescriptor>(
  'qwikMaterial/menuScrollStrategy',
);
