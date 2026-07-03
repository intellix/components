import {
  $,
  component$,
  noSerialize,
  useContext,
  useSignal,
  useStore,
  type Component,
  type NoSerialize,
  type QRL,
  type Signal,
} from '@builder.io/qwik';
import {
  useOverlay,
  useOverlayKeyboardDispatcher,
  useOverlayOutsideClickDispatcher,
  type OverlayConfig,
  type OverlayRef,
} from '@angular-community/qwik-cdk/overlay';
import type {MatDialogConfig} from './mat-dialog-config';
import {createMatDialogRef, MatDialogState, type MatDialogRef} from './mat-dialog-ref';
import {MatDialogContainer} from './mat-dialog-container';
import {MAT_DIALOG_DEFAULT_OPTIONS, MAT_DIALOG_SCROLL_STRATEGY} from './mat-dialog-tokens';

/**
 * Internal wrapper component that MatDialog opens via the cdk overlay. It
 * receives the merged config, the consumer's body component, and the
 * per-dialog MatDialogRef (NoSerialize-wrapped) as plain-object props.
 * Consumers never construct this directly.
 */
const MatDialogWrapper = component$<{
  config: Partial<MatDialogConfig>;
  ContentComponent: Component<any>;
  contentProps: Record<string, unknown>;
  matDialogRef: NoSerialize<MatDialogRef> | undefined;
}>(({config, ContentComponent, contentProps, matDialogRef}) => {
  return (
    <MatDialogContainer config={config} matDialogRef={matDialogRef}>
      <ContentComponent {...(contentProps as any)} />
    </MatDialogContainer>
  );
});

/**
 * Consumer-facing MatDialog service. Opens dialogs via qwik-cdk's overlay
 * (bypassing the CDK's `useDialog` because that always wraps in
 * `CdkDialogContainer` and can't accept arbitrary wrapper props). Close-on-
 * Escape and close-on-outside-click are wired via the overlay keyboard +
 * outside-click dispatchers.
 */
export interface MatDialog {
  open$: QRL<
    <C, D = unknown, R = unknown>(
      component: Component<any>,
      config?: MatDialogConfig<D>,
    ) => NoSerialize<MatDialogRef<R, C>> | null
  >;
  close$: QRL<(id: string, result?: unknown) => void>;
  closeAll$: QRL<() => void>;
  getDialogById$: QRL<(id: string) => NoSerialize<MatDialogRef> | undefined>;
  readonly openDialogs: Signal<readonly NoSerialize<MatDialogRef>[]>;
}

let _matDialogIdSeq = 0;

export function useMatDialog(): MatDialog {
  const overlay = useOverlay();
  const keyboardDispatcher = useOverlayKeyboardDispatcher();
  const outsideClickDispatcher = useOverlayOutsideClickDispatcher();
  const defaults = useContext(MAT_DIALOG_DEFAULT_OPTIONS, {} as Partial<MatDialogConfig>);
  const scrollStrategyFactory = useContext(MAT_DIALOG_SCROLL_STRATEGY, undefined);

  const matRefsById = useStore<Record<string, NoSerialize<MatDialogRef>>>({});
  const openDialogs = useSignal<readonly NoSerialize<MatDialogRef>[]>([]);

  const open$ = $(
    <C, D, R>(
      component: Component<any>,
      config?: MatDialogConfig<D>,
    ): NoSerialize<MatDialogRef<R, C>> | null => {
      const merged: MatDialogConfig<D> = Object.assign(
        {} as MatDialogConfig<D>,
        defaults,
        config ?? {},
      );
      merged.id = merged.id ?? `mat-mdc-dialog-${_matDialogIdSeq++}`;

      if (!merged.scrollStrategy && scrollStrategyFactory) {
        merged.scrollStrategy = scrollStrategyFactory();
      }

      // SSR no-op: return a pre-CLOSED ref that resolves all three promises
      // immediately so awaiters never hang on the server.
      if (typeof document === 'undefined') {
        const state = {value: MatDialogState.CLOSED} as Signal<MatDialogState>;
        const componentInstance = {value: null} as Signal<C | null>;
        const fakeOverlayRef = {
          dispose() {},
          updatePosition() {},
          updateSize(_o: {width?: string | number; height?: string | number}) {},
          addPanelClass(_c: string | string[]) {},
          removePanelClass(_c: string | string[]) {},
        };
        const ref = createMatDialogRef<R, C>({
          cdkRef: fakeOverlayRef,
          config: merged,
          state,
          componentInstance,
        });
        return noSerialize(ref);
      }

      // Overlay.create returns the ref synchronously, so no cdkShim is needed
      // (unlike the earlier cdk.dialog.open$ variant which was a QRL).
      const overlayConfig: OverlayConfig = {
        scrollStrategy: merged.scrollStrategy,
        panelClass: merged.panelClass,
        hasBackdrop: merged.hasBackdrop ?? true,
        backdropClass: merged.backdropClass,
        width: merged.width,
        height: merged.height,
        minWidth: merged.minWidth,
        minHeight: merged.minHeight,
        maxWidth: merged.maxWidth,
        maxHeight: merged.maxHeight,
        direction: merged.direction,
      };

      // Pre-mint state signals + the wrapping matRef with a shim so the
      // wrapper's descendants (MatDialogClose) can call ref.close() from the
      // start, even if the real overlayRef assignment happens after render.
      const state = {value: MatDialogState.OPEN} as Signal<MatDialogState>;
      const componentInstance = {value: null} as Signal<C | null>;
      interface OverlayShim {
        real: OverlayRef | null;
        dispose(): void;
        updatePosition(): void;
        updateSize(o: {width?: string | number; height?: string | number}): void;
        addPanelClass(c: string | string[]): void;
        removePanelClass(c: string | string[]): void;
      }
      const overlayShim: OverlayShim = {
        real: null,
        dispose() {
          this.real?.dispose();
        },
        updatePosition() {
          this.real?.updatePosition();
        },
        updateSize(o) {
          this.real?.updateSize(o);
        },
        addPanelClass(c) {
          this.real?.addPanelClass(c);
        },
        removePanelClass(c) {
          this.real?.removePanelClass(c);
        },
      };
      const matRef = createMatDialogRef<R, C>({
        cdkRef: overlayShim,
        config: merged,
        state,
        componentInstance,
      });
      const wrapped = noSerialize(matRef)!;

      const overlayRef = overlay.create<{
        config: Partial<MatDialogConfig>;
        ContentComponent: Component<any>;
        contentProps: Record<string, unknown>;
        matDialogRef: NoSerialize<MatDialogRef> | undefined;
      }>(
        MatDialogWrapper as Component<any>,
        {
          config: {...merged},
          ContentComponent: component,
          contentProps: {},
          matDialogRef: wrapped,
        },
        overlayConfig,
      );

      if (!overlayRef) return null;
      overlayShim.real = overlayRef;

      // Wire close-on-Escape via keyboard dispatcher. The CDK's DialogService
      // used to do this; we replicate the behaviour at the qwik-material layer
      // since we're bypassing the dialog service.
      keyboardDispatcher.add(overlayRef, {
        onKeydown(e) {
          if (merged.onKeydown$) merged.onKeydown$(e);
          const isModifierPressed = e.shiftKey || e.ctrlKey || e.altKey || e.metaKey;
          if (e.key === 'Escape' && !merged.disableClose && !isModifierPressed) {
            matRef.close();
          }
        },
      });

      // Wire close-on-backdrop-click via outside-click dispatcher.
      outsideClickDispatcher.add(overlayRef, {
        onOutsideClick(e) {
          if (merged.onOutsidePointer$) merged.onOutsidePointer$(e);
          if (merged.hasBackdrop !== false && !merged.disableClose) {
            if (merged.onBackdropClick$) merged.onBackdropClick$(e);
            matRef.close();
          }
        },
      });

      matRefsById[matRef.id] = wrapped;
      openDialogs.value = [...openDialogs.value, wrapped];

      matRef.afterClosed.then(() => {
        keyboardDispatcher.remove(overlayRef);
        outsideClickDispatcher.remove(overlayRef);
        delete matRefsById[matRef.id];
        openDialogs.value = openDialogs.value.filter(r => r?.id !== matRef.id);
      });

      return wrapped;
    },
  );

  const close$ = $((id: string, result?: unknown) => {
    const ref = matRefsById[id];
    if (ref) ref.close(result as any);
  });

  const closeAll$ = $(() => {
    for (const r of openDialogs.value) r?.close();
  });

  const getDialogById$ = $((id: string): NoSerialize<MatDialogRef> | undefined => {
    return matRefsById[id];
  });

  return {open$, close$, closeAll$, getDialogById$, openDialogs};
}

/**
 * Pure factory used by vitest to test the merge logic and delegation shape
 * without going through Qwik hooks. Consumers should use useMatDialog().
 *
 * The vitest harness supplies its own `cdk` (a fake with an `open` method)
 * that returns an OverlayRef-shaped object. The factory returns the same
 * MatDialogService shape regardless.
 */
export interface CreateMatDialogServiceDeps {
  cdk: {
    open(
      component: Component<any>,
      props: any,
      config?: OverlayConfig,
    ): {
      dispose(): void;
      updatePosition(): void;
      updateSize(opts: {width?: string | number; height?: string | number}): void;
      addPanelClass(c: string | string[]): void;
      removePanelClass(c: string | string[]): void;
    } | null;
  };
  defaults: Partial<MatDialogConfig>;
  scrollStrategyFactory?: () => import('@angular-community/qwik-cdk/overlay').ScrollStrategy;
  openDialogs: Signal<readonly NoSerialize<MatDialogRef>[]>;
  matRefsById: Record<string, NoSerialize<MatDialogRef>>;
}

export interface MatDialogService {
  open<C, D, R>(component: Component<any>, config?: MatDialogConfig<D>): MatDialogRef<R, C> | null;
  close(id: string, result?: unknown): void;
  closeAll(): void;
  getDialogById<R>(id: string): MatDialogRef<R> | undefined;
}

export function createMatDialogService(deps: CreateMatDialogServiceDeps): MatDialogService {
  return {
    open(component, config) {
      const merged = Object.assign({} as MatDialogConfig, deps.defaults, config ?? {});
      if (!merged.scrollStrategy && deps.scrollStrategyFactory) {
        merged.scrollStrategy = deps.scrollStrategyFactory();
      }

      const cdkRef = deps.cdk.open(
        MatDialogWrapper,
        {
          config: {...merged},
          ContentComponent: component,
          contentProps: {},
          matDialogRef: undefined,
        },
        {} as OverlayConfig,
      );
      if (!cdkRef) return null;

      const state = {value: MatDialogState.OPEN} as Signal<MatDialogState>;
      const componentInstance = {value: null} as Signal<unknown>;
      const matRef = createMatDialogRef({
        cdkRef,
        config: merged,
        state,
        componentInstance,
      });

      deps.matRefsById[matRef.id] = noSerialize(matRef)!;
      deps.openDialogs.value = [...deps.openDialogs.value, noSerialize(matRef)!];
      matRef.afterClosed.then(() => {
        delete deps.matRefsById[matRef.id];
        deps.openDialogs.value = deps.openDialogs.value.filter(r => r?.id !== matRef.id);
      });

      return matRef as any;
    },
    close(id: string, result?: unknown) {
      deps.matRefsById[id]?.close(result as any);
    },
    closeAll() {
      for (const r of deps.openDialogs.value) r?.close();
    },
    getDialogById<R>(id: string): MatDialogRef<R> | undefined {
      return deps.matRefsById[id] as MatDialogRef<R> | undefined;
    },
  };
}
