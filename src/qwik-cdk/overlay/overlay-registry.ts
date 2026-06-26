import {createContextId, type Component, type NoSerialize, type Signal} from '@builder.io/qwik';
import type {OverlayConfig} from './overlay-config';
import type {OverlayRef} from './overlay-ref';

export interface OverlayEntryState {
  panelClasses: Signal<readonly string[]>;
  backdropShowing: Signal<boolean>;
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

export const OVERLAY_REGISTRY = createContextId<OverlayRegistry>('qwik-cdk/overlay-registry');
