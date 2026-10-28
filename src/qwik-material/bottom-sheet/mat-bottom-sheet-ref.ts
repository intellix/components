import type {Signal} from '@builder.io/qwik';
import type {MatBottomSheetConfig} from './mat-bottom-sheet-config';

/**
 * @internal Container calls this to resolve `afterOpened` once the real
 * enter animation finishes (`animationend` for `_mat-bottom-sheet-enter`, or
 * synchronously when animations are disabled). Not part of the consumer API.
 */
export const MARK_OPENED = Symbol('qwik-material/bottom-sheet-ref/mark-opened');

/**
 * @internal Container calls this to dispose the underlying overlay and
 * resolve `afterDismissed` once the real exit animation finishes
 * (`animationend` for `_mat-bottom-sheet-exit`, or synchronously when
 * animations are disabled). Not part of the consumer API.
 */
export const MARK_CLOSED = Symbol('qwik-material/bottom-sheet-ref/mark-closed');

/**
 * @internal The container calls this on mount to register the real
 * `enter()`/`exit()` triggers that actually flip the animation-state classes
 * (and, for `exit()`, set `mat-exit` synchronously). `dismiss()` and
 * `[TRIGGER_ENTER]()` delegate to these rather than mutating any state
 * directly — mirrors the `REGISTER_CLOSE_HANDLER` pattern already
 * established by `qwik-material/dialog`'s `MatDialogRef`, extended to cover
 * both directions since (unlike a dialog) a bottom sheet's "open" isn't
 * driven by the container's own mount — it's triggered externally by
 * `MatBottomSheet.open$`, once immediately or after a previously-open
 * sheet's `afterDismissed` (the "replace" flow — see bottom-sheet.ts's
 * `MatBottomSheet.open()`). Not part of the consumer API.
 */
export const REGISTER_ANIMATION_HANDLERS = Symbol(
  'qwik-material/bottom-sheet-ref/register-animation-handlers',
);

/**
 * @internal `MatBottomSheet.open$` calls this to trigger the registered
 * `enter()` — either immediately, or once a previously-open sheet's
 * `afterDismissed` resolves. Not part of the consumer API.
 */
export const TRIGGER_ENTER = Symbol('qwik-material/bottom-sheet-ref/trigger-enter');

/**
 * Consumer-facing handle returned by useMatBottomSheet().open$(). Mirrors
 * upstream `MatBottomSheetRef` with the project's established
 * Observable→Promise/QRL deviations (see MatDialogRef's doc comment for the
 * same rationale):
 * - `afterOpened()`/`afterDismissed()` methods → `afterOpened`/`afterDismissed` Promises.
 * - `backdropClick()`/`keydownEvents()` Observables → `MatBottomSheetConfig.onBackdropClick$`/`onKeydown$` QRLs.
 * - `componentRef` (ComponentRef<T>) removed — no ComponentRef equivalent in Qwik.
 */
export interface MatBottomSheetRef<R = unknown, T = unknown> {
  readonly id: string;
  readonly config: MatBottomSheetConfig;
  /** Instance of the component making up the content of the bottom sheet. */
  readonly instance: Signal<T | null>;
  /** Whether the user is allowed to close the bottom sheet. */
  disableClose: boolean | undefined;

  /** Resolves once the enter animation completes. */
  readonly afterOpened: Promise<void>;
  /** Resolves once the exit animation completes; carries the dismiss result. */
  readonly afterDismissed: Promise<R | undefined>;

  /** Dismisses the bottom sheet. */
  dismiss(result?: R): void;

  /** @internal */
  [MARK_OPENED](): void;
  /** @internal */
  [MARK_CLOSED](): void;
  /** @internal */
  [REGISTER_ANIMATION_HANDLERS](handlers: {enter(): void; exit(): void}): void;
  /** @internal */
  [TRIGGER_ENTER](): void;
}

/**
 * Pure factory used internally by useMatBottomSheet().open$. Not intended
 * for direct consumer use — but exported for the vitest harness. Holds no
 * Qwik-hook dependency; a plain function that captures closures and returns
 * a plain object (mirrors `createMatDialogRef`'s shape in
 * qwik-material/dialog/mat-dialog-ref.ts).
 */
export function createMatBottomSheetRef<R = unknown, T = unknown>(deps: {
  cdkRef: {
    dispose(): void;
    /** Optional: detaches the backdrop independently of the pane's exit animation. */
    detachBackdrop?(): void;
  };
  config: MatBottomSheetConfig;
  instance: Signal<T | null>;
  id: string;
  /**
   * SSR no-op: when true, `afterOpened`/`afterDismissed` resolve
   * immediately so awaiters never hang on the server (mirrors
   * `createMatDialogRef`'s pre-set-CLOSED-state SSR branch).
   */
  ssr?: boolean;
}): MatBottomSheetRef<R, T> {
  let resolveOpened!: () => void;
  let resolveDismissed!: (r: R | undefined) => void;

  const afterOpened = new Promise<void>(r => {
    resolveOpened = r;
  });
  const afterDismissed = new Promise<R | undefined>(r => {
    resolveDismissed = r;
  });

  let pendingResult: R | undefined;
  let dismissed = false;
  let disposed = false;
  let enterFn: (() => void) | undefined;
  let exitFn: (() => void) | undefined;
  let fallbackTimer: ReturnType<typeof setTimeout> | undefined;
  // `[TRIGGER_ENTER]()`/`dismiss()` can run before the container has ever
  // mounted and called `[REGISTER_ANIMATION_HANDLERS]`: a write to the
  // shared `entries` signal that creates this sheet's overlay entry doesn't
  // render synchronously in Qwik (unlike Angular's synchronous
  // `ComponentFactory` attachment, which is why upstream's
  // `MatBottomSheet.open()` can call `ref.containerInstance.enter()`
  // immediately after `_dialog.open()` returns). For the common "no sheet
  // currently open" path, `[TRIGGER_ENTER]()` fires in the SAME synchronous
  // call as the overlay entry's creation — well before Qwik's next render
  // flush. These flags make both triggers "sticky": if the container hasn't
  // registered yet, remember the request and fire it the moment
  // `[REGISTER_ANIMATION_HANDLERS]` runs, instead of silently dropping it.
  let enterRequested = false;
  let exitRequested = false;

  if (deps.ssr) {
    resolveOpened();
    resolveDismissed(undefined);
  }

  const ref: MatBottomSheetRef<R, T> = {
    id: deps.id,
    config: deps.config,
    instance: deps.instance,
    disableClose: deps.config.disableClose,

    afterOpened,
    afterDismissed,

    dismiss(result) {
      if (dismissed) return;
      dismissed = true;
      pendingResult = result;
      // Mirrors upstream `MatBottomSheetRef.dismiss()`: the backdrop starts
      // fading out in parallel with the pane's own exit animation, not
      // gated on it.
      deps.cdkRef.detachBackdrop?.();
      // Fallback in case the exit animation never fires an `animationend`
      // (e.g. the container never mounted) — mirrors upstream's
      // `_closeFallbackTimeout`, simplified to run from `dismiss()` itself
      // rather than from the exit animation's own `start` phase.
      fallbackTimer = setTimeout(() => ref[MARK_CLOSED](), 500);
      if (exitFn) exitFn();
      else exitRequested = true;
    },

    [MARK_OPENED]() {
      resolveOpened();
    },

    [MARK_CLOSED]() {
      if (disposed) return;
      disposed = true;
      clearTimeout(fallbackTimer);
      deps.cdkRef.dispose();
      resolveDismissed(pendingResult);
    },

    [REGISTER_ANIMATION_HANDLERS](handlers) {
      enterFn = handlers.enter;
      exitFn = handlers.exit;
      // Fire whichever trigger already ran before this registration landed
      // — see the "sticky" doc comment above.
      if (enterRequested) {
        enterRequested = false;
        enterFn();
      }
      if (exitRequested) {
        exitRequested = false;
        exitFn();
      }
    },

    [TRIGGER_ENTER]() {
      if (enterFn) enterFn();
      else enterRequested = true;
    },
  };

  return ref;
}
