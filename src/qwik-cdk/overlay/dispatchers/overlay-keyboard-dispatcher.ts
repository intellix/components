/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.dev/license
 */

import {createContextId, useContext} from '@builder.io/qwik';
import {isBrowser} from '@builder.io/qwik/build';
import {BaseOverlayDispatcher} from './base-overlay-dispatcher';
import type {OverlayRef} from '../overlay-ref';

/**
 * Service for dispatching keyboard events that land on the body to appropriate overlay ref,
 * if any. It maintains a list of attached overlays to determine best suited overlay based
 * on event target and order of overlay opens.
 */
export class OverlayKeyboardDispatcher extends BaseOverlayDispatcher {
  private _cleanupKeydown: (() => void) | undefined;

  /** Add a new overlay to the list of attached overlay refs. */
  override add(overlayRef: OverlayRef): void {
    super.add(overlayRef);

    // Lazily start dispatcher once first overlay is added.
    if (!this._isAttached && isBrowser) {
      document.addEventListener('keydown', this._keydownListener, true);
      this._cleanupKeydown = () =>
        document.removeEventListener('keydown', this._keydownListener, true);
      this._isAttached = true;
    }
  }

  /** Detaches the global keyboard event listener. */
  protected detach() {
    if (this._isAttached) {
      this._cleanupKeydown?.();
      this._cleanupKeydown = undefined;
      this._isAttached = false;
    }
  }

  /** Keyboard event listener that will be attached to the document. */
  private _keydownListener = (event: KeyboardEvent) => {
    const overlays = this._attachedOverlays;

    for (let i = overlays.length - 1; i > -1; i--) {
      // Dispatch the keydown event to the top overlay which has a keydown handler.
      // We want to target the most recent overlay, rather than trying to match where the event
      // came from, because some components might open an overlay but keep focus on a trigger
      // element (e.g. for select and autocomplete). We skip overlays without keydown handlers,
      // because we don't want overlays that don't handle keyboard events to block ones below them.
      const overlayRef = overlays[i];
      if (this.canReceiveKeyboardEvent(overlayRef, event)) {
        overlayRef._keydownEvents!(event);
        break;
      }
    }
  };
}

export const OVERLAY_KEYBOARD_DISPATCHER = createContextId<OverlayKeyboardDispatcher>(
  'qwik-cdk/overlay-keyboard-dispatcher',
);

export function useOverlayKeyboardDispatcher(): OverlayKeyboardDispatcher {
  return useContext(OVERLAY_KEYBOARD_DISPATCHER);
}
