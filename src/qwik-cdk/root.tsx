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
import {createPlatform} from './platform/platform';
import type {Direction} from './bidi/directionality';
import {
  type OverlayEntry,
  OverlayContainerOutlet,
  type OverlayContainerOptions,
  createOverlayKeyboardDispatcher,
  createOverlayOutsideClickDispatcher,
  createNoopScrollStrategy,
} from './overlay/public-api';
import type {DialogConfig} from './dialog/dialog-config';
import type {DialogRef} from './dialog/dialog-ref';
import {QWIK_CDK, type QwikCdkInternals} from './internals/internals';
import {ID_GENERATOR_COUNTER} from './a11y/id-generator';

export interface QwikCdkRootProps {
  dialogDefaults?: Partial<DialogConfig>;
  overlayContainer?: OverlayContainerOptions;
  direction?: Direction;
  loadStyles?: boolean;
}

export const QwikCdkRoot = component$<QwikCdkRootProps>(props => {
  // Reactive state (signals serialize cleanly across SSR→CSR resume).
  const entries = useSignal<readonly OverlayEntry[]>([]);
  const overlayContainerCreated = useSignal(false);
  const openDialogs = useSignal<readonly NoSerialize<DialogRef>[]>([]);
  const direction = useSignal<Direction>(props.direction ?? 'ltr');
  const idCounter = useSignal(0);

  // Single tracked store so that the NoSerialize dispatcher fields populated by
  // useVisibleTask$ are visible to every consumer reading useContext(QWIK_CDK)
  // — Qwik serializes the store object identity, the noSerialize fields are
  // undefined during SSR, and the visible-task assignment lights them up on the
  // client. Using a plain object with getters here would silently break because
  // Qwik serializes getter RESULTS, not the getters themselves.
  const internals = useStore<QwikCdkInternals>({
    entries,
    overlayContainerCreated,
    openDialogs,
    direction,
    idCounter,
    dialogDefaults: props.dialogDefaults ?? {},
    keyboardDispatcher: undefined,
    outsideClickDispatcher: undefined,
    dialogScrollStrategyFactory: undefined,
  });

  useContextProvider(QWIK_CDK, internals);
  // Shared counter backing qwik-material's `mat-button-toggle-N` /
  // `mat-button-toggle-group-N` ids (and any future consumer of
  // `useIdGenerator()`) on the same monotonic sequence as `cdk-dialog-N` /
  // `cdk-overlay-N` — see id-generator.ts for why this is a plain
  // `Signal<number>` rather than a closure-bearing `IdGenerator` object.
  useContextProvider(ID_GENERATOR_COUNTER, idCounter);

  // Construct browser-only dispatchers after hydration; clean up on teardown.
  //
  // This `useVisibleTask$` is exempt from the lazy-interactions remediation's
  // rule 7 ("no per-instance `useVisibleTask$` for interaction plumbing in
  // components that appear many times per page"): `<QwikCdkRoot>` is a
  // once-per-app singleton wrapper (one instance total, typically mounted
  // near the document root), not a repeated widget like a button or
  // button-toggle that multiplies this cost per occurrence. The dispatchers
  // it builds (keyboard routing, outside-click routing, dialog scroll
  // strategy) are overlay/dialog machinery anyway, which rule 7 and this
  // remediation explicitly scope out.
  useVisibleTask$(({cleanup}) => {
    const platform = createPlatform();
    const kbd = createOverlayKeyboardDispatcher();
    const ocd = createOverlayOutsideClickDispatcher(platform);
    internals.keyboardDispatcher = noSerialize(kbd);
    internals.outsideClickDispatcher = noSerialize(ocd);
    internals.dialogScrollStrategyFactory = noSerialize(() => createNoopScrollStrategy());

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
