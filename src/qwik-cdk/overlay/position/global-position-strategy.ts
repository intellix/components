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
 * explicit position relative to the browser's viewport. We use flexbox, instead of
 * transforms, in order to avoid issues with subpixel rendering which can cause the
 * element to become blurry.
 */
export class GlobalPositionStrategy implements PositionStrategy {
  /** The overlay to which this strategy is attached. */
  private _overlayRef!: PositionStrategyOverlayHandle;
  private _cssPosition = 'static';
  private _topOffset = '';
  private _bottomOffset = '';
  private _alignItems = '';
  private _xPosition = '';
  private _xOffset = '';
  private _isDisposed = false;

  /**
   * The wrapper element created inside hostElement. The CDK adds `wrapperClass` directly
   * to `hostElement`, but in qwik-cdk the host is a shared container so we create our own
   * wrapper child element and keep the overlay pane inside it.
   */
  private _wrapper: HTMLElement | null = null;

  attach(overlayRef: PositionStrategyOverlayHandle): void {
    this._overlayRef = overlayRef;
    this._isDisposed = false;

    const host = overlayRef.hostElement;
    const pane = overlayRef.overlayElement;

    if (!host || !pane) {
      return;
    }

    // Create a wrapper element inside the host and give it the CDK wrapper class.
    // The pane is moved into the wrapper so that flex-based positioning works correctly.
    if (!this._wrapper) {
      this._wrapper = host.ownerDocument.createElement('div');
      this._wrapper.classList.add(wrapperClass);
      // Move the pane into the wrapper, then attach the wrapper to the host.
      this._wrapper.appendChild(pane);
      host.appendChild(this._wrapper);
    }
  }

  /**
   * Sets the top position of the overlay. Clears any previously set vertical position.
   * @param value New top offset.
   */
  top(value: string = ''): this {
    this._bottomOffset = '';
    this._topOffset = value;
    this._alignItems = 'flex-start';
    return this;
  }

  /**
   * Sets the left position of the overlay. Clears any previously set horizontal position.
   * @param value New left offset.
   */
  left(value: string = ''): this {
    this._xOffset = value;
    this._xPosition = 'left';
    return this;
  }

  /**
   * Sets the bottom position of the overlay. Clears any previously set vertical position.
   * @param value New bottom offset.
   */
  bottom(value: string = ''): this {
    this._topOffset = '';
    this._bottomOffset = value;
    this._alignItems = 'flex-end';
    return this;
  }

  /**
   * Sets the right position of the overlay. Clears any previously set horizontal position.
   * @param value New right offset.
   */
  right(value: string = ''): this {
    this._xOffset = value;
    this._xPosition = 'right';
    return this;
  }

  /**
   * Sets the overlay to the start of the viewport, depending on the overlay direction.
   * This will be to the left in LTR layouts and to the right in RTL.
   * @param value Offset from the edge of the screen.
   */
  start(value: string = ''): this {
    this._xOffset = value;
    this._xPosition = 'start';
    return this;
  }

  /**
   * Sets the overlay to the end of the viewport, depending on the overlay direction.
   * This will be to the right in LTR layouts and to the left in RTL.
   * @param value Offset from the edge of the screen.
   */
  end(value: string = ''): this {
    this._xOffset = value;
    this._xPosition = 'end';
    return this;
  }

  /**
   * Sets the overlay width and clears any previously set width.
   * @param value New width for the overlay
   * @deprecated Pass the `width` through the `OverlayConfig`.
   * @breaking-change 8.0.0
   */
  width(_value: string = ''): this {
    // Width sizing is managed via OverlayConfig in qwik-cdk; this method is kept
    // for API parity but has no effect on the overlay pane directly.
    return this;
  }

  /**
   * Sets the overlay height and clears any previously set height.
   * @param value New height for the overlay
   * @deprecated Pass the `height` through the `OverlayConfig`.
   * @breaking-change 8.0.0
   */
  height(_value: string = ''): this {
    // Height sizing is managed via OverlayConfig in qwik-cdk; this method is kept
    // for API parity but has no effect on the overlay pane directly.
    return this;
  }

  /**
   * Centers the overlay horizontally with an optional offset.
   * Clears any previously set horizontal position.
   *
   * @param offset Overlay offset from the horizontal center.
   */
  centerHorizontally(offset: string = ''): this {
    this.left(offset);
    this._xPosition = 'center';
    return this;
  }

  /**
   * Centers the overlay vertically with an optional offset.
   * Clears any previously set vertical position.
   *
   * @param offset Overlay offset from the vertical center.
   */
  centerVertically(offset: string = ''): this {
    this.top(offset);
    this._alignItems = 'center';
    return this;
  }

  /**
   * Apply the position to the element.
   * @docs-private
   */
  apply(): void {
    // Since the overlay ref applies the strategy asynchronously, it could
    // have been disposed before it ends up being applied. If that is the
    // case, we shouldn't do anything.
    if (!this._overlayRef || !this._overlayRef.overlayElement || !this._wrapper) {
      return;
    }

    const paneStyles = this._overlayRef.overlayElement.style;
    const wrapperStyles = this._wrapper.style;
    const xPosition = this._xPosition;
    const xOffset = this._xOffset;
    // RTL detection: read direction from the wrapper's computed style if possible.
    const isRtl =
      isBrowser && this._wrapper ? getComputedStyle(this._wrapper).direction === 'rtl' : false;

    let marginLeft = '';
    let marginRight = '';
    let justifyContent = '';

    if (xPosition === 'center') {
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

    paneStyles.position = this._cssPosition;
    paneStyles.marginLeft = marginLeft;
    paneStyles.marginTop = this._topOffset;
    paneStyles.marginBottom = this._bottomOffset;
    paneStyles.marginRight = marginRight;
    wrapperStyles.justifyContent = justifyContent;
    wrapperStyles.alignItems = this._alignItems;
  }

  /**
   * Cleans up the DOM changes from the position strategy.
   * @docs-private
   */
  dispose(): void {
    if (this._isDisposed || !this._overlayRef) {
      return;
    }

    const pane = this._overlayRef.overlayElement;
    const host = this._overlayRef.hostElement;

    if (this._wrapper) {
      const wrapperStyles = this._wrapper.style;
      wrapperStyles.justifyContent = '';
      wrapperStyles.alignItems = '';

      // Move pane back to the host before removing wrapper.
      if (pane && host) {
        host.appendChild(pane);
      }

      this._wrapper.remove();
      this._wrapper = null;
    }

    if (pane) {
      const paneStyles = pane.style;
      paneStyles.marginTop = '';
      paneStyles.marginBottom = '';
      paneStyles.marginLeft = '';
      paneStyles.marginRight = '';
      paneStyles.position = '';
    }

    this._overlayRef = null!;
    this._isDisposed = true;
  }
}
