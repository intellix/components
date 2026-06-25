import {createContextId, type Component, type QRL, type Signal} from '@builder.io/qwik';
import type {OverlayConfig} from './overlay-config';

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
  lifecycle: {
    onAttached$: QRL<(host: HTMLElement, pane: HTMLElement) => void>;
    onDetached$: QRL<() => void>;
  };
}

export interface OverlayRegistry {
  entries: Signal<readonly OverlayEntry[]>;
  push(entry: OverlayEntry): void;
  remove(id: string): void;
  get(id: string): OverlayEntry | undefined;
}

export const OVERLAY_REGISTRY = createContextId<OverlayRegistry>('qwik-cdk/overlay-registry');
