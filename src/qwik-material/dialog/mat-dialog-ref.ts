import type {Signal} from '@builder.io/qwik';
import type {FocusOrigin} from '@angular-community/qwik-cdk/a11y';
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
  };
  config: MatDialogConfig;
  state: Signal<MatDialogState>;
  componentInstance: Signal<C | null>;
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
      // The container's exit-animation task observes state === CLOSING, waits
      // exitAnimationDuration ms, then calls ref[MARK_CLOSED]().
    },

    updatePosition(_position) {
      // Position deltas are applied to the underlying overlay's position
      // strategy via cdkRef.updatePosition. The MatDialogConfig.position
      // struct is honoured by the container's position-strategy config at
      // open() time; updates after open re-run the strategy.
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
  };
  return ref;
}
