/**
 * mat-bottom-sheet-scenarios.spec.ts
 *
 * Scenario port from src/material/bottom-sheet/bottom-sheet.spec.ts (59 it()
 * blocks across the top-level `describe('MatBottomSheet')` plus 5 nested
 * describes and 2 sibling top-level describes).
 *
 * Bucketing rules (same as mat-dialog-scenarios.spec.ts):
 *  1. Angular-only — uses TestBed, inject(), ViewContainerRef, TemplateRef,
 *     Injector.create/createNgModule, SpyLocation, Bindings (new Angular
 *     signal-input API with no Qwik analogue), hierarchical DI
 *     (`_parentBottomSheet`).
 *  2. DOM-render — queries DOM nodes, checks focus/activeElement, checks
 *     ARIA/class on rendered nodes, dispatches keyboard/mouse events,
 *     observes CSS animation in the browser. These are exercised instead by
 *     `specs/material-bottom-sheet/angular-parity.spec.ts` (Playwright).
 *  3. Ported — drives createMatBottomSheetService with a stub CDK; asserts
 *     on ref id/config/instance/afterOpened/afterDismissed, and the
 *     replace-sheet singleton flow. Overlaps a little with
 *     mat-bottom-sheet.spec.ts's own, more focused unit tests — kept
 *     separate so this file's bucket-per-upstream-test shape stays legible
 *     against the original.
 *
 * Run:  pnpm -C src/qwik-material test bottom-sheet/mat-bottom-sheet-scenarios
 */

import {describe, it, expect, vi} from 'vitest';
import {component$, jsx} from '@qwik.dev/core';
import {createMatBottomSheetService, type MatBottomSheetService} from './mat-bottom-sheet';
import type {MatBottomSheetRef} from './mat-bottom-sheet-ref';
import {MARK_CLOSED, MARK_OPENED, REGISTER_ANIMATION_HANDLERS} from './mat-bottom-sheet-ref';

// ---------------------------------------------------------------------------
// Shared test harness (matches mat-bottom-sheet.spec.ts)
// ---------------------------------------------------------------------------

const PizzaMsg = component$<{flavor?: string}>(() => jsx('p', {}, 'Pizza'));
const TacoMsg = component$(() => jsx('p', {}, 'Taco'));

function makeStubCdk() {
  const disposed: string[] = [];
  const detached: string[] = [];
  let idSeq = 0;
  return {
    disposed,
    detached,
    open<C, D, R>(_c: any, _props: any, _cfg: any) {
      const id = `stub-cdk-${idSeq++}`;
      return {
        id,
        dispose() {
          disposed.push(id);
        },
        detachBackdrop() {
          detached.push(id);
        },
      };
    },
  };
}

function makeService(defaults: Partial<any> = {}): {
  service: MatBottomSheetService;
  registry: {openedRef: any};
  cdk: ReturnType<typeof makeStubCdk>;
} {
  const registry: {openedRef: any} = {openedRef: null};
  const cdk = makeStubCdk();
  const service = createMatBottomSheetService({cdk, defaults, registry});
  return {service, registry, cdk};
}

/** Simulates the container: wires enter()/exit() straight to MARK_OPENED/MARK_CLOSED. */
function wireInstantAnimation(ref: MatBottomSheetRef) {
  ref[REGISTER_ANIMATION_HANDLERS]({
    enter: () => ref[MARK_OPENED](),
    exit: () => ref[MARK_CLOSED](),
  });
}

// ---------------------------------------------------------------------------
// describe('MatBottomSheet') — mirroring the top-level block in bottom-sheet.spec.ts
// ---------------------------------------------------------------------------

describe('MatBottomSheet scenarios', () => {
  it('should open a bottom sheet with a component — returns non-null ref', () => {
    const {service} = makeService();
    const ref = service.open(PizzaMsg);
    expect(ref).not.toBeNull();
  });

  it.skip('should open a bottom sheet with a component (DOM-render — deferred to Playwright)', () => {
    // Upstream asserts `overlayContainerElement.textContent` + `instance instanceof PizzaMsg`.
  });

  it.skip('should open a bottom sheet with a template (Angular-only: TemplateRef)', () => {});

  it.skip('should position the bottom sheet at the bottom center of the screen (DOM-render — deferred to Playwright)', () => {
    // Covered structurally by the parity spec's shared skeleton assertion
    // (`justify-content: center; align-items: flex-end` on the overlay
    // wrapper, from GlobalPositionStrategy.centerHorizontally().bottom('0')).
  });

  it.skip('should emit when the bottom sheet opening animation is complete (DOM-render — deferred to Playwright)', () => {
    // afterOpened resolving on MARK_OPENED is covered directly in mat-bottom-sheet-ref.spec.ts.
  });

  it.skip('should use the correct injector (Angular-only: Injector)', () => {});

  it.skip('should open a bottom sheet with a component and no ViewContainerRef (DOM-render — deferred to Playwright)', () => {});

  it.skip('should apply the correct role to the container element (DOM-render — deferred to Playwright)', () => {
    // Covered by the parity spec: every scenario's container carries role="dialog" aria-modal="false".
  });

  it.skip('should be able to set aria-modal (DOM-render — deferred to Playwright)', () => {});

  it.skip('should close a bottom sheet via the escape key (DOM-render — deferred to Playwright)', () => {
    // Covered by specs/material-bottom-sheet/angular-parity.spec.ts's close-on-escape test.
  });

  it.skip('should not close a bottom sheet via the escape key with a modifier (DOM-render — deferred to Playwright)', () => {});

  it.skip('should close when clicking on the overlay backdrop (DOM-render — deferred to Playwright)', () => {
    // Covered by the parity spec's close-on-backdrop test.
  });

  it.skip('should dispose of bottom sheet if view container is destroyed while animating (Angular-only: ViewContainerRef destroy)', () => {});

  it.skip('should emit the backdropClick stream when clicking on the overlay backdrop (Angular-only: Observable + DOM-render)', () => {
    // backdropClick() Observable replaced by MatBottomSheetConfig.onBackdropClick$ — no Qwik analogue to re-test here without DOM.
  });

  it.skip('should emit the keyboardEvent stream when key events target the overlay (Angular-only: Observable + DOM-render)', () => {});

  it.skip('should allow setting the layout direction (DOM-render — deferred to Playwright)', () => {});

  it.skip('should inject the correct direction in the instantiated component (Angular-only: inject/Directionality)', () => {});

  it.skip('should fall back to injecting the global direction if none is passed by the config (Angular-only: inject/Directionality)', () => {});

  it.skip('should be able to set a custom panel class (DOM-render — deferred to Playwright)', () => {
    // Covered by the parity spec's panel-class test.
  });

  it.skip('should be able to set a custom aria-label (DOM-render — deferred to Playwright)', () => {
    // Covered by the parity spec's aria-label test.
  });

  it('should be able to get dismissed through the service', async () => {
    const {service} = makeService();
    const ref = service.open(PizzaMsg)!;
    wireInstantAnimation(ref);
    service.dismiss();
    await expect(ref.afterDismissed).resolves.toBeUndefined();
  });

  it.skip('should dismiss the bottom sheet when the service is destroyed (Angular-only: ngOnDestroy — no Qwik service-destroy lifecycle)', () => {});

  it('should open a new bottom sheet after dismissing a previous sheet', async () => {
    const {service, registry} = makeService();
    const first = service.open(PizzaMsg)!;
    wireInstantAnimation(first);
    first.dismiss();
    await first.afterDismissed;
    // The registry is cleared once the first sheet is FULLY dismissed — the
    // second open() below therefore takes the "no sheet in view" branch
    // (immediate `[TRIGGER_ENTER]()`, not the deferred replace flow the
    // "opening a second sheet dismisses the first" test below exercises).
    expect(registry.openedRef).toBeNull();

    const second = service.open(TacoMsg)!;
    wireInstantAnimation(second);
    expect(registry.openedRef).toBe(second);
  });

  it('should remove past bottom sheets when opening new ones', () => {
    const {service, registry} = makeService();
    const first = service.open(PizzaMsg)!;
    wireInstantAnimation(first);
    const second = service.open(TacoMsg)!;
    wireInstantAnimation(second);
    expect(registry.openedRef).toBe(second);
  });

  it('should not throw when opening multiple bottom sheets in quick succession', () => {
    const {service} = makeService();
    expect(() => {
      for (let i = 0; i < 3; i++) {
        const ref = service.open(PizzaMsg)!;
        wireInstantAnimation(ref);
      }
    }).not.toThrow();
  });

  it('should remove bottom sheet if another is shown while it is still animating open', () => {
    const {service, registry} = makeService();
    const first = service.open(PizzaMsg)!;
    // No animation handlers registered — `first` never finishes entering.
    const second = service.open(TacoMsg)!;
    wireInstantAnimation(second);
    // The second sheet becomes the tracked one immediately — the first's own
    // (stalled) enter is irrelevant once it has been told to exit.
    expect(registry.openedRef).toBe(second);
  });

  it('should emit after being dismissed', async () => {
    const {service} = makeService();
    const ref = service.open(PizzaMsg)!;
    wireInstantAnimation(ref);
    const spy = vi.fn();
    ref.afterDismissed.then(spy);
    service.dismiss();
    await ref.afterDismissed;
    expect(spy).toHaveBeenCalledTimes(1);
  });

  it('should be able to pass a result back to the dismissed stream', async () => {
    const {service} = makeService();
    const ref = service.open<any, unknown, number>(PizzaMsg)!;
    wireInstantAnimation(ref);
    ref.dismiss(1337);
    await expect(ref.afterDismissed).resolves.toBe(1337);
  });

  it('should be able to pass data when dismissing through the service', async () => {
    const {service} = makeService();
    const ref = service.open<any, unknown, number>(PizzaMsg)!;
    wireInstantAnimation(ref);
    service.dismiss(1337);
    await expect(ref.afterDismissed).resolves.toBe(1337);
  });

  it.skip('should close the bottom sheet when going forwards/backwards in history (Angular-only: Location/Router — not wired in this port)', () => {});

  it.skip('should close the bottom sheet when the location hash changes (Angular-only: Location)', () => {});

  it.skip('should allow the consumer to disable closing a bottom sheet on navigation (Angular-only: Location)', () => {});

  it.skip('should be able to attach a custom scroll strategy (covered by qwik-cdk/overlay’s own scroll-strategy specs — enable()/disable() wiring is OverlayRef’s responsibility, not MatBottomSheet’s)', () => {});

  it.skip('should contain the height style properties on overlay pane (DOM-render — deferred to Playwright)', () => {});

  describe('passing in data', () => {
    it('should be able to pass in data', () => {
      const {service} = makeService();
      const ref = service.open<any, {stringParam: string}>(PizzaMsg, {
        data: {stringParam: 'hello'},
      })!;
      expect(ref.config.data?.stringParam).toBe('hello');
    });

    it('should default to null if no data is passed', () => {
      const {service} = makeService();
      const ref = service.open(PizzaMsg)!;
      expect(ref.config.data ?? null).toBeNull();
    });

    it.skip('should be able to apply bindings (Angular-only: inputBinding() — not portable; use Qwik component props instead)', () => {});
  });

  describe('disableClose option', () => {
    it.skip('should prevent closing via clicks on the backdrop (DOM-render — deferred to Playwright)', () => {
      // Covered by the parity spec's disable-close test.
    });

    it.skip('should prevent closing via the escape key (DOM-render — deferred to Playwright)', () => {});

    it.skip('should allow for the disableClose option to be updated while open (DOM-render — also a known deviation: this port reads config.disableClose once at open() time inside the keyboard/outside-click dispatcher closures, not from a live ref.disableClose field — see SYNC.md)', () => {});

    it('disableClose defaults to config.disableClose on the ref', () => {
      const {service} = makeService();
      const ref = service.open(PizzaMsg, {disableClose: true})!;
      expect(ref.disableClose).toBe(true);
    });
  });

  describe('hasBackdrop option', () => {
    it.skip('should have a backdrop (DOM-render — deferred to Playwright)', () => {});
    it.skip('should not have a backdrop (DOM-render — deferred to Playwright)', () => {
      // Covered by the parity spec's no-backdrop test.
    });
  });

  describe('backdropClass option', () => {
    it.skip('should have default backdrop class (DOM-render — deferred to Playwright)', () => {});
    it.skip('should have custom backdrop class (DOM-render — deferred to Playwright)', () => {
      // Covered by the parity spec's panel-class test (backdropClass: 'my-backdrop-class').
    });
  });

  describe('focus management', () => {
    it.skip('should focus the first tabbable element by default (DOM-render — deferred to Playwright)', () => {});
    it.skip('should create a focus trap if autoFocus is disabled (DOM-render — deferred to Playwright)', () => {
      // Covered by the parity spec: focus-trap anchors are present in EVERY scenario.
    });
    it.skip('should focus the first tabbable element on open when autoFocus is "first-tabbable" (DOM-render — deferred to Playwright)', () => {});
    it.skip('should focus the bottom sheet element on open when autoFocus is "dialog" (DOM-render — deferred to Playwright)', () => {});
    it.skip('should focus the bottom sheet element on open when autoFocus is "first-heading" (DOM-render — deferred to Playwright)', () => {
      // Covered by the parity spec's restore-focus test (autoFocus: 'first-heading').
    });
    it.skip('should focus the first element matching a CSS selector when autoFocus is a selector (DOM-render — deferred to Playwright)', () => {});
    it.skip('should re-focus the trigger element when the bottom sheet closes (DOM-render — deferred to Playwright)', () => {
      // Covered by the parity spec's restore-focus "close restores focus" step.
    });
    it.skip('should be able to disable focus restoration (DOM-render — deferred to Playwright)', () => {});
    it.skip('should not move focus if it was moved outside the sheet while animating (DOM-render — deferred to Playwright)', () => {});
    it.skip('should re-focus trigger element inside the shadow DOM when dismissed (DOM-render — deferred to Playwright)', () => {});
  });
});

// ---------------------------------------------------------------------------
// describe('MatBottomSheet with parent MatBottomSheet')
// ---------------------------------------------------------------------------

describe('MatBottomSheet with parent MatBottomSheet', () => {
  it.skip('should close bottom sheets opened by parent when opening from child (Angular-only: hierarchical DI — this port uses a single flat per-QwikCdkRoot registry, see mat-bottom-sheet.tsx’s doc comment on BottomSheetRegistry)', () => {});
  it.skip('should close bottom sheets opened by child when opening from parent (Angular-only: hierarchical DI)', () => {});
  it.skip('should not close parent bottom sheet when child is destroyed (Angular-only: hierarchical DI + ngOnDestroy)', () => {});
});

// ---------------------------------------------------------------------------
// describe('MatBottomSheet with default options')
// ---------------------------------------------------------------------------

describe('MatBottomSheet with default options', () => {
  it('should use the provided defaults', () => {
    const {service} = makeService({hasBackdrop: false, disableClose: true, autoFocus: 'dialog'});
    const ref = service.open(PizzaMsg)!;
    expect(ref.config.hasBackdrop).toBe(false);
    expect(ref.config.disableClose).toBe(true);
    expect(ref.config.autoFocus).toBe('dialog');
  });

  it('should be overridable by open() options', () => {
    const {service} = makeService({hasBackdrop: false, disableClose: true});
    const ref = service.open(PizzaMsg, {hasBackdrop: true, disableClose: false})!;
    expect(ref.config.hasBackdrop).toBe(true);
    expect(ref.config.disableClose).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// describe('MatBottomSheet with explicit injector provided')
// ---------------------------------------------------------------------------

describe('MatBottomSheet with explicit injector provided', () => {
  it.skip('should use the standalone injector and render the bottom sheet successfully (Angular-only: createNgModule/Injector — no DI container in Qwik)', () => {});
});
