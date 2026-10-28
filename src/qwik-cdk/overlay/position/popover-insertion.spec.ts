/**
 * Unit tests for popover-insertion.ts. Pure DOM-API-level assertions (no
 * Qwik component rendering needed — see overlay-container-outlet.spec.tsx
 * for why that's currently infra-blocked in this vitest setup).
 *
 * Mirrors the scenarios upstream `overlay-ref.spec.ts` covers for
 * `_attachHost()`'s insertion-point branch, adapted to this port's
 * split-into-two-pure-functions shape (`resolvePopoverInsertionPoint` +
 * `applyPopoverInsertionPoint`).
 */
import {describe, expect, it} from 'vitest';
import {applyPopoverInsertionPoint, resolvePopoverInsertionPoint} from './popover-insertion';
import type {PositionStrategy} from './position-strategy';

function makeStrategy(
  getPopoverInsertionPoint: PositionStrategy['getPopoverInsertionPoint'],
): PositionStrategy {
  return {
    attach() {},
    apply() {},
    dispose() {},
    getPopoverInsertionPoint,
  };
}

describe('resolvePopoverInsertionPoint', () => {
  it('returns null when usePopover is false, regardless of the strategy', () => {
    const strategy = makeStrategy(() => document.createElement('div'));
    expect(resolvePopoverInsertionPoint(false, strategy)).toBeNull();
  });

  it('returns null when the strategy has no getPopoverInsertionPoint (e.g. GlobalPositionStrategy)', () => {
    const strategy: PositionStrategy = {attach() {}, apply() {}, dispose() {}};
    expect(resolvePopoverInsertionPoint(true, strategy)).toBeNull();
  });

  it('returns null when there is no position strategy at all', () => {
    expect(resolvePopoverInsertionPoint(true, undefined)).toBeNull();
  });

  it("returns null for the 'global' location (strategy resolves to null)", () => {
    const strategy = makeStrategy(() => null);
    expect(resolvePopoverInsertionPoint(true, strategy)).toBeNull();
  });

  it("returns the origin element for the 'inline' location", () => {
    const origin = document.createElement('button');
    const strategy = makeStrategy(() => origin);
    expect(resolvePopoverInsertionPoint(true, strategy)).toBe(origin);
  });

  it("returns the {type: 'parent', element} descriptor unchanged for a custom parent", () => {
    const parent = document.createElement('div');
    const strategy = makeStrategy(() => ({type: 'parent', element: parent}));
    const result = resolvePopoverInsertionPoint(true, strategy);
    expect(result).toEqual({type: 'parent', element: parent});
  });
});

describe('applyPopoverInsertionPoint', () => {
  it('is a no-op when insertionPoint is null (global case)', () => {
    const originalParent = document.createElement('div');
    const host = document.createElement('div');
    originalParent.appendChild(host);

    applyPopoverInsertionPoint(host, null);

    expect(host.parentElement).toBe(originalParent);
  });

  it('is a no-op when insertionPoint is undefined', () => {
    const originalParent = document.createElement('div');
    const host = document.createElement('div');
    originalParent.appendChild(host);

    applyPopoverInsertionPoint(host, undefined);

    expect(host.parentElement).toBe(originalParent);
  });

  it("moves host to be the next sibling of the origin element for the 'inline' case", () => {
    const container = document.createElement('div');
    const origin = document.createElement('button');
    const unrelatedParent = document.createElement('div');
    const host = document.createElement('div');
    container.appendChild(origin);
    unrelatedParent.appendChild(host);
    document.body.appendChild(container);
    document.body.appendChild(unrelatedParent);

    applyPopoverInsertionPoint(host, origin);

    expect(host.previousElementSibling).toBe(origin);
    expect(host.parentElement).toBe(container);

    container.remove();
    unrelatedParent.remove();
  });

  it("appends host as a child of the custom parent for the {type: 'parent'} case", () => {
    const customParent = document.createElement('div');
    const unrelatedParent = document.createElement('div');
    const host = document.createElement('div');
    unrelatedParent.appendChild(host);

    applyPopoverInsertionPoint(host, {type: 'parent', element: customParent});

    expect(host.parentElement).toBe(customParent);
  });

  it('places host after an already-existing sibling of the origin (After semantics, not prepend)', () => {
    const container = document.createElement('div');
    const origin = document.createElement('button');
    const existingSibling = document.createElement('span');
    const host = document.createElement('div');
    container.append(origin, existingSibling);

    applyPopoverInsertionPoint(host, origin);

    expect(Array.from(container.children)).toEqual([origin, host, existingSibling]);
  });

  it('re-parents an already-mounted host (simulates OverlayHost moving it post-render)', () => {
    const cdkOverlayContainer = document.createElement('div');
    cdkOverlayContainer.className = 'cdk-overlay-container';
    const host = document.createElement('div');
    host.className = 'cdk-overlay-popover';
    cdkOverlayContainer.appendChild(host);
    document.body.appendChild(cdkOverlayContainer);

    const trigger = document.createElement('button');
    document.body.appendChild(trigger);

    applyPopoverInsertionPoint(host, trigger);

    expect(host.parentElement).toBe(document.body);
    expect(host.previousElementSibling).toBe(trigger);
    expect(cdkOverlayContainer.contains(host)).toBe(false);

    cdkOverlayContainer.remove();
    trigger.remove();
    host.remove();
  });
});
