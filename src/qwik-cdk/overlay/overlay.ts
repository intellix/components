import {createContextId, noSerialize, useContext, type Component} from '@builder.io/qwik';
import type {OverlayConfig} from './overlay-config';
import {OverlayRef} from './overlay-ref';
import type {OverlayRegistry, OverlayEntry, OverlayEntryState} from './overlay-registry';
import {OverlayPositionBuilder} from './position/overlay-position-builder';
import {_IdGenerator} from '../a11y/id-generator';

export interface Overlay {
  create<P>(component: Component<P>, props: P, config?: OverlayConfig): OverlayRef;
  position(): OverlayPositionBuilder;
}

export const OVERLAY = createContextId<Overlay>('qwik-cdk/overlay');

export function useOverlay(): Overlay {
  return useContext(OVERLAY);
}

export function createOverlayService(registry: OverlayRegistry, idGen: _IdGenerator): Overlay {
  const positionBuilder = new OverlayPositionBuilder();
  return {
    create(component, props, config = {} as OverlayConfig) {
      const id = idGen.getId('cdk-overlay-');
      const state = {
        panelClasses: signalOf<readonly string[]>(toArr(config.panelClass)),
        backdropShowing: signalOf(false),
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
        config,
        state: state as unknown as OverlayEntryState,
      };
      const ref = new OverlayRef(registry, entry, config.positionStrategy, config.scrollStrategy);
      // Backref the ref so OverlayHost's useVisibleTask$ can drive lifecycle
      // (attach/detach + position-strategy.apply()). Avoids using a QRL closure
      // over `ref`, which the qwik optimizer extracts as a free identifier when
      // the closure lives outside a component$ — see ./overlay-host.tsx.
      entry.ref = noSerialize(ref);
      registry.push(entry);
      // Trigger backdrop-show after attach via microtask (matches CDK animation timing)
      queueMicrotask(() => {
        entry.state.backdropShowing.value = !!config.hasBackdrop;
      });
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
