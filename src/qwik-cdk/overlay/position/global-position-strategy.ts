/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.dev/license
 */

import {isBrowser} from '@builder.io/qwik/build';
import type {PositionStrategy, PositionStrategyOverlayHandle} from './position-strategy';

/** Class to be added to the overlay pane wrapper. */
const wrapperClass = 'cdk-global-overlay-wrapper';

/**
 * A strategy for positioning overlays. Using this strategy, an overlay is given an
 * explicit position relative to the browser's viewport. Uses flexbox (rather than
 * transforms) to avoid subpixel-rendering blur.
 *
 * Builder API extends `PositionStrategy` with the fluent positioning setters
 * (`top()`, `centerHorizontally()` etc.) that return `this` for chaining.
 */
export interface GlobalPositionStrategy extends PositionStrategy {
  top(value?: string): GlobalPositionStrategy;
  left(value?: string): GlobalPositionStrategy;
  bottom(value?: string): GlobalPositionStrategy;
  right(value?: string): GlobalPositionStrategy;
  start(value?: string): GlobalPositionStrategy;
  end(value?: string): GlobalPositionStrategy;
  /** @deprecated Pass the `width` through the `OverlayConfig`. */
  width(value?: string): GlobalPositionStrategy;
  /** @deprecated Pass the `height` through the `OverlayConfig`. */
  height(value?: string): GlobalPositionStrategy;
  centerHorizontally(offset?: string): GlobalPositionStrategy;
  centerVertically(offset?: string): GlobalPositionStrategy;
}

export function createGlobalPositionStrategy(): GlobalPositionStrategy {
  let overlayRef: PositionStrategyOverlayHandle | null = null;
  const cssPosition = 'static';
  let topOffset = '';
  let bottomOffset = '';
  let alignItems = '';
  let xPosition = '';
  let xOffset = '';
  let isDisposed = false;

  /**
   * The wrapper element created inside hostElement. CDK adds `wrapperClass` directly to
   * `hostElement`, but the brief's spec uses `host.querySelector('.cdk-global-overlay-wrapper')`
   * which requires a child element, so qwik-cdk creates a child wrapper instead.
   */
  let wrapper: HTMLElement | null = null;

  const strategy: GlobalPositionStrategy = {
    attach(handle) {
      overlayRef = handle;
      isDisposed = false;

      const host = handle.hostElement;
      const pane = handle.overlayElement;
      if (!host || !pane) return;

      // Create a wrapper child element with the CDK wrapper class. The brief's spec uses
      // host.querySelector('.cdk-global-overlay-wrapper'), which requires a child element.
      if (!wrapper) {
        wrapper = host.ownerDocument.createElement('div');
        wrapper.classList.add(wrapperClass);
        // Move the pane into the wrapper, then attach the wrapper to the host.
        wrapper.appendChild(pane);
        host.appendChild(wrapper);
      }
    },

    top(value = '') {
      bottomOffset = '';
      topOffset = value;
      alignItems = 'flex-start';
      return strategy;
    },

    left(value = '') {
      xOffset = value;
      xPosition = 'left';
      return strategy;
    },

    bottom(value = '') {
      topOffset = '';
      bottomOffset = value;
      alignItems = 'flex-end';
      return strategy;
    },

    right(value = '') {
      xOffset = value;
      xPosition = 'right';
      return strategy;
    },

    start(value = '') {
      xOffset = value;
      xPosition = 'start';
      return strategy;
    },

    end(value = '') {
      xOffset = value;
      xPosition = 'end';
      return strategy;
    },

    // Width sizing is managed via OverlayConfig in qwik-cdk; kept for API parity, no-op.
    width() {
      return strategy;
    },

    // Height sizing is managed via OverlayConfig in qwik-cdk; kept for API parity, no-op.
    height() {
      return strategy;
    },

    centerHorizontally(offset = '') {
      strategy.left(offset);
      xPosition = 'center';
      return strategy;
    },

    centerVertically(offset = '') {
      strategy.top(offset);
      alignItems = 'center';
      return strategy;
    },

    apply() {
      // Since the overlay ref applies the strategy asynchronously, it could
      // have been disposed before it ends up being applied. If that is the
      // case, we shouldn't do anything.
      if (!overlayRef || !overlayRef.overlayElement || !wrapper) {
        return;
      }

      const paneStyles = overlayRef.overlayElement.style;
      const wrapperStyles = wrapper.style;
      // OverlayRef exposes `.config` as a public property; the handle interface only declares
      // host/overlay elements, so fall back to `undefined` for non-OverlayRef stubs.
      const config = (overlayRef as any).config as
        | {
            width?: string | number;
            height?: string | number;
            maxWidth?: string | number;
            maxHeight?: string | number;
          }
        | undefined;
      const width = config?.width;
      const height = config?.height;
      const maxWidth = config?.maxWidth;
      const maxHeight = config?.maxHeight;
      const shouldBeFlushHorizontally =
        (width === '100%' || width === '100vw') &&
        (!maxWidth || maxWidth === '100%' || maxWidth === '100vw');
      const shouldBeFlushVertically =
        (height === '100%' || height === '100vh') &&
        (!maxHeight || maxHeight === '100%' || maxHeight === '100vh');
      // RTL detection: read direction from the wrapper's computed style if possible.
      const isRtl = isBrowser && wrapper ? getComputedStyle(wrapper).direction === 'rtl' : false;

      let marginLeft = '';
      let marginRight = '';
      let justifyContent = '';

      if (shouldBeFlushHorizontally) {
        justifyContent = 'flex-start';
      } else if (xPosition === 'center') {
        justifyContent = 'center';
        if (isRtl) {
          marginRight = xOffset;
        } else {
          marginLeft = xOffset;
        }
      } else if (isRtl) {
        if (xPosition === 'left' || xPosition === 'end') {
          justifyContent = 'flex-end';
          marginLeft = xOffset;
        } else if (xPosition === 'right' || xPosition === 'start') {
          justifyContent = 'flex-start';
          marginRight = xOffset;
        }
      } else if (xPosition === 'left' || xPosition === 'start') {
        justifyContent = 'flex-start';
        marginLeft = xOffset;
      } else if (xPosition === 'right' || xPosition === 'end') {
        justifyContent = 'flex-end';
        marginRight = xOffset;
      }

      paneStyles.position = cssPosition;
      paneStyles.marginLeft = shouldBeFlushHorizontally ? '0' : marginLeft;
      paneStyles.marginTop = shouldBeFlushVertically ? '0' : topOffset;
      paneStyles.marginBottom = bottomOffset;
      paneStyles.marginRight = shouldBeFlushHorizontally ? '0' : marginRight;
      wrapperStyles.justifyContent = justifyContent;
      wrapperStyles.alignItems = shouldBeFlushVertically ? 'flex-start' : alignItems;
    },

    dispose() {
      if (isDisposed || !overlayRef) {
        return;
      }

      const pane = overlayRef.overlayElement;
      const host = overlayRef.hostElement;

      if (wrapper) {
        wrapper.style.justifyContent = '';
        wrapper.style.alignItems = '';

        // Move pane back to the host before removing wrapper.
        if (pane && host) {
          host.appendChild(pane);
        }

        wrapper.remove();
        wrapper = null;
      }

      if (pane) {
        pane.style.marginTop = '';
        pane.style.marginBottom = '';
        pane.style.marginLeft = '';
        pane.style.marginRight = '';
        pane.style.position = '';
      }

      overlayRef = null;
      isDisposed = true;
    },
  };

  return strategy;
}
