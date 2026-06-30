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
 * Strategy that updates the element position as the user is scrolling.
 *
 * Throttle approach: uses requestAnimationFrame for zero-throttle (smooth, one update per
 * frame), and a setTimeout-based trailing-edge debounce for non-zero throttle values.
 * CDK uses rxjs `auditTime(throttle)` which emits once at the end of each throttle window;
 * we replicate this with a pending-timer pattern.
 */
export function createRepositionScrollStrategy(
  config?: RepositionScrollStrategyConfig,
): ScrollStrategy {
  let scrollTeardown: (() => void) | null = null;
  let overlayRef: OverlayRef | null = null;

  function disable(): void {
    if (scrollTeardown) {
      scrollTeardown();
      scrollTeardown = null;
    }
  }

  return {
    attach(ref) {
      if (overlayRef) {
        throw getMatScrollStrategyAlreadyAttachedError();
      }
      overlayRef = ref as OverlayRef;
    },

    enable() {
      if (!isBrowser) return;
      if (scrollTeardown) return;

      const throttle = config?.scrollThrottle ?? 0;

      const applyUpdate = () => {
        if (!overlayRef) return;
        overlayRef.updatePosition();

        if (config?.autoClose) {
          const overlayEl = overlayRef.overlayElement;
          if (overlayEl) {
            const overlayRect = overlayEl.getBoundingClientRect();
            const {width, height} = getViewportSize();
            const parentRects = [{width, height, bottom: height, right: width, top: 0, left: 0}];

            if (isElementScrolledOutsideView(overlayRect, parentRects)) {
              disable();
              overlayRef.detach();
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
        scrollTeardown = () => {
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
        scrollTeardown = () => {
          document.removeEventListener('scroll', handler, {capture: true} as EventListenerOptions);
          if (timerId !== null) {
            clearTimeout(timerId);
            timerId = null;
          }
        };
      }
    },

    disable,

    detach() {
      disable();
      overlayRef = null;
    },
  };
}
