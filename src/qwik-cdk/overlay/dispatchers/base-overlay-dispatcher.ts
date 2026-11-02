/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.dev/license
 */

import type {OverlayRef} from '../overlay-ref';

/**
 * Shared shape implemented by both `OverlayKeyboardDispatcher` and
 * `OverlayOutsideClickDispatcher`. The base class hierarchy from CDK is
 * collapsed into this interface plus the `canReceiveOverlayEvent` helper —
 * factories inline the rest of the state per-dispatcher.
 */
export interface BaseOverlayDispatcher {
  _attachedOverlays: readonly OverlayRef[];
  remove(overlayRef: OverlayRef): void;
  dispose(): void;
}

/**
 * Lets an overlay opt out of receiving a routed event via its
 * `eventPredicate` callback. Returns `true` when no predicate is set.
 */
export function canReceiveOverlayEvent(overlayRef: OverlayRef, event: Event): boolean {
  return overlayRef.eventPredicate ? overlayRef.eventPredicate(event) : true;
}
