import {createContextId, noSerialize, useContext, type Component} from '@qwik.dev/core';
import type {OverlayConfig} from './overlay-config';
import {createOverlayRef, type OverlayRef} from './overlay-ref';
import type {OverlayRegistry, OverlayEntry, OverlayEntryState} from './overlay-registry';
import {
  createOverlayPositionBuilder,
  type OverlayPositionBuilder,
} from './position/overlay-position-builder';
import type {IdGenerator} from '../a11y/id-generator';

export interface Overlay {
  create<P>(component: Component<P>, props: P, config?: OverlayConfig): OverlayRef;
  position(): OverlayPositionBuilder;
}

export const OVERLAY = createContextId<Overlay>('qwik-cdk/overlay');

export function useOverlay(): Overlay {
  return useContext(OVERLAY);
}

export function createOverlayService(registry: OverlayRegistry, idGen: IdGenerator): Overlay {
  const positionBuilder = createOverlayPositionBuilder();
  return {
    create(component, props, config = {} as OverlayConfig) {
      const id = idGen.getId('cdk-overlay-');
      // Mirrors `createOverlayRef`'s feature-detection + default in upstream
      // src/cdk/overlay/overlay.ts: popovers are used whenever the browser
      // supports the Popover API, unless the overlay opts out explicitly.
      const popoverSupported = typeof document !== 'undefined' && 'showPopover' in document.body;
      const usePopover = popoverSupported ? (config.usePopover ?? true) : false;
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
      const ref = createOverlayRef({
        registry,
        entry,
        positionStrategy: config.positionStrategy,
        scrollStrategy: config.scrollStrategy,
      });
      // Backref the ref so OverlayHost's useVisibleTask$ can drive lifecycle
      // (attach/detach + position-strategy.apply()). Avoids using a QRL closure
      // over `ref`, which the qwik optimizer extracts as a free identifier when
      // the closure lives outside a component$ — see ./overlay-host.tsx.
      entry.ref = noSerialize(ref);
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
