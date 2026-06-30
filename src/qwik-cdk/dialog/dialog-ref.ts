import {type Signal} from '@builder.io/qwik';
import type {OverlayRef} from '../overlay/overlay-ref';
import type {DialogConfig} from './dialog-config';
import type {FocusOrigin} from '../a11y/focus-monitor/focus-monitor';

/**
 * Consumer-facing handle returned by `Dialog.open$`. Built by
 * `createDialogRef`; methods proxy to the underlying `OverlayRef` and the
 * `closed` Promise resolves the first time `close()` is invoked.
 *
 * SSR-safety note: in the SSR no-op path `isOpen.value` is passed as `false`
 * — `createDialogRef` notices that and resolves `closed` synchronously so
 * any awaiter doesn't hang on the server.
 */
export interface DialogRef<R = unknown, C = unknown> {
  readonly id: string;
  readonly config: DialogConfig<unknown, R>;
  readonly isOpen: Signal<boolean>;
  readonly componentInstance: Signal<C | null>;
  readonly closed: Promise<R | undefined>;
  close(result?: R, options?: {focusOrigin?: FocusOrigin}): void;
  updatePosition(): void;
  updateSize(width?: string | number, height?: string | number): void;
  addPanelClass(classes: string | string[]): void;
  removePanelClass(classes: string | string[]): void;
}

export function createDialogRef<R = unknown, C = unknown>(deps: {
  overlayRef: OverlayRef;
  config: DialogConfig<unknown, R>;
  isOpen: Signal<boolean>;
  componentInstance: Signal<C | null>;
}): DialogRef<R, C> {
  let resolveClosed!: (r: R | undefined) => void;
  const closed = new Promise<R | undefined>(resolve => {
    resolveClosed = resolve;
  });

  // If the caller pre-set isOpen to false (SSR no-op), resolve immediately so
  // consumers awaiting `closed` don't hang.
  if (!deps.isOpen.value) {
    resolveClosed(undefined);
  }

  return {
    id: deps.config.id!,
    config: deps.config,
    isOpen: deps.isOpen,
    componentInstance: deps.componentInstance,
    closed,
    close(result) {
      if (!deps.isOpen.value) return;
      (deps.isOpen as {value: boolean}).value = false;
      deps.overlayRef.dispose();
      resolveClosed(result);
    },
    updatePosition() {
      deps.overlayRef.updatePosition();
    },
    updateSize(width, height) {
      deps.overlayRef.updateSize({width, height});
    },
    addPanelClass(classes) {
      deps.overlayRef.addPanelClass(classes);
    },
    removePanelClass(classes) {
      deps.overlayRef.removePanelClass(classes);
    },
  };
}
