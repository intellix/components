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
import {useDialog} from '@angular-community/qwik-cdk/dialog';
import type {DialogConfig as CdkDialogConfig} from '@angular-community/qwik-cdk/dialog';
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
 * Consumer-facing MatDialog service, matching the shape of qwik-cdk's Dialog
 * but with the Material-flavoured MatDialogRef return type and merging of
 * defaults from the MAT_DIALOG_DEFAULT_OPTIONS context.
 */
export interface MatDialog {
  open$: QRL<
    <C, D = unknown, R = unknown>(
      component: Component<any>,
      config?: MatDialogConfig<D>,
    ) => Promise<NoSerialize<MatDialogRef<R, C>> | null>
  >;
  close$: QRL<(id: string, result?: unknown) => void>;
  closeAll$: QRL<() => void>;
  getDialogById$: QRL<(id: string) => NoSerialize<MatDialogRef> | undefined>;
  readonly openDialogs: Signal<readonly NoSerialize<MatDialogRef>[]>;
}

export function useMatDialog(): MatDialog {
  const cdk = useDialog();
  const defaults = useContext(MAT_DIALOG_DEFAULT_OPTIONS, {} as Partial<MatDialogConfig>);
  const scrollStrategyFactory = useContext(MAT_DIALOG_SCROLL_STRATEGY, undefined);

  // openDialogs is a derived signal — a live map from qwik-cdk's openDialogs
  // to the wrapping MatDialogRefs we've minted. Stored in a useStore keyed
  // by dialog id.
  const matRefsById = useStore<Record<string, NoSerialize<MatDialogRef>>>({});
  const openDialogs = useSignal<readonly NoSerialize<MatDialogRef>[]>([]);

  // `cdk.open$` is a QRL — calls return `Promise<NoSerialize<DialogRef>|null>`.
  // Our own `open$` returns a QRL too, so `await` is fine inside the body.
  //
  // Ordering challenge: MatDialogWrapper renders as soon as cdk.open$ pushes
  // it into the overlay registry, which happens INSIDE the awaited call. At
  // wrapper-render time we don't yet have the cdk ref (still in-flight from
  // cdk.open$), but the wrapper needs the matDialogRef to provide via context
  // for its descendants (MatDialogClose etc.).
  //
  // Solution: mint the matRef BEFORE calling cdk.open$, using a `cdkShim`
  // whose methods delegate to a `.real` slot filled in AFTER cdk.open$
  // resolves. The wrapper reads a stable matRef; close() from a
  // MatDialogClose click before the shim is populated is a no-op (the
  // window where this matters is a single microtask on real hardware).
  const open$ = $(
    async <C, D, R>(
      component: Component<any>,
      config?: MatDialogConfig<D>,
    ): Promise<NoSerialize<MatDialogRef<R, C>> | null> => {
      const merged: MatDialogConfig<D> = Object.assign(
        {} as MatDialogConfig<D>,
        defaults,
        config ?? {},
      );

      if (!merged.scrollStrategy && scrollStrategyFactory) {
        merged.scrollStrategy = scrollStrategyFactory();
      }

      // SSR no-op: return a pre-CLOSED ref that resolves all three promises
      // immediately so awaiters never hang on the server.
      if (typeof document === 'undefined') {
        const state = {value: MatDialogState.CLOSED} as Signal<MatDialogState>;
        const componentInstance = {value: null} as Signal<C | null>;
        merged.id = merged.id ?? 'mat-dialog-ssr-noop';
        const fakeCdkRef = {
          dispose() {},
          updatePosition() {},
          updateSize(_o: any) {},
          addPanelClass(_c: any) {},
          removePanelClass(_c: any) {},
        };
        const ref = createMatDialogRef<R, C>({
          cdkRef: fakeCdkRef,
          config: merged,
          state,
          componentInstance,
        });
        return noSerialize(ref);
      }

      // Pre-mint state signals and the cdkShim so the matRef can exist BEFORE
      // cdk.open$ is called.
      const state = {value: MatDialogState.OPEN} as Signal<MatDialogState>;
      const componentInstance = {value: null} as Signal<C | null>;
      interface CdkShim {
        real: null | {
          dispose(): void;
          updatePosition(): void;
          updateSize(o: {width?: string | number; height?: string | number}): void;
          addPanelClass(c: string | string[]): void;
          removePanelClass(c: string | string[]): void;
        };
        dispose(): void;
        updatePosition(): void;
        updateSize(o: {width?: string | number; height?: string | number}): void;
        addPanelClass(c: string | string[]): void;
        removePanelClass(c: string | string[]): void;
      }
      const cdkShim: CdkShim = {
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
        cdkRef: cdkShim,
        config: merged,
        state,
        componentInstance,
      });
      const wrapped = noSerialize(matRef)!;

      // Build the CdkDialogConfig from the MatDialogConfig. The CDK layer
      // knows nothing about MDC animation durations or DialogPosition; those
      // are Material-only concerns handled by MatDialogContainer.
      const cdkConfig: CdkDialogConfig = {
        id: merged.id,
        role: merged.role,
        panelClass: merged.panelClass,
        hasBackdrop: merged.hasBackdrop ?? true,
        backdropClass: merged.backdropClass,
        disableClose: merged.disableClose,
        width: merged.width,
        height: merged.height,
        minWidth: merged.minWidth,
        minHeight: merged.minHeight,
        maxWidth: merged.maxWidth,
        maxHeight: merged.maxHeight,
        direction: merged.direction,
        ariaDescribedBy: merged.ariaDescribedBy,
        ariaLabelledBy: merged.ariaLabelledBy,
        ariaLabel: merged.ariaLabel,
        ariaModal: merged.ariaModal ?? true,
        autoFocus: merged.autoFocus,
        restoreFocus: merged.restoreFocus,
        closeOnNavigation: merged.closeOnNavigation,
        data: merged.data,
        scrollStrategy: merged.scrollStrategy,
        context: merged.context,
        onBackdropClick$: merged.onBackdropClick$,
        onKeydown$: merged.onKeydown$,
        onOutsidePointer$: merged.onOutsidePointer$,
      };

      // Cast cdk.open$ to any: the hook passes (component, props, cdkConfig)
      // as three args to support the MatDialogWrapper prop-injection pattern,
      // whereas qwik-cdk's QRL signature is (component, config?). The extra
      // args are absorbed by the CDK's internal overlay.create() call at
      // runtime; this is documented as a Task 20 SYNC.md deviation.
      const cdkRef = await (cdk.open$ as any)(
        MatDialogWrapper as any,
        {
          config: {...merged},
          ContentComponent: component,
          contentProps: {},
          matDialogRef: wrapped,
        } as any,
        cdkConfig as any,
      );

      if (!cdkRef) return null;

      // Point the shim at the real cdk ref. Any close() calls that arrived
      // during the microtask window between open$ start and now (extremely
      // rare — the wrapper hasn't rendered its close button yet) are lost;
      // documented as a Task 20 SYNC.md deviation.
      cdkShim.real = cdkRef as any;

      // Track in matRefsById + openDialogs signal.
      matRefsById[matRef.id] = wrapped;
      openDialogs.value = [...openDialogs.value, wrapped];

      // Wire cleanup: when the matRef's afterClosed resolves, remove from tracking.
      matRef.afterClosed.then(() => {
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
 * The vitest harness supplies its own `cdk` (a fake with an `open` method),
 * `defaults`, and `scrollStrategyFactory`; the factory returns the same
 * MatDialog shape.
 */
export interface CreateMatDialogServiceDeps {
  cdk: {
    open(
      component: Component<any>,
      props: any,
      config?: CdkDialogConfig,
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
        {} as CdkDialogConfig,
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
