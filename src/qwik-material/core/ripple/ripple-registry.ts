import {RippleRenderer} from './ripple-renderer';

/**
 * Qwik-material-specific (no upstream file). Upstream's `RippleRenderer` is
 * a field owned by the `MatRipple` directive instance, which Angular keeps
 * alive for the whole lifetime of its host element — so "the renderer for
 * this container" is just "the one field on the directive instance
 * attached to it". Qwik has no equivalent long-lived instance object for a
 * `component$` (a resumed page has no JS objects at all until an event
 * actually runs some), so this cache plays the same role keyed by the
 * container DOM element itself instead: the first real pointer/touch event
 * on a given ripple container creates its `RippleRenderer` and every later
 * event on the same container (same DOM node identity) reuses it, which is
 * exactly the persistence the active-ripples bookkeeping
 * (`_activeRipples`/`_isPointerDown`/etc.) needs. A `WeakMap` means a
 * container removed from the DOM (e.g. a chip that gets deleted) is GC'd
 * for free, with nothing to explicitly dispose — there is no
 * `ngOnDestroy`/`_removeTriggerEvents()` equivalent needed because nothing
 * here holds a strong reference to a detached element, unlike upstream's
 * directive, which explicitly unbinds its event-manager registration.
 */
const registry = new WeakMap<Element, RippleRenderer>();

/** Returns the cached `RippleRenderer` for a container, creating it on first use. */
export function getRippleRenderer(container: Element): RippleRenderer {
  let renderer = registry.get(container);
  if (!renderer) {
    renderer = new RippleRenderer(container as HTMLElement);
    registry.set(container, renderer);
  }
  return renderer;
}
