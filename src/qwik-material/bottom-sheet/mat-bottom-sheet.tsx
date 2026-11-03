import {
  $,
  component$,
  noSerialize,
  useContext,
  useContextProvider,
  type Component,
  type NoSerialize,
  type QRL,
  type Signal,
} from '@qwik.dev/core';
import {ensureCdkDispatchers, QWIK_CDK, type QwikCdkInternals} from '@angular-community/qwik-cdk';
import {
  createOverlayService,
  createGlobalPositionStrategy,
  createBlockScrollStrategy,
  type OverlayConfig,
  type OverlayRef,
} from '@angular-community/qwik-cdk/overlay';
import type {OverlayEntry, OverlayRegistry} from '@angular-community/qwik-cdk/overlay';
import type {MatBottomSheetConfig} from './mat-bottom-sheet-config';
import {
  createMatBottomSheetRef,
  TRIGGER_ENTER,
  type MatBottomSheetRef,
} from './mat-bottom-sheet-ref';
import {MatBottomSheetContainer} from './mat-bottom-sheet-container';
import {
  MAT_BOTTOM_SHEET_DATA,
  MAT_BOTTOM_SHEET_DEFAULT_OPTIONS,
  MAT_BOTTOM_SHEET_REF,
  MAT_BOTTOM_SHEET_SCROLL_STRATEGY,
} from './mat-bottom-sheet-tokens';

/**
 * Internal wrapper component that MatBottomSheet opens via the cdk overlay.
 * Receives the merged config, the consumer's content component, and the
 * per-sheet MatBottomSheetRef (NoSerialize-wrapped) as plain-object props.
 * Consumers never construct this directly.
 *
 * Unlike `MatDialogWrapper`, no extra class is stamped onto the content
 * component: upstream's base `CdkDialogContainer.attachComponentPortal()`
 * (which `MatBottomSheetContainer` does NOT override, unlike
 * `MatDialogContainer`) adds no class of its own to the attached component's
 * host element.
 */
const MatBottomSheetWrapper = component$<{
  id: string;
  config: Partial<MatBottomSheetConfig>;
  ContentComponent: Component<any>;
  contentProps: Record<string, unknown>;
  matBottomSheetRef: NoSerialize<MatBottomSheetRef> | undefined;
}>(({id, config, ContentComponent, contentProps, matBottomSheetRef}) => {
  useContextProvider(MAT_BOTTOM_SHEET_DATA, config.data);
  useContextProvider(MAT_BOTTOM_SHEET_REF, matBottomSheetRef);
  return (
    <MatBottomSheetContainer id={id} config={config} matBottomSheetRef={matBottomSheetRef}>
      <ContentComponent {...(contentProps as any)} />
    </MatBottomSheetContainer>
  );
});

/**
 * Per-`QwikCdkInternals` singleton tracking of "the currently-open bottom
 * sheet", mirroring upstream `MatBottomSheet._openedBottomSheetRef` (a
 * root-injector-scoped service field every `MatBottomSheet.open()` call
 * reads/writes, regardless of which component injected the service).
 *
 * Qwik has no DI container to key a module-level singleton off of safely —
 * but `useContext(QWIK_CDK)` always resolves to the SAME `QwikCdkInternals`
 * object for every component in the app (provided once by the ancestor
 * `<QwikCdkRoot>`), INCLUDING components rendered inside the overlay branch
 * (`<OverlayContainerOutlet>`, a sibling of the routed page content under
 * `<QwikCdkRoot>`, not a descendant of `<QwikMaterialProvider>` — so a
 * `<QwikMaterialProvider>`-scoped context would NOT reach a bottom sheet's
 * own content component the way `QWIK_CDK` does). A `WeakMap` keyed by that
 * shared object gives every `useMatBottomSheet()` call site — including one
 * from inside a bottom sheet's own content (see the `replace-sheet`
 * scenario, where the first sheet's body opens a second) — the same shared
 * "currently open" state, without smuggling bottom-sheet-specific fields
 * into qwik-cdk's own typed `QwikCdkInternals`.
 *
 * Deliberately flat (one level), unlike upstream's `_parentBottomSheet`
 * hierarchy (nested injectors each get their own `_bottomSheetRefAtThisLevel`
 * unless a child explicitly looks up its parent) — no scenario in this port
 * exercises nested `<QwikMaterialProvider>` scoping for bottom sheets.
 */
interface BottomSheetRegistry {
  openedRef: NoSerialize<MatBottomSheetRef> | null;
}
const registryByCtx = new WeakMap<QwikCdkInternals, BottomSheetRegistry>();
function getRegistry(ctx: QwikCdkInternals): BottomSheetRegistry {
  let reg = registryByCtx.get(ctx);
  if (!reg) {
    reg = {openedRef: null};
    registryByCtx.set(ctx, reg);
  }
  return reg;
}

/**
 * Consumer-facing MatBottomSheet service. Opens bottom sheets via qwik-cdk's
 * overlay directly (bypassing qwik-cdk's `useDialog`, same as
 * `useMatDialog()` does — see its doc comment for why). Close-on-Escape and
 * close-on-backdrop are wired via the overlay keyboard + outside-click
 * dispatchers, same as `useMatDialog()`; upstream wires the equivalent
 * inside `MatBottomSheetRef`'s own constructor instead, but since this port
 * already bypasses the underlying `Dialog`/`DialogRef` machinery those
 * streams would have come from, service-level wiring is the natural fit —
 * no DOM-visible difference either way.
 */
export interface MatBottomSheet {
  open$: QRL<
    <C, D = unknown, R = unknown>(
      component: Component<any>,
      config?: MatBottomSheetConfig<D>,
    ) => NoSerialize<MatBottomSheetRef<R, C>> | null
  >;
  /** Dismisses the currently-visible bottom sheet, if any. */
  dismiss$: QRL<(result?: unknown) => void>;
}

export function useMatBottomSheet(): MatBottomSheet {
  const ctx = useContext(QWIK_CDK);
  const defaults = useContext(
    MAT_BOTTOM_SHEET_DEFAULT_OPTIONS,
    {} as Partial<MatBottomSheetConfig>,
  );
  // Qwik's `useContext(ctx, defaultValue)` has two special cases that make
  // passing a function (even a `noSerialize`-wrapped one, since
  // `noSerialize` just tags the same function reference — `typeof` is
  // unaffected) as the default UNSAFE here:
  //   1. If no provider is found AND `defaultValue === undefined`, it
  //      throws `QError_notFoundContext` (an explicit `undefined` default
  //      is treated the same as no default at all).
  //   2. If `defaultValue` is itself a function, Qwik treats it as a LAZY
  //      INITIALIZER and calls it immediately (`defaultValue(value)`),
  //      storing the RETURN VALUE — not the function reference — as the
  //      resolved value. Passing our `() => createBlockScrollStrategy()`
  //      factory directly here would make Qwik call it and try to persist
  //      the resulting `ScrollStrategy` INSTANCE (which has function
  //      properties like `.attach`) through the normal serialization path,
  //      crashing SSR with `QError_verifySerializable` on every route —
  //      found by booting the real dev-app, not just unit tests.
  // `useMatBottomSheet()` can be called from a component with no
  // `<QwikMaterialProvider>` ancestor at all: the `replace-sheet` scenario
  // calls it from INSIDE a bottom sheet's own content (rendered via
  // `<OverlayContainerOutlet>`, a sibling of the routed page under
  // `<QwikCdkRoot>`, not a descendant of `<QwikMaterialProvider>` — see
  // `BottomSheetRegistry`'s doc comment below). Use `null` (not a function,
  // not `undefined`) as the safe default sentinel, then substitute the real
  // fallback factory afterward in plain JS.
  const scrollStrategyFactoryOrNull = useContext(MAT_BOTTOM_SHEET_SCROLL_STRATEGY, null as any);
  const scrollStrategyFactory =
    scrollStrategyFactoryOrNull ?? noSerialize(() => createBlockScrollStrategy());

  const open$ = $(
    <C, D, R>(
      component: Component<any>,
      config?: MatBottomSheetConfig<D>,
    ): NoSerialize<MatBottomSheetRef<R, C>> | null => {
      const merged: MatBottomSheetConfig<D> = Object.assign(
        {} as MatBottomSheetConfig<D>,
        defaults,
        config ?? {},
      );

      if (!merged.scrollStrategy && scrollStrategyFactory) {
        merged.scrollStrategy = scrollStrategyFactory();
      }

      // SSR no-op: return a pre-resolved ref so awaiters never hang on the server.
      if (typeof document === 'undefined') {
        const instance = {value: null} as Signal<C | null>;
        const ref = createMatBottomSheetRef<R, C>({
          cdkRef: {dispose() {}, detachBackdrop() {}, updateProps() {}},
          config: merged,
          instance,
          id: 'cdk-dialog-ssr-noop',
          ssr: true,
        });
        return noSerialize(ref);
      }

      // Created on demand: <QwikCdkRoot>'s visible task may not have run yet.
      const {keyboardDispatcher, outsideClickDispatcher, navigationDispatcher} =
        ensureCdkDispatchers(ctx);

      // Build a thin idGen + registry that close over the shared ctx signals
      // (same pattern as qwik-material/dialog's useMatDialog()). This
      // ensures MatBottomSheet entries land in the same overlay container as
      // any MatDialog / qwik-cdk Dialog entries.
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

      // Mirrors upstream: `MatBottomSheetConfig` has no `id` field — the
      // underlying `Dialog.open()` always mints one (`cdk-dialog-` prefix)
      // since `MatBottomSheet` never supplies one itself.
      const id = idGen.getId('cdk-dialog-');

      // Mirrors upstream `MatBottomSheet.open()`: always opens with a fresh
      // `GlobalPositionStrategy` centered horizontally, pinned to the
      // bottom — the same mechanism `MatDialog`/`useMatDialog()` uses, just
      // `.bottom('0')` instead of `.centerVertically()`.
      const positionStrategy = createGlobalPositionStrategy().centerHorizontally().bottom('0');

      const overlayConfig: OverlayConfig = {
        scrollStrategy: merged.scrollStrategy,
        panelClass: merged.panelClass,
        hasBackdrop: merged.hasBackdrop ?? true,
        backdropClass: merged.backdropClass,
        // Mirrors upstream's unconditional `maxWidth: '100%'` in
        // `MatBottomSheet.open()` — not a `MatBottomSheetConfig` field at
        // all, so always applied regardless of consumer config.
        maxWidth: '100%',
        height: merged.height,
        minHeight: merged.minHeight,
        maxHeight: merged.maxHeight,
        direction: merged.direction,
        positionStrategy,
      };

      const instance = {value: null} as Signal<C | null>;
      interface OverlayShim {
        real: OverlayRef | null;
        dispose(): void;
        detachBackdrop(): void;
        updateProps(p: Record<string, unknown>): void;
      }
      const overlayShim: OverlayShim = {
        real: null,
        dispose() {
          this.real?.dispose();
        },
        updateProps(p) {
          this.real?.updateProps(p);
        },
        detachBackdrop() {
          this.real?.detachBackdrop();
        },
      };

      const matRef = createMatBottomSheetRef<R, C>({
        cdkRef: overlayShim,
        config: merged,
        instance,
        id,
      });
      const wrapped = noSerialize(matRef)!;

      const overlayRef = overlay.create<{
        id: string;
        config: Partial<MatBottomSheetConfig>;
        ContentComponent: Component<any>;
        contentProps: Record<string, unknown>;
        matBottomSheetRef: NoSerialize<MatBottomSheetRef> | undefined;
      }>(
        MatBottomSheetWrapper as Component<any>,
        {
          id,
          config: {...merged},
          ContentComponent: component,
          contentProps: {...(merged.componentProps ?? {})},
          matBottomSheetRef: wrapped,
        },
        overlayConfig,
      );

      if (!overlayRef) return null;
      overlayShim.real = overlayRef;

      // Wire close-on-Escape via keyboard dispatcher (mirrors upstream
      // `MatBottomSheetRef`'s own `keydownEvents()` subscription, relocated
      // to the service level — see this file's doc comment).
      keyboardDispatcher.add(overlayRef, {
        onKeydown(e) {
          if (merged.onKeydown$) merged.onKeydown$(e);
          const isModifierPressed = e.shiftKey || e.ctrlKey || e.altKey || e.metaKey;
          // Mirrors upstream MatBottomSheetRef: `disableClose` is read LIVE
          // off the ref's own `disableClose` field (not `merged.disableClose`,
          // which was only ever a one-time snapshot never re-read after
          // open) — so mutating `matBottomSheetRef.disableClose` after open
          // takes effect immediately. Fixes the gap this port's SYNC.md
          // previously documented as a known deviation.
          if (e.key === 'Escape' && !matRef.disableClose && !isModifierPressed) {
            matRef.dismiss();
          }
        },
      });

      // Wire close-on-backdrop-click via outside-click dispatcher (mirrors
      // upstream `MatBottomSheetRef`'s own `backdropClick()` subscription).
      // `onBackdropClick$` fires for every backdrop click REGARDLESS of
      // `disableClose` (matching upstream's `backdropClick()` Observable,
      // which is independent of the ref's own disableClose-gated dismiss
      // logic) — only the actual `dismiss()` call is gated.
      outsideClickDispatcher.add(overlayRef, {
        onOutsideClick(e) {
          if (merged.onOutsidePointer$) merged.onOutsidePointer$(e);
          if (merged.hasBackdrop !== false) {
            if (merged.onBackdropClick$) merged.onBackdropClick$(e);
            if (!matRef.disableClose) matRef.dismiss();
          }
        },
      });

      // Wire close-on-navigation: dismisses when the user navigates back/
      // forward in history (popstate) or the URL hash changes — NOT on
      // every link click. Default true, same as MatDialogConfig —
      // see useMatDialog().open$'s identical wiring for the full rationale.
      if (merged.closeOnNavigation !== false) {
        navigationDispatcher.add(overlayRef, {
          onNavigate() {
            matRef.dismiss();
          },
        });
      }

      const reg = getRegistry(ctx);
      const previous = reg.openedRef;

      matRef.afterDismissed.then(() => {
        keyboardDispatcher.remove(overlayRef);
        outsideClickDispatcher.remove(overlayRef);
        navigationDispatcher.remove(overlayRef);
        // Clear the ref if it hasn't already been replaced by a newer one —
        // mirrors upstream's identical guard in `MatBottomSheet.open()`.
        if (reg.openedRef === wrapped) reg.openedRef = null;
      });

      if (previous) {
        // A sheet is already in view: dismiss it and enter the new one only
        // once its exit animation has fully finished — mirrors upstream's
        // `if (this._openedBottomSheetRef)` branch exactly.
        previous.afterDismissed.then(() => matRef[TRIGGER_ENTER]());
        previous.dismiss();
      } else {
        matRef[TRIGGER_ENTER]();
      }
      reg.openedRef = wrapped;

      return wrapped;
    },
  );

  const dismiss$ = $((result?: unknown) => {
    getRegistry(ctx).openedRef?.dismiss(result as any);
  });

  return {open$, dismiss$};
}

/**
 * Pure factory used by vitest to test the merge logic, "replace" semantics
 * and delegation shape without going through Qwik hooks. Consumers should
 * use useMatBottomSheet().
 *
 * The vitest harness supplies its own `cdk` (a fake with an `open` method)
 * that returns an overlay-ref-shaped object. The factory returns the same
 * MatBottomSheetService shape regardless.
 */
export interface CreateMatBottomSheetServiceDeps {
  cdk: {
    open(
      component: Component<any>,
      props: any,
      config?: OverlayConfig,
    ): {
      dispose(): void;
      detachBackdrop?(): void;
    } | null;
  };
  defaults: Partial<MatBottomSheetConfig>;
  /** Shared "currently open" tracking — pass the same object across calls to exercise the replace flow. */
  registry: BottomSheetRegistry;
}

export interface MatBottomSheetService {
  open<C, D, R>(
    component: Component<any>,
    config?: MatBottomSheetConfig<D>,
  ): MatBottomSheetRef<R, C> | null;
  dismiss(result?: unknown): void;
}

let testIdSeq = 0;

export function createMatBottomSheetService(
  deps: CreateMatBottomSheetServiceDeps,
): MatBottomSheetService {
  return {
    open(component, config) {
      const merged = Object.assign({} as MatBottomSheetConfig, deps.defaults, config ?? {});
      const id = `cdk-dialog-test-${testIdSeq++}`;

      const cdkRef = deps.cdk.open(
        MatBottomSheetWrapper,
        {
          id,
          config: {...merged},
          ContentComponent: component,
          contentProps: {...(merged.componentProps ?? {})},
          matBottomSheetRef: undefined,
        },
        {} as OverlayConfig,
      );
      if (!cdkRef) return null;

      const instance = {value: null} as Signal<unknown>;
      const matRef = createMatBottomSheetRef({cdkRef, config: merged, instance, id});

      const previous = deps.registry.openedRef;
      matRef.afterDismissed.then(() => {
        if (deps.registry.openedRef === (matRef as any)) deps.registry.openedRef = null;
      });
      if (previous) {
        previous.afterDismissed.then(() => matRef[TRIGGER_ENTER]());
        previous.dismiss();
      } else {
        matRef[TRIGGER_ENTER]();
      }
      deps.registry.openedRef = noSerialize(matRef)!;

      return matRef as any;
    },
    dismiss(result) {
      deps.registry.openedRef?.dismiss(result as any);
    },
  };
}
