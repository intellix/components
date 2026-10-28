import type {Signal} from '@builder.io/qwik';

/** Event payload for `MatSnackBarRef.afterDismissed`. Mirrors upstream `MatSnackBarDismiss`. */
export interface MatSnackBarDismiss {
  /** Whether the snack bar was dismissed using its own action button. */
  dismissedByAction: boolean;
}

/** Maximum amount of milliseconds that can be passed into setTimeout. */
const MAX_TIMEOUT = Math.pow(2, 31) - 1;

/**
 * Internal symbol the real `MatSnackBarContainer` calls once its enter
 * animation completes, to resolve `afterOpened`. Not part of the consumer API.
 */
export const MARK_OPENED = Symbol('qwik-material/snack-bar-ref/mark-opened');

/**
 * Internal symbol called once the exit animation + removal has fully
 * completed, to resolve `afterDismissed` and dispose the owning overlay. Not
 * part of the consumer API.
 */
export const MARK_DISMISSED = Symbol('qwik-material/snack-bar-ref/mark-dismissed');

/**
 * Internal symbol the container registers on mount so `dismiss()` has a real
 * exit-animation trigger to call into — same pattern as
 * `qwik-material/dialog`'s `REGISTER_CLOSE_HANDLER` (see its doc comment for
 * why: the container's animation state is a genuine `useSignal`, reactive
 * only within that component; `MatSnackBarRef` is built by a plain factory
 * outside any component, so nothing would observe a plain-object write).
 *
 * `dismiss()` may be called before the container has mounted (e.g. the
 * snack bar is still waiting for a previously-open one to finish exiting, in
 * the "replace" path — see `mat-snack-bar.tsx`). The registration itself
 * replays a pending dismiss request synchronously if one already happened.
 */
export const REGISTER_EXIT_HANDLER = Symbol('qwik-material/snack-bar-ref/register-exit-handler');

/**
 * Consumer-facing handle returned by `useMatSnackBar()`'s `open()` /
 * `openFromComponent$()` / `openFromTemplate$()`.
 *
 * Deviations from upstream `MatSnackBarRef` (see SYNC.md):
 * - `afterDismissed()` / `afterOpened()` / `onAction()`: `Observable` →
 *   one-shot `Promise`, matching `qwik-material/dialog`'s
 *   `MatDialogRef.afterClosed`/`afterOpened` precedent.
 * - `containerInstance` removed (no public handle to the Qwik container
 *   component — there's no `ComponentRef` concept to expose).
 * - `instance` is a `Signal<T | null>` that stays `null` in practice: Qwik
 *   has no `ComponentRef` to read a live content-component instance from
 *   (same already-accepted deviation as `MatDialogRef.componentInstance`).
 */
export interface MatSnackBarRef<T = unknown> {
  readonly id: string;
  /** @deprecated Always null — see the class doc comment. Kept for API shape parity. */
  readonly instance: Signal<T | null>;

  /** Dismisses the snack bar. */
  dismiss(): void;
  /** Marks the snack bar as dismissed via its own action button, then dismisses it. */
  dismissWithAction(): void;

  /** Resolves once the exit animation completes and the overlay has been disposed. */
  readonly afterDismissed: Promise<MatSnackBarDismiss>;
  /** Resolves once the enter animation completes. */
  readonly afterOpened: Promise<void>;
  /** Resolves when the snack bar's own action button is clicked. */
  readonly onAction: Promise<void>;

  /**
   * @internal Starts (or restarts) the auto-dismiss timer. Called by
   * `useMatSnackBar()` once `afterOpened` resolves, when `config.duration > 0`.
   */
  _dismissAfter(duration: number): void;

  /** @internal See `MARK_OPENED`'s doc comment. */
  [MARK_OPENED](): void;
  /** @internal See `MARK_DISMISSED`'s doc comment. */
  [MARK_DISMISSED](): void;
  /** @internal See `REGISTER_EXIT_HANDLER`'s doc comment. */
  [REGISTER_EXIT_HANDLER](fn: () => void): void;
}

/**
 * Pure factory used internally by `useMatSnackBar()`. Exported for the
 * vitest harness. Calls no Qwik hook — safe to call from inside a QRL.
 */
export function createMatSnackBarRef<T = unknown>(deps: {
  id: string;
  instance: Signal<T | null>;
  /** Disposes the owning overlay. May be a late-bound indirection (see mat-snack-bar.tsx's "replace" path, where the real OverlayRef doesn't exist yet when the ref is constructed). */
  dispose(): void;
  /** True to construct a pre-closed (SSR no-op) ref whose promises resolve immediately. */
  closed?: boolean;
}): MatSnackBarRef<T> {
  let resolveOpened!: () => void;
  let resolveDismissed!: (r: MatSnackBarDismiss) => void;
  let resolveAction!: () => void;

  let dismissedByAction = false;
  let dismissedSettled = false;
  let actionSettled = false;
  let exitRequested = false;
  let requestExit: (() => void) | undefined;
  let durationTimeoutId: ReturnType<typeof setTimeout> | undefined;

  const afterOpened = new Promise<void>(resolve => (resolveOpened = resolve));
  const afterDismissed = new Promise<MatSnackBarDismiss>(resolve => (resolveDismissed = resolve));
  const onAction = new Promise<void>(resolve => (resolveAction = resolve));

  if (deps.closed) {
    resolveOpened();
    resolveDismissed({dismissedByAction: false});
  }

  const ref: MatSnackBarRef<T> = {
    id: deps.id,
    instance: deps.instance,

    dismiss() {
      if (dismissedSettled || exitRequested) return;
      exitRequested = true;
      clearTimeout(durationTimeoutId);
      // If the container hasn't registered its exit handler yet (still
      // waiting for a previously-open snack bar to finish, in the "replace"
      // path), `REGISTER_EXIT_HANDLER` will see `exitRequested` and call the
      // handler immediately once it does register.
      requestExit?.();
    },

    dismissWithAction() {
      if (!actionSettled) {
        dismissedByAction = true;
        actionSettled = true;
        resolveAction();
      }
      clearTimeout(durationTimeoutId);
      ref.dismiss();
    },

    afterDismissed,
    afterOpened,
    onAction,

    _dismissAfter(duration) {
      clearTimeout(durationTimeoutId);
      durationTimeoutId = setTimeout(() => ref.dismiss(), Math.min(duration, MAX_TIMEOUT));
    },

    [MARK_OPENED]() {
      resolveOpened();
    },

    [MARK_DISMISSED]() {
      if (dismissedSettled) return;
      dismissedSettled = true;
      deps.dispose();
      resolveDismissed({dismissedByAction});
    },

    [REGISTER_EXIT_HANDLER](fn) {
      requestExit = fn;
      if (exitRequested) fn();
    },
  };

  return ref;
}
