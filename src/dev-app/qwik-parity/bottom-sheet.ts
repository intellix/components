import {Component, Type, inject} from '@angular/core';
import {
  MAT_BOTTOM_SHEET_DATA,
  MatBottomSheet,
  MatBottomSheetRef,
} from '@angular/material/bottom-sheet';
import {MatListModule} from '@angular/material/list';

// Each scenario mirrors a route under src/qwik-cdk-dev-app/src/routes/mat-bottom-sheet/.
//
// Unlike dialog.ts/cdk-dialog.ts, NONE of these scenarios auto-open: every one renders a real
// trigger `<button>` inside `[data-parity-root]` and opens the sheet from a (click) handler,
// per the task brief. Bottom sheets render into `.cdk-overlay-container` under <body>, not
// inside the routed component's own DOM, so `angular-parity.spec.ts` compares with
// `rootSelector: '.cdk-overlay-container'` rather than the default `[data-parity-root]` — see
// dialog.ts for the identical setup. `[data-parity-root]` (and the trigger button(s) inside it)
// therefore only has to exist for expectMaterialParity's open() to wait on; its own content,
// including the trigger button's markup/class, is NEVER diffed for this component.
//
// MatBottomSheet builds directly on `Dialog`/overlay (already ported — see cdk-dialog.ts and
// specs/cdk-dialog/angular-parity.spec.ts), reusing the exact same `GlobalPositionStrategy`
// mechanism MatDialog already uses (`createGlobalPositionStrategy(injector)`, just
// `.centerHorizontally().bottom('0')` instead of `.centerHorizontally().centerVertically()`) —
// see src/material/bottom-sheet/bottom-sheet.ts.
//
// Content-component host element convention: every content component below declares an
// explicit `selector` (e.g. `bottom-sheet-scenario-body`), which becomes its real DOM host tag
// once Angular's `ComponentPortal` instantiates it — unlike dialog.ts's bodies (which have no
// selector and fall back to `<ng-component>`). The Qwik side's equivalent `component$` bodies
// have no host wrapper by default, so they must each be wrapped in a matching custom element
// with that exact tag name to reproduce this extra host layer (see cdk-dialog.ts's identical
// convention and its Qwik routes under src/qwik-cdk-dev-app/src/routes/dialog/*).
//
// Known, non-obvious upstream DOM facts that the Qwik port must reproduce (verified by reading
// src/material/bottom-sheet/*.ts and src/cdk/dialog/dialog-container.ts, and empirically against
// the live Angular dev-app — see the spec's header comment for the exact classes/attrs observed
// per scenario):
//
//   - Container host tag is `<mat-bottom-sheet-container>`, always carrying class
//     `mat-bottom-sheet-container` AND `cdk-dialog-container` (the latter inherited straight
//     from the base `CdkDialogContainer`'s own host binding — Angular keeps it even though
//     `MatBottomSheetContainer`'s own `@Component` redeclares `'class': 'mat-bottom-sheet-
//     container'`; both are real, verified live), plus (unless animations are globally
//     disabled, which none of these scenarios do) `mat-bottom-sheet-container-animations-
//     enabled`, plus EXACTLY ONE of `mat-bottom-sheet-container-enter`
//     (`_animationState === 'visible'`) or `mat-bottom-sheet-container-exit` (`'hidden'`) once
//     `enter()`/`exit()` has run — see bottom-sheet-container.ts. `enter()` forces this
//     synchronously via `detectChanges()`, so it's visible by the time a trigger click's
//     handler returns; `exit()` only calls `markForCheck()` (applied on the next CD tick, still
//     well within a couple of animation frames for a direct keydown-driven dismiss, though a
//     backdrop-click-driven one can land noticeably later — see the spec's header comment) — BUT
//     `exit()` also sets a bare `mat-exit=""` attribute directly via `setAttribute()`,
//     synchronously, before that CD tick even runs. That attribute has no styling/testing
//     purpose of its own but IS part of the real DOM and must be reproduced.
//   - `BreakpointObserver.observe([Medium, Large, XLarge]).subscribe(...)` toggles
//     `mat-bottom-sheet-container-medium` / `-large` / `-xlarge` on the container, evaluated
//     synchronously against the real viewport the moment the container is constructed (RxJS
//     `startWith`-style immediate emission) — not timing-dependent in practice. Playwright's
//     default viewport here is 1280x720, which lands in `Breakpoints.Large`
//     (`min-width: 1280px) and (max-width: 1919.98px)`) — NOT Medium (960–1279.98) or XLarge
//     (>=1920) — so every scenario below is expected to show `mat-bottom-sheet-container-large`
//     specifically (verified live; see the spec's header comment).
//   - `tabindex="-1"` always; `role` defaults to `"dialog"` (inherited from the base
//     `DialogConfig.role` default — none of these scenarios override it); `aria-modal` defaults
//     to `"false"` (MatBottomSheetConfig's OWN default, unlike MatDialogConfig's upstream
//     default of the same `"false"` value but qwik-material's drift to `"true"` for dialogs —
//     see dialog.ts's "known drift" note; that drift must NOT be copy-pasted into the bottom
//     sheet port, since upstream truly defaults to `"false"` for both).
//   - `id="cdk-dialog-#"` (digits squashed by the harness) always appears: the underlying
//     `Dialog.open()` auto-generates one (`config.id = config.id || idGenerator.getId
//     ('cdk-dialog-')`) when the caller doesn't supply one, which MatBottomSheet never does —
//     see src/cdk/dialog/dialog.ts. `aria-labelledby`/`aria-describedby`/`aria-label` are
//     otherwise inherited host bindings from `CdkDialogContainer`; `aria-labelledby` stays
//     absent in every scenario here (bottom sheets have no `MatBottomSheetTitle`-equivalent
//     directive to populate `_ariaLabelledByQueue`), `aria-describedby` stays absent (no
//     scenario sets `ariaDescribedBy`), and `aria-label` only appears in the `aria-label`
//     scenario.
//   - Focus-trap anchors (`<div class="cdk-visually-hidden cdk-focus-trap-anchor"
//     aria-hidden="true" tabindex="0">`) are inserted as the immediate previous/next siblings of
//     `<mat-bottom-sheet-container>` inside `.cdk-overlay-pane`, for EVERY scenario — not only
//     when `autoFocus` is disabled. `CdkDialogContainer._initializeFocusTrap()` calls
//     `FocusTrapFactory.create(element)` unconditionally with no `deferCaptureElements` arg
//     (defaults to `false`), so `FocusTrap.attachAnchors()` runs eagerly in every case — see
//     src/cdk/a11y/focus-trap/focus-trap.ts. Do not assume the anchors are specific to the
//     `restore-focus` scenario below.
//   - The overlay pane (`.cdk-overlay-pane`, itself carrying its own auto-generated
//     `id="cdk-overlay-#"` — a different id sequence than the container's `cdk-dialog-#`)
//     always carries inline `style="max-width: 100%; position: static; margin-bottom: 0px"` —
//     the `max-width` from `MatBottomSheet.open()`'s unconditional `maxWidth: '100%'`, the rest
//     from the shared `GlobalPositionStrategy`/`OverlayRef` machinery (same as mat-dialog) —
//     plus any `panelClass` classes directly on that same pane element (see the `panel-class`
//     scenario). Its parent, the position-strategy wrapper, carries classes
//     `cdk-overlay-popover cdk-global-overlay-wrapper`, attribute `popover="manual"` (this
//     build's CDK overlay sits on top of the native HTML Popover API), and inline
//     `style="justify-content: center; align-items: flex-end"` for the bottom-center position
//     every scenario here uses — see the spec's header comment for the full verified skeleton.
//   - The default backdrop (`hasBackdrop: true`, no explicit `backdropClass`) is
//     `.cdk-overlay-backdrop.cdk-overlay-dark-backdrop`; an explicit `backdropClass` config
//     value (see the `panel-class` scenario) REPLACES `cdk-overlay-dark-backdrop` entirely
//     rather than adding alongside it — verified live (the `panel-class` scenario's backdrop
//     shows `cdk-overlay-backdrop my-backdrop-class`, with no `cdk-overlay-dark-backdrop`).

/** Shared body for scenarios that don't care about their bottom sheet's specific content. */
@Component({
  selector: 'bottom-sheet-scenario-body',
  template: `<div class="mat-scenario-body">Material scenario body</div>`,
})
export class BottomSheetScenarioBody {}

/**
 * Mirrors the real demo's content (src/dev-app/bottom-sheet/bottom-sheet-demo.ts) using
 * already-ported `mat-nav-list`/`matListItemTitle` (see list.ts's `ListNav` for the exact
 * `<div matListItemTitle>` convention the Qwik port already implements, used here instead of
 * upstream's `<span matListItemTitle>` so this scenario's content is itself already-proven
 * parity-safe). Each action link dismisses the sheet via the injected `MatBottomSheetRef`,
 * exactly like the real demo's `ExampleBottomSheet`.
 */
@Component({
  selector: 'bottom-sheet-nav-body',
  template: `
    <mat-nav-list>
      <a mat-list-item href="#" (click)="onActionClick($event)">
        <div matListItemTitle>Action 1</div>
      </a>
      <a mat-list-item href="#" (click)="onActionClick($event)">
        <div matListItemTitle>Action 2</div>
      </a>
      <a mat-list-item href="#" (click)="onActionClick($event)">
        <div matListItemTitle>Action 3</div>
      </a>
    </mat-nav-list>
  `,
  imports: [MatListModule],
})
export class BottomSheetNavBody {
  private bottomSheetRef = inject(MatBottomSheetRef);

  onActionClick(event: MouseEvent) {
    event.preventDefault();
    this.bottomSheetRef.dismiss();
  }
}

/** Has a heading (for `autoFocus: 'first-heading'`) and other focusable content. */
@Component({
  selector: 'bottom-sheet-focusable-body',
  template: `
    <h2>Heading</h2>
    <p>Content</p>
    <button class="first-button">First</button>
  `,
})
export class BottomSheetFocusableBody {}

/** Renders injected `MAT_BOTTOM_SHEET_DATA` and dismisses with a result derived from it. */
@Component({
  selector: 'bottom-sheet-data-body',
  template: `
    <div class="mat-scenario-body">{{ data.message }}</div>
    <button class="data-close" (click)="onClose()">Close</button>
  `,
})
export class BottomSheetDataBody {
  data = inject<{message: string}>(MAT_BOTTOM_SHEET_DATA);
  private bottomSheetRef = inject(MatBottomSheetRef);

  onClose() {
    this.bottomSheetRef.dismiss(this.data.message);
  }
}

/**
 * Opens the second sheet from a button INSIDE the first sheet's own content, rather than from
 * the page underneath — the page's own trigger(s) sit behind `hasBackdrop: true`'s backdrop
 * once the first sheet is open (the backdrop blocks pointer events to everything behind it, by
 * design), so a page-level "open second" button would be unclickable without a forced,
 * unrealistic click. A button inside the sheet's own content has no such problem (it renders
 * above the backdrop, like the rest of the sheet) and mirrors a realistic use of
 * `MatBottomSheet.open()`'s "replace the currently-open sheet" behavior (e.g. a nav action that
 * opens a different sheet).
 */
@Component({
  selector: 'bottom-sheet-first-body',
  template: `
    <div class="mat-scenario-body">First sheet</div>
    <button class="open-second" (click)="onOpenSecond()">Open second</button>
  `,
})
export class BottomSheetFirstBody {
  private bottomSheet = inject(MatBottomSheet);
  onOpenSecond() {
    this.bottomSheet.open(BottomSheetSecondBody, {hasBackdrop: true});
  }
}

@Component({
  selector: 'bottom-sheet-second-body',
  template: `<div class="mat-scenario-body">Second sheet</div>`,
})
export class BottomSheetSecondBody {}

@Component({
  template: `
    <div data-parity-root>
      <button class="open-button" (click)="onOpen()">Open</button>
    </div>
  `,
  imports: [MatListModule],
})
export class BottomSheetBasic {
  private bottomSheet = inject(MatBottomSheet);
  onOpen() {
    this.bottomSheet.open(BottomSheetNavBody, {hasBackdrop: true});
  }
}

@Component({
  template: `
    <div data-parity-root>
      <button class="open-button" (click)="onOpen()">Open</button>
    </div>
  `,
})
export class BottomSheetCloseOnBackdrop {
  private bottomSheet = inject(MatBottomSheet);
  onOpen() {
    this.bottomSheet.open(BottomSheetScenarioBody, {hasBackdrop: true});
  }
}

@Component({
  template: `
    <div data-parity-root>
      <button class="open-button" (click)="onOpen()">Open</button>
    </div>
  `,
})
export class BottomSheetCloseOnEscape {
  private bottomSheet = inject(MatBottomSheet);
  onOpen() {
    this.bottomSheet.open(BottomSheetScenarioBody, {hasBackdrop: true});
  }
}

@Component({
  template: `
    <div data-parity-root>
      <button class="open-button" (click)="onOpen()">Open</button>
    </div>
  `,
})
export class BottomSheetDisableClose {
  private bottomSheet = inject(MatBottomSheet);
  onOpen() {
    this.bottomSheet.open(BottomSheetScenarioBody, {hasBackdrop: true, disableClose: true});
  }
}

@Component({
  template: `
    <div data-parity-root>
      <button class="open-button" (click)="onOpen()">Open</button>
    </div>
  `,
})
export class BottomSheetNoBackdrop {
  private bottomSheet = inject(MatBottomSheet);
  onOpen() {
    this.bottomSheet.open(BottomSheetScenarioBody, {hasBackdrop: false});
  }
}

@Component({
  template: `
    <div data-parity-root>
      <button class="open-button" (click)="onOpen()">Open</button>
    </div>
  `,
})
export class BottomSheetPanelClass {
  private bottomSheet = inject(MatBottomSheet);
  onOpen() {
    this.bottomSheet.open(BottomSheetScenarioBody, {
      hasBackdrop: true,
      panelClass: ['my-panel-a', 'my-panel-b'],
      backdropClass: 'my-backdrop-class',
    });
  }
}

@Component({
  template: `
    <div data-parity-root>
      <button class="open-button" (click)="onOpen()">Open</button>
    </div>
  `,
})
export class BottomSheetAriaLabel {
  private bottomSheet = inject(MatBottomSheet);
  onOpen() {
    this.bottomSheet.open(BottomSheetScenarioBody, {
      hasBackdrop: true,
      ariaLabel: 'Settings sheet',
    });
  }
}

@Component({
  template: `
    <div data-parity-root>
      <button class="open-button" (click)="onOpen()">Open</button>
      <div class="result" data-result>{{ result }}</div>
    </div>
  `,
})
export class BottomSheetWithData {
  private bottomSheet = inject(MatBottomSheet);
  result = '';

  onOpen() {
    const ref = this.bottomSheet.open(BottomSheetDataBody, {
      hasBackdrop: true,
      data: {message: 'hello world'},
    });
    ref.afterDismissed().subscribe(r => {
      this.result = String(r ?? '(dismissed with no result)');
    });
  }
}

@Component({
  template: `
    <div data-parity-root>
      <button class="restore-trigger" (click)="onOpen()">Open</button>
    </div>
  `,
})
export class BottomSheetRestoreFocus {
  private bottomSheet = inject(MatBottomSheet);
  onOpen() {
    this.bottomSheet.open(BottomSheetFocusableBody, {
      hasBackdrop: true,
      autoFocus: 'first-heading',
      restoreFocus: true,
    });
  }
}

@Component({
  template: `
    <div data-parity-root>
      <button class="open-first" (click)="onOpenFirst()">Open first</button>
    </div>
  `,
})
export class BottomSheetReplace {
  private bottomSheet = inject(MatBottomSheet);
  onOpenFirst() {
    this.bottomSheet.open(BottomSheetFirstBody, {hasBackdrop: true});
  }
}

export const BOTTOM_SHEET_SCENARIOS: Record<string, Type<unknown>> = {
  'aria-label': BottomSheetAriaLabel,
  'basic': BottomSheetBasic,
  'close-on-backdrop': BottomSheetCloseOnBackdrop,
  'close-on-escape': BottomSheetCloseOnEscape,
  'disable-close': BottomSheetDisableClose,
  'no-backdrop': BottomSheetNoBackdrop,
  'panel-class': BottomSheetPanelClass,
  'replace-sheet': BottomSheetReplace,
  'restore-focus': BottomSheetRestoreFocus,
  'with-data': BottomSheetWithData,
};
