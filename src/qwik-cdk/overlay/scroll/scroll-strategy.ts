/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.dev/license
 */

/**
 * Minimal overlay handle used by ScrollStrategy so that this interface can be
 * declared before OverlayRef exists (Phase 5 forward-reference pattern).
 */
export interface ScrollStrategyOverlayHandle {
  readonly overlayElement: HTMLElement | null;
}

/**
 * Describes a strategy that will be used by an overlay to handle scroll events
 * while it is open.
 */
export interface ScrollStrategy {
  /** Attaches this scroll strategy to an overlay. */
  attach(overlayRef: ScrollStrategyOverlayHandle): void;

  /** Enable this scroll strategy (called when the overlay is opened). */
  enable(): void;

  /** Disable this scroll strategy (called when the overlay is closed). */
  disable(): void;

  /** Detaches the scroll strategy from the current overlay. */
  detach?(): void;
}
