/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.dev/license
 */

import type {PositionStrategy} from './position-strategy';

/** Return type of `PositionStrategy.getPopoverInsertionPoint()`. */
export type PopoverInsertionPoint = Element | null | {type: 'parent'; element: Element};

/**
 * Mirrors upstream `OverlayRef._attachHost()`'s insertion-point handling
 * (`src/cdk/overlay/overlay-ref.ts`): when the overlay renders as a native
 * popover AND its position strategy names a non-`'global'` insertion point
 * (`FlexibleConnectedPositionStrategy.withPopoverLocation('inline' | {type:
 * 'parent', element})`), the host element is physically relocated — as a
 * DOM sibling placed immediately after the insertion point element
 * (`'inline'`, e.g. `mat-select`'s `cdk-connected-overlay`, which anchors
 * its popover right next to the trigger it opens from), or appended as a
 * child of a custom parent element (`{type: 'parent', …}`) — instead of
 * staying inside the shared `.cdk-overlay-container` that
 * `OverlayContainerOutlet` renders it into by default.
 *
 * Call this ONCE, right after the host's first mount (see
 * `overlay-host.tsx`'s `useVisibleTask$`) — `OverlayHost` always renders
 * the host declaratively as a child of `.cdk-overlay-container` first
 * (Qwik has no imperative "render into this other DOM node" primitive the
 * way upstream's vanilla-DOM `_attachHost()` does); this performs the same
 * one-time physical move upstream does, via plain DOM APIs. A no-op for
 * the (overwhelmingly common) `'global'` case, where `insertionPoint` is
 * `null` and the host simply stays where `OverlayContainerOutlet` put it.
 *
 * Qwik's event delegation (qwikloader attaches listeners at high-level
 * ancestors and resolves the actual target dynamically at dispatch time,
 * not via a fixed subscription captured at listener-attach time) means a
 * plain DOM reparent like this does not break any already-wired `on:*`
 * handlers on the moved subtree.
 */
export function applyPopoverInsertionPoint(
  host: HTMLElement,
  insertionPoint: PopoverInsertionPoint | null | undefined,
): void {
  if (!insertionPoint) {
    return;
  }

  if (insertionPoint instanceof Element) {
    insertionPoint.after(host);
  } else {
    insertionPoint.element.appendChild(host);
  }
}

/**
 * Resolves the insertion point for `host`, mirroring upstream
 * `_attachHost()`'s own guard: a custom insertion point only applies when
 * actually rendering as a native popover (`usePopover`) — for a non-popover
 * overlay the host always stays in the global container regardless of what
 * the position strategy's `withPopoverLocation()` was configured with.
 */
export function resolvePopoverInsertionPoint(
  usePopover: boolean,
  positionStrategy: PositionStrategy | undefined,
): PopoverInsertionPoint | null {
  if (!usePopover) return null;
  return positionStrategy?.getPopoverInsertionPoint?.() ?? null;
}
