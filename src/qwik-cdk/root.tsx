import {
  component$,
  noSerialize,
  Slot,
  useContextProvider,
  useSignal,
  useStore,
  useVisibleTask$,
  type NoSerialize,
} from '@builder.io/qwik';
import {Platform} from './platform/platform';
import type {Direction} from './bidi/directionality';
import {
  type OverlayEntry,
  OverlayContainerOutlet,
  type OverlayContainerOptions,
  OverlayKeyboardDispatcher,
  OverlayOutsideClickDispatcher,
  NoopScrollStrategy,
} from './overlay/public-api';
import type {DialogConfig} from './dialog/dialog-config';
import type {DialogRef} from './dialog/dialog-ref';
import {QWIK_CDK, type QwikCdkInternals} from './internals/internals';

export interface QwikCdkRootProps {
  dialogDefaults?: Partial<DialogConfig>;
  overlayContainer?: OverlayContainerOptions;
  direction?: Direction;
  loadStyles?: boolean;
}

export const QwikCdkRoot = component$<QwikCdkRootProps>(props => {
  // === Reactive state (signals — serialize cleanly across SSR→CSR resume) ===
  const entries = useSignal<readonly OverlayEntry[]>([]);
  const openDialogs = useSignal<readonly NoSerialize<DialogRef>[]>([]);
  const direction = useSignal<Direction>(props.direction ?? 'ltr');
  const idCounter = useSignal(0);

  // === Browser-only services (held in a store so mutation from a
  // useVisibleTask$ survives resume; the noSerialize fields are undefined
  // during SSR and re-populated on first client tick.) ===
  const services = useStore<{
    keyboardDispatcher: NoSerialize<OverlayKeyboardDispatcher> | undefined;
    outsideClickDispatcher: NoSerialize<OverlayOutsideClickDispatcher> | undefined;
    dialogScrollStrategyFactory: NoSerialize<() => NoopScrollStrategy> | undefined;
  }>({
    keyboardDispatcher: undefined,
    outsideClickDispatcher: undefined,
    dialogScrollStrategyFactory: undefined,
  });

  const internals: QwikCdkInternals = {
    entries,
    openDialogs,
    direction,
    idCounter,
    dialogDefaults: props.dialogDefaults ?? {},
    get keyboardDispatcher() {
      return services.keyboardDispatcher;
    },
    get outsideClickDispatcher() {
      return services.outsideClickDispatcher;
    },
    get dialogScrollStrategyFactory() {
      return services.dialogScrollStrategyFactory;
    },
  };

  useContextProvider(QWIK_CDK, internals);

  // Construct browser-only dispatchers after hydration; clean up on teardown.
  useVisibleTask$(({cleanup}) => {
    const platform = new Platform();
    const kbd = new OverlayKeyboardDispatcher();
    const ocd = new OverlayOutsideClickDispatcher(platform);
    services.keyboardDispatcher = noSerialize(kbd);
    services.outsideClickDispatcher = noSerialize(ocd);
    services.dialogScrollStrategyFactory = noSerialize(() => new NoopScrollStrategy());

    cleanup(() => {
      kbd.dispose();
      ocd.dispose();
    });
  });

  // Auto-load overlay-structure styles if requested (default true)
  if (props.loadStyles !== false) {
    // Side-effect import; Vite bundles the CSS with the component.
    // @ts-expect-error - side-effect css import
    import('./scss/overlay/overlay-structure.scss');
  }

  return (
    <>
      <Slot />
      <OverlayContainerOutlet />
    </>
  );
});
