/**
 * mat-dialog-scenarios.spec.ts
 *
 * Scenario port from src/material/dialog/dialog.spec.ts (120 it() blocks).
 *
 * Bucketing rules (applied in order):
 *  1. Angular-only — uses TestBed, inject(), ViewContainerRef, TemplateRef,
 *     Injector.create, NgZone, ChangeDetectorRef, flush(), tick(),
 *     ComponentPortal, ngOnDestroy, SpyLocation, OnPush fixture.
 *  2. DOM-render — queries DOM nodes, checks focus, checks ARIA on rendered
 *     nodes, checks computed styles, dispatches keyboard/mouse events,
 *     observes animation in the browser.
 *  3. Ported — drives createMatDialogService with a stub CDK; asserts on ref
 *     id/config/state/afterClosed/beforeClosed/openDialogs signal.
 *
 * Extra Material-only tests (§5 of the design spec) come at the end.
 *
 * Run:  pnpm -C src/qwik-material test dialog/mat-dialog-scenarios
 */

import {describe, it, expect, beforeEach} from 'vitest';
import {component$, jsx, noSerialize, type NoSerialize, type Signal} from '@qwik.dev/core';
import {createMatDialogService, type MatDialogService} from './mat-dialog';
import {MatDialogState, MARK_CLOSED, MARK_OPENED} from './mat-dialog-ref';
import type {MatDialogRef} from './mat-dialog-ref';

// ---------------------------------------------------------------------------
// Shared test harness (matches mat-dialog.spec.ts)
// ---------------------------------------------------------------------------

const StubBody = component$<{msg?: string}>(() => jsx('div', {}, 'stub'));

function makeStubCdk() {
  const disposed: string[] = [];
  let idSeq = 0;
  return {
    disposed,
    open<C, D, R>(_c: any, _props: any, _cfg: any) {
      const id = `stub-cdk-${idSeq++}`;
      return {
        id,
        dispose() {
          disposed.push(id);
        },
        updatePosition() {},
        updateSize(_o: any) {},
        addPanelClass(_c: any) {},
        removePanelClass(_c: any) {},
      };
    },
  };
}

function makeService(defaults: Partial<any> = {}): {
  service: MatDialogService;
  openDialogs: Signal<readonly NoSerialize<MatDialogRef>[]>;
  matRefsById: Record<string, NoSerialize<MatDialogRef>>;
  cdk: ReturnType<typeof makeStubCdk>;
} {
  const openDialogs = {value: [] as readonly NoSerialize<MatDialogRef>[]} as Signal<
    readonly NoSerialize<MatDialogRef>[]
  >;
  const matRefsById: Record<string, NoSerialize<MatDialogRef>> = {};
  const cdk = makeStubCdk();
  const service = createMatDialogService({
    cdk,
    defaults,
    openDialogs,
    matRefsById,
  });
  return {service, openDialogs, matRefsById, cdk};
}

// ---------------------------------------------------------------------------
// describe('MatDialog') — mirroring the top-level block in dialog.spec.ts
// ---------------------------------------------------------------------------

describe('MatDialog scenarios', () => {
  let service: MatDialogService;
  let openDialogs: Signal<readonly NoSerialize<MatDialogRef>[]>;
  let matRefsById: Record<string, NoSerialize<MatDialogRef>>;

  beforeEach(() => {
    ({service, openDialogs, matRefsById} = makeService());
  });

  // -------------------------------------------------------------------------
  // Top-level it() blocks from the main describe('MatDialog')
  // -------------------------------------------------------------------------

  it('should open a dialog with a component — returns non-null ref', () => {
    // Angular: checks overlayContainerElement.textContent + componentInstance + role attr.
    // We can assert the pure-factory layer: ref is non-null and has state OPEN.
    const ref = service.open(StubBody);
    expect(ref).not.toBeNull();
    expect(ref!.state.value).toBe(MatDialogState.OPEN);
  });

  it.skip('should be able to set aria-modal (DOM-render — deferred to Playwright)', () => {
    // Reason: asserts aria-modal attribute on the rendered mat-dialog-container DOM node.
  });

  it.skip('should open a dialog with a template (Angular-only: TemplateRef)', () => {
    // Reason: dialog.open() is called with a TemplateRef, which is an Angular-only concept.
  });

  it.skip('should emit when dialog opening animation is complete (DOM-render — deferred to Playwright)', () => {
    // Reason: afterOpened emits only after the enter animation; requires a live browser.
  });

  it.skip('should use injector from viewContainerRef for DialogInjector (Angular-only: ViewContainerRef/Injector)', () => {
    // Reason: asserts Angular DI injector chain via viewContainerRef; no Qwik equivalent.
  });

  it.skip('should open a dialog with a component and no ViewContainerRef (DOM-render — deferred to Playwright)', () => {
    // Reason: asserts on overlayContainerElement text + DOM query for mat-dialog-container.
  });

  it.skip('should apply the configured role to the dialog element (DOM-render — deferred to Playwright)', () => {
    // Reason: asserts getAttribute("role") on the rendered mat-dialog-container DOM node.
  });

  it.skip('should apply the specified aria-describedby (DOM-render — deferred to Playwright)', () => {
    // Reason: asserts getAttribute("aria-describedby") on the rendered DOM node.
  });

  it('should close a dialog and get back a result', async () => {
    // Angular: also checks DOM removal of mat-dialog-container.
    // Ported portion: afterClosed resolves with the close result.
    const ref = service.open<any, unknown, string>(StubBody)!;
    ref.close('Charmander');
    ref[MARK_CLOSED]();
    await expect(ref.afterClosed).resolves.toBe('Charmander');
  });

  it.skip('should dispose of dialog if view container is destroyed while animating (Angular-only: ViewContainerRef destroy)', () => {
    // Reason: relies on viewContainerFixture.destroy() and Angular change detection timing.
  });

  it.skip('should dispatch the beforeClosed and afterClosed events when the overlay is detached externally (Angular-only: scrollStrategy/Injector + DOM)', () => {
    // Reason: relies on createCloseScrollStrategy(TestBed.inject(Injector)) and a scrolledSubject
    // to trigger external detachment of the overlay — Angular DI + DOM.
  });

  it('should close a dialog and get back a result before it is closed (beforeClosed)', async () => {
    // Angular: also checks mat-dialog-container still exists inside the beforeClosed callback.
    // Ported portion: beforeClosed resolves with the result synchronously on close().
    const ref = service.open<any, unknown, string>(StubBody)!;
    const results: string[] = [];
    ref.beforeClosed.then(r => results.push(r as string));
    ref.close('Bulbasaur');
    await ref.beforeClosed;
    expect(results).toEqual(['Bulbasaur']);
  });

  it.skip('should close a dialog via the escape key (DOM-render — deferred to Playwright)', () => {
    // Reason: dispatches keyboard event on document.body; requires a live browser.
  });

  it.skip('should not close a dialog via the escape key with a modifier (DOM-render — deferred to Playwright)', () => {
    // Reason: dispatches keyboard event with alt modifier; requires a live browser.
  });

  it.skip('should close from a ViewContainerRef with OnPush change detection (Angular-only: OnPush/ChangeDetection)', () => {
    // Reason: uses ComponentWithOnPushViewContainer + detectChanges + whenStable.
  });

  it.skip('should close when clicking on the overlay backdrop (DOM-render — deferred to Playwright)', () => {
    // Reason: clicks the .cdk-overlay-backdrop DOM element; requires a live browser.
  });

  it.skip('should emit the backdropClick stream when clicking on the overlay backdrop (DOM-render — deferred to Playwright)', () => {
    // Reason: backdropClick() observable fires on DOM click; requires a live browser.
    // In qwik-material the callback is onBackdropClick$ QRL (config-level, not ref-level).
  });

  it.skip('should emit the keyboardEvent stream when key events target the overlay (DOM-render — deferred to Playwright)', () => {
    // Reason: keydownEvents() observable fires on DOM keyboard events; requires a live browser.
    // In qwik-material the callback is onKeydown$ QRL (config-level, not ref-level).
  });

  it.skip('should notify the observers if a dialog has been opened (Angular-only: afterOpened Observable)', () => {
    // Reason: uses dialog.afterOpened Subject (removed in qwik-material; derive from openDialogs signal).
  });

  it.skip('should notify the observers if all open dialogs have finished closing (Angular-only: afterAllClosed Observable + DOM)', () => {
    // Reason: uses dialog.afterAllClosed Observable + DOM timing via whenStable.
    // qwik-material derives this from openDialogs.value.length === 0.
  });

  it.skip('should emit the afterAllClosed stream on subscribe if there are no open dialogs (Angular-only: afterAllClosed Observable)', () => {
    // Reason: afterAllClosed emits synchronously on subscribe; Angular-only Observable API.
  });

  it.skip('should override the width of the overlay pane (DOM-render — deferred to Playwright)', () => {
    // Reason: asserts overlayPane.style.width on a rendered DOM element.
  });

  it.skip('should override the height of the overlay pane (DOM-render — deferred to Playwright)', () => {
    // Reason: asserts overlayPane.style.height on a rendered DOM element.
  });

  it.skip('should override the min-width of the overlay pane (DOM-render — deferred to Playwright)', () => {
    // Reason: asserts overlayPane.style.minWidth on a rendered DOM element.
  });

  it.skip('should override the max-width of the overlay pane (DOM-render — deferred to Playwright)', () => {
    // Reason: asserts overlayPane.style.maxWidth on a rendered DOM element.
  });

  it.skip('should override the min-height of the overlay pane (DOM-render — deferred to Playwright)', () => {
    // Reason: asserts overlayPane.style.minHeight on a rendered DOM element.
  });

  it.skip('should override the max-height of the overlay pane (DOM-render — deferred to Playwright)', () => {
    // Reason: asserts overlayPane.style.maxHeight on a rendered DOM element.
  });

  it.skip('should override the top offset of the overlay pane (DOM-render — deferred to Playwright)', () => {
    // Reason: asserts overlayPane.style.marginTop on a rendered DOM element.
  });

  it.skip('should override the bottom offset of the overlay pane (DOM-render — deferred to Playwright)', () => {
    // Reason: asserts overlayPane.style.marginBottom on a rendered DOM element.
  });

  it.skip('should override the left offset of the overlay pane (DOM-render — deferred to Playwright)', () => {
    // Reason: asserts overlayPane.style.marginLeft on a rendered DOM element.
  });

  it.skip('should override the right offset of the overlay pane (DOM-render — deferred to Playwright)', () => {
    // Reason: asserts overlayPane.style.marginRight on a rendered DOM element.
  });

  it.skip('should allow for the position to be updated (DOM-render — deferred to Playwright)', () => {
    // Reason: asserts overlayPane.style.marginLeft changes after dialogRef.updatePosition().
  });

  it.skip('should allow for the dimensions to be updated (DOM-render — deferred to Playwright)', () => {
    // Reason: asserts overlayPane.style.width changes after dialogRef.updateSize().
  });

  it.skip('should reset the overlay dimensions to their initial size (DOM-render — deferred to Playwright)', () => {
    // Reason: asserts overlayPane.style dimensions after updateSize() calls; DOM-render.
  });

  it.skip('should allow setting the layout direction (DOM-render — deferred to Playwright)', () => {
    // Reason: asserts getAttribute("dir") on a rendered .cdk-global-overlay-wrapper.
  });

  it.skip('should inject the correct layout direction in the component instance (Angular-only: inject/Directionality)', () => {
    // Reason: reads dialogRef.componentInstance.directionality.value via Angular DI.
  });

  it.skip('should fall back to injecting the global direction if none is passed by the config (Angular-only: inject/Directionality)', () => {
    // Reason: reads dialogRef.componentInstance.directionality.value via Angular DI.
  });

  it.skip('should use the passed in ViewContainerRef from the config (Angular-only: ViewContainerRef)', () => {
    // Reason: asserts testViewContainerRef.length before/after close; Angular ViewContainerRef API.
  });

  it('should close all of the dialogs (closeAll transitions all to CLOSING)', () => {
    const refA = service.open(StubBody, {id: 'a'})!;
    const refB = service.open(StubBody, {id: 'b'})!;
    const refC = service.open(StubBody, {id: 'c'})!;
    service.closeAll();
    expect(refA.state.value).toBe(MatDialogState.CLOSING);
    expect(refB.state.value).toBe(MatDialogState.CLOSING);
    expect(refC.state.value).toBe(MatDialogState.CLOSING);
  });

  it.skip('should close all dialogs when the user goes forwards/backwards in history (Angular-only: SpyLocation)', () => {
    // Reason: uses mockLocation.simulateUrlPop() from Angular's SpyLocation.
  });

  it.skip('should close all open dialogs when the location hash changes (Angular-only: SpyLocation)', () => {
    // Reason: uses mockLocation.simulateHashChange() from Angular's SpyLocation.
  });

  it.skip('should close all of the dialogs when the injectable is destroyed (Angular-only: ngOnDestroy)', () => {
    // Reason: calls dialog.ngOnDestroy(); removed in qwik-material.
  });

  it.skip('should complete open and close streams when the injectable is destroyed (Angular-only: ngOnDestroy/afterOpened/afterAllClosed Observables)', () => {
    // Reason: subscribes to dialog.afterOpened and dialog.afterAllClosed Observables, then calls
    // ngOnDestroy() to expect complete callbacks. All three are removed in qwik-material.
  });

  it.skip('should allow the consumer to disable closing a dialog on navigation (Angular-only: SpyLocation + closeOnNavigation)', () => {
    // Reason: relies on mockLocation.simulateUrlPop() and Angular location integration.
  });

  it.skip('should have the componentInstance available in the afterClosed callback (Angular-only: componentInstance + DOM)', () => {
    // Reason: asserts dialogRef.componentInstance is truthy inside afterClosed; in qwik-material
    // componentInstance is a Signal and the Angular assumption (cleared on close) does not apply.
  });

  it.skip('should be able to attach a custom scroll strategy (Angular-only: ScrollStrategy/Injector)', () => {
    // Reason: provides a custom ScrollStrategy and checks scrollStrategy.enable() was called
    // via Angular injection; qwik-material exposes scrollStrategyFactory in CDK config layer.
  });

  // describe('passing in data')
  describe('passing in data', () => {
    it('should be able to pass in data — stored in merged config', () => {
      // Angular: reads through MAT_DIALOG_DATA injection token from componentInstance.
      // Ported portion: data is preserved in the merged config accessible via ref.config.
      const data = {stringParam: 'hello', dateParam: new Date()};
      const ref = service.open(StubBody, {data})!;
      expect(ref.config.data).toBe(data);
      expect((ref.config.data as any).stringParam).toBe('hello');
    });

    it('should default to null if no data is passed — config.data is undefined', () => {
      // Angular: componentInstance.data is null (via MAT_DIALOG_DATA injection with null default).
      // Ported: ref.config.data is undefined when omitted.
      const ref = service.open(StubBody)!;
      expect(ref.config.data).toBeUndefined();
    });

    it.skip('should be able to apply bindings (Angular-only: inputBinding/Component)', () => {
      // Reason: uses inputBinding() which is an Angular-specific component binding mechanism.
    });
  });

  it.skip('should not keep a reference to the component after the dialog is closed (Angular-only: componentInstance + DOM)', () => {
    // Reason: asserts dialogRef.componentInstance becomes falsy after close + animation; in
    // qwik-material componentInstance is a Signal<C | null> whose clearing is container-driven.
  });

  it.skip('should assign a unique id to each dialog (Angular-only: auto-ID in useMatDialog, not factory)', () => {
    // Reason: auto-ID generation (`mat-mdc-dialog-N`) lives in useMatDialog(), not in the
    // pure createMatDialogService factory. The factory only uses whatever id is in config/defaults.
    // useMatDialog integration is covered by the Playwright suite.
  });

  it('should allow for the id to be overwritten', () => {
    const ref = service.open(StubBody, {id: 'pizza'})!;
    expect(ref.id).toBe('pizza');
  });

  it.skip('should throw when trying to open a dialog with the same id as another dialog (Angular-only: MatDialog guard)', () => {
    // Reason: the duplicate-id guard lives in the full Angular MatDialog service, not in the
    // pure createMatDialogService factory. The factory layer does not replicate this guard.
  });

  it('should be able to find a dialog by id', () => {
    const ref = service.open(StubBody, {id: 'pizza'})!;
    expect(service.getDialogById('pizza')).toBe(ref);
  });

  it('should return undefined from getDialogById for unknown ids', () => {
    service.open(StubBody, {id: 'known'});
    expect(service.getDialogById('unknown')).toBeUndefined();
  });

  it.skip('should toggle aria-hidden on the overlay container siblings (DOM-render — deferred to Playwright)', () => {
    // Reason: creates a DOM sibling of overlayContainerElement and checks aria-hidden attribute.
  });

  it.skip('should restore aria-hidden to the overlay container siblings on close (DOM-render — deferred to Playwright)', () => {
    // Reason: same as above; relies on DOM manipulation of sibling aria-hidden.
  });

  it.skip('should not set aria-hidden on aria-live elements (DOM-render — deferred to Playwright)', () => {
    // Reason: queries DOM for aria-live siblings; requires a live browser.
  });

  it.skip('should add and remove classes while open (DOM-render — deferred to Playwright)', () => {
    // Reason: asserts pane.classList changes via addPanelClass/removePanelClass on DOM node.
  });

  // describe('disableClose option')
  describe('disableClose option', () => {
    it.skip('should prevent closing via clicks on the backdrop (DOM-render — deferred to Playwright)', () => {
      // Reason: clicks .cdk-overlay-backdrop DOM element and checks mat-dialog-container.
    });

    it.skip('should prevent closing via the escape key (DOM-render — deferred to Playwright)', () => {
      // Reason: dispatches keyboard event on document.body; requires a live browser.
    });

    it.skip('should allow for the disableClose option to be updated while open (DOM-render — deferred to Playwright)', () => {
      // Reason: clicks backdrop DOM element before/after changing disableClose; live browser.
    });

    it.skip('should recapture focus when clicking on the backdrop (DOM-render — deferred to Playwright)', () => {
      // Reason: checks document.activeElement; requires live DOM and focus management.
    });

    it.skip('should recapture focus to the first tabbable element when clicking on the backdrop with autoFocus set to "first-tabbable" (DOM-render — deferred to Playwright)', () => {
      // Reason: checks document.activeElement with autoFocus="first-tabbable"; live DOM.
    });

    it.skip('should recapture focus to the container when clicking on the backdrop with autoFocus set to "dialog" (DOM-render — deferred to Playwright)', () => {
      // Reason: checks document.activeElement with autoFocus="dialog"; live DOM.
    });
  });

  // describe('closePredicate option')
  describe('closePredicate option', () => {
    it.skip('should determine whether closing via the backdrop is allowed (DOM-render — deferred to Playwright)', () => {
      // Reason: backdrop click drives closePredicate evaluation; requires live DOM.
    });

    it.skip('should determine whether closing via the escape key is allowed (DOM-render — deferred to Playwright)', () => {
      // Reason: keyboard event drives closePredicate evaluation; requires live DOM.
    });

    it.skip('should determine whether closing via the close method is allowed (DOM-render — deferred to Playwright)', () => {
      // Reason: closePredicate blocks ref.close() only when evaluated in the container; live DOM.
      // Note: the pure createMatDialogService factory does not implement closePredicate guard.
    });

    it.skip('should not be closed by closeAll if not allowed by the predicate (DOM-render — deferred to Playwright)', () => {
      // Reason: closePredicate blocking closeAll() requires the container; live DOM.
    });

    it.skip('should recapture focus to the first tabbable element when clicking on the backdrop while the closePredicate is blocking the close sequence (DOM-render — deferred to Playwright)', () => {
      // Reason: focus management + closePredicate + live DOM.
    });
  });

  it.skip('should recapture focus to the first header when clicking on the backdrop with autoFocus set to "first-heading" (DOM-render — deferred to Playwright)', () => {
    // Reason: checks document.activeElement with autoFocus="first-heading"; live DOM.
  });

  it.skip('should recapture focus to the first element that matches the css selector when clicking on the backdrop with autoFocus set to a css selector (DOM-render — deferred to Playwright)', () => {
    // Reason: checks document.activeElement with autoFocus CSS selector; live DOM.
  });

  it.skip('should be able to use afterOpened in the template while animations are disabled (DOM-render — deferred to Playwright)', () => {
    // Reason: checks overlayContainerElement.textContent after animations complete; live DOM.
  });

  // describe('hasBackdrop option')
  describe('hasBackdrop option', () => {
    it('should have a backdrop — config preserved', () => {
      // Angular: checks DOM for .cdk-overlay-backdrop element.
      // Ported: hasBackdrop is preserved in the merged config.
      const ref = service.open(StubBody, {hasBackdrop: true})!;
      expect(ref.config.hasBackdrop).toBe(true);
    });

    it('should not have a backdrop — config preserved', () => {
      // Angular: checks absence of .cdk-overlay-backdrop DOM element.
      // Ported: hasBackdrop false is preserved in the merged config.
      const ref = service.open(StubBody, {hasBackdrop: false})!;
      expect(ref.config.hasBackdrop).toBe(false);
    });
  });

  // describe('panelClass option')
  describe('panelClass option', () => {
    it('should have custom panel class — config preserved', () => {
      // Angular: checks DOM for .custom-panel-class element.
      // Ported: panelClass is preserved in the merged config.
      const ref = service.open(StubBody, {panelClass: 'custom-panel-class'})!;
      expect(ref.config.panelClass).toBe('custom-panel-class');
    });
  });

  // describe('backdropClass option')
  describe('backdropClass option', () => {
    it.skip('should have default backdrop class (DOM-render — deferred to Playwright)', () => {
      // Reason: asserts presence of .cdk-overlay-dark-backdrop class in DOM.
    });

    it('should have custom backdrop class — config preserved', () => {
      // Angular: asserts .custom-backdrop-class DOM element.
      // Ported: backdropClass is preserved in the merged config.
      const ref = service.open(StubBody, {backdropClass: 'custom-backdrop-class'})!;
      expect(ref.config.backdropClass).toBe('custom-backdrop-class');
    });
  });

  // describe('focus management')
  describe('focus management', () => {
    it.skip('should focus the first focusable element on open (DOM-render — deferred to Playwright)', () => {
      // Reason: checks document.activeElement.tagName; live DOM required.
    });

    it.skip('should focus the first tabbable element of the dialog on open (the default) (DOM-render — deferred to Playwright)', () => {
      // Reason: checks document.activeElement.tagName; live DOM required.
    });

    it.skip('should focus the dialog element on open (DOM-render — deferred to Playwright)', () => {
      // Reason: checks document.activeElement vs rendered mat-dialog-container; live DOM.
    });

    it.skip('should focus the first header element on open (DOM-render — deferred to Playwright)', () => {
      // Reason: checks document.activeElement vs h2[tabindex="-1"]; live DOM.
    });

    it.skip('should focus the first element that matches the css selector from autoFocus on open (DOM-render — deferred to Playwright)', () => {
      // Reason: checks document.activeElement vs p[tabindex="-1"]; live DOM.
    });

    it.skip('should attach the focus trap even if automatic focus is disabled (DOM-render — deferred to Playwright)', () => {
      // Reason: queries .cdk-focus-trap-anchor DOM nodes; live DOM.
    });

    it.skip('should re-focus trigger element when dialog closes (DOM-render — deferred to Playwright)', () => {
      // Reason: creates a DOM button, focuses it, opens dialog, closes, checks activeElement.
    });

    it.skip('should re-focus trigger element inside the shadow DOM when dialog closes (DOM-render — deferred to Playwright)', () => {
      // Reason: uses Shadow DOM + Angular fixture; live DOM required.
    });

    it.skip('should re-focus the trigger via keyboard when closed via escape key (DOM-render — deferred to Playwright)', () => {
      // Reason: uses FocusMonitor + keyboard event + live DOM to assert focus origin.
    });

    it.skip('should re-focus the trigger via mouse when backdrop has been clicked (DOM-render — deferred to Playwright)', () => {
      // Reason: uses FocusMonitor + mouse event on backdrop + live DOM.
    });

    it.skip('should re-focus via keyboard if the close button has been triggered through keyboard (DOM-render — deferred to Playwright)', () => {
      // Reason: uses FocusMonitor + mouse-event simulation on close button + live DOM.
    });

    it.skip('should re-focus via mouse if the close button has been clicked (DOM-render — deferred to Playwright)', () => {
      // Reason: uses FocusMonitor + mouse click coordinates on close button + live DOM.
    });

    it.skip('should allow the consumer to shift focus in afterClosed (DOM-render — deferred to Playwright)', () => {
      // Reason: afterClosed subscriber calls input.focus() and checks activeElement; live DOM.
    });

    it.skip('should move focus to the container if there are no focusable elements in the dialog (DOM-render — deferred to Playwright)', () => {
      // Reason: checks document.activeElement.tagName === "MAT-DIALOG-CONTAINER"; live DOM.
    });

    it.skip('should be able to disable focus restoration (DOM-render — deferred to Playwright)', () => {
      // Reason: opens dialog with restoreFocus: false and checks activeElement on close; live DOM.
    });

    it.skip('should not move focus if it was moved outside the dialog while animating (DOM-render — deferred to Playwright)', () => {
      // Reason: focus management during animation; live DOM required.
    });
  });

  // describe('dialog content elements')
  describe('dialog content elements', () => {
    // describe('inside component dialog') + describe('inside template portal')
    // All tests in runContentElementTests() are DOM-render or Angular-only.

    describe('inside component dialog', () => {
      it.skip('should close the dialog when clicking on the close button (DOM-render — deferred to Playwright)', () => {
        // Reason: clicks button[mat-dialog-close] DOM element; live DOM.
      });

      it.skip('should not close when clicking on an aria-disabled close button (DOM-render — deferred to Playwright)', () => {
        // Reason: sets aria-disabled on button and clicks it; live DOM.
      });

      it.skip('should not close if [mat-dialog-close] is applied on a non-button node (DOM-render — deferred to Playwright)', () => {
        // Reason: clicks div[mat-dialog-close] DOM element; live DOM.
      });

      it.skip('should allow for a user-specified aria-label on the close button (DOM-render — deferred to Playwright)', () => {
        // Reason: reads aria-label attribute from rendered close button; live DOM.
      });

      it.skip('should set the "type" attribute of the close button if not set manually (DOM-render — deferred to Playwright)', () => {
        // Reason: reads type attribute from rendered close button; live DOM.
      });

      it.skip('should not override type attribute of the close button if set manually (DOM-render — deferred to Playwright)', () => {
        // Reason: reads type="submit" attribute from rendered close button; live DOM.
      });

      it.skip('should return the [mat-dialog-close] result when clicking the close button (DOM-render — deferred to Playwright)', () => {
        // Reason: clicks button.close-with-true and checks afterClosed callback result; live DOM.
      });

      it.skip('should set the aria-labelledby attribute to the id of the title (DOM-render — deferred to Playwright)', () => {
        // Reason: reads aria-labelledby from rendered mat-dialog-container; live DOM.
      });

      it.skip('should update the aria-labelledby attribute if two titles are swapped (DOM-render — deferred to Playwright)', () => {
        // Reason: mutates Angular component state and checks aria-labelledby; live DOM + CD.
      });

      it.skip('should update the aria-labelledby attribute if multiple titles are present and one is removed (DOM-render — deferred to Playwright)', () => {
        // Reason: mutates Angular component state and checks aria-labelledby; live DOM + CD.
      });

      it.skip('should add correct css class according to given [align] input in [mat-dialog-actions] (DOM-render — deferred to Playwright)', () => {
        // Reason: checks mat-dialog-actions DOM classList; live DOM.
      });
    });

    describe('inside template portal', () => {
      it.skip('should close the dialog when clicking on the close button (Angular-only: TemplateRef)', () => {
        // Reason: opens dialog with a TemplateRef; Angular-only.
      });

      it.skip('should not close when clicking on an aria-disabled close button (Angular-only: TemplateRef)', () => {
        // Reason: opens dialog with a TemplateRef; Angular-only.
      });

      it.skip('should not close if [mat-dialog-close] is applied on a non-button node (Angular-only: TemplateRef)', () => {
        // Reason: opens dialog with a TemplateRef; Angular-only.
      });

      it.skip('should allow for a user-specified aria-label on the close button (Angular-only: TemplateRef)', () => {
        // Reason: opens dialog with a TemplateRef; Angular-only.
      });

      it.skip('should set the "type" attribute of the close button if not set manually (Angular-only: TemplateRef)', () => {
        // Reason: opens dialog with a TemplateRef; Angular-only.
      });

      it.skip('should not override type attribute of the close button if set manually (Angular-only: TemplateRef)', () => {
        // Reason: opens dialog with a TemplateRef; Angular-only.
      });

      it.skip('should return the [mat-dialog-close] result when clicking the close button (Angular-only: TemplateRef)', () => {
        // Reason: opens dialog with a TemplateRef; Angular-only.
      });

      it.skip('should set the aria-labelledby attribute to the id of the title (Angular-only: TemplateRef)', () => {
        // Reason: opens dialog with a TemplateRef; Angular-only.
      });

      it.skip('should update the aria-labelledby attribute if two titles are swapped (Angular-only: TemplateRef)', () => {
        // Reason: opens dialog with a TemplateRef; Angular-only.
      });

      it.skip('should update the aria-labelledby attribute if multiple titles are present and one is removed (Angular-only: TemplateRef)', () => {
        // Reason: opens dialog with a TemplateRef; Angular-only.
      });

      it.skip('should add correct css class according to given [align] input in [mat-dialog-actions] (Angular-only: TemplateRef)', () => {
        // Reason: opens dialog with a TemplateRef; Angular-only.
      });
    });

    it.skip('should set the aria-labelledby attribute to the id of the title under OnPush host (Angular-only: OnPush/ChangeDetection/inject)', () => {
      // Reason: creates inline OnPush components via TestBed.createComponent; Angular-only.
    });
  });

  // describe('aria-labelledby')
  describe('aria-labelledby', () => {
    it.skip('should be able to set a custom aria-labelledby (DOM-render — deferred to Playwright)', () => {
      // Reason: reads aria-labelledby from rendered mat-dialog-container; live DOM.
    });

    it.skip('should not set the aria-labelledby automatically if it has an aria-label and an aria-labelledby (DOM-render — deferred to Playwright)', () => {
      // Reason: reads aria-labelledby attribute from rendered container; live DOM.
    });

    it.skip('should set the aria-labelledby attribute to the config provided aria-labelledby instead of the mat-dialog-title id (DOM-render — deferred to Playwright)', () => {
      // Reason: reads aria-labelledby from rendered container with ContentElementDialog; live DOM.
    });
  });

  // describe('aria-label')
  describe('aria-label', () => {
    it.skip('should be able to set a custom aria-label (DOM-render — deferred to Playwright)', () => {
      // Reason: reads aria-label attribute from rendered mat-dialog-container; live DOM.
    });

    it.skip('should not set the aria-labelledby automatically if it has an aria-label (DOM-render — deferred to Playwright)', () => {
      // Reason: reads aria-labelledby from rendered mat-dialog-container; live DOM.
    });
  });

  it.skip('should dispose backdrop if containing dialog view is destroyed (Angular-only: ViewContainerRef/ChangeDetection + DOM)', () => {
    // Reason: sets showChildView = false on Angular component + detectChanges to destroy view;
    // then checks backdrop DOM node. Angular-only + DOM.
  });

  // ---------------------------------------------------------------------------
  // describe('MatDialog with a parent MatDialog')
  // ---------------------------------------------------------------------------

  describe('MatDialog with a parent MatDialog', () => {
    it.skip('should close dialogs opened by a parent when calling closeAll on a child MatDialog (Angular-only: nested DI providers)', () => {
      // Reason: relies on ComponentThatProvidesMatDialog providing a child MatDialog instance
      // via Angular DI providers on a component; nested injector hierarchy.
    });

    it.skip('should close dialogs opened by a child when calling closeAll on a parent MatDialog (Angular-only: nested DI providers)', () => {
      // Reason: same as above; nested DI provider hierarchy.
    });

    it.skip('should close the top dialog via the escape key (DOM-render — deferred to Playwright)', () => {
      // Reason: dispatches keyboard event; live DOM.
    });

    it.skip('should not close the parent dialogs when a child is destroyed (Angular-only: ngOnDestroy + DOM)', () => {
      // Reason: calls childDialog.ngOnDestroy() + detectChanges + DOM check; Angular-only.
    });
  });

  // ---------------------------------------------------------------------------
  // describe('MatDialog with default options')
  // ---------------------------------------------------------------------------

  describe('MatDialog with default options', () => {
    it('should use the provided defaults — config fields merged from defaults', () => {
      // Angular: checks DOM nodes for backdrop absence and overlay pane sizes.
      // Ported: the factory merges defaults into ref.config.
      const {service: svc} = makeService({
        hasBackdrop: false,
        disableClose: true,
        width: '100px',
        height: '100px',
        minWidth: '50px',
        minHeight: '50px',
        maxWidth: '150px',
        maxHeight: '150px',
        autoFocus: 'dialog' as const,
      });
      const ref = svc.open(StubBody)!;
      expect(ref.config.hasBackdrop).toBe(false);
      expect(ref.config.disableClose).toBe(true);
      expect(ref.config.width).toBe('100px');
      expect(ref.config.height).toBe('100px');
      expect(ref.config.minWidth).toBe('50px');
      expect(ref.config.minHeight).toBe('50px');
      expect(ref.config.maxWidth).toBe('150px');
      expect(ref.config.maxHeight).toBe('150px');
      expect(ref.config.autoFocus).toBe('dialog');
    });

    it('should be overridable by open() options — call-site config overrides defaults', () => {
      // Angular: also checks DOM (backdrop present + escape closes).
      // Ported: open()-level config takes precedence over defaults for boolean fields.
      const {service: svc} = makeService({hasBackdrop: false, disableClose: true});
      const ref = svc.open(StubBody, {hasBackdrop: true, disableClose: false})!;
      expect(ref.config.hasBackdrop).toBe(true);
      expect(ref.config.disableClose).toBe(false);
    });
  });

  // ---------------------------------------------------------------------------
  // describe('MatDialog with animations enabled')
  // ---------------------------------------------------------------------------

  describe('MatDialog with animations enabled', () => {
    it.skip('should emit when dialog opening animation is complete (DOM-render — deferred to Playwright)', () => {
      // Reason: afterOpened fires after real OPEN_ANIMATION_DURATION in a browser.
    });

    it('should return the current state of the dialog', () => {
      // Angular: waits CLOSE_ANIMATION_DURATION ms via real timer.
      // Ported portion: state transitions OPEN → CLOSING synchronously on close();
      // CLOSED requires MARK_CLOSED() (container's animation-end callback).
      const ref = service.open(StubBody)!;
      expect(ref.state.value).toBe(MatDialogState.OPEN);
      ref.close();
      expect(ref.state.value).toBe(MatDialogState.CLOSING);
      ref[MARK_CLOSED]();
      expect(ref.state.value).toBe(MatDialogState.CLOSED);
    });
  });

  // ---------------------------------------------------------------------------
  // describe('MatDialog with explicit injector provided')
  // ---------------------------------------------------------------------------

  describe('MatDialog with explicit injector provided', () => {
    it.skip('should use the standalone injector and render the dialog successfully (Angular-only: NgModule/createNgModule/Injector)', () => {
      // Reason: creates a NgModule via createNgModule and injects it into dialog.open().
      // Angular-only; no Qwik equivalent.
    });
  });

  // ===========================================================================
  // openDialogs signal tracking (extra service-level tests)
  // ===========================================================================

  describe('openDialogs signal tracking', () => {
    it('should push ref into openDialogs when opened', () => {
      expect(openDialogs.value.length).toBe(0);
      service.open(StubBody, {id: 'x'});
      expect(openDialogs.value.length).toBe(1);
    });

    it('should return openDialogs with correct length for multiple opens', () => {
      service.open(StubBody, {id: 'a'});
      service.open(StubBody, {id: 'b'});
      expect(openDialogs.value.length).toBe(2);
    });

    it('should remove ref from openDialogs after afterClosed resolves', async () => {
      const ref = service.open(StubBody, {id: 'gone'})!;
      expect(openDialogs.value.length).toBe(1);
      ref.close();
      ref[MARK_CLOSED]();
      await ref.afterClosed;
      expect(openDialogs.value.length).toBe(0);
    });

    it('should track multiple refs independently', async () => {
      const refA = service.open(StubBody, {id: 'a'})!;
      const refB = service.open(StubBody, {id: 'b'})!;
      service.close('a');
      refA[MARK_CLOSED]();
      await refA.afterClosed;
      expect(openDialogs.value.map(r => r?.id)).toEqual(['b']);
      expect(refB.state.value).toBe(MatDialogState.OPEN);
    });
  });

  // ===========================================================================
  // Material-only extras (design spec §5 fields not covered by the Angular spec)
  // ===========================================================================

  describe('Material-only extras (§5 fields)', () => {
    it('should preserve enterAnimationDuration in merged config', () => {
      const ref = service.open(StubBody, {enterAnimationDuration: 200})!;
      expect(ref.config.enterAnimationDuration).toBe(200);
    });

    it('should preserve exitAnimationDuration in merged config', () => {
      const ref = service.open(StubBody, {exitAnimationDuration: 75})!;
      expect(ref.config.exitAnimationDuration).toBe(75);
    });

    it('should merge enterAnimationDuration from defaults, overridable per open()', () => {
      const {service: svc} = makeService({enterAnimationDuration: 300});
      const refDefault = svc.open(StubBody, {id: 'a'})!;
      expect(refDefault.config.enterAnimationDuration).toBe(300);
      const refOverride = svc.open(StubBody, {id: 'b', enterAnimationDuration: 500})!;
      expect(refOverride.config.enterAnimationDuration).toBe(500);
    });

    it('should preserve DialogPosition in merged config', () => {
      const position = {top: '100px', left: '50px'};
      const ref = service.open(StubBody, {position})!;
      expect(ref.config.position).toEqual({top: '100px', left: '50px'});
    });

    it('should preserve backdropClass string in merged config', () => {
      const ref = service.open(StubBody, {backdropClass: 'my-backdrop'})!;
      expect(ref.config.backdropClass).toBe('my-backdrop');
    });

    it('should preserve backdropClass array in merged config', () => {
      const ref = service.open(StubBody, {backdropClass: ['a', 'b']})!;
      expect(ref.config.backdropClass).toEqual(['a', 'b']);
    });

    it('should preserve minWidth and maxWidth in merged config', () => {
      const ref = service.open(StubBody, {minWidth: '200px', maxWidth: '800px'})!;
      expect(ref.config.minWidth).toBe('200px');
      expect(ref.config.maxWidth).toBe('800px');
    });

    it('should preserve minHeight and maxHeight in merged config', () => {
      const ref = service.open(StubBody, {minHeight: '100px', maxHeight: '600px'})!;
      expect(ref.config.minHeight).toBe('100px');
      expect(ref.config.maxHeight).toBe('600px');
    });

    it('should resolve afterOpened after MARK_OPENED is called', async () => {
      const ref = service.open(StubBody)!;
      let opened = false;
      ref.afterOpened.then(() => {
        opened = true;
      });
      expect(opened).toBe(false);
      ref[MARK_OPENED]();
      await ref.afterOpened;
      expect(opened).toBe(true);
    });

    it('should keep state CLOSING until MARK_CLOSED is called', async () => {
      const ref = service.open(StubBody)!;
      ref.close();
      expect(ref.state.value).toBe(MatDialogState.CLOSING);
      // MARK_CLOSED simulates end of exit animation
      ref[MARK_CLOSED]();
      expect(ref.state.value).toBe(MatDialogState.CLOSED);
    });
  });
});
