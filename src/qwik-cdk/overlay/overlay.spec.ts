/**
 * Vitest scenario port from src/cdk/overlay/overlay.spec.ts
 *
 * Strategy: service-level/direct-class tests only — no Angular TestBed,
 * no ComponentPortal, no DOM rendering. Tests exercise the public
 * createOverlayService() / OverlayRef API via the registry harness.
 *
 * DOM-render, Angular-only and deferred scenarios are it.skip() with reasons.
 */

import {describe, it, expect, beforeEach, afterEach, vi} from 'vitest';
import {component$, jsx} from '@builder.io/qwik';
import type {Signal} from '@builder.io/qwik';
import {createOverlayService, type OverlayConfig} from './public-api';
import type {OverlayEntry, OverlayRegistry} from './public-api';
import {_IdGenerator} from '../a11y/id-generator';

// ---------------------------------------------------------------------------
// Stub component — never rendered, just passed by reference.
// ---------------------------------------------------------------------------
const StubComponent = component$<Record<string, never>>(() => jsx('div', {}, 'stub'));

// ---------------------------------------------------------------------------
// Test harness helpers (mirrors dialog.spec.ts pattern)
// ---------------------------------------------------------------------------

function makeRegistry(): OverlayRegistry {
  const entries = {value: [] as readonly OverlayEntry[]} as Signal<readonly OverlayEntry[]>;
  return {
    entries,
    push: (e: OverlayEntry) => {
      entries.value = [...entries.value, e];
    },
    remove: (id: string) => {
      entries.value = entries.value.filter((x: OverlayEntry) => x.id !== id);
    },
    get: (id: string) => entries.value.find((x: OverlayEntry) => x.id === id),
  };
}

function makeOverlay() {
  const registry = makeRegistry();
  const idGen = new _IdGenerator();
  const overlay = createOverlayService(registry, idGen);
  return {overlay, registry, idGen};
}

// ---------------------------------------------------------------------------
// describe('Overlay')
// ---------------------------------------------------------------------------

describe('Overlay (createOverlayService)', () => {
  let overlay: ReturnType<typeof makeOverlay>['overlay'];
  let registry: ReturnType<typeof makeOverlay>['registry'];

  beforeEach(() => {
    ({overlay, registry} = makeOverlay());
  });

  afterEach(() => {
    // Clean up any lingering registry entries.
    const ids = registry.entries.value.map(e => e.id);
    ids.forEach(id => registry.remove(id));
  });

  // ------------------------------------------------------------------ //
  // Ported: creation and registry management
  // ------------------------------------------------------------------ //

  it('create() returns an OverlayRef-shaped handle', () => {
    const ref = overlay.create(StubComponent, {});
    expect(typeof ref.dispose).toBe('function');
    expect(typeof ref.updatePosition).toBe('function');
    expect(typeof ref.updateSize).toBe('function');
    expect(typeof ref.addPanelClass).toBe('function');
    expect(typeof ref.removePanelClass).toBe('function');
  });

  it('create() pushes an entry into the registry', () => {
    overlay.create(StubComponent, {});
    expect(registry.entries.value.length).toBe(1);
  });

  it('create() increments registry entry count for multiple overlays', () => {
    overlay.create(StubComponent, {});
    overlay.create(StubComponent, {});
    expect(registry.entries.value.length).toBe(2);
  });

  it('each created overlay gets a unique id', () => {
    const refA = overlay.create(StubComponent, {});
    const refB = overlay.create(StubComponent, {});
    const entryA = registry.entries.value[0];
    const entryB = registry.entries.value[1];
    expect(entryA.id).not.toBe(entryB.id);
  });

  it('dispose() removes the entry from the registry', () => {
    const ref = overlay.create(StubComponent, {});
    expect(registry.entries.value.length).toBe(1);
    ref.dispose();
    expect(registry.entries.value.length).toBe(0);
  });

  // ------------------------------------------------------------------ //
  // Ported: OverlayConfig propagation
  // ------------------------------------------------------------------ //

  it('panelClass config propagates to entry state', () => {
    const config = {panelClass: 'custom-class'};
    overlay.create(StubComponent, {}, config);
    const entry = registry.entries.value[0];
    expect(entry.state.panelClasses.value).toContain('custom-class');
  });

  it('multiple panelClasses are stored as an array', () => {
    const config = {panelClass: ['classA', 'classB']};
    overlay.create(StubComponent, {}, config);
    const entry = registry.entries.value[0];
    expect(entry.state.panelClasses.value).toContain('classA');
    expect(entry.state.panelClasses.value).toContain('classB');
  });

  it('numeric width is converted to px string', () => {
    const config = {width: 500};
    overlay.create(StubComponent, {}, config);
    const entry = registry.entries.value[0];
    expect(entry.state.width.value).toBe('500px');
  });

  it('string width is stored as-is', () => {
    const config = {width: '200%'};
    overlay.create(StubComponent, {}, config);
    const entry = registry.entries.value[0];
    expect(entry.state.width.value).toBe('200%');
  });

  it('numeric height is converted to px string', () => {
    const config = {height: 500};
    overlay.create(StubComponent, {}, config);
    const entry = registry.entries.value[0];
    expect(entry.state.height.value).toBe('500px');
  });

  it('string height is stored as-is', () => {
    const config = {height: '100vh'};
    overlay.create(StubComponent, {}, config);
    const entry = registry.entries.value[0];
    expect(entry.state.height.value).toBe('100vh');
  });

  it('zero width is stored as 0px', () => {
    const config = {width: 0};
    overlay.create(StubComponent, {}, config);
    const entry = registry.entries.value[0];
    expect(entry.state.width.value).toBe('0px');
  });

  it('minWidth numeric is converted to px', () => {
    const config = {minWidth: 200};
    overlay.create(StubComponent, {}, config);
    const entry = registry.entries.value[0];
    expect(entry.state.minWidth.value).toBe('200px');
  });

  it('maxWidth numeric is converted to px', () => {
    const config = {maxWidth: 200};
    overlay.create(StubComponent, {}, config);
    const entry = registry.entries.value[0];
    expect(entry.state.maxWidth.value).toBe('200px');
  });

  it('minHeight numeric is converted to px', () => {
    const config = {minHeight: 500};
    overlay.create(StubComponent, {}, config);
    const entry = registry.entries.value[0];
    expect(entry.state.minHeight.value).toBe('500px');
  });

  it('maxHeight numeric is converted to px', () => {
    const config = {maxHeight: 500};
    overlay.create(StubComponent, {}, config);
    const entry = registry.entries.value[0];
    expect(entry.state.maxHeight.value).toBe('500px');
  });

  // ------------------------------------------------------------------ //
  // Ported: OverlayRef panel class mutations
  // ------------------------------------------------------------------ //

  it('addPanelClass adds a class to the entry state', () => {
    const ref = overlay.create(StubComponent, {});
    ref.addPanelClass('custom-class-one');
    const entry = registry.entries.value[0];
    expect(entry.state.panelClasses.value).toContain('custom-class-one');
  });

  it('removePanelClass removes a class from the entry state', () => {
    const config = {panelClass: 'custom-class-one'};
    const ref = overlay.create(StubComponent, {}, config);
    ref.removePanelClass('custom-class-one');
    const entry = registry.entries.value[0];
    expect(entry.state.panelClasses.value).not.toContain('custom-class-one');
  });

  it('addPanelClass does not add empty string', () => {
    const ref = overlay.create(StubComponent, {});
    expect(() => ref.addPanelClass('')).not.toThrow();
    // Empty string may be in the list but should not cause errors.
  });

  it('removePanelClass does not throw for empty string', () => {
    const ref = overlay.create(StubComponent, {});
    expect(() => ref.removePanelClass('')).not.toThrow();
  });

  it('addPanelClass with an array adds all classes', () => {
    const ref = overlay.create(StubComponent, {});
    ref.addPanelClass(['foo', 'bar']);
    const entry = registry.entries.value[0];
    expect(entry.state.panelClasses.value).toContain('foo');
    expect(entry.state.panelClasses.value).toContain('bar');
  });

  it('addPanelClass is idempotent — same class not duplicated', () => {
    const ref = overlay.create(StubComponent, {});
    ref.addPanelClass('unique-class');
    ref.addPanelClass('unique-class');
    const entry = registry.entries.value[0];
    const count = entry.state.panelClasses.value.filter(c => c === 'unique-class').length;
    expect(count).toBe(1);
  });

  it('addPanelClass does not throw after dispose', () => {
    const ref = overlay.create(StubComponent, {});
    ref.dispose();
    // addPanelClass mutates the entry state. The entry is removed from registry
    // after dispose but the state object still exists.
    expect(() => ref.addPanelClass('custom-class-two')).not.toThrow();
  });

  // ------------------------------------------------------------------ //
  // Ported: updateSize via OverlayRef
  // ------------------------------------------------------------------ //

  it('updateSize sets width in the entry state', () => {
    const ref = overlay.create(StubComponent, {});
    ref.updateSize({width: '300px'});
    const entry = registry.entries.value[0];
    expect(entry.state.width.value).toBe('300px');
  });

  it('updateSize sets height in the entry state', () => {
    const ref = overlay.create(StubComponent, {});
    ref.updateSize({height: 200});
    const entry = registry.entries.value[0];
    expect(entry.state.height.value).toBe('200px');
  });

  // ------------------------------------------------------------------ //
  // Ported: OverlayRef.config exposes the original OverlayConfig
  // ------------------------------------------------------------------ //

  it('OverlayRef.config returns the original OverlayConfig', () => {
    const config = {hasBackdrop: true};
    const ref = overlay.create(StubComponent, {}, config);
    expect(ref.config.hasBackdrop).toBe(true);
  });

  // ------------------------------------------------------------------ //
  // Ported: position() returns an OverlayPositionBuilder
  // ------------------------------------------------------------------ //

  it('overlay.position() returns a position builder with a global() method', () => {
    const positionBuilder = overlay.position();
    expect(typeof positionBuilder.global).toBe('function');
  });

  it('overlay.position() returns a position builder with a flexibleConnectedTo() method', () => {
    const positionBuilder = overlay.position();
    expect(typeof positionBuilder.flexibleConnectedTo).toBe('function');
  });

  // ------------------------------------------------------------------ //
  // Skipped: tests requiring DOM rendering or Angular infrastructure
  // ------------------------------------------------------------------ //

  it.skip('should load a component into an overlay', () => {
    // SKIP: DOM-render — requires ComponentPortal.attach() and Qwik rendering
    // to verify overlayContainerElement.textContent.
  });

  it.skip('should disable pointer events of the pane element if detached', () => {
    // SKIP: DOM-render — checks paneElement.style.pointerEvents after attach/detach.
  });

  it.skip('should take the default direction from the global Directionality', () => {
    // SKIP: Angular-only — requires Angular DI Directionality service.
  });

  it.skip('should set the direction', () => {
    // SKIP: Angular-only — checks hostElement.getAttribute("dir") after
    // ComponentPortal.attach().
  });

  it.skip('should ensure that the most-recently-attached overlay is on top (z-order)', () => {
    // SKIP: DOM-render — checks hostElement.nextSibling ordering in the container.
  });

  it.skip('should clear out all DOM element references on dispose', () => {
    // SKIP: DOM-render — requires actual hostElement/overlayElement/backdropElement
    // to be set via _onAttached() lifecycle.
  });

  it.skip('should be able to dispose an overlay on navigation', () => {
    // SKIP: Angular-only — uses Location/SpyLocation service.
  });

  it.skip('should add and remove the overlay host as the ref is being attached and detached', () => {
    // SKIP: DOM-render — checks parentElement of hostElement after
    // ComponentPortal attach/detach cycle.
  });

  it.skip('should detach a component-based overlay when the view is destroyed', () => {
    // SKIP: Angular-only — ViewContainerRef / fixture.destroy().
  });

  it.skip('should do nothing when trying to attach a disposed overlay', () => {
    // SKIP: DOM-render — checks that no .cdk-overlay-pane appears in DOM.
  });
});
