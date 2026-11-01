import {createContextId} from '@qwik.dev/core';
import type {TooltipPosition, TooltipTouchGestures} from './tooltip-position';

/**
 * Default `matTooltip` options that can be overridden. Mirrors upstream
 * `MatTooltipDefaultOptions` (`src/material/tooltip/tooltip.ts`).
 */
export interface MatTooltipDefaultOptions {
  /** Default delay (ms) when the tooltip is shown. */
  showDelay?: number;
  /** Default delay (ms) when the tooltip is hidden. */
  hideDelay?: number;
  /** Default delay (ms) before hiding the tooltip on a touch device after `touchend`. */
  touchendHideDelay?: number;
  /** Time (ms) between pointer-down and the long-press show on a touch device. */
  touchLongPressShowDelay?: number;
  /** Default touch gesture handling for tooltips. */
  touchGestures?: TooltipTouchGestures;
  /** Default position for tooltips. */
  position?: TooltipPosition;
  /** Default value for `positionAtOrigin`. */
  positionAtOrigin?: boolean;
  /** Disables the ability for the user to interact with the tooltip element. */
  disableTooltipInteractivity?: boolean;
  /**
   * Default classes applied to the tooltip. Not applied if `tooltipClass` is
   * set directly on `<MatTooltip>`.
   */
  tooltipClass?: string | string[];
  /**
   * Whether a touch-capable device should be detected via the `any-hover`
   * media query rather than assumed non-touch. See `mat-tooltip.tsx`'s
   * `isTouchPlatform` doc comment / SYNC.md for the upstream
   * `Platform.IOS`/`Platform.ANDROID` simplification this port makes.
   */
  detectHoverCapability?: boolean | (() => boolean);
}

/** Upstream's hardcoded defaults (`MAT_TOOLTIP_DEFAULT_OPTIONS`'s DI factory). */
export const MAT_TOOLTIP_DEFAULT_OPTIONS_FACTORY: Required<
  Omit<
    MatTooltipDefaultOptions,
    | 'position'
    | 'positionAtOrigin'
    | 'tooltipClass'
    | 'detectHoverCapability'
    | 'touchLongPressShowDelay'
  >
> = {
  showDelay: 0,
  hideDelay: 0,
  touchendHideDelay: 1500,
  touchGestures: 'auto',
  disableTooltipInteractivity: false,
};

/**
 * Context token that installs default `MatTooltip` options in a subtree.
 * Provided by `<QwikMaterialProvider matTooltipDefaults={…}>`. Consumed by
 * `MatTooltip` via `useContext(MAT_TOOLTIP_DEFAULT_OPTIONS, {})`.
 */
export const MAT_TOOLTIP_DEFAULT_OPTIONS = createContextId<MatTooltipDefaultOptions>(
  'qwik-material/tooltip-default-options',
);
