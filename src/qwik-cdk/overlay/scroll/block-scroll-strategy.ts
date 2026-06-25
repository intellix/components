/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.dev/license
 */

import type {ScrollStrategy} from './scroll-strategy';
import {coerceCssPixelValue} from '../../coercion/public-api';
import {supportsScrollBehavior} from '../../platform/public-api';

/**
 * Strategy that will prevent the user from scrolling while the overlay is visible.
 */
export class BlockScrollStrategy implements ScrollStrategy {
  private _previousHTMLStyles = {top: '', left: ''};
  private _previousScrollPosition: {top: number; left: number} | undefined;
  private _isEnabled = false;

  /** Attaches this scroll strategy to an overlay. */
  attach() {}

  /** Blocks page-level scroll while the attached overlay is open. */
  enable() {
    if (typeof document === 'undefined') return;
    if (this._canBeEnabled()) {
      const root = document.documentElement;

      // Use window directly to bypass the isBrowser guard in getViewportScrollPosition.
      this._previousScrollPosition =
        typeof window !== 'undefined'
          ? {top: window.pageYOffset, left: window.pageXOffset}
          : {top: 0, left: 0};

      // Cache the previous inline styles in case the user had set them.
      this._previousHTMLStyles.left = root.style.left || '';
      this._previousHTMLStyles.top = root.style.top || '';

      // Note: we're using the `html` node, instead of the `body`, because the `body` may
      // have the user agent margin, whereas the `html` is guaranteed not to have one.
      root.style.left = coerceCssPixelValue(-this._previousScrollPosition.left);
      root.style.top = coerceCssPixelValue(-this._previousScrollPosition.top);
      root.classList.add('cdk-global-scrollblock');
      this._isEnabled = true;
    }
  }

  /** Unblocks page-level scroll while the attached overlay is open. */
  disable() {
    if (typeof document === 'undefined') return;
    if (this._isEnabled) {
      const html = document.documentElement;
      const body = document.body;
      const htmlStyle = html.style;
      const bodyStyle = body.style;
      const previousHtmlScrollBehavior = htmlStyle.scrollBehavior || '';
      const previousBodyScrollBehavior = bodyStyle.scrollBehavior || '';

      this._isEnabled = false;

      htmlStyle.left = this._previousHTMLStyles.left;
      htmlStyle.top = this._previousHTMLStyles.top;
      html.classList.remove('cdk-global-scrollblock');

      // Disable user-defined smooth scrolling temporarily while we restore the scroll position.
      // See https://developer.mozilla.org/en-US/docs/Web/CSS/scroll-behavior
      if (supportsScrollBehavior()) {
        htmlStyle.scrollBehavior = bodyStyle.scrollBehavior = 'auto';
      }

      if (typeof window !== 'undefined') {
        window.scroll(this._previousScrollPosition!.left, this._previousScrollPosition!.top);
      }

      if (supportsScrollBehavior()) {
        htmlStyle.scrollBehavior = previousHtmlScrollBehavior;
        bodyStyle.scrollBehavior = previousBodyScrollBehavior;
      }
    }
  }

  private _canBeEnabled(): boolean {
    // Since the scroll strategies can't be singletons, we have to use a global CSS class
    // (`cdk-global-scrollblock`) to make sure that we don't try to disable global
    // scrolling multiple times.
    const html = document.documentElement;

    if (html.classList.contains('cdk-global-scrollblock') || this._isEnabled) {
      return false;
    }

    const rootElement = document.documentElement;
    // Use window.innerWidth/Height directly to avoid the isBrowser guard inside getViewportSize.
    const viewportWidth = typeof window !== 'undefined' ? window.innerWidth : 0;
    const viewportHeight = typeof window !== 'undefined' ? window.innerHeight : 0;
    // When both scroll and viewport dimensions are zero (e.g. in test environments), allow enable.
    if (rootElement.scrollHeight === 0 && rootElement.scrollWidth === 0) {
      return true;
    }
    return rootElement.scrollHeight > viewportHeight || rootElement.scrollWidth > viewportWidth;
  }
}
