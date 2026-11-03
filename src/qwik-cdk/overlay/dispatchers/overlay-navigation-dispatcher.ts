/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.dev/license
 */

import {createContextId, useContext} from '@qwik.dev/core';
import {isBrowser} from '@qwik.dev/core/build';
import type {BaseOverlayDispatcher} from './base-overlay-dispatcher';
import type {OverlayRef} from '../overlay-ref';

/** Per-overlay navigation handler registration. */
export interface NavigationHandlers {
  onNavigate: () => void;
}

/**
 * Global history-navigation router. Qwik-cdk has no `Location`/Router
 * service to inject (this library takes no router dependency — see
 * `OverlayConfig.disposeOnNavigation` / `MatDialogConfig.closeOnNavigation`'s
 * own doc comments), so upstream's per-`OverlayRef` `Location.subscribe()`
 * becomes a single shared `popstate`/`hashchange` listener that broadcasts
 * to EVERY currently-attached overlay — unlike the keyboard/outside-click
 * dispatchers, which route to only the topmost (or the first interested)
 * overlay, a navigation should close every overlay that opted in, not just
 * one.
 *
 * Deliberately `popstate`/`hashchange` ONLY, not every `pushState`/
 * `replaceState` call (which would also fire for in-app link clicks
 * handled by a router calling `history.pushState` directly — this port's
 * explicit scope is "closes on back/forward navigation", not "closes on
 * every link click").
 */
export interface OverlayNavigationDispatcher extends BaseOverlayDispatcher {
  add(overlayRef: OverlayRef, handlers: NavigationHandlers): void;
}

export function createOverlayNavigationDispatcher(): OverlayNavigationDispatcher {
  const attachedOverlays: OverlayRef[] = [];
  const handlers = new Map<OverlayRef, NavigationHandlers>();
  let cleanup: (() => void) | undefined;
  let isAttached = false;

  const onNavigate = () => {
    // Snapshot: a handler closing its overlay synchronously calls remove(),
    // which would otherwise mutate attachedOverlays mid-iteration.
    const overlays = attachedOverlays.slice();
    for (const overlayRef of overlays) {
      handlers.get(overlayRef)?.onNavigate();
    }
  };

  function detach() {
    if (isAttached) {
      cleanup?.();
      cleanup = undefined;
      isAttached = false;
    }
  }

  return {
    _attachedOverlays: attachedOverlays,

    add(overlayRef, h) {
      const idx = attachedOverlays.indexOf(overlayRef);
      if (idx > -1) attachedOverlays.splice(idx, 1);
      attachedOverlays.push(overlayRef);
      handlers.set(overlayRef, h);

      if (!isAttached && isBrowser) {
        window.addEventListener('popstate', onNavigate);
        window.addEventListener('hashchange', onNavigate);
        cleanup = () => {
          window.removeEventListener('popstate', onNavigate);
          window.removeEventListener('hashchange', onNavigate);
        };
        isAttached = true;
      }
    },

    remove(overlayRef) {
      handlers.delete(overlayRef);
      const idx = attachedOverlays.indexOf(overlayRef);
      if (idx > -1) attachedOverlays.splice(idx, 1);
      if (attachedOverlays.length === 0) detach();
    },

    dispose() {
      detach();
    },
  };
}

export const OVERLAY_NAVIGATION_DISPATCHER = createContextId<OverlayNavigationDispatcher>(
  'qwikCdk/overlayNavigationDispatcher',
);

export function useOverlayNavigationDispatcher(): OverlayNavigationDispatcher {
  return useContext(OVERLAY_NAVIGATION_DISPATCHER);
}
