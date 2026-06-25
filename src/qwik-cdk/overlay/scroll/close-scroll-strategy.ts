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
 * Strategy that will close the overlay as soon as the user starts scrolling.
 *
 * Throttle approach: uses a debounce flag + setTimeout(0) pattern.
 * CDK uses rxjs `auditTime(0)` (emit once per task boundary). We replicate
 * this with a pending boolean guard so that only one scroll event is processed
 * per event-loop turn.
 */
export class CloseScrollStrategy implements ScrollStrategy {
  private _scrollTeardown: (() => void) | null = null;
  private _overlayRef!: OverlayRef;
  private _initialScrollPosition!: number;

  constructor(private _config?: CloseScrollStrategyConfig) {}

  /** Attaches this scroll strategy to an overlay. */
  attach(overlayRef: OverlayRef) {
    if (this._overlayRef) {
      throw getMatScrollStrategyAlreadyAttachedError();
    }

    this._overlayRef = overlayRef;
  }

  /** Enables the closing of the attached overlay on scroll. */
  enable() {
    if (!isBrowser) return;
    if (this._scrollTeardown) {
      return;
    }

    let pending = false;

    if (this._config && this._config.threshold && this._config.threshold > 1) {
      this._initialScrollPosition = getViewportScrollPosition().top;

      const handler = () => {
        if (pending) return;
        pending = true;
        setTimeout(() => {
          pending = false;
          const scrollPosition = getViewportScrollPosition().top;
          if (Math.abs(scrollPosition - this._initialScrollPosition) > this._config!.threshold!) {
            this._detach();
          } else {
            this._overlayRef.updatePosition();
          }
        }, 0);
      };

      document.addEventListener('scroll', handler, {capture: true, passive: true});
      this._scrollTeardown = () =>
        document.removeEventListener('scroll', handler, {capture: true} as EventListenerOptions);
    } else {
      const handler = () => {
        if (pending) return;
        pending = true;
        setTimeout(() => {
          pending = false;
          this._detach();
        }, 0);
      };

      document.addEventListener('scroll', handler, {capture: true, passive: true});
      this._scrollTeardown = () =>
        document.removeEventListener('scroll', handler, {capture: true} as EventListenerOptions);
    }
  }

  /** Disables the closing the attached overlay on scroll. */
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

  /** Detaches the overlay ref and disables the scroll strategy. */
  private _detach = () => {
    this.disable();

    if (this._overlayRef.hasAttached()) {
      this._overlayRef.detach();
    }
  };
}
