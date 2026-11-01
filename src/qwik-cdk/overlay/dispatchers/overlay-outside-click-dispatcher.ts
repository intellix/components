/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.dev/license
 */

import {createContextId, useContext} from '@qwik.dev/core';
import {isBrowser} from '@qwik.dev/core/build';
import {createPlatform, type Platform, _getEventTarget} from '../../platform/public-api';
import {type BaseOverlayDispatcher, canReceiveOverlayEvent} from './base-overlay-dispatcher';
import type {OverlayRef} from '../overlay-ref';

/** Per-overlay outside-click handler registration. */
export interface OutsideClickHandlers {
  onOutsideClick: (e: MouseEvent) => void;
}

/**
 * Global pointer-event router. Routes outside-click events to overlays that
 * have a handler installed and whose `eventPredicate` admits the event.
 */
export interface OverlayOutsideClickDispatcher extends BaseOverlayDispatcher {
  add(overlayRef: OverlayRef, handlers?: OutsideClickHandlers): void;
}

export function createOverlayOutsideClickDispatcher(
  platform: Platform = createPlatform(),
): OverlayOutsideClickDispatcher {
  const attachedOverlays: OverlayRef[] = [];
  const handlers = new Map<OverlayRef, OutsideClickHandlers>();
  let cursorOriginalValue: string;
  let cursorStyleIsSet = false;
  let pointerDownEventTarget: HTMLElement | null = null;
  let cleanups: (() => void)[] | undefined;
  let isAttached = false;

  /** Store pointerdown event target to track origin of click. */
  const pointerDownListener = (event: PointerEvent) => {
    pointerDownEventTarget = _getEventTarget<HTMLElement>(event);
  };

  /** Click event listener that will be attached to the body propagate phase. */
  const clickListener = (event: MouseEvent) => {
    const target = _getEventTarget<HTMLElement>(event);
    // In case of a click event, we want to check the origin of the click
    // (e.g. in case where a user starts a click inside the overlay and
    // releases the click outside of it).
    // This is done by using the event target of the preceding pointerdown event.
    // Every click event caused by a pointer device has a preceding pointerdown
    // event, unless the click was programmatically triggered (e.g. in a unit test).
    const origin =
      event.type === 'click' && pointerDownEventTarget ? pointerDownEventTarget : target;
    // Reset the stored pointerdown event target, to avoid having it interfere
    // in subsequent events.
    pointerDownEventTarget = null;

    // We copy the array because the original may be modified asynchronously if the
    // outsidePointerEvents listener decides to detach overlays resulting in index errors inside
    // the for loop.
    const overlays = attachedOverlays.slice();

    // Dispatch the mouse event to the top overlay which has subscribers to its mouse events.
    // We want to target all overlays for which the click could be considered as outside click.
    // As soon as we reach an overlay for which the click is not outside click we break off the loop.
    for (let i = overlays.length - 1; i > -1; i--) {
      const overlayRef = overlays[i];
      const h = handlers.get(overlayRef);
      // Prefer the per-add handler; fall back to ref._outsidePointerEvents for backwards compat.
      const handler = h?.onOutsideClick ?? overlayRef._outsidePointerEvents;

      if (!handler || !overlayRef.hasAttached() || !canReceiveOverlayEvent(overlayRef, event)) {
        continue;
      }

      // If it's a click inside the overlay, just break - we should do nothing.
      // If it's an outside click (both origin and target), dispatch the mouse event,
      // and proceed with the next overlay.
      if (
        containsPierceShadowDom(overlayRef.overlayElement, target) ||
        containsPierceShadowDom(overlayRef.overlayElement, origin)
      ) {
        break;
      }

      handler(event);
    }
  };

  function detach() {
    if (isAttached) {
      cleanups?.forEach(cleanup => cleanup());
      cleanups = undefined;
      if (platform.IOS && cursorStyleIsSet) {
        document.body.style.cursor = cursorOriginalValue;
        cursorStyleIsSet = false;
      }
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

      // Safari on iOS does not generate click events for non-interactive elements.
      // However, we want to receive a click for any element outside the overlay.
      // We can force a "clickable" state by setting `cursor: pointer` on the document body.
      // See: https://developer.mozilla.org/en-US/docs/Web/API/Element/click_event#Safari_Mobile
      if (!isAttached && isBrowser) {
        const body = document.body;
        const captureOpts = {capture: true};

        body.addEventListener('pointerdown', pointerDownListener, captureOpts);
        body.addEventListener('click', clickListener, captureOpts);
        body.addEventListener('auxclick', clickListener, captureOpts);
        body.addEventListener('contextmenu', clickListener, captureOpts);

        cleanups = [
          () => body.removeEventListener('pointerdown', pointerDownListener, captureOpts),
          () => body.removeEventListener('click', clickListener, captureOpts),
          () => body.removeEventListener('auxclick', clickListener, captureOpts),
          () => body.removeEventListener('contextmenu', clickListener, captureOpts),
        ];

        // click event is not fired on iOS. To make element "clickable" we are
        // setting the cursor to pointer.
        if (platform.IOS && !cursorStyleIsSet) {
          cursorOriginalValue = body.style.cursor;
          body.style.cursor = 'pointer';
          cursorStyleIsSet = true;
        }

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

/** Version of `Element.contains` that transcends shadow DOM boundaries. */
function containsPierceShadowDom(parent: HTMLElement | null, child: HTMLElement | null): boolean {
  const supportsShadowRoot = typeof ShadowRoot !== 'undefined' && ShadowRoot;
  let current: Node | null = child;

  while (current) {
    if (current === parent) {
      return true;
    }

    current =
      supportsShadowRoot && current instanceof ShadowRoot ? current.host : current.parentNode;
  }

  return false;
}

export const OVERLAY_OUTSIDE_CLICK_DISPATCHER = createContextId<OverlayOutsideClickDispatcher>(
  'qwikCdk/overlayOutsideClickDispatcher',
);

export function useOverlayOutsideClickDispatcher(): OverlayOutsideClickDispatcher {
  return useContext(OVERLAY_OUTSIDE_CLICK_DISPATCHER);
}
