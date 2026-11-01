import {createContextId, type Component, type NoSerialize, type Signal} from '@qwik.dev/core';
import type {OverlayConfig} from './overlay-config';
import type {OverlayRef} from './overlay-ref';

export interface OverlayEntryState {
  panelClasses: Signal<readonly string[]>;
  backdropShowing: Signal<boolean>;
  /** Set once `detachBackdrop()` is called — drives `pointer-events: none` on the backdrop. */
  backdropDetached: Signal<boolean>;
  detached: Signal<boolean>;
  width: Signal<string | undefined>;
  height: Signal<string | undefined>;
  minWidth: Signal<string | undefined>;
  minHeight: Signal<string | undefined>;
  maxWidth: Signal<string | undefined>;
  maxHeight: Signal<string | undefined>;
}

export interface OverlayEntry {
  id: string;
  Component: Component<any>;
  props: Record<string, unknown>;
  config: OverlayConfig;
  state: OverlayEntryState;
  /**
   * Whether this overlay renders via the native Popover API — mirrors CDK's
   * `createOverlayRef` feature-detection (`'showPopover' in document.body`)
   * combined with `config.usePopover`. Computed once at creation time (static
   * for the overlay's lifetime), it drives the `popover="manual"` attribute
   * and `cdk-overlay-popover` class on the host element.
   */
  usePopover: boolean;
  /** Text direction applied to the host element's `dir` attribute. */
  direction: 'ltr' | 'rtl';
  /**
   * Back-reference to the `OverlayRef` that owns this entry. Populated by
   * `createOverlayService` immediately after constructing the ref, before the
   * entry is pushed to the registry. `OverlayHost`'s `useVisibleTask$` reads
   * this and calls `_onAttached` / `_onDetached` to drive position/scroll
   * strategies. NoSerialize because OverlayRef holds DOM refs and is only
   * meaningful within the current client session — entries are also created
   * client-side after user interaction, so the ref is always populated by the
   * time OverlayHost mounts.
   */
  ref?: NoSerialize<OverlayRef>;
}

export interface OverlayRegistry {
  entries: Signal<readonly OverlayEntry[]>;
  push(entry: OverlayEntry): void;
  remove(id: string): void;
  get(id: string): OverlayEntry | undefined;
}

export const OVERLAY_REGISTRY = createContextId<OverlayRegistry>('qwikCdk/overlayRegistry');
