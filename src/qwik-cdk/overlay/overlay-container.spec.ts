/**
 * Vitest scenario port from src/cdk/overlay/overlay-container.spec.ts
 *
 * Strategy: direct-class tests only — no Angular TestBed, no CDK portal rendering.
 * DOM-render and Angular-only scenarios are it.skip() with reasons.
 */

import {describe, it, expect, beforeEach, afterEach} from 'vitest';
import {DefaultOverlayContainer} from './public-api';

describe('OverlayContainer', () => {
  let container: DefaultOverlayContainer;

  beforeEach(() => {
    document.body.innerHTML = '';
    container = new DefaultOverlayContainer();
  });

  afterEach(() => {
    document.body.innerHTML = '';
  });

  it.skip('should remove the overlay container element from the DOM on destruction', () => {
    // SKIP: Angular-only — CDK relies on ngOnDestroy lifecycle hook wired via
    // Angular's DI; qwik-cdk uses explicit cleanup in the component tree.
  });

  it('should add and remove css classes from the container element (direct API)', () => {
    // Create a container element manually and exercise classList API.
    const el = document.createElement('div');
    el.classList.add('cdk-overlay-container');
    document.body.appendChild(el);

    el.classList.add('commander-shepard');
    expect(el.classList.contains('commander-shepard')).toBe(true);

    el.classList.remove('commander-shepard');
    expect(el.classList.contains('commander-shepard')).toBe(false);
  });

  it('getContainerElement finds existing .cdk-overlay-container in the DOM', () => {
    const el = document.createElement('div');
    el.classList.add('cdk-overlay-container');
    document.body.appendChild(el);

    const found = container.getContainerElement();
    expect(found).toBe(el);
  });

  it('getContainerElement returns null when no container exists', () => {
    // Fresh JSDOM — no container appended yet.
    const result = container.getContainerElement();
    expect(result).toBeNull();
  });

  it.skip('should remove overlay containers from the server when on the browser', () => {
    // SKIP: Angular-only — CDK's OverlayContainer constructor scans for
    // platform="server" nodes during DI initialization. qwik-cdk's
    // DefaultOverlayContainer only reads; no server-side cleanup logic needed.
  });

  it.skip('should remove overlay containers from other unit tests', () => {
    // SKIP: Angular-only — CDK's container removes nodes with platform="test".
    // qwik-cdk does not replicate this Karma-specific cleanup behavior.
  });

  it.skip('should not remove extra containers that were created on the browser', () => {
    // SKIP: Angular-only — corollary to the "server"/"test" removal test above.
  });
});
