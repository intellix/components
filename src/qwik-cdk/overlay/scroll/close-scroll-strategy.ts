/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.dev/license
 */

import {isBrowser} from '@qwik.dev/core/build';
import type {ScrollStrategy} from './scroll-strategy';
import {getMatScrollStrategyAlreadyAttachedError} from './scroll-strategy';
import {getViewportScrollPosition} from '../position/viewport-ruler';
import type {OverlayRef} from '../overlay-ref';

/**
 * Config options for the CloseScrollStrategy.
 */
export interface CloseScrollStrategyConfig {
  /** Amount of pixels the user has to scroll before the overlay is closed. */
  threshold?: number;
}

/**
 * Strategy that closes the overlay as soon as the user starts scrolling.
 *
 * Throttle approach: pending flag + `setTimeout(0)` (leading-edge per
 * task boundary). CDK uses rxjs `auditTime(0)`; for `CloseScrollStrategy` the
 * functional result is identical because no event data flows out of the
 * handler — both forms run the close check once per task boundary.
 */
export function createCloseScrollStrategy(config?: CloseScrollStrategyConfig): ScrollStrategy {
  let scrollTeardown: (() => void) | null = null;
  let overlayRef: OverlayRef | null = null;
  let initialScrollPosition = 0;

  function detachOverlay(): void {
    disable();
    if (overlayRef?.hasAttached()) {
      overlayRef.detach();
    }
  }

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

      let pending = false;

      if (config && config.threshold && config.threshold > 1) {
        initialScrollPosition = getViewportScrollPosition().top;

        const handler = () => {
          if (pending) return;
          pending = true;
          setTimeout(() => {
            pending = false;
            const scrollPosition = getViewportScrollPosition().top;
            if (Math.abs(scrollPosition - initialScrollPosition) > config!.threshold!) {
              detachOverlay();
            } else {
              overlayRef?.updatePosition();
            }
          }, 0);
        };

        document.addEventListener('scroll', handler, {capture: true, passive: true});
        scrollTeardown = () =>
          document.removeEventListener('scroll', handler, {capture: true} as EventListenerOptions);
      } else {
        const handler = () => {
          if (pending) return;
          pending = true;
          setTimeout(() => {
            pending = false;
            detachOverlay();
          }, 0);
        };

        document.addEventListener('scroll', handler, {capture: true, passive: true});
        scrollTeardown = () =>
          document.removeEventListener('scroll', handler, {capture: true} as EventListenerOptions);
      }
    },

    disable,

    detach() {
      disable();
      overlayRef = null;
    },
  };
}
