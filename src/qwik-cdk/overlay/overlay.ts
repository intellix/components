import {
  $,
  createContextId,
  noSerialize,
  useContext,
  type Component,
  type NoSerialize,
  type QRL,
} from '@qwik.dev/core';
import type {OverlayConfig, OverlayDefaultConfig} from './overlay-config';
import {createOverlayRef, type OverlayRef} from './overlay-ref';
import type {OverlayRegistry, OverlayEntry, OverlayEntryState} from './overlay-registry';
import {
  createOverlayPositionBuilder,
  type OverlayPositionBuilder,
} from './position/overlay-position-builder';
import type {IdGenerator} from '../a11y/id-generator';
import {QWIK_CDK} from '../internals/internals';
import {
  isScrollStrategyInstance,
  resolveBuiltinScrollStrategyDescriptor,
} from './scroll/scroll-strategy-descriptor';

export interface Overlay {
  create<P>(component: Component<P>, props: P, config?: OverlayConfig): OverlayRef;
  position(): OverlayPositionBuilder;
}

/**
 * App-wide `OverlayDefaultConfig`. Provided by `<QwikCdkRoot
 * overlayDefaultConfig={…}>`; most consumers read this indirectly via
 * `QwikCdkInternals.overlayDefaultConfig` (the same object), but it's also
 * exposed as its own context for app code that wants it without pulling in
 * the whole `QwikCdkInternals` shape.
 */
export const OVERLAY_DEFAULT_CONFIG = createContextId<OverlayDefaultConfig>(
  'qwikCdk/overlayDefaultConfig',
);

/**
 * App-facing handle returned by `useOverlay()`. `create$` mirrors
 * `Overlay.create()`'s signature, QRL-wrapped — see `useOverlay()`'s doc
 * comment for why a plain, directly-callable `Overlay` can't be exposed
 * here. Build a position strategy via `createGlobalPositionStrategy()` /
 * `createFlexibleConnectedPositionStrategy(...)` and a scroll strategy via
 * `createBlockScrollStrategy()` / `createRepositionScrollStrategy()` /
 * `createCloseScrollStrategy()` / `createNoopScrollStrategy()` — already
 * plain, standalone exports (no hook needed) — and pass them on
 * `config.positionStrategy` / `config.scrollStrategy`.
 */
export interface OverlayHandle {
  create$: QRL<
    <P>(
      component: Component<P>,
      props: P,
      config?: OverlayConfig,
    ) => NoSerialize<OverlayRef> | null
  >;
}

/**
 * App-facing overlay hook, so apps can build their own overlays (global or
 * `flexibleConnectedTo(...)` position strategy, scroll strategies, a
 * backdrop + `backdropClass`, sizing, attaching a component with props) the
 * same way every qwik-material entry point (dialog, bottom sheet, select,
 * menu, autocomplete, tooltip, datepicker, …) already does internally.
 *
 * Deliberately NOT `useContext(OVERLAY)` returning a plain `Overlay`
 * object: `Overlay.create`/`position` are ordinary JS closures (over a
 * registry/id-generator), not `$()` QRLs — Qwik can serialize a QRL
 * reference and a store/signal, but not an arbitrary closure. A real app
 * almost always calls `useOverlay()` during render and then invokes the
 * result later, from an event handler's own `$()` scope; capturing a plain
 * `Overlay` instance that way either fails SSR serialization outright
 * (`Code(Q34)`) or — if force-marked `noSerialize()` — silently resolves to
 * `undefined` after the SSR→CSR resume (confirmed live both ways: this is
 * the same category of pitfall `keyboardDispatcher`/`dialogScrollStrategyFactory`
 * already work around by living on `QwikCdkInternals` as NoSerialize fields
 * instead of being captured directly).
 *
 * The fix, matching `useDialog()`'s already-proven shape exactly (see
 * `qwik-cdk/dialog/dialog.tsx`): return an object whose only method is
 * itself a QRL (`create$`). The QRL's OWN closure captures just `ctx` (the
 * `QwikCdkInternals` store — a provided context value, safely serializable)
 * and builds a fresh `Overlay` INSIDE its own body on every call, never
 * capturing one from outside. The `OverlayRef` it returns is `noSerialize()`
 * -wrapped before returning, same convention as `MatDialog.open$`/
 * `Dialog.open$`.
 */
export function useOverlay(): OverlayHandle {
  const ctx = useContext(QWIK_CDK);

  const create$ = $(
    <P,>(
      component: Component<P>,
      props: P,
      config?: OverlayConfig,
    ): NoSerialize<OverlayRef> | null => {
      const idGen: IdGenerator = {
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
      const ref = overlay.create(component, props, config);
      return noSerialize(ref);
    },
  );

  return {create$};
}

export function createOverlayService(
  registry: OverlayRegistry,
  idGen: IdGenerator,
  defaultConfig?: OverlayDefaultConfig,
): Overlay {
  const positionBuilder = createOverlayPositionBuilder();
  return {
    create(component, props, config = {} as OverlayConfig) {
      const id = idGen.getId('cdk-overlay-');
      // Mirrors `createOverlayRef`'s feature-detection + default in upstream
      // src/cdk/overlay/overlay.ts: popovers are used whenever the browser
      // supports the Popover API, unless the overlay opts out explicitly
      // (per-overlay `config.usePopover`, falling back to the app-wide
      // `OverlayDefaultConfig.usePopover` before the unconditional `true`).
      const popoverSupported = typeof document !== 'undefined' && 'showPopover' in document.body;
      const usePopover = popoverSupported
        ? config.usePopover ?? defaultConfig?.usePopover ?? true
        : false;
      const direction: 'ltr' | 'rtl' =
        (typeof config.direction === 'string' ? config.direction : config.direction?.value.value) ??
        'ltr';
      // Mirrors upstream `OverlayConfig`'s class-level default
      // (`backdropClass = 'cdk-overlay-dark-backdrop'`), which qwik-cdk's
      // plain-data config interface can't express as a field default.
      const backdropClass = config.backdropClass ?? 'cdk-overlay-dark-backdrop';
      const state = {
        panelClasses: signalOf<readonly string[]>(toArr(config.panelClass)),
        backdropShowing: signalOf(false),
        backdropDetached: signalOf(false),
        detached: signalOf(false),
        width: signalOf(
          typeof config.width === 'string'
            ? config.width
            : config.width != null
              ? `${config.width}px`
              : undefined,
        ),
        height: signalOf(
          typeof config.height === 'string'
            ? config.height
            : config.height != null
              ? `${config.height}px`
              : undefined,
        ),
        minWidth: signalOf(toCssPx(config.minWidth)),
        minHeight: signalOf(toCssPx(config.minHeight)),
        maxWidth: signalOf(toCssPx(config.maxWidth)),
        maxHeight: signalOf(toCssPx(config.maxHeight)),
      };
      const entry: OverlayEntry = {
        id,
        Component: component,
        props: props as Record<string, unknown>,
        config: {...config, backdropClass},
        state: state as unknown as OverlayEntryState,
        usePopover,
        direction,
      };
      // `config.scrollStrategy` may be a real instance (passed through
      // unchanged) or a `BuiltinScrollStrategyDescriptor` (plain,
      // serializable data — resolved synchronously here; `create()` stays
      // synchronous, so the `QRL` form of `ScrollStrategyDescriptor` isn't
      // accepted at this layer — see `OverlayConfig.scrollStrategy`'s doc
      // comment).
      const resolvedScrollStrategy =
        config.scrollStrategy === undefined
          ? undefined
          : isScrollStrategyInstance(config.scrollStrategy)
            ? config.scrollStrategy
            : resolveBuiltinScrollStrategyDescriptor(config.scrollStrategy);
      const ref = createOverlayRef({
        registry,
        entry,
        positionStrategy: config.positionStrategy,
        scrollStrategy: resolvedScrollStrategy,
      });
      // Backref the ref so OverlayHost's useVisibleTask$ can drive lifecycle
      // (attach/detach + position-strategy.apply()). Avoids using a QRL closure
      // over `ref`, which the qwik optimizer extracts as a free identifier when
      // the closure lives outside a component$ — see ./overlay-host.tsx.
      entry.ref = noSerialize(ref);
      // Entries only ever exist in the browser (created when something opens, never
      // server-rendered), yet they hold live objects — position/scroll strategies, the ref, the
      // attached component's props. `OverlayHost`'s `$()` handlers capture the entry, and Qwik's
      // dev mode verifies every captured value is serializable (Code(Q3)) — marking the whole
      // entry `noSerialize` (in place: it joins a WeakSet) exempts it, matching what it is.
      noSerialize(entry);
      registry.push(entry);
      // Backdrop fade-in is triggered from `OverlayRef._onAttached()` (once a
      // real `OverlayHost` has mounted and registered its visual callbacks),
      // not here — see overlay-ref.ts.
      return ref;
    },
    position() {
      return positionBuilder;
    },
  };
}

function signalOf<T>(v: T): {value: T} {
  return {value: v};
}
function toArr<T>(v: T | T[] | undefined): T[] {
  return v == null ? [] : Array.isArray(v) ? v : [v];
}
function toCssPx(v: string | number | undefined): string | undefined {
  if (typeof v === 'string') return v;
  if (v != null) return `${v}px`;
  return undefined;
}
