import type {OverlayRegistry, OverlayEntry} from './overlay-registry';
import type {OverlayConfig} from './overlay-config';
import type {PositionStrategy} from './position/position-strategy';
import type {ScrollStrategy} from './scroll/scroll-strategy';

/** Real-signal setters `OverlayHost` registers via `_onAttached` — see its doc comment. */
export interface OverlayVisualCallbacks {
  setBackdropShowing(value: boolean): void;
  setBackdropDetached(value: boolean): void;
  /**
   * Mirrors the backdrop setters above, for `addPanelClass`/`removePanelClass`
   * calls made AFTER the overlay has already mounted (e.g. a
   * `FlexibleConnectedPositionStrategy` consumer re-deriving
   * `mat-mdc-tooltip-panel-{above,below,left,right}` once its position is
   * known, which only happens once `hasAttached()` is true — i.e. always
   * after `OverlayHost`'s first render). Previously only
   * `entry.state.panelClasses` (a plain `{value}` carrier, not a real
   * signal — see that field's doc comment) was updated, which is correct on
   * first render but silently invisible to any already-mounted
   * `OverlayHost`; confirmed live via `MatTooltip`, the first consumer to
   * call `addPanelClass` post-mount.
   */
  setPanelClasses(classes: readonly string[]): void;
  /**
   * ONLY called for a reparented host (see `_onReparented()` below) — never
   * for the common 'global' case, to avoid any behavior change there (see
   * that method's own doc comment for why this must stay opt-in).
   *
   * `OverlayContainerOutlet`'s own `ctx.entries.value` array-removal (the
   * normal way a detached overlay's `<OverlayHost>` gets torn down) only
   * knows how to find/remove a host element at the DOM position it
   * ORIGINALLY rendered it into. A popover using a non-`'global'` insertion
   * point (e.g. `mat-select`'s inline overlay — see
   * `position/popover-insertion.ts`) gets its host physically relocated by
   * `OverlayHost`'s own `useVisibleTask$` right after mount, so by the time
   * the array shrinks, the host is no longer where that list-keyed removal
   * looks for it: confirmed live, the relocated host (and everything inside
   * it) is orphaned in the DOM forever — invisible to `ctx.entries` but
   * still fully attached to `document` — see `qwik-material/select/SYNC.md`.
   * `detach()` calls this (instead of just removing the registry entry) so
   * `OverlayHost` can unmount ITS OWN previously-rendered output via a
   * normal conditional-render (`detached.value` flips its return value from
   * the host `<div>` to `null`), which Qwik's per-component diff handles via
   * a direct node reference, unaffected by where that node currently lives —
   * unlike the parent's list-keyed removal.
   */
  setDetached(value: boolean): void;
}

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
  /**
   * Wired by `OverlayHost.useVisibleTask$` once the DOM refs are populated.
   * `visuals` are real `useSignal()` setters owned by `OverlayHost` itself —
   * `OverlayEntryState`'s fields are plain `{value}` carriers (not Qwik
   * signals: the entry is built inside a QRL, where Qwik hooks can't run),
   * so they only reflect correctly on `OverlayHost`'s *first* render. Visual
   * changes made after mount (e.g. `detachBackdrop()` while an exit
   * animation is still running) must go through `visuals` to actually
   * trigger a re-render.
   */
  _onAttached(host: HTMLElement, pane: HTMLElement, visuals?: OverlayVisualCallbacks): void;
  _onDetached(): void;
  /**
   * Called by `OverlayHost` right after `applyPopoverInsertionPoint`
   * physically relocates the host element out of the declarative
   * `.cdk-overlay-container` tree it was originally rendered into — i.e.
   * exactly when `getPopoverInsertionPoint()` returns a real, non-null
   * insertion point (currently only `mat-select`'s inline overlay; see
   * `setDetached`'s doc comment for the full "why"). Flips how `detach()`
   * tears this overlay down: a reparented host can't rely on the registry's
   * array-shrink to find/remove it, so `detach()` goes through
   * `visuals.setDetached()` instead (confirmed live: calling BOTH in the
   * same synchronous tick races Qwik's own render scheduling — the array
   * removal observably wins, leaving the `detached` signal write with
   * nothing left subscribed to react to it, which is why the registry
   * removal is deferred one tick past it instead of run eagerly). Never
   * called for a 'global' overlay — `detach()`'s existing synchronous
   * registry-removal path (and the unit tests pinning its synchronous
   * contract) is completely unaffected.
   */
  _onReparented(): void;
  /** Removes the overlay from the registry without disposing strategies. */
  detach(): void;
  /** Detaches AND disposes any owned position strategy. */
  dispose(): void;
  /**
   * Fades out and detaches the backdrop independently of the rest of the
   * overlay — used by consumers (Material dialogs) that delay the pane's own
   * removal for an exit animation but want the backdrop to start fading
   * immediately. Mirrors upstream `OverlayRef.detachBackdrop()`.
   */
  detachBackdrop(): void;
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
  let visuals: OverlayVisualCallbacks | null = null;
  let reparented = false;

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
    _onAttached(host, pane, visualCallbacks) {
      hostEl = host;
      paneEl = pane;
      visuals = visualCallbacks ?? null;
      // Mirrors upstream `OverlayRef.attach()`: the position strategy is
      // attached once real host/pane DOM nodes exist (qwik-cdk creates the
      // `OverlayRef` before `OverlayHost` has rendered those nodes, so
      // attaching here — not at construction time — is the first point at
      // which `handle.hostElement`/`handle.overlayElement` are non-null).
      deps.positionStrategy?.attach(ref);
      deps.positionStrategy?.apply();
      deps.scrollStrategy?.enable();
      // Fade the backdrop in one frame after attach (matches CDK's
      // requestAnimationFrame-gated `cdk-overlay-backdrop-showing` toggle in
      // `_attachBackdrop()`). Done here (not at `create()` time) so it goes
      // through the just-registered real-signal callback.
      if (deps.entry.config.hasBackdrop) {
        queueMicrotask(() => {
          if (hostEl === null) return; // detached before the frame landed
          deps.entry.state.backdropShowing.value = true;
          visuals?.setBackdropShowing(true);
        });
      }
    },
    _onDetached() {
      deps.scrollStrategy?.disable();
      deps.positionStrategy?.detach?.();
      hostEl = null;
      paneEl = null;
      visuals = null;
    },
    _onReparented() {
      reparented = true;
    },
    detach() {
      ref.detachBackdrop();
      deps.entry.state.detached.value = true;
      if (reparented) {
        // See `_onReparented()`'s doc comment: the array-shrink below can't
        // find this host to remove it once it's been physically relocated,
        // so tell `OverlayHost` to unmount itself directly instead — and
        // defer the registry removal one tick so it doesn't race (and win
        // against) that re-render.
        visuals?.setDetached(true);
        setTimeout(() => deps.registry.remove(deps.entry.id), 0);
      } else {
        deps.registry.remove(deps.entry.id);
      }
    },
    dispose() {
      ref.detach();
      deps.positionStrategy?.dispose();
    },
    detachBackdrop() {
      deps.entry.state.backdropShowing.value = false;
      deps.entry.state.backdropDetached.value = true;
      visuals?.setBackdropShowing(false);
      visuals?.setBackdropDetached(true);
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
      const next = [...new Set([...deps.entry.state.panelClasses.value, ...arr])];
      deps.entry.state.panelClasses.value = next;
      visuals?.setPanelClasses(next);
    },
    removePanelClass(classes) {
      const arr = Array.isArray(classes) ? classes : [classes];
      const next = deps.entry.state.panelClasses.value.filter(c => !arr.includes(c));
      deps.entry.state.panelClasses.value = next;
      visuals?.setPanelClasses(next);
    },
  };

  deps.scrollStrategy?.attach(ref);

  return ref;
}

function px(v: string | number): string {
  return typeof v === 'number' ? `${v}px` : v;
}
