/**
 * Pure positioning helpers ported from `src/material/tooltip/tooltip.ts`
 * (`MatTooltip._getOrigin` / `_getOverlayPosition` / `_addOffset` /
 * `_invertPosition` / `_updateCurrentPositionClass`). Kept framework-free
 * (no Qwik imports) so they're trivially unit-testable and reusable from
 * both `mat-tooltip.tsx` and its spec file.
 */
import {
  type ConnectedPosition,
  type ConnectionPositionPair,
  type HorizontalConnectionPos,
  type OriginConnectionPosition,
  type OverlayConnectionPosition,
  type VerticalConnectionPos,
} from '@angular-community/qwik-cdk/overlay';

/** Possible positions for a tooltip. Mirrors upstream `TooltipPosition`. */
export type TooltipPosition = 'left' | 'right' | 'above' | 'below' | 'before' | 'after';

/** Mirrors upstream `TooltipTouchGestures`. */
export type TooltipTouchGestures = 'auto' | 'on' | 'off';

/** Mirrors upstream `UNBOUNDED_ANCHOR_GAP` — gap (px) between trigger and panel. */
export const UNBOUNDED_ANCHOR_GAP = 8;

/** Mirrors upstream `MIN_VIEWPORT_TOOLTIP_THRESHOLD`. */
export const MIN_VIEWPORT_TOOLTIP_THRESHOLD = 8;

/**
 * Creates an error to be thrown if the user supplied an invalid tooltip position.
 * @docs-private
 */
export function getMatTooltipInvalidPositionError(position: string): Error {
  return Error(`Tooltip position "${position}" is invalid.`);
}

/** Inverts an overlay position — verbatim port of `MatTooltip._invertPosition`. */
export function invertPosition(
  position: TooltipPosition,
  x: HorizontalConnectionPos,
  y: VerticalConnectionPos,
): {x: HorizontalConnectionPos; y: VerticalConnectionPos} {
  if (position === 'above' || position === 'below') {
    if (y === 'top') {
      y = 'bottom';
    } else if (y === 'bottom') {
      y = 'top';
    }
  } else {
    if (x === 'end') {
      x = 'start';
    } else if (x === 'start') {
      x = 'end';
    }
  }

  return {x, y};
}

/**
 * Returns the origin position and a fallback position based on the user's
 * position preference. Verbatim port of `MatTooltip._getOrigin`.
 */
export function getOrigin(
  position: TooltipPosition,
  isLtr: boolean,
): {main: OriginConnectionPosition; fallback: OriginConnectionPosition} {
  let originPosition: OriginConnectionPosition;

  if (position === 'above' || position === 'below') {
    originPosition = {originX: 'center', originY: position === 'above' ? 'top' : 'bottom'};
  } else if (
    position === 'before' ||
    (position === 'left' && isLtr) ||
    (position === 'right' && !isLtr)
  ) {
    originPosition = {originX: 'start', originY: 'center'};
  } else if (
    position === 'after' ||
    (position === 'right' && isLtr) ||
    (position === 'left' && !isLtr)
  ) {
    originPosition = {originX: 'end', originY: 'center'};
  } else {
    throw getMatTooltipInvalidPositionError(position);
  }

  const {x, y} = invertPosition(position, originPosition.originX, originPosition.originY);

  return {
    main: originPosition,
    fallback: {originX: x, originY: y},
  };
}

/**
 * Returns the overlay position and a fallback position based on the user's
 * preference. Verbatim port of `MatTooltip._getOverlayPosition`.
 */
export function getOverlayPosition(
  position: TooltipPosition,
  isLtr: boolean,
): {main: OverlayConnectionPosition; fallback: OverlayConnectionPosition} {
  let overlayPosition: OverlayConnectionPosition;

  if (position === 'above') {
    overlayPosition = {overlayX: 'center', overlayY: 'bottom'};
  } else if (position === 'below') {
    overlayPosition = {overlayX: 'center', overlayY: 'top'};
  } else if (
    position === 'before' ||
    (position === 'left' && isLtr) ||
    (position === 'right' && !isLtr)
  ) {
    overlayPosition = {overlayX: 'end', overlayY: 'center'};
  } else if (
    position === 'after' ||
    (position === 'right' && isLtr) ||
    (position === 'left' && !isLtr)
  ) {
    overlayPosition = {overlayX: 'start', overlayY: 'center'};
  } else {
    throw getMatTooltipInvalidPositionError(position);
  }

  const {x, y} = invertPosition(position, overlayPosition.overlayX, overlayPosition.overlayY);

  return {
    main: overlayPosition,
    fallback: {overlayX: x, overlayY: y},
  };
}

/** Adds the configured offset to a position. Verbatim port of `MatTooltip._addOffset`. */
export function addOffset(position: ConnectedPosition, isLtr: boolean): ConnectedPosition {
  const offset = UNBOUNDED_ANCHOR_GAP;

  if (position.originY === 'top') {
    position.offsetY = -offset;
  } else if (position.originY === 'bottom') {
    position.offsetY = offset;
  } else if (position.originX === 'start') {
    position.offsetX = isLtr ? -offset : offset;
  } else if (position.originX === 'end') {
    position.offsetX = isLtr ? offset : -offset;
  }

  return position;
}

/**
 * Builds the `[main, fallback]` pair passed to
 * `FlexibleConnectedPositionStrategy.withPositions()`. Combines
 * `getOrigin`/`getOverlayPosition`/`addOffset` the same way
 * `MatTooltip._updatePosition` does.
 */
export function buildTooltipPositions(
  position: TooltipPosition,
  isLtr: boolean,
): ConnectedPosition[] {
  const origin = getOrigin(position, isLtr);
  const overlay = getOverlayPosition(position, isLtr);

  return [
    addOffset({...origin.main, ...overlay.main}, isLtr),
    addOffset({...origin.fallback, ...overlay.fallback}, isLtr),
  ];
}

/**
 * Resolves the panel position class suffix (`above`/`below`/`left`/`right`)
 * for a given connection pair. Verbatim port of
 * `MatTooltip._updateCurrentPositionClass`'s class-name computation (minus
 * the side-effecting panel-class add/remove, which the caller does).
 */
export function resolvePanelPosition(
  connectionPair: ConnectionPositionPair,
  isRtl: boolean,
): TooltipPosition {
  const {overlayY, originX, originY} = connectionPair;

  if (overlayY === 'center') {
    if (isRtl) {
      return originX === 'end' ? 'left' : 'right';
    }
    return originX === 'start' ? 'left' : 'right';
  }

  return overlayY === 'bottom' && originY === 'top' ? 'above' : 'below';
}
