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
} from '@qwik.dev/core';
import {ensureCdkDispatchers, QWIK_CDK} from '@angular-community/qwik-cdk';
import {
  createOverlayService,
  createGlobalPositionStrategy,
  createBlockScrollStrategy,
  type OverlayConfig,
  type OverlayRef,
} from '@angular-community/qwik-cdk/overlay';
import type {OverlayEntry, OverlayRegistry} from '@angular-community/qwik-cdk/overlay';
import type {MatDialogConfig} from './mat-dialog-config';
import {createMatDialogRef, MatDialogState, type MatDialogRef} from './mat-dialog-ref';
import {MatDialogContainer} from './mat-dialog-container';
import {MAT_DIALOG_DEFAULT_OPTIONS, MAT_DIALOG_SCROLL_STRATEGY} from './mat-dialog-tokens';
import {useQwikMaterialContextSnapshot} from './qwik-material-provider';

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
      {/*
        Mirrors `MatDialogContainer.attachComponentPortal()`'s
        `ref.location.nativeElement.classList.add('mat-mdc-dialog-component-host')`:
        Angular's ComponentPortal always creates a host element for the
        attached component and the container stamps this class onto it (the
        display:flex fix documented there). Qwik has no implicit per-component
        host element, so the content component itself must render its own
        root tag and apply this class — see the dev-app scenario bodies.
      */}
      <ContentComponent {...(contentProps as any)} class="mat-mdc-dialog-component-host" />
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
  /**
   * Registers a callback invoked every time `openDialogs` transitions from
   * non-empty to empty — the Qwik-idiomatic replacement for upstream
   * `MatDialog.afterAllClosed` (an Observable with the same "emits
   * whenever the open-dialog count reaches zero" contract). Returns an
   * unsubscribe function.
   */
  afterAllClosed$: QRL<(callback: QRL<() => void>) => QRL<() => void>>;
}

export function useMatDialog(): MatDialog {
  // Consume the qwik-cdk umbrella so we share the overlay registry +
  // dispatchers that <QwikCdkRoot> already installs. Matches the pattern used
  // by qwik-cdk's own useDialog — see src/qwik-cdk/dialog/dialog.tsx.
  const ctx = useContext(QWIK_CDK);
  const defaults = useContext(MAT_DIALOG_DEFAULT_OPTIONS, {} as Partial<MatDialogConfig>);
  // Snapshot every qwik-material configuration context visible HERE, at the
  // point useMatDialog() is called (inside the opener's own render) — see
  // OverlayConfig.context's doc comment for why the dialog's content,
  // rendered elsewhere under <QwikCdkRoot>, can't see them on its own.
  const inheritedContext = useQwikMaterialContextSnapshot();
  // Qwik's `useContext(ctx, defaultValue)` has two special cases that make
  // passing a function as the default UNSAFE: (1) an explicit `undefined`
  // default is treated the same as no default (throws
  // `QError_notFoundContext` when no provider exists), and (2) a
  // FUNCTION-typed default is treated as a lazy initializer and INVOKED
  // immediately, with the return value (not the function) persisted —
  // which would try to serialize the resulting `ScrollStrategy` instance
  // (function properties like `.attach`) during SSR, crashing every route.
  // See `useMatBottomSheet()`'s identical fix in `mat-bottom-sheet.tsx` for
  // the full explanation and the scenario that surfaced this (calling the
  // service hook from a component with no `<QwikMaterialProvider>`
  // ancestor — not currently exercised by any `useMatDialog()` scenario,
  // but fixed here too since it's the same latent bug). `null` (not a
  // function, not `undefined`) is the safe default sentinel; the real
  // fallback factory is substituted afterward in plain JS.
  const scrollStrategyFactoryOrNull = useContext(MAT_DIALOG_SCROLL_STRATEGY, null as any);
  const scrollStrategyFactory =
    scrollStrategyFactoryOrNull ?? noSerialize(() => createBlockScrollStrategy());

  const matRefsById = useStore<Record<string, NoSerialize<MatDialogRef>>>({});
  const openDialogs = useSignal<readonly NoSerialize<MatDialogRef>[]>([]);
  const idSeq = useStore<{n: number}>({n: 0});
  // QRL callbacks are plain serializable values, so a signal works fine
  // here (unlike an `Overlay`/dispatcher instance — see
  // qwik-cdk/overlay/SYNC.md's `useOverlay()` entry for why those can't
  // live in a signal the same way).
  const afterAllClosedCallbacks = useSignal<readonly QRL<() => void>[]>([]);

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
      merged.id = merged.id ?? `mat-mdc-dialog-${idSeq.n++}`;

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
          updateProps(_p: Record<string, unknown>) {},
        };
        const ref = createMatDialogRef<R, C>({
          cdkRef: fakeOverlayRef,
          config: merged,
          state,
          componentInstance,
        });
        return noSerialize(ref);
      }

      // Created on demand: <QwikCdkRoot>'s visible task may not have run yet.
      const {keyboardDispatcher, outsideClickDispatcher, navigationDispatcher} =
        ensureCdkDispatchers(ctx);

      // Build a thin idGen + registry that close over the shared ctx signals
      // (same pattern as qwik-cdk's useDialog). This ensures MatDialog entries
      // land in the same overlay container as any qwik-cdk Dialog entries.
      const idGen = {
        getId(prefix: string): string {
          return `${prefix}${ctx.idCounter.value++}`;
        },
      };
      const registry: OverlayRegistry = {
        entries: ctx.entries,
        push: e => {
          ctx.overlayContainerCreated.value = true;
          ctx.entries.value = [...ctx.entries.value, e];
        },
        remove: id => {
          ctx.entries.value = ctx.entries.value.filter(x => x.id !== id);
        },
        get: id => ctx.entries.value.find((x: OverlayEntry) => x.id === id),
      };
      const overlay = createOverlayService(registry, idGen, ctx.overlayDefaultConfig);

      // Mirrors upstream MatDialog.open(): always opens with a fresh,
      // centered GlobalPositionStrategy (ignoring any CDK-level override —
      // MatDialog has no positionStrategy field on its config), later
      // adjusted by matRef.updatePosition(merged.position) below.
      const positionStrategy = createGlobalPositionStrategy()
        .centerHorizontally()
        .centerVertically();

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
        positionStrategy,
        // Automatically-carried qwik-material contexts first, so an
        // explicit, per-open `merged.context` override (user-supplied,
        // via MatDialogConfig.context) always wins on a conflicting id —
        // see OverlayHost's loop, which provides these in array order and
        // lets a later entry for the same ContextId overwrite an earlier
        // one.
        context: [...inheritedContext, ...(merged.context ?? [])],
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
        detachBackdrop(): void;
        updateProps(p: Record<string, unknown>): void;
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
        detachBackdrop() {
          this.real?.detachBackdrop();
        },
        updateProps(p) {
          this.real?.updateProps(p);
        },
      };
      const matRef = createMatDialogRef<R, C>({
        cdkRef: overlayShim,
        config: merged,
        state,
        componentInstance,
        positionStrategy,
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
          contentProps: {...(merged.componentProps ?? {})},
          matDialogRef: wrapped,
        },
        overlayConfig,
      );

      if (!overlayRef) return null;
      overlayShim.real = overlayRef;
      // Mirrors `MatDialogRef`'s constructor: `_ref.addPanelClass('mat-mdc-dialog-panel')`.
      overlayRef.addPanelClass('mat-mdc-dialog-panel');
      // Mirrors `MatDialog.open()`'s `providers` callback:
      // `dialogRef.updatePosition(config?.position)`.
      matRef.updatePosition(merged.position);

      // Wire close-on-Escape via keyboard dispatcher. The CDK's DialogService
      // used to do this; we replicate the behaviour at the qwik-material layer
      // since we're bypassing the dialog service.
      keyboardDispatcher.add(overlayRef, {
        onKeydown(e) {
          if (merged.onKeydown$) merged.onKeydown$(e);
          const isModifierPressed = e.shiftKey || e.ctrlKey || e.altKey || e.metaKey;
          // Mirrors upstream MatDialogRef: `disableClose` is read LIVE off the
          // ref (not snapshotted from `merged` at open time), so mutating
          // `matDialogRef.disableClose` after open takes effect immediately.
          if (e.key === 'Escape' && !matRef.disableClose && !isModifierPressed) {
            matRef.close();
          }
        },
      });

      // Wire close-on-backdrop-click via outside-click dispatcher. Mirrors
      // upstream: `MatDialogRef.backdropClick()` (here: `onBackdropClick$`)
      // emits for every backdrop click REGARDLESS of `disableClose` — apps
      // use this to show a "discard changes?" confirmation even when the
      // dialog can't be dismissed by clicking outside it. Only the actual
      // `close()` call is gated on `disableClose`.
      outsideClickDispatcher.add(overlayRef, {
        onOutsideClick(e) {
          if (merged.onOutsidePointer$) merged.onOutsidePointer$(e);
          if (merged.hasBackdrop !== false) {
            if (merged.onBackdropClick$) merged.onBackdropClick$(e);
            if (!matRef.disableClose) matRef.close();
          }
        },
      });

      // Wire close-on-navigation: closes when the user navigates back/
      // forward in history (popstate) or the URL hash changes — NOT on
      // every link click (this library takes no router dependency, so it
      // can't distinguish a router-driven pushState from any other call).
      // Mirrors upstream `OverlayConfig.disposeOnNavigation` (set from
      // `MatDialogConfig.closeOnNavigation`), default true.
      if (merged.closeOnNavigation !== false) {
        navigationDispatcher.add(overlayRef, {
          onNavigate() {
            matRef.close();
          },
        });
      }

      matRefsById[matRef.id] = wrapped;
      openDialogs.value = [...openDialogs.value, wrapped];

      matRef.afterClosed.then(() => {
        keyboardDispatcher.remove(overlayRef);
        outsideClickDispatcher.remove(overlayRef);
        navigationDispatcher.remove(overlayRef);
        delete matRefsById[matRef.id];
        openDialogs.value = openDialogs.value.filter(r => r?.id !== matRef.id);
        if (openDialogs.value.length === 0) {
          for (const cb of afterAllClosedCallbacks.value) cb();
        }
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

  const afterAllClosed$ = $((callback: QRL<() => void>): QRL<() => void> => {
    afterAllClosedCallbacks.value = [...afterAllClosedCallbacks.value, callback];
    return $(() => {
      afterAllClosedCallbacks.value = afterAllClosedCallbacks.value.filter(cb => cb !== callback);
    });
  });

  return {open$, close$, closeAll$, getDialogById$, openDialogs, afterAllClosed$};
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
          contentProps: {...(merged.componentProps ?? {})},
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
