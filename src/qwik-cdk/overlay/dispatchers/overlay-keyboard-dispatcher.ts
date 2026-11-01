/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.dev/license
 */

import {createContextId, useContext} from '@qwik.dev/core';
import {isBrowser} from '@qwik.dev/core/build';
import {type BaseOverlayDispatcher, canReceiveOverlayEvent} from './base-overlay-dispatcher';
import type {OverlayRef} from '../overlay-ref';

/** Per-overlay keyboard handler registration. */
export interface KeyboardHandlers {
  onKeydown: (e: KeyboardEvent) => void;
}

/**
 * Global keydown router. Routes events to the most-recently-added overlay
 * that has a handler installed and whose `eventPredicate` admits the event.
 */
export interface OverlayKeyboardDispatcher extends BaseOverlayDispatcher {
  add(overlayRef: OverlayRef, handlers?: KeyboardHandlers): void;
}

export function createOverlayKeyboardDispatcher(): OverlayKeyboardDispatcher {
  const attachedOverlays: OverlayRef[] = [];
  const handlers = new Map<OverlayRef, KeyboardHandlers>();
  let cleanupKeydown: (() => void) | undefined;
  let isAttached = false;

  const keydownListener = (event: KeyboardEvent) => {
    for (let i = attachedOverlays.length - 1; i >= 0; i--) {
      // Dispatch the keydown event to the top overlay which has a keydown handler.
      // We want to target the most recent overlay, rather than trying to match where the event
      // came from, because some components might open an overlay but keep focus on a trigger
      // element (e.g. for select and autocomplete). We skip overlays without keydown handlers,
      // because we don't want overlays that don't handle keyboard events to block ones below them.
      const ref = attachedOverlays[i];
      const h = handlers.get(ref);
      const handler = h?.onKeydown ?? ref._keydownEvents;
      if (handler && canReceiveOverlayEvent(ref, event)) {
        handler(event);
        break;
      }
    }
  };

  function detach() {
    if (isAttached) {
      cleanupKeydown?.();
      cleanupKeydown = undefined;
      isAttached = false;
    }
  }

  return {
    _attachedOverlays: attachedOverlays,

    add(overlayRef, h) {
      // Ensure that we don't get the same overlay multiple times.
      const idx = attachedOverlays.indexOf(overlayRef);
      if (idx > -1) attachedOverlays.splice(idx, 1);
      attachedOverlays.push(overlayRef);

      if (h) handlers.set(overlayRef, h);

      // Lazily start dispatcher once first overlay is added.
      if (!isAttached && isBrowser) {
        document.addEventListener('keydown', keydownListener, true);
        cleanupKeydown = () => document.removeEventListener('keydown', keydownListener, true);
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

export const OVERLAY_KEYBOARD_DISPATCHER = createContextId<OverlayKeyboardDispatcher>(
  'qwikCdk/overlayKeyboardDispatcher',
);

export function useOverlayKeyboardDispatcher(): OverlayKeyboardDispatcher {
  return useContext(OVERLAY_KEYBOARD_DISPATCHER);
}
