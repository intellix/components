import {
  component$,
  createContextId,
  useContext,
  useContextProvider,
  type Component,
  type Signal,
} from '@builder.io/qwik';
import {isBrowser} from '@builder.io/qwik/build';
import type {DialogConfig} from './dialog-config';
import {DialogConfig as DialogConfigCtor} from './dialog-config';
import {DialogRef} from './dialog-ref';
import {CdkDialogContainer} from './dialog-container';
import type {Overlay, OverlayRef} from '../overlay/public-api';
import {DIALOG_DATA} from './dialog-tokens';
import type {_IdGenerator} from '../a11y/id-generator';

export interface Dialog {
  open<C, D = unknown, R = unknown>(
    component: Component<any>,
    config?: DialogConfig<D, R>,
  ): DialogRef<R, C>;
  closeAll(): void;
  getDialogById<R = unknown>(id: string): DialogRef<R> | undefined;
  readonly openDialogs: Signal<readonly DialogRef[]>;
}

export const DIALOG = createContextId<Dialog>('qwik-cdk/dialog');

export function useDialog(): Dialog {
  return useContext(DIALOG);
}

/**
 * The Dialog wrapper component that the overlay registry renders for each open dialog.
 * Receives a plain-object config (not a DialogConfig class instance) so Qwik can
 * serialize props without throwing "Value cannot be serialized" errors.
 */
const DialogWrapper = component$<{
  config: Partial<DialogConfig>;
  ContentComponent: Component<any>;
  contentProps: Record<string, unknown>;
}>(({config, ContentComponent, contentProps}) => {
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

export function createDialogService(deps: {
  overlay: Overlay;
  idGen: _IdGenerator;
  defaults: Partial<DialogConfig>;
  openDialogs: Signal<readonly DialogRef[]>;
}): Dialog {
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
      if (!merged.id) merged.id = deps.idGen.getId('cdk-dialog-');

      const isOpen = {value: true} as Signal<boolean>;
      const instance = {value: null} as Signal<C | null>;

      // Spread merged to a plain object so Qwik doesn't try to serialize a
      // DialogConfig class instance when passing props through the overlay.
      const overlayRef: OverlayRef = deps.overlay.create(
        DialogWrapper,
        {config: {...merged}, ContentComponent: component, contentProps: {}},
        {
          hasBackdrop: merged.hasBackdrop ?? true,
          panelClass: merged.panelClass,
          width: merged.width,
          height: merged.height,
          positionStrategy: merged.positionStrategy,
          scrollStrategy: merged.scrollStrategy,
        } as any,
      );

      const ref = new DialogRef<R, C>(overlayRef, merged as any, isOpen, instance);

      // Wire close-on-Escape and close-on-backdrop-click.
      // (Phase 7 baseline: direct DOM listeners.  Task 23 will replace these
      // with proper OverlayKeyboard/OutsideClick dispatcher integration.)
      if (!merged.disableClose) {
        wireCloseBehavior(overlayRef, merged, ref);
      }

      deps.openDialogs.value = [...deps.openDialogs.value, ref] as readonly DialogRef[];
      ref.closed.then(() => {
        deps.openDialogs.value = deps.openDialogs.value.filter(r => r !== ref);
      });

      return ref;
    },

    closeAll(): void {
      for (const r of deps.openDialogs.value) r.close();
    },

    getDialogById<R>(id: string): DialogRef<R> | undefined {
      return deps.openDialogs.value.find(r => r.id === id) as DialogRef<R> | undefined;
    },
  };
}

function wireCloseBehavior<R, C>(
  overlayRef: OverlayRef,
  config: DialogConfig,
  ref: DialogRef<R, C>,
): void {
  // Backdrop click — wait a microtask for the host element to be attached
  queueMicrotask(() => {
    const h = overlayRef.hostElement;
    if (!h) return;
    h.querySelector('.cdk-overlay-backdrop')?.addEventListener('click', (e: Event) => {
      config.onBackdropClick$?.(e as MouseEvent);
      if (!config.disableClose) ref.close();
    });
  });

  // Escape key — attaches a direct document listener that cleans up on close.
  // Task 23 will delegate this to OverlayKeyboardDispatcher instead.
  const onKey = (e: KeyboardEvent) => {
    config.onKeydown$?.(e);
    if (e.key === 'Escape' && !config.disableClose) ref.close();
  };
  document.addEventListener('keydown', onKey);
  ref.closed.finally(() => document.removeEventListener('keydown', onKey));
}
