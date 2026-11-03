import {
  component$,
  Slot,
  useContextProvider,
  useSignal,
  useStore,
  useVisibleTask$,
  type NoSerialize,
} from '@qwik.dev/core';
import type {Direction} from './bidi/directionality';
import {
  type OverlayEntry,
  type OverlayDefaultConfig,
  OverlayContainerOutlet,
  OVERLAY_DEFAULT_CONFIG,
  type OverlayContainerOptions,
} from './overlay/public-api';
import type {DialogConfig} from './dialog/dialog-config';
import type {DialogRef} from './dialog/dialog-ref';
import {QWIK_CDK, type QwikCdkInternals} from './internals/internals';
import {ensureCdkDispatchers} from './internals/ensure-dispatchers';
import {ID_GENERATOR_COUNTER} from './a11y/id-generator';

export interface QwikCdkRootProps {
  dialogDefaults?: Partial<DialogConfig>;
  overlayContainer?: OverlayContainerOptions;
  /**
   * App-wide defaults merged into every overlay's `OverlayConfig` at
   * creation time (qwik-cdk's `OVERLAY_DEFAULT_CONFIG` equivalent),
   * honoured by every port entry point that opens an overlay (dialog,
   * bottom sheet, select, menu, autocomplete, tooltip, datepicker,
   * timepicker, snack bar) as well as any app-built overlay from
   * `useOverlay()`.
   */
  overlayDefaultConfig?: OverlayDefaultConfig;
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
  const overlayDefaultConfig = props.overlayDefaultConfig ?? {};

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
    overlayDefaultConfig,
  });

  useContextProvider(QWIK_CDK, internals);
  // Plain serializable data (unlike the `Overlay` service itself, which
  // `useOverlay()` builds on demand from `QWIK_CDK` — see its doc comment
  // for why providing a ready-made `Overlay` instance here wouldn't survive
  // the SSR→CSR resume): safe to provide directly.
  useContextProvider(OVERLAY_DEFAULT_CONFIG, overlayDefaultConfig);
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
    // May already exist if an overlay was opened before this task ran.
    const {keyboardDispatcher: kbd, outsideClickDispatcher: ocd} = ensureCdkDispatchers(internals);

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
      {/*
        Eager installation for `recent-keydown.ts` (see its doc comment for
        the full "why" — `useFocusOrigin()` needs to know "was there a real
        keydown since the last focus change" to correctly attribute
        keyboard-driven focus, and nothing Qwik-lazy-loaded — including a
        `useVisibleTask$` here, tried first — is reliably registered before
        the FIRST keydown on a page under real test-harness load). A
        literal inline `<script>`, not a QRL: it runs synchronously as the
        browser parses this point in the HTML — before Qwik's own bundle
        has even started loading, let alone hydrated anything. Written
        with zero string-literal quotes (`document.onkeydown =` instead of
        `addEventListener("keydown", …)`) because a JSX text child gets
        HTML-entity-escaped (`"`/`'` → `&quot;`/`&#39;`), which `<script>`
        tags never decode back (their content is raw text, not parsed as
        HTML) — confirmed by the dev-app root's own identical constraint on
        its `<style>` tag. No expiry timer (unlike an earlier version of
        this script): see recent-keydown.ts for why the flag instead
        persists until a `focusin`/`pointerdown` explicitly clears it.

        The matching `onpointerdown` clear is ALSO installed here eagerly,
        as of the Qwik v2 upgrade — not just the `onkeydown` set above.
        `useFocusOrigin()`'s own `useOn('pointerdown', ...)` handler already
        calls `consumeRecentKeydown()` too, but under v2 every Qwik event
        handler resolves through a microtask-deferred `import()` even when
        already cached, and that handler is a DIFFERENT lazy QRL than
        `useFocusOrigin()`'s own `focusin` handler — so their relative
        resolution order is no longer guaranteed to match the browser's
        real `pointerdown`-then-`focusin` dispatch order (confirmed live: a
        real click immediately following a keyboard selection — e.g.
        pressing Space then clicking a different tab — got attributed
        `cdk-keyboard-focused` instead of `cdk-mouse-focused`, because the
        `focusin` handler's stale-flag check won the race against the
        SAME click's own `pointerdown` handler clearing it). Clearing the
        flag synchronously here, at the same eager, zero-QRL-resolution
        layer `onkeydown` already uses, makes it unconditionally win that
        race: a real `pointerdown` ALWAYS physically precedes its own
        `focusin`, so clearing it here can never run too late for its own
        click, only ever too early relative to the (separately handled)
        `lastPointerModality` bookkeeping `useFocusOrigin()`'s own
        `pointerdown` listener still owns.
      */}
      {/*
        No quote characters ANYWHERE in this script (see the big comment
        above): `e.pointerType` (the browser's own "mouse"/"touch"/"pen"
        string) is stored AS-IS, with no comparison against a quoted
        literal — `recent-keydown.ts`'s `getRecentPointerModality()` does
        the "touch" vs "anything else" mapping on the READING side
        instead, in ordinary TypeScript where quotes are safe.
      */}
      <script>
        {`document.onkeydown=function(){window.__qwikCdkRecentKeydown__=true};` +
          `document.onpointerdown=function(e){window.__qwikCdkRecentKeydown__=false;` +
          `window.__qwikCdkRecentPointerModality__=e.pointerType}`}
      </script>
      <Slot />
      <OverlayContainerOutlet />
    </>
  );
});
