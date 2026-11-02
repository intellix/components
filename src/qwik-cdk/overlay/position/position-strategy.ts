/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.dev/license
 */

/**
 * Minimal overlay handle used by PositionStrategy so that this interface can be
 * declared before OverlayRef exists (Phase 5 forward-reference pattern).
 */
export interface PositionStrategyOverlayHandle {
  readonly hostElement: HTMLElement | null;
  readonly overlayElement: HTMLElement | null;
}

/** A strategy for positioning an overlay on the page. */
export interface PositionStrategy {
  /** Attaches this strategy to an overlay. */
  attach(overlayRef: PositionStrategyOverlayHandle): void;

  /** Updates the position of the overlay element. */
  apply(): void;

  /** Called when the overlay is detached. */
  detach?(): void;

  /** Cleans up any DOM modifications made by the strategy. */
  dispose(): void;

  /**
   * Returns the element into which the overlay should be inserted when
   * rendering as a native popover. Only relevant for popover-based overlays.
   */
  getPopoverInsertionPoint?(): Element | null | {type: 'parent'; element: Element};
}
