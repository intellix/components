import type {Signal} from '@builder.io/qwik';
import type {FocusOrigin} from '@angular-community/qwik-cdk/a11y';
import type {GlobalPositionStrategy} from '@angular-community/qwik-cdk/overlay';
import type {MatDialogConfig, DialogPosition} from './mat-dialog-config';

/** Possible states of the lifecycle of a Material dialog. */
export enum MatDialogState {
  OPEN,
  CLOSING,
  CLOSED,
}

/**
 * Internal symbol the MatDialogContainer uses to signal "enter animation
 * complete → resolve afterOpened". Not part of the consumer API.
 */
export const MARK_OPENED = Symbol('qwik-material/dialog-ref/mark-opened');

/**
 * Internal symbol the MatDialogContainer uses to signal "exit animation
 * complete → resolve afterClosed and transition state to CLOSED". Not part
 * of the consumer API.
 */
export const MARK_CLOSED = Symbol('qwik-material/dialog-ref/mark-closed');

/**
 * Internal symbol the MatDialogContainer uses to register the callback that
 * actually drives the exit animation + eventual disposal. `close()` can't do
 * this itself: the MDC closing classes/timing live in the container's own
 * component state (a real `useSignal`, reactive within that component), and
 * `state` on this ref is a plain `{value}` object (not a Qwik signal, since
 * `createMatDialogRef` is constructed inside a QRL where Qwik hooks can't be
 * called) — so nothing would ever observe a plain `state.value` write and
 * react to it. The container installs the real exit-animation callback here
 * once it mounts; `close()` invokes it synchronously. Not part of the
 * consumer API.
 */
export const REGISTER_CLOSE_HANDLER = Symbol('qwik-material/dialog-ref/register-close-handler');

/**
 * Consumer-facing handle returned by useMatDialog().open$().
 *
 * Design shape:
 * - Reactive state (isOpen, componentInstance, state) exposed as Signals.
 * - One-shot events (afterOpened / beforeClosed / afterClosed) exposed as
 *   Promises. beforeClosed resolves when close() is called; afterClosed
 *   resolves after the exit animation completes.
 * - Mutations (updatePosition, updateSize, addPanelClass, removePanelClass)
 *   return `this` for chaining, matching Angular MatDialogRef.
 */
export interface MatDialogRef<R = unknown, C = unknown> {
  readonly id: string;
  readonly config: MatDialogConfig;
  readonly componentInstance: Signal<C | null>;
  readonly state: Signal<MatDialogState>;

  /** Resolves once the enter animation completes. */
  readonly afterOpened: Promise<void>;
  /** Resolves once the exit animation completes; carries the close result. */
  readonly afterClosed: Promise<R | undefined>;
  /** Resolves the moment close() is called, before the exit animation. */
  readonly beforeClosed: Promise<R | undefined>;

  close(result?: R, options?: {focusOrigin?: FocusOrigin}): void;
  updatePosition(position?: DialogPosition): MatDialogRef<R, C>;
  updateSize(width?: string, height?: string): MatDialogRef<R, C>;
  addPanelClass(classes: string | string[]): MatDialogRef<R, C>;
  removePanelClass(classes: string | string[]): MatDialogRef<R, C>;

  /**
   * @internal Container calls this to resolve `afterOpened` when the enter
   * animation ends. Not part of the consumer API.
   */
  [MARK_OPENED](): void;
  /**
   * @internal Container calls this to resolve `afterClosed` and transition
   * state to CLOSED when the exit animation ends. Not part of the consumer API.
   */
  [MARK_CLOSED](): void;
  /**
   * @internal Container calls this on mount to install the callback that
   * `close()` delegates to for the real exit-animation + disposal sequence.
   * Not part of the consumer API.
   */
  [REGISTER_CLOSE_HANDLER](fn: () => void): void;
}

/**
 * Pure factory used internally by useMatDialog().open$. Not intended for
 * direct consumer use — but exported for the vitest harness.
 *
 * The caller (useMatDialog) supplies:
 * - `cdkRef`: the wrapping cdk DialogRef, used to dispose the overlay on close.
 * - `config`: the merged MatDialogConfig.
 * - `state`: a Signal<MatDialogState> the caller initialises to OPEN.
 * - `componentInstance`: a Signal<C | null> the caller initialises to null.
 *
 * The factory itself does NOT call any Qwik hook (useSignal, useContext, …).
 * It's a plain function that captures closures and returns a plain object.
 */
export function createMatDialogRef<R = unknown, C = unknown>(deps: {
  cdkRef: {
    dispose(): void;
    updatePosition(): void;
    updateSize(opts: {width?: string | number; height?: string | number}): void;
    addPanelClass(cls: string | string[]): void;
    removePanelClass(cls: string | string[]): void;
    /** Optional: detaches the backdrop independently of the pane's exit animation. */
    detachBackdrop?(): void;
  };
  config: MatDialogConfig;
  state: Signal<MatDialogState>;
  componentInstance: Signal<C | null>;
  /**
   * The GlobalPositionStrategy backing this dialog's overlay. Mutated by
   * `updatePosition()`, matching upstream `MatDialogRef.updatePosition()`.
   */
  positionStrategy?: GlobalPositionStrategy;
}): MatDialogRef<R, C> {
  // Promise resolvers captured from Promise constructor executors.
  let resolveOpened!: () => void;
  let resolveBeforeClosed!: (r: R | undefined) => void;
  let resolveClosed!: (r: R | undefined) => void;

  const afterOpened = new Promise<void>(r => {
    resolveOpened = r;
  });
  const beforeClosed = new Promise<R | undefined>(r => {
    resolveBeforeClosed = r;
  });
  const afterClosed = new Promise<R | undefined>(r => {
    resolveClosed = r;
  });

  // Stash the last-seen close result so [MARK_CLOSED]() knows what to resolve with.
  let pendingResult: R | undefined = undefined;
  // Installed by MatDialogContainer via [REGISTER_CLOSE_HANDLER] once it mounts.
  let requestClose: (() => void) | undefined;

  // If the caller pre-set state to CLOSED (SSR no-op), resolve everything
  // immediately so awaiters never hang.
  if (deps.state.value === MatDialogState.CLOSED) {
    resolveOpened();
    resolveBeforeClosed(undefined);
    resolveClosed(undefined);
  }

  const ref: MatDialogRef<R, C> = {
    id: deps.config.id!,
    config: deps.config,
    state: deps.state,
    componentInstance: deps.componentInstance,
    afterOpened,
    beforeClosed,
    afterClosed,

    close(result, _options) {
      if (deps.state.value !== MatDialogState.OPEN) return;
      pendingResult = result;
      (deps.state as {value: MatDialogState}).value = MatDialogState.CLOSING;
      resolveBeforeClosed(result);
      // Mirrors upstream MatDialogRef.close(): the backdrop starts fading out
      // immediately, independent of the pane's (possibly longer) exit
      // animation — see `BackdropRef.detach()` / `OverlayRef.detachBackdrop()`.
      deps.cdkRef.detachBackdrop?.();
      // Delegate to the container's real exit-animation + disposal sequence
      // (installed via [REGISTER_CLOSE_HANDLER]). In tests that construct a
      // ref directly without a container, there is nothing to delegate to —
      // the caller drives [MARK_CLOSED]() itself, matching the previous
      // (pre-fix) behaviour this file's vitest spec exercises.
      requestClose?.();
    },

    updatePosition(position) {
      // Mirrors upstream MatDialogRef.updatePosition(): mutate the backing
      // GlobalPositionStrategy (falling back to centering on each axis when
      // no override is given for it), then re-apply.
      const strategy = deps.positionStrategy;
      if (strategy) {
        if (position && (position.left || position.right)) {
          position.left ? strategy.left(position.left) : strategy.right(position.right!);
        } else {
          strategy.centerHorizontally();
        }
        if (position && (position.top || position.bottom)) {
          position.top ? strategy.top(position.top) : strategy.bottom(position.bottom!);
        } else {
          strategy.centerVertically();
        }
      }
      deps.cdkRef.updatePosition();
      return ref;
    },

    updateSize(width, height) {
      deps.cdkRef.updateSize({width, height});
      return ref;
    },

    addPanelClass(classes) {
      deps.cdkRef.addPanelClass(classes);
      return ref;
    },

    removePanelClass(classes) {
      deps.cdkRef.removePanelClass(classes);
      return ref;
    },

    [MARK_OPENED]() {
      resolveOpened();
    },

    [MARK_CLOSED]() {
      (deps.state as {value: MatDialogState}).value = MatDialogState.CLOSED;
      deps.cdkRef.dispose();
      resolveClosed(pendingResult);
    },

    [REGISTER_CLOSE_HANDLER](fn) {
      requestClose = fn;
    },
  };
  return ref;
}
