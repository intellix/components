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
} from '@builder.io/qwik';
import {isBrowser} from '@builder.io/qwik/build';
import type {DialogConfig} from './dialog-config';
import {DialogConfig as DialogConfigCtor} from './dialog-config';
import {DialogRef} from './dialog-ref';
import {CdkDialogContainer} from './dialog-container';
import type {Overlay, OverlayRef, OverlayRegistry, ScrollStrategy} from '../overlay/public-api';
import {
  createOverlayService,
  OverlayKeyboardDispatcher,
  OverlayOutsideClickDispatcher,
} from '../overlay/public-api';
import {DIALOG_DATA} from './dialog-tokens';
import {_IdGenerator} from '../a11y/id-generator';
import {hasModifierKey} from '../keycodes/modifiers';
import {QWIK_CDK} from '../internals/internals';

/**
 * Consumer-facing dialog hook.
 *
 * Returns QRL methods (so the closure survives the SSR→CSR resume) that close
 * over signals provided by `<QwikCdkRoot>`. The hook reads no class-instance
 * services from context — all state is signals; browser-only dispatchers are
 * read by reference from a useStore the root populates in `useVisibleTask$`.
 */
export interface Dialog {
  /**
   * Opens a dialog rendering the given Qwik component. The returned
   * `DialogRef` is wrapped in `NoSerialize` because it owns DOM refs and is
   * only meaningful within the current client-side session.
   */
  open$: QRL<
    <C, D = unknown, R = unknown>(
      component: Component<any>,
      config?: DialogConfig<D, R>,
    ) => NoSerialize<DialogRef<R, C>> | null
  >;

  /** Closes a specific dialog by `id`, optionally with a result. */
  close$: QRL<(id: string, result?: unknown) => void>;

  /** Closes every open dialog. */
  closeAll$: QRL<() => void>;

  /** Reactive list of every open dialog handle (NoSerialize-wrapped). */
  readonly openDialogs: Signal<readonly NoSerialize<DialogRef>[]>;
}

export function useDialog(): Dialog {
  const ctx = useContext(QWIK_CDK);

  const open$ = $(
    <C, D, R>(
      component: Component<any>,
      config?: DialogConfig<D, R>,
    ): NoSerialize<DialogRef<R, C>> | null => {
      if (typeof window === 'undefined') return null;
      const kbd = ctx.keyboardDispatcher;
      const ocd = ctx.outsideClickDispatcher;
      if (!kbd || !ocd) return null;

      // Build a thin idGen + registry that close over the shared ctx signals.
      const idGen = makeCtxIdGen(ctx.idCounter);
      const registry = makeCtxRegistry(ctx.entries);
      const overlay = createOverlayService(registry, idGen);

      const service = createDialogService({
        overlay,
        idGen,
        defaults: ctx.dialogDefaults,
        openDialogs: ctx.openDialogs,
        keyboardDispatcher: kbd,
        outsideClickDispatcher: ocd,
        dialogScrollStrategyFactory: ctx.dialogScrollStrategyFactory,
      });
      const ref = service.open<C, D, R>(component, config);
      return noSerialize(ref);
    },
  );

  const close$ = $((id: string, result?: unknown) => {
    const ref = ctx.openDialogs.value.find(r => r?.id === id);
    if (ref) ref.close(result as any);
  });

  const closeAll$ = $(() => {
    for (const r of ctx.openDialogs.value) r?.close();
  });

  return {open$, close$, closeAll$, openDialogs: ctx.openDialogs};
}

function makeCtxIdGen(counter: Signal<number>): _IdGenerator {
  // _IdGenerator's contract is just `getId(prefix): string` — fake the shape so
  // createOverlayService can call it and we share the ctx counter signal so
  // dialog and overlay IDs come from the same sequence.
  const fake = Object.create(_IdGenerator.prototype) as _IdGenerator;
  (fake as any).getId = (prefix: string) => `${prefix}${counter.value++}`;
  return fake;
}

function makeCtxRegistry(entries: Signal<readonly any[]>): OverlayRegistry {
  return {
    entries,
    push: e => {
      entries.value = [...entries.value, e];
    },
    remove: id => {
      entries.value = entries.value.filter(x => x.id !== id);
    },
    get: id => entries.value.find(x => x.id === id),
  };
}

/**
 * The Dialog wrapper component that the overlay registry renders for each open
 * dialog. Receives a plain-object config (not a DialogConfig class instance) so
 * Qwik can serialize props without throwing "Value cannot be serialized" errors.
 */
const DialogWrapper = component$<{
  config: Partial<DialogConfig>;
  ContentComponent: Component<any>;
  contentProps: Record<string, unknown>;
}>(({config, ContentComponent, contentProps}) => {
  for (const override of config.context ?? []) {
    useContextProvider(override.ctx, override.value);
  }
  useContextProvider(DIALOG_DATA, config.data);
  // Cast required because CdkDialogContainer expects DialogConfig but we pass
  // a plain object (class identity stripped to avoid Qwik serialization errors).
  const containerConfig = config as DialogConfig;
  return (
    <CdkDialogContainer config={containerConfig}>
      <ContentComponent {...contentProps} />
    </CdkDialogContainer>
  );
});

/**
 * Sync-method shape returned by `createDialogService`. Used internally and by
 * vitest. The consumer-facing surface is the QRL-based `Dialog` interface.
 */
export interface DialogService {
  open<C, D, R>(component: Component<any>, config?: DialogConfig<D, R>): DialogRef<R, C>;
  closeAll(): void;
  getDialogById<R>(id: string): DialogRef<R> | undefined;
  openDialogs: Signal<readonly NoSerialize<DialogRef>[]>;
}

/**
 * Pure factory used by `useDialog` (inside a QRL) and by the vitest harness.
 * Holds no state beyond the deps it closes over; safe to call repeatedly.
 */
export function createDialogService(deps: {
  overlay: Overlay;
  idGen: _IdGenerator;
  defaults: Partial<DialogConfig>;
  openDialogs: Signal<readonly NoSerialize<DialogRef>[]>;
  keyboardDispatcher: OverlayKeyboardDispatcher;
  outsideClickDispatcher: OverlayOutsideClickDispatcher;
  dialogScrollStrategyFactory?: () => ScrollStrategy;
}): DialogService {
  return {
    openDialogs: deps.openDialogs,

    open<C, D, R>(component: Component<any>, config?: DialogConfig<D, R>): DialogRef<R, C> {
      // SSR no-op: return a resolved fake ref so consumers don't hang
      if (!isBrowser) {
        const isOpen = {value: false} as Signal<boolean>;
        const instance = {value: null} as Signal<C | null>;
        const fakeConfig = Object.assign(new DialogConfigCtor(), deps.defaults, config ?? {});
        if (!fakeConfig.id) fakeConfig.id = 'cdk-dialog-ssr-noop';
        const fake = new DialogRef<R, C>(
          {
            dispose() {},
            updatePosition() {},
            updateSize() {},
            addPanelClass() {},
            removePanelClass() {},
          } as any,
          fakeConfig as any,
          isOpen,
          instance,
        );
        (fake as any)._resolveClosed(undefined);
        return fake;
      }

      const merged = Object.assign(new DialogConfigCtor(), deps.defaults, config ?? {});

      if (merged.id) {
        for (const r of deps.openDialogs.value) {
          if (r?.id === merged.id) {
            throw new Error(
              `Dialog with id "${merged.id}" exists already. The dialog id must be unique.`,
            );
          }
        }
      }
      if (!merged.id) merged.id = deps.idGen.getId('cdk-dialog-');

      if (!merged.scrollStrategy && deps.dialogScrollStrategyFactory) {
        merged.scrollStrategy = deps.dialogScrollStrategyFactory();
      }

      const isOpen = {value: true} as Signal<boolean>;
      const instance = {value: null} as Signal<C | null>;

      // Spread merged to a plain object so Qwik doesn't try to serialize a
      // DialogConfig class instance when passing props through the overlay.
      const overlayRef: OverlayRef = deps.overlay.create(
        DialogWrapper,
        {config: {...merged}, ContentComponent: component, contentProps: {}},
        {
          hasBackdrop: merged.hasBackdrop ?? true,
          backdropClass: merged.backdropClass,
          panelClass: merged.panelClass,
          width: merged.width,
          height: merged.height,
          minWidth: merged.minWidth,
          minHeight: merged.minHeight,
          maxWidth: merged.maxWidth,
          maxHeight: merged.maxHeight,
          positionStrategy: merged.positionStrategy,
          scrollStrategy: merged.scrollStrategy,
        } as any,
      );

      const ref = new DialogRef<R, C>(overlayRef, merged as any, isOpen, instance);

      // Register dispatcher handlers so user callbacks fire regardless of disableClose;
      // disableClose only suppresses the auto-close calls inside each handler.
      deps.keyboardDispatcher.add(overlayRef, {
        onKeydown: (e: KeyboardEvent) => {
          merged.onKeydown$?.(e);
          if (e.key === 'Escape' && !merged.disableClose && !hasModifierKey(e)) ref.close();
        },
      });
      deps.outsideClickDispatcher.add(overlayRef, {
        onOutsideClick: (e: MouseEvent) => {
          merged.onOutsidePointer$?.(e);
          if (isBackdropClick(e, overlayRef)) {
            merged.onBackdropClick$?.(e);
            if (!merged.disableClose) ref.close();
          }
        },
      });
      ref.closed.finally(() => {
        deps.keyboardDispatcher.remove(overlayRef);
        deps.outsideClickDispatcher.remove(overlayRef);
      });

      const wrapped = noSerialize(ref as DialogRef)!;
      deps.openDialogs.value = [...deps.openDialogs.value, wrapped];
      ref.closed.then(() => {
        deps.openDialogs.value = deps.openDialogs.value.filter(r => r?.id !== ref.id);
      });

      return ref;
    },

    closeAll(): void {
      for (const r of deps.openDialogs.value) r?.close();
    },

    getDialogById<R>(id: string): DialogRef<R> | undefined {
      return deps.openDialogs.value.find(r => r?.id === id) as DialogRef<R> | undefined;
    },
  };
}

/** Checks whether a pointer event's target is the backdrop element of the given overlay. */
function isBackdropClick(event: Event, overlayRef: OverlayRef): boolean {
  const target = event.target as Element | null;
  if (!target) return false;
  const host = overlayRef.hostElement;
  if (!host) return false;
  const backdrop = host.querySelector('.cdk-overlay-backdrop');
  return backdrop !== null && (backdrop === target || backdrop.contains(target));
}
