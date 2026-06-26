import {
  component$,
  Slot,
  useContextProvider,
  useSignal,
  useVisibleTask$,
  noSerialize,
} from '@builder.io/qwik';
import {Platform, PLATFORM} from './platform/platform';
import {Directionality, DIRECTIONALITY} from './bidi/directionality';
import type {Direction} from './bidi/directionality';
import {_IdGenerator, ID_GENERATOR} from './a11y/id-generator';
import {
  InputModalityDetector,
  INPUT_MODALITY_DETECTOR,
} from './a11y/input-modality/input-modality-detector';
import {FocusMonitor, FOCUS_MONITOR} from './a11y/focus-monitor/focus-monitor';
import {
  OVERLAY_REGISTRY,
  type OverlayRegistry,
  type OverlayEntry,
  OverlayContainerOutlet,
  DefaultOverlayContainer,
  OVERLAY_CONTAINER,
  type OverlayContainerOptions,
  createOverlayService,
  OVERLAY,
  ScrollStrategyOptions,
  SCROLL_STRATEGY_OPTIONS,
  OverlayKeyboardDispatcher,
  OVERLAY_KEYBOARD_DISPATCHER,
  OverlayOutsideClickDispatcher,
  OVERLAY_OUTSIDE_CLICK_DISPATCHER,
  NoopScrollStrategy,
} from './overlay/public-api';
import {DEFAULT_DIALOG_CONFIG, DIALOG_SCROLL_STRATEGY} from './dialog/dialog-tokens';
import type {DialogConfig} from './dialog/dialog-config';
import {createDialogService, DIALOG} from './dialog/dialog';
import type {DialogRef} from './dialog/dialog-ref';

export interface QwikCdkRootProps {
  dialogDefaults?: Partial<DialogConfig>;
  overlayContainer?: OverlayContainerOptions;
  direction?: Direction;
  loadStyles?: boolean;
}

export const QwikCdkRoot = component$<QwikCdkRootProps>(props => {
  // Singleton services — wrapped with noSerialize so Qwik does not try to
  // serialise class instances into the SSR state snapshot.
  const platform = noSerialize(new Platform())!;
  const idGen = noSerialize(new _IdGenerator())!;
  const dir = noSerialize(new Directionality(props.direction ?? 'ltr'))!;
  const modalityDetector = noSerialize(new InputModalityDetector())!;
  const focusMonitor = noSerialize(new FocusMonitor(platform, modalityDetector))!;
  const overlayContainer = noSerialize(new DefaultOverlayContainer())!;
  const scrollStrategyOptions = noSerialize(new ScrollStrategyOptions())!;
  const keyboardDispatcher = noSerialize(new OverlayKeyboardDispatcher())!;
  const outsideClickDispatcher = noSerialize(new OverlayOutsideClickDispatcher(platform))!;

  // Overlay registry — uses useSignal so mutations are reactive
  const entries = useSignal<readonly OverlayEntry[]>([]);
  const registry = noSerialize<OverlayRegistry>({
    entries,
    push: e => {
      entries.value = [...entries.value, e];
    },
    remove: id => {
      entries.value = entries.value.filter(x => x.id !== id);
    },
    get: id => entries.value.find(x => x.id === id),
  })!;

  const overlay = noSerialize(createOverlayService(registry, idGen))!;

  // Open dialogs tracked as a reactive signal (browser-only; no dialogs open during SSR)
  const openDialogs = useSignal<readonly DialogRef[]>([]);
  const dialog = noSerialize(
    createDialogService({
      overlay,
      idGen,
      defaults: props.dialogDefaults ?? {},
      openDialogs,
      keyboardDispatcher,
      outsideClickDispatcher,
      dialogScrollStrategyFactory: () => new NoopScrollStrategy(),
    }),
  )!;

  // Provide all contexts
  useContextProvider(PLATFORM, platform);
  useContextProvider(ID_GENERATOR, idGen);
  useContextProvider(DIRECTIONALITY, dir);
  useContextProvider(INPUT_MODALITY_DETECTOR, modalityDetector);
  useContextProvider(FOCUS_MONITOR, focusMonitor);
  useContextProvider(OVERLAY_CONTAINER, overlayContainer);
  useContextProvider(SCROLL_STRATEGY_OPTIONS, scrollStrategyOptions);
  useContextProvider(OVERLAY_KEYBOARD_DISPATCHER, keyboardDispatcher);
  useContextProvider(OVERLAY_OUTSIDE_CLICK_DISPATCHER, outsideClickDispatcher);
  useContextProvider(OVERLAY_REGISTRY, registry);
  useContextProvider(OVERLAY, overlay);
  useContextProvider(DEFAULT_DIALOG_CONFIG, props.dialogDefaults ?? {});
  useContextProvider(DIALOG_SCROLL_STRATEGY, () => new NoopScrollStrategy());
  useContextProvider(DIALOG, dialog);

  // Cleanup dispatchers on teardown
  useVisibleTask$(({cleanup}) => {
    cleanup(() => {
      keyboardDispatcher.dispose();
      outsideClickDispatcher.dispose();
      modalityDetector.destroy?.();
      focusMonitor.destroy();
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
