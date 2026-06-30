/**
 * Vitest scenario port from
 * src/cdk/overlay/dispatchers/overlay-keyboard-dispatcher.spec.ts
 *
 * Strategy: direct-class tests — no Angular TestBed, real DOM event dispatch.
 * Tests exercise OverlayKeyboardDispatcher ordering, routing and
 * eventPredicate filtering.
 * Angular-only and change-detection scenarios are it.skip() with reasons.
 */

import {describe, it, expect, beforeEach, afterEach} from 'vitest';
import {createOverlayKeyboardDispatcher, type OverlayKeyboardDispatcher} from '../public-api';

/** Minimal OverlayRef stub. */
function makeRef(predicate?: (e: Event) => boolean): any {
  return {
    _keydownEvents: undefined as ((e: KeyboardEvent) => void) | undefined,
    eventPredicate: predicate,
    hostElement: null,
    overlayElement: null,
    hasAttached: () => true,
  };
}

describe('OverlayKeyboardDispatcher', () => {
  let dispatcher: OverlayKeyboardDispatcher;

  beforeEach(() => {
    dispatcher = createOverlayKeyboardDispatcher();
  });

  afterEach(() => {
    dispatcher.dispose();
  });

  // ------------------------------------------------------------------ //
  // Ported from CDK
  // ------------------------------------------------------------------ //

  it('routes keydown to topmost attached overlay', () => {
    const events: KeyboardEvent[] = [];
    const ref: any = {_keydownEvents: (e: KeyboardEvent) => events.push(e)};
    dispatcher.add(ref);
    document.dispatchEvent(new KeyboardEvent('keydown', {key: 'Escape', bubbles: true}));
    expect(events.length).toBe(1);
    dispatcher.remove(ref);
  });

  it('routes keydown to per-ref handler from add(ref, handlers)', () => {
    const events: KeyboardEvent[] = [];
    const ref: any = {};
    dispatcher.add(ref, {onKeydown: (e: KeyboardEvent) => events.push(e)});
    document.dispatchEvent(new KeyboardEvent('keydown', {key: 'Escape', bubbles: true}));
    expect(events.length).toBe(1);
    dispatcher.remove(ref);
  });

  it('should track keyboard overlays in order as they are attached and detached', () => {
    const overlayOne = makeRef();
    const overlayTwo = makeRef();

    dispatcher.add(overlayOne);
    dispatcher.add(overlayTwo);

    expect(dispatcher._attachedOverlays.length).toBe(2);
    expect(dispatcher._attachedOverlays[0]).toBe(overlayOne);
    expect(dispatcher._attachedOverlays[1]).toBe(overlayTwo);

    // Detach first and re-attach — it should become last.
    dispatcher.remove(overlayOne);
    dispatcher.add(overlayOne);

    expect(dispatcher._attachedOverlays[0]).toBe(overlayTwo);
    expect(dispatcher._attachedOverlays[1]).toBe(overlayOne);
  });

  it('should dispatch keydown to the most recently attached overlay', () => {
    const eventsOne: KeyboardEvent[] = [];
    const eventsTwo: KeyboardEvent[] = [];

    const overlayOne = makeRef();
    const overlayTwo = makeRef();

    overlayOne._keydownEvents = (e: KeyboardEvent) => eventsOne.push(e);
    overlayTwo._keydownEvents = (e: KeyboardEvent) => eventsTwo.push(e);

    dispatcher.add(overlayOne);
    dispatcher.add(overlayTwo);

    document.dispatchEvent(new KeyboardEvent('keydown', {key: 'Escape', bubbles: true}));

    expect(eventsOne.length).toBe(0);
    expect(eventsTwo.length).toBe(1);
  });

  it('should not add the same keyboard overlay to the stack multiple times', () => {
    const eventsOne: KeyboardEvent[] = [];
    const eventsTwo: KeyboardEvent[] = [];

    const overlayOne = makeRef();
    const overlayTwo = makeRef();

    overlayOne._keydownEvents = (e: KeyboardEvent) => eventsOne.push(e);
    overlayTwo._keydownEvents = (e: KeyboardEvent) => eventsTwo.push(e);

    dispatcher.add(overlayOne);
    dispatcher.add(overlayTwo);
    dispatcher.add(overlayOne); // Re-adding should move it to the end, not duplicate.

    document.dispatchEvent(new KeyboardEvent('keydown', {key: 'Escape', bubbles: true}));

    expect(dispatcher._attachedOverlays).toEqual([overlayTwo, overlayOne]);
    expect(eventsTwo.length).toBe(0);
    expect(eventsOne.length).toBe(1);
  });

  it('should skip overlays that do not have keydown event handlers', () => {
    const eventsOne: KeyboardEvent[] = [];
    const overlayOne = makeRef();
    const overlayTwo = makeRef(); // No handler.

    overlayOne._keydownEvents = (e: KeyboardEvent) => eventsOne.push(e);

    dispatcher.add(overlayOne);
    dispatcher.add(overlayTwo);

    document.dispatchEvent(new KeyboardEvent('keydown', {key: 'Escape', bubbles: true}));

    // overlayTwo has no handler so the dispatcher skips it and reaches overlayOne.
    expect(eventsOne.length).toBe(1);
  });

  it('should not dispatch to overlay whose eventPredicate does not allow the event', () => {
    const eventsOne: KeyboardEvent[] = [];
    const eventsTwo: KeyboardEvent[] = [];

    const overlayOne = makeRef();
    const overlayTwo = makeRef(() => false); // Always rejects.

    overlayOne._keydownEvents = (e: KeyboardEvent) => eventsOne.push(e);
    overlayTwo._keydownEvents = (e: KeyboardEvent) => eventsTwo.push(e);

    dispatcher.add(overlayOne);
    dispatcher.add(overlayTwo);

    document.dispatchEvent(new KeyboardEvent('keydown', {key: 'Escape', bubbles: true}));

    // overlayTwo's predicate returns false — event falls through to overlayOne.
    expect(eventsOne.length).toBe(1);
    expect(eventsTwo.length).toBe(0);
  });

  it('remove() cleans up the overlay from _attachedOverlays', () => {
    const ref = makeRef();
    dispatcher.add(ref);
    expect(dispatcher._attachedOverlays.length).toBe(1);
    dispatcher.remove(ref);
    expect(dispatcher._attachedOverlays.length).toBe(0);
  });

  it('dispose() detaches the global keydown listener without error', () => {
    const ref = makeRef();
    ref._keydownEvents = () => {};
    dispatcher.add(ref);
    expect(() => dispatcher.dispose()).not.toThrow();
  });

  it.skip('should not dispatch keyboard events when propagation is stopped', () => {
    // SKIP: DOM-render — requires dispatching to an element inside the overlay
    // that calls stopPropagation; happy-dom correctly stops propagation but the
    // test also relies on ComponentPortal.attach() to build the overlay DOM tree.
  });

  it.skip('should complete the keydown stream on dispose', () => {
    // SKIP: Angular-only — CDK uses RxJS Subject.complete() triggered from
    // OverlayRef.dispose(). qwik-cdk does not expose an RxJS keydownEvents stream.
  });

  it.skip('should stop emitting events to detached overlays', () => {
    // SKIP: Angular-only — requires ComponentPortal and OverlayRef.attach().
  });

  it.skip('should stop emitting events to disposed overlays', () => {
    // SKIP: Angular-only — requires ComponentPortal and OverlayRef.attach().
  });

  it.skip('should not run change detection if there are no keydownEvents observers', () => {
    // SKIP: Angular-only — ApplicationRef.tick() is Angular change detection.
  });

  it.skip('should dispose of the global keyboard event handler correctly (spy on addEventListener)', () => {
    // SKIP: Angular-only — CDK spies on document.body.addEventListener/removeEventListener.
    // qwik-cdk attaches to document (not body) — test structure differs.
  });
});
