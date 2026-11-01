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
   * ONLY wired for a reparented host (see `_onReparented()` below) — never
   * for the common 'global' case. Still provided and still called by
   * `OverlayHost` (`detached.value`'s conditional-null-return below is
   * untouched), but `detach()` (overlay-ref.ts, this file) no longer
   * INVOKES this specific callback for the reparented case — see that
   * method's own comment for why and for the full history of this
   * mechanism (originally built, then found to need replacing under
   * Qwik v2 — `qwik-material/select/SYNC.md` and `overlay/SYNC.md` have
   * the full writeup). Kept in the interface/wiring rather than deleted:
   * a future overlay consumer might still have a legitimate use for
   * "unmount via conditional-null-return, independent of the registry
   * array shrink," and the wiring itself is inert (never called) unless
   * something explicitly invokes it again.
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
   * insertion point (`mat-select`'s and `mat-autocomplete`'s inline
   * overlays). Flips how `detach()` tears this overlay down — see that
   * method's own comment, and `overlay/SYNC.md` / `qwik-material/select/
   * SYNC.md` for the full history: under Qwik v1 this went through
   * `visuals.setDetached()` (a conditional-null-return unmount), deferring
   * the registry-array removal one tick so the two didn't race; under v2
   * that specific transition (re-rendering a component whose DOM node has
   * been externally relocated, to make it return `null`) throws a `Node
   * is not a child of this node` `insertBefore` error from inside Qwik's
   * own renderer — confirmed via a fine-grained Playwright repro, isolated
   * down to exactly this call. `detach()` now removes the (reparented)
   * host element itself, imperatively, before the same deferred registry
   * removal — `OverlayHost` unmounts normally, one tick later, via the
   * ordinary list-shrink path once there's no DOM node left for Qwik's own
   * diff to worry about. Never called for a 'global' overlay — `detach()`'s
   * existing synchronous registry-removal path (and the unit tests pinning
   * its synchronous contract) is completely unaffected.
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
        // See `_onReparented()`'s doc comment for the full history. Remove
        // the physically-relocated host ourselves (plain DOM API — the
        // array-shrink below can't find it at its original position to do
        // this for us), THEN defer the registry removal one tick, same
        // timing as before: once there's nothing left for Qwik's own diff
        // to reconcile, `OverlayHost` unmounts cleanly via the ordinary
        // list-shrink path.
        hostEl?.remove();
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
