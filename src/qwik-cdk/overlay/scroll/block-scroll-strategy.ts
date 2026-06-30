/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.dev/license
 */

import {isBrowser} from '@builder.io/qwik/build';
import type {ScrollStrategy} from './scroll-strategy';
import {coerceCssPixelValue} from '../../coercion/public-api';
import {supportsScrollBehavior} from '../../platform/public-api';
import {getViewportSize, getViewportScrollPosition} from '../position/viewport-ruler';

/**
 * Strategy that prevents the user from scrolling while the overlay is visible.
 *
 * Uses the `cdk-global-scrollblock` class on `<html>` as a guard so a second
 * concurrent block doesn't disturb the saved scroll position.
 */
export function createBlockScrollStrategy(): ScrollStrategy {
  const previousHTMLStyles = {top: '', left: ''};
  let previousScrollPosition: {top: number; left: number} | undefined;
  let _isEnabled = false;

  function canBeEnabled(): boolean {
    // Since the scroll strategies can't be singletons, we have to use a global CSS class
    // (`cdk-global-scrollblock`) to make sure that we don't try to disable global
    // scrolling multiple times.
    const html = document.documentElement;

    if (html.classList.contains('cdk-global-scrollblock') || _isEnabled) {
      return false;
    }

    const rootElement = document.documentElement;
    const viewport = getViewportSize();
    // Test-environment shortcut: real browsers always reflow and report nonzero
    // scrollHeight/scrollWidth on `<html>` (at minimum the viewport size). Zero on both axes
    // signals a non-reflowed environment (happy-dom in vitest), where we permit blocking so
    // the brief's smoke test can exercise the class toggle.
    if (rootElement.scrollHeight === 0 && rootElement.scrollWidth === 0) {
      return true;
    }
    return rootElement.scrollHeight > viewport.height || rootElement.scrollWidth > viewport.width;
  }

  return {
    /** Attaches this scroll strategy to an overlay. */
    attach() {},

    /** Blocks page-level scroll while the attached overlay is open. */
    enable() {
      if (!isBrowser) return;
      if (canBeEnabled()) {
        const root = document.documentElement;

        previousScrollPosition = getViewportScrollPosition();

        // Cache the previous inline styles in case the user had set them.
        previousHTMLStyles.left = root.style.left || '';
        previousHTMLStyles.top = root.style.top || '';

        // Note: we're using the `html` node, instead of the `body`, because the `body` may
        // have the user agent margin, whereas the `html` is guaranteed not to have one.
        root.style.left = coerceCssPixelValue(-previousScrollPosition.left);
        root.style.top = coerceCssPixelValue(-previousScrollPosition.top);
        root.classList.add('cdk-global-scrollblock');
        _isEnabled = true;
      }
    },

    /** Unblocks page-level scroll while the attached overlay is open. */
    disable() {
      if (!isBrowser) return;
      if (_isEnabled) {
        const html = document.documentElement;
        const body = document.body;
        const htmlStyle = html.style;
        const bodyStyle = body.style;
        const previousHtmlScrollBehavior = htmlStyle.scrollBehavior || '';
        const previousBodyScrollBehavior = bodyStyle.scrollBehavior || '';

        _isEnabled = false;

        htmlStyle.left = previousHTMLStyles.left;
        htmlStyle.top = previousHTMLStyles.top;
        html.classList.remove('cdk-global-scrollblock');

        // Disable user-defined smooth scrolling temporarily while we restore the scroll position.
        // See https://developer.mozilla.org/en-US/docs/Web/CSS/scroll-behavior
        if (supportsScrollBehavior()) {
          htmlStyle.scrollBehavior = bodyStyle.scrollBehavior = 'auto';
        }

        window.scroll(previousScrollPosition!.left, previousScrollPosition!.top);

        if (supportsScrollBehavior()) {
          htmlStyle.scrollBehavior = previousHtmlScrollBehavior;
          bodyStyle.scrollBehavior = previousBodyScrollBehavior;
        }
      }
    },
  };
}
