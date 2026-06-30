import type {OverlayRegistry, OverlayEntry} from './overlay-registry';
import type {OverlayConfig} from './overlay-config';
import type {PositionStrategy} from './position/position-strategy';
import type {ScrollStrategy} from './scroll/scroll-strategy';

/**
 * Imperative handle that mutates registry signals and drives the attached
 * position/scroll strategies. Built by `createOverlayRef`; consumers normally
 * obtain one indirectly via `Overlay.create()`.
 *
 * The dispatcher mutates `_keydownEvents` / `_outsidePointerEvents` to receive
 * routed events when this overlay is on top of the stack.
 */
export interface OverlayRef {
  readonly config: OverlayConfig;
  readonly eventPredicate: ((event: Event) => boolean) | undefined;
  readonly hostElement: HTMLElement | null;
  readonly overlayElement: HTMLElement | null;
  /** True once `_onAttached` has been called with both DOM refs. */
  hasAttached(): boolean;
  /** Wired by `OverlayHost.useVisibleTask$` once the DOM refs are populated. */
  _onAttached(host: HTMLElement, pane: HTMLElement): void;
  _onDetached(): void;
  /** Removes the overlay from the registry without disposing strategies. */
  detach(): void;
  /** Detaches AND disposes any owned position strategy. */
  dispose(): void;
  updatePosition(): void;
  updateSize(opts: {
    width?: string | number;
    height?: string | number;
    minWidth?: string | number;
    minHeight?: string | number;
    maxWidth?: string | number;
    maxHeight?: string | number;
  }): void;
  addPanelClass(classes: string | string[]): void;
  removePanelClass(classes: string | string[]): void;
  /** Optional keydown callback; assigned by `OverlayKeyboardDispatcher.add`. */
  _keydownEvents?: (event: KeyboardEvent) => void;
  /** Optional outside-pointer callback; assigned by `OverlayOutsideClickDispatcher.add`. */
  _outsidePointerEvents?: (event: MouseEvent) => void;
}

export function createOverlayRef(deps: {
  registry: OverlayRegistry;
  entry: OverlayEntry;
  positionStrategy?: PositionStrategy;
  scrollStrategy?: ScrollStrategy;
}): OverlayRef {
  let hostEl: HTMLElement | null = null;
  let paneEl: HTMLElement | null = null;

  const ref: OverlayRef = {
    get config() {
      return deps.entry.config;
    },
    get eventPredicate() {
      return deps.entry.config.eventPredicate;
    },
    get hostElement() {
      return hostEl;
    },
    get overlayElement() {
      return paneEl;
    },
    hasAttached() {
      return hostEl !== null && paneEl !== null;
    },
    _onAttached(host, pane) {
      hostEl = host;
      paneEl = pane;
      deps.positionStrategy?.apply();
      deps.scrollStrategy?.enable();
    },
    _onDetached() {
      deps.scrollStrategy?.disable();
      deps.positionStrategy?.detach?.();
      hostEl = null;
      paneEl = null;
    },
    detach() {
      deps.entry.state.detached.value = true;
      deps.registry.remove(deps.entry.id);
    },
    dispose() {
      ref.detach();
      deps.positionStrategy?.dispose();
    },
    updatePosition() {
      deps.positionStrategy?.apply();
    },
    updateSize(opts) {
      if (opts.width !== undefined) deps.entry.state.width.value = px(opts.width);
      if (opts.height !== undefined) deps.entry.state.height.value = px(opts.height);
      if (opts.minWidth !== undefined) deps.entry.state.minWidth.value = px(opts.minWidth);
      if (opts.minHeight !== undefined) deps.entry.state.minHeight.value = px(opts.minHeight);
      if (opts.maxWidth !== undefined) deps.entry.state.maxWidth.value = px(opts.maxWidth);
      if (opts.maxHeight !== undefined) deps.entry.state.maxHeight.value = px(opts.maxHeight);
    },
    addPanelClass(classes) {
      const arr = Array.isArray(classes) ? classes : [classes];
      deps.entry.state.panelClasses.value = [
        ...new Set([...deps.entry.state.panelClasses.value, ...arr]),
      ];
    },
    removePanelClass(classes) {
      const arr = Array.isArray(classes) ? classes : [classes];
      deps.entry.state.panelClasses.value = deps.entry.state.panelClasses.value.filter(
        c => !arr.includes(c),
      );
    },
  };

  deps.positionStrategy?.attach(ref);
  deps.scrollStrategy?.attach(ref);

  return ref;
}

function px(v: string | number): string {
  return typeof v === 'number' ? `${v}px` : v;
}
