/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.dev/license
 */

import {isBrowser} from '@builder.io/qwik/build';
import type {ScrollStrategy} from './scroll-strategy';
import {getMatScrollStrategyAlreadyAttachedError} from './scroll-strategy';
import {getViewportSize} from '../position/viewport-ruler';
import {isElementScrolledOutsideView} from '../position/scroll-clip';
import type {OverlayRef} from '../overlay-ref';

/**
 * Config options for the RepositionScrollStrategy.
 */
export interface RepositionScrollStrategyConfig {
  /** Time in milliseconds to throttle the scroll events. */
  scrollThrottle?: number;

  /** Whether to close the overlay once the user has scrolled away completely. */
  autoClose?: boolean;
}

/**
 * Strategy that will update the element position as the user is scrolling.
 *
 * Throttle approach: uses requestAnimationFrame for zero-throttle (smooth, one update per
 * frame), and a setTimeout-based trailing-edge debounce for non-zero throttle values.
 * CDK uses rxjs `auditTime(throttle)` which emits once at the end of each throttle window;
 * we replicate this with a pending-timer pattern.
 */
export class RepositionScrollStrategy implements ScrollStrategy {
  private _scrollTeardown: (() => void) | null = null;
  private _overlayRef!: OverlayRef;

  constructor(private _config?: RepositionScrollStrategyConfig) {}

  /** Attaches this scroll strategy to an overlay. */
  attach(overlayRef: OverlayRef) {
    if (this._overlayRef) {
      throw getMatScrollStrategyAlreadyAttachedError();
    }

    this._overlayRef = overlayRef;
  }

  /** Enables repositioning of the attached overlay on scroll. */
  enable() {
    if (!isBrowser) return;
    if (this._scrollTeardown) return;

    const throttle = this._config?.scrollThrottle ?? 0;

    const applyUpdate = () => {
      this._overlayRef.updatePosition();

      if (this._config?.autoClose) {
        const overlayEl = this._overlayRef.overlayElement;
        if (overlayEl) {
          const overlayRect = overlayEl.getBoundingClientRect();
          const {width, height} = getViewportSize();
          const parentRects = [{width, height, bottom: height, right: width, top: 0, left: 0}];

          if (isElementScrolledOutsideView(overlayRect, parentRects)) {
            this.disable();
            this._overlayRef.detach();
          }
        }
      }
    };

    if (throttle === 0) {
      // Use rAF for zero-throttle — one update per animation frame.
      let rafId: number | null = null;
      const handler = () => {
        if (rafId !== null) return;
        rafId = requestAnimationFrame(() => {
          rafId = null;
          applyUpdate();
        });
      };

      document.addEventListener('scroll', handler, {capture: true, passive: true});
      this._scrollTeardown = () => {
        document.removeEventListener('scroll', handler, {capture: true} as EventListenerOptions);
        if (rafId !== null) {
          cancelAnimationFrame(rafId);
          rafId = null;
        }
      };
    } else {
      // Non-zero throttle: trailing-edge debounce via setTimeout.
      let timerId: ReturnType<typeof setTimeout> | null = null;
      const handler = () => {
        if (timerId !== null) return;
        timerId = setTimeout(() => {
          timerId = null;
          applyUpdate();
        }, throttle);
      };

      document.addEventListener('scroll', handler, {capture: true, passive: true});
      this._scrollTeardown = () => {
        document.removeEventListener('scroll', handler, {capture: true} as EventListenerOptions);
        if (timerId !== null) {
          clearTimeout(timerId);
          timerId = null;
        }
      };
    }
  }

  /** Disables repositioning of the attached overlay on scroll. */
  disable() {
    if (this._scrollTeardown) {
      this._scrollTeardown();
      this._scrollTeardown = null;
    }
  }

  detach() {
    this.disable();
    this._overlayRef = null!;
  }
}
