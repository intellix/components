/**
 * New (no direct CDK equivalent — CDK wires `disposeOnNavigation` per
 * `OverlayRef` via an injected `Location` service; qwik-cdk has no router
 * dependency, so this is a shared `popstate`/`hashchange` broadcast
 * dispatcher instead — see the module's own doc comment).
 *
 * Strategy: direct-class tests, real DOM event dispatch (`window`, not
 * `document` — matches the dispatcher's own listener target).
 */
import {describe, it, expect, beforeEach, afterEach} from 'vitest';
import {createOverlayNavigationDispatcher, type OverlayNavigationDispatcher} from '../public-api';

function makeRef(): any {
  return {};
}

describe('OverlayNavigationDispatcher', () => {
  let dispatcher: OverlayNavigationDispatcher;

  beforeEach(() => {
    dispatcher = createOverlayNavigationDispatcher();
  });

  afterEach(() => {
    dispatcher.dispose();
  });

  it('broadcasts popstate to every attached overlay, not just the topmost', () => {
    const eventsOne: number[] = [];
    const eventsTwo: number[] = [];
    const overlayOne = makeRef();
    const overlayTwo = makeRef();

    dispatcher.add(overlayOne, {onNavigate: () => eventsOne.push(1)});
    dispatcher.add(overlayTwo, {onNavigate: () => eventsTwo.push(1)});

    window.dispatchEvent(new PopStateEvent('popstate'));

    expect(eventsOne).toEqual([1]);
    expect(eventsTwo).toEqual([1]);
  });

  it('broadcasts hashchange to every attached overlay', () => {
    const events: number[] = [];
    const ref = makeRef();
    dispatcher.add(ref, {onNavigate: () => events.push(1)});

    window.dispatchEvent(new HashChangeEvent('hashchange'));

    expect(events).toEqual([1]);
  });

  it('a handler that removes its own overlay during onNavigate does not break the broadcast to others', () => {
    const eventsTwo: number[] = [];
    const overlayOne = makeRef();
    const overlayTwo = makeRef();

    dispatcher.add(overlayOne, {
      onNavigate: () => dispatcher.remove(overlayOne),
    });
    dispatcher.add(overlayTwo, {onNavigate: () => eventsTwo.push(1)});

    expect(() => window.dispatchEvent(new PopStateEvent('popstate'))).not.toThrow();
    expect(eventsTwo).toEqual([1]);
    expect(dispatcher._attachedOverlays).toEqual([overlayTwo]);
  });

  it('does not add the same overlay to the stack multiple times', () => {
    const ref = makeRef();
    dispatcher.add(ref, {onNavigate: () => {}});
    dispatcher.add(ref, {onNavigate: () => {}});
    expect(dispatcher._attachedOverlays.length).toBe(1);
  });

  it('remove() cleans up the overlay from _attachedOverlays', () => {
    const ref = makeRef();
    dispatcher.add(ref, {onNavigate: () => {}});
    expect(dispatcher._attachedOverlays.length).toBe(1);
    dispatcher.remove(ref);
    expect(dispatcher._attachedOverlays.length).toBe(0);
  });

  it('removed overlays no longer receive navigation events', () => {
    const events: number[] = [];
    const ref = makeRef();
    dispatcher.add(ref, {onNavigate: () => events.push(1)});
    dispatcher.remove(ref);

    window.dispatchEvent(new PopStateEvent('popstate'));

    expect(events).toEqual([]);
  });

  it('dispose() detaches the global listeners without error', () => {
    const ref = makeRef();
    dispatcher.add(ref, {onNavigate: () => {}});
    expect(() => dispatcher.dispose()).not.toThrow();
  });
});
