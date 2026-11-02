import {AriaLivePoliteness} from '@angular/cdk/a11y';
import {Component, TemplateRef, Type, ViewChild, inject} from '@angular/core';
import {MatButtonModule} from '@angular/material/button';
import {
  MatSnackBar,
  MatSnackBarAction,
  MatSnackBarActions,
  MatSnackBarHorizontalPosition,
  MatSnackBarLabel,
  MatSnackBarRef,
  MatSnackBarVerticalPosition,
} from '@angular/material/snack-bar';

// Each scenario mirrors a route under src/qwik-cdk-dev-app/src/routes/mat-snack-bar/.
//
// Unlike mat-dialog/cdk-dialog, NONE of these scenarios auto-open: every page renders only
// trigger button(s) inside `[data-parity-root]`, and `MatSnackBar` is invoked from a
// `(click)` handler — matching the task requirement that nothing opens until clicked. The
// snack bar itself attaches into `.cdk-overlay-container` under <body>, so
// `angular-parity.spec.ts` compares with `rootSelector: '.cdk-overlay-container'`; the pages'
// own `data-parity-root` content (the buttons) is never diffed, only used by
// `expectMaterialParity`'s `open()` to know the page has mounted.
//
// No scenario sets `duration` (it defaults to 0 = never auto-dismiss) — every dismissal in the
// spec is driven explicitly (a dismiss button, the snack bar's own action button, or opening a
// replacement), per the task instruction not to depend on timer-based auto-dismiss.
//
// ============================================================================================
// Shared DOM skeleton every scenario produces once its trigger is clicked (see
// src/material/snack-bar/snack-bar-container.html/.ts and src/cdk/overlay/overlay.ts /
// global-position-strategy.ts):
//
//   <div class="cdk-overlay-container">
//     <div class="cdk-global-overlay-wrapper cdk-overlay-popover" popover="manual"
//          style="justify-content: ...; align-items: ...;">      <!-- OverlayRef.hostElement -->
//       <div class="cdk-overlay-pane" id="cdk-overlay-#"
//            style="position: static; margin-...">                <!-- OverlayRef.overlayElement -->
//         <mat-snack-bar-container
//             class="mdc-snackbar mat-mdc-snack-bar-container
//                    mat-snack-bar-container-enter
//                    mat-snack-bar-container-animations-enabled
//                    [...panelClass]">
//           <div class="mdc-snackbar__surface mat-mdc-snackbar-surface">
//             <div class="mat-mdc-snack-bar-label [mdc-snackbar__label]">  <!-- see LABEL CLASS note -->
//               <!-- BEFORE the ~150ms screen-reader-announce move (see below): -->
//               <div aria-hidden="true">...content...</div>
//               <div aria-live="polite|assertive|off" [id]="mat-snack-bar-container-live-#"></div>
//               <!-- AFTER the move, the two divs above are replaced by: -->
//               <div aria-live="polite|assertive|off" [id]="mat-snack-bar-container-live-#">
//                 <div>...content...</div>  <!-- the relocated former aria-hidden div -->
//               </div>
//             </div>
//           </div>
//         </mat-snack-bar-container>
//       </div>
//     </div>
//   </div>
//
// NO BACKDROP: snack bars never set `hasBackdrop`, so unlike mat-dialog/cdk-dialog there is
// never a `.cdk-overlay-backdrop` element to account for.
//
// OUTSIDE THE COMPARED ROOT (not visible to the spec, worth knowing about): merely injecting
// `MatSnackBar` (which injects `LiveAnnouncer`) eagerly creates a
// `<div class="cdk-live-announcer-element cdk-visually-hidden" aria-live="polite" aria-atomic="true"
//      id="cdk-live-announcer-#">` appended directly to `<body>` — a sibling of
// `.cdk-overlay-container`, not a descendant, so it is never part of any snapshot here. None of
// these scenarios set `announcementMessage`, so `LiveAnnouncer.announce()` is never actually
// called in any of them — the element still exists (eagerly, on construction) but stays empty.
//
// SCREEN-READER ANNOUNCE MOVE (the trickiest timing in this component — the spec MUST wait for
// it before every snapshot): `MatSnackBarContainer.enter()` calls `_screenReaderAnnounce()`,
// which — independent of CSS animation state, politeness, or duration — starts a *plain*
// `setTimeout(..., 150)` (outside Angular's zone) that relocates the WHOLE `<div
// aria-hidden="true">` wrapper (not just its content) to become a child of the sibling `<div
// aria-live="...">` wrapper, stripping the `aria-hidden` attribute off it in the process (see
// `MatSnackBarContainer._screenReaderAnnounce`: `inertElement.removeAttribute('aria-hidden');
// liveElement.appendChild(inertElement);`). So the actual content ends up nested ONE level
// deeper after the move than before it (`<div aria-live>` → bare `<div>` (ex-`aria-hidden`) →
// content), and — crucially for a settle check — there is no longer any `[aria-hidden]` element
// anywhere in the container once this has happened. Until it fires, the content sits inside the
// still-`aria-hidden` div and the `aria-live` div is empty; this is a genuine DOM structural
// mutation on a timer, not tied to `animationend` at all, so the spec polls for "no
// `[aria-hidden]` element remains under `.mat-mdc-snack-bar-label`" before taking any snapshot
// after opening a snack bar — see `waitSettled()` in the parity spec.
//
// ANIMATION CLASSES: `_animationState` ('void' initially, 'visible' after `enter()`, 'hidden'
// after `exit()`) drives `mat-snack-bar-container-enter` / `mat-snack-bar-container-exit` host
// classes, which key CSS `animation: _mat-snack-bar-enter 150ms ...` / `..._exit 75ms ...`
// (`mat-snack-bar-container-animations-enabled` gates both — present because none of these
// scenarios disable animations). Both durations are well under the 200ms JS fallback timer in
// `enter()`/`exit()`, so the fallback (`mat-snack-bar-fallback-visible`) class is not expected to
// appear in practice. Once visible, the `-enter` class is NOT removed again (unlike mat-dialog's
// transient `--opening` class) — it stays for the snack bar's whole visible lifetime. On
// dismissal the host also gains a bare `mat-exit` attribute (`setAttribute('mat-exit', '')`,
// see `MatSnackBarHarness.hostSelector = '.mat-mdc-snack-bar-container:not([mat-exit])'`) for the
// ~75ms exit animation before the whole overlay (host + pane + container) is removed from the
// DOM. The spec does not try to catch that transient `mat-exit` frame — it waits straight
// through to full removal (`state: 'detached'`), the same "wait for the settled end-state, not
// the transient" approach `specs/material-dialog/angular-parity.spec.ts` uses for MDC's dialog
// open/close classes.
//
// REPLACEMENT: if a snack bar is already open when `MatSnackBar.open*()` is called again,
// `_attach()` attaches the NEW container's overlay before `_animateSnackBar()` even looks at
// whether to dismiss a previous one — only the new container's `enter()` call is deferred,
// until the old one's `afterDismissed()` fires. Verified directly against the running app: the
// old (now exiting) and new (not yet entered) `mat-snack-bar-container` elements ARE both
// present in the DOM for the ~75ms the old one's exit animation takes (an earlier version of
// this comment claimed otherwise, from reading the source without checking the real timing —
// that was wrong). The horizontal/vertical position and politeness scenarios below each click
// through several triggers in sequence, exercising this replace path repeatedly for free; see
// `specs/material-snack-bar/angular-parity.spec.ts`'s header comment, point 2, for how its
// `waitSettled()`-based steps account for this two-containers-at-once window.
//
// LIVE REGION / POLITENESS: `_live` ('polite' default, 'assertive', or 'off') feeds
// `[attr.aria-live]="_live"` unconditionally (always a real attribute, including the literal
// string `"off"` — never omitted). `_role` ('status'/'alert') is ONLY ever set on Firefox
// (`this._platform.FIREFOX`); under Chromium (what Playwright uses here) `_role` stays
// `undefined` and `[attr.role]="_role"` never renders a `role` attribute at all, for any
// politeness value. The live element's id (`mat-snack-bar-container-live-#`) is a per-container
// `_IdGenerator` id — digits get squashed by the harness's `ID_ATTRS` normalization like any
// other auto id.
//
// LABEL CLASS note (`mdc-snackbar__label` on the OUTER `.mat-mdc-snack-bar-label` wrapper):
// `_afterPortalAttached()` checks whether the attached content already contains an element with
// class `mdc-snackbar__label` anywhere in its subtree. `MatSnackBarLabel`
// (`[matSnackBarLabel]`) itself carries that class, so both `SimpleSnackBar` (the `open()`
// convenience method) and the `custom-component` scenario below (which applies
// `matSnackBarLabel` explicitly) do NOT get the class added a second time onto the outer
// wrapper. The `from-template` scenario's content is plain interpolated text with no element at
// all, let alone one with that class, so for THAT scenario only, the outer wrapper itself picks
// up the extra `mdc-snackbar__label` class — the one structural difference between the two
// "custom content" scenarios below, called out again per-scenario.
//
// OVERLAY POSITIONING (`GlobalPositionStrategy`, LTR — no scenario sets `direction: 'rtl'`):
// horizontal/vertical position change exactly two inline styles — `justify-content` /
// `align-items` on the wrapper (`OverlayRef.hostElement`) and `margin-*` on the pane
// (`OverlayRef.overlayElement`) — `position` on the pane is always the literal string `static`
// (`GlobalPositionStrategy` never changes its private `_cssPosition` field away from that
// default). Computed per value (LTR):
//   - horizontalPosition 'center' (default): wrapper `justify-content: center`; pane gets no
//     horizontal margin at all (the `centerHorizontally()` call passes no offset, so the
//     assigned `''` never becomes a real inline declaration).
//   - horizontalPosition 'left' OR 'start' (these two collapse to the SAME internal state and
//     therefore the SAME DOM in LTR — `_createOverlay` maps both to `positionStrategy.left('0')`):
//     wrapper `justify-content: flex-start`; pane `margin-left: 0px`.
//   - horizontalPosition 'right' OR 'end' (same collapse, both map to
//     `positionStrategy.right('0')`): wrapper `justify-content: flex-end`; pane
//     `margin-right: 0px`.
//   - verticalPosition 'bottom' (default): wrapper `align-items: flex-end`; pane
//     `margin-bottom: 0px` (note: `_createOverlay` calls `positionStrategy.bottom('0')` with an
//     explicit `'0'`, not the empty default, so this margin IS present even for the default).
//   - verticalPosition 'top': wrapper `align-items: flex-start`; pane `margin-top: 0px`.
// So, e.g., the untouched default (center/bottom) produces pane `style="position: static;
// margin-bottom: 0px;"` and wrapper `style="justify-content: center; align-items: flex-end;"`.
//
// PANEL CLASS: `config.panelClass` (string or string[]) is applied with plain `classList.add`
// directly onto the `<mat-snack-bar-container>` host element itself (not the pane/wrapper),
// alongside its other host classes.
//
// HANDSET MODE (not exercised/asserted by any scenario here, mentioned so it isn't mistaken for
// a bug): `MatSnackBar._attach()` subscribes to `BreakpointObserver.observe(HandsetPortrait)`
// and toggles a `mat-mdc-snack-bar-handset` class on the PANE (`overlayRef.overlayElement`,
// `.cdk-overlay-pane`) when the viewport matches. Playwright's default 1280×720 viewport never
// matches `HandsetPortrait`, so this class is never expected to appear in any snapshot below.
//
// CUSTOM COMPONENT HOST TAG (`custom-component` scenario): `MatSnackBar.openFromComponent()`
// instantiates the given component via `ComponentPortal`, same mechanism as `MatDialog.open()`
// (see src/dev-app/qwik-parity/dialog.ts's header comment on `DialogScenarioBody` et al., and
// src/qwik-cdk-dev-app/src/scenarios/_mat-template.tsx's `NgComponentHost`/`<ng-component>`
// convention). Components with NO explicit `selector` fall back to Angular's generic
// `<ng-component>` host tag; to avoid relying on that fallback here, `ParitySnackBarContent`
// below is given an explicit selector (`parity-snack-bar-content`) — the Qwik side's content
// component should wrap its own body in a matching `<parity-snack-bar-content>` tag, the same
// "content component host element" convention the dialog scenarios established.
//
// CONSUMER SELECTOR ATTRIBUTES: the `custom-component` scenario's template writes
// `matSnackBarLabel`, `matSnackBarActions` and `matSnackBarAction` as directive selectors on its
// own elements (lowercased by the DOM to `matsnackbarlabel`, `matsnackbaractions`,
// `matsnackbaraction`) — these are consumer-written, like `matFab`/`mat-dialog-close` elsewhere,
// NOT part of the component's own DOM contract, and should be added to
// `CONSUMER_SELECTOR_ATTRS` in lib/material-parity.ts (not done here — out of scope for this
// Angular-only change; see handback report).
// ============================================================================================

/**
 * `simple-message`: one trigger ("Show message") opens `snackBar.open('File deleted')` — no
 * action, default politeness/position. A second trigger ("Dismiss") calls
 * `MatSnackBar.dismiss()` directly (the service-level dismiss, as opposed to the snack bar's own
 * action button exercised by `with-action` below).
 */
@Component({
  template: `
    <div data-parity-root>
      <button (click)="open()">Show message</button>
      <button (click)="dismiss()">Dismiss</button>
    </div>
  `,
})
export class SnackBarSimpleMessage {
  private snackBar = inject(MatSnackBar);

  open() {
    this.snackBar.open('File deleted');
  }

  dismiss() {
    this.snackBar.dismiss();
  }
}

/**
 * `with-action`: one trigger ("Show with action") opens `snackBar.open('Message archived',
 * 'Undo')` — exercises `SimpleSnackBar`'s `@if (hasAction)` branch (the `matSnackBarActions`
 * wrapper + `matButton matSnackBarAction` button, text "Undo"). Clicking that action button
 * calls `MatSnackBarRef.dismissWithAction()`, which dismisses the snack bar the same way
 * `dismiss()` does (adds `mat-exit`, runs the exit animation, removes the overlay).
 */
@Component({
  template: `
    <div data-parity-root>
      <button (click)="open()">Show with action</button>
    </div>
  `,
})
export class SnackBarWithAction {
  private snackBar = inject(MatSnackBar);

  open() {
    this.snackBar.open('Message archived', 'Undo');
  }
}

/**
 * `horizontal-position`: five triggers, one per `MatSnackBarHorizontalPosition` value, each
 * opening the SAME message with only `horizontalPosition` varying. Clicking a later trigger
 * while an earlier snack bar is still open exercises the "opening a second snack bar replaces
 * the first" path (see REPLACEMENT above) four times over. In LTR, 'left'/'start' produce
 * identical DOM to each other, and 'right'/'end' likewise (see OVERLAY POSITIONING above) — all
 * five are still exercised since the named value is what's bound, even where the resulting DOM
 * coincides.
 */
@Component({
  template: `
    <div data-parity-root>
      <button (click)="show('start')">Start</button>
      <button (click)="show('center')">Center</button>
      <button (click)="show('end')">End</button>
      <button (click)="show('left')">Left</button>
      <button (click)="show('right')">Right</button>
    </div>
  `,
})
export class SnackBarHorizontalPosition {
  private snackBar = inject(MatSnackBar);

  show(horizontalPosition: MatSnackBarHorizontalPosition) {
    this.snackBar.open('Positioned message', '', {horizontalPosition});
  }
}

/**
 * `vertical-position`: two triggers, 'top' and 'bottom', each opening the same message with
 * only `verticalPosition` varying (horizontalPosition stays default 'center'). Clicking the
 * second trigger exercises the replace path once more.
 */
@Component({
  template: `
    <div data-parity-root>
      <button (click)="show('top')">Top</button>
      <button (click)="show('bottom')">Bottom</button>
    </div>
  `,
})
export class SnackBarVerticalPosition {
  private snackBar = inject(MatSnackBar);

  show(verticalPosition: MatSnackBarVerticalPosition) {
    this.snackBar.open('Positioned message', '', {verticalPosition});
  }
}

/**
 * `panel-class`: one trigger opens `snackBar.open('Styled message', '', {panelClass: [...]})`
 * with a two-element array — both classes must land directly on the `<mat-snack-bar-container>`
 * host element (see PANEL CLASS above), alongside its usual `mdc-snackbar`/`mat-mdc-snack-bar-
 * container`/animation-state classes.
 */
@Component({
  template: `
    <div data-parity-root>
      <button (click)="open()">Show styled</button>
    </div>
  `,
})
export class SnackBarPanelClass {
  private snackBar = inject(MatSnackBar);

  open() {
    this.snackBar.open('Styled message', '', {panelClass: ['my-snack-a', 'my-snack-b']});
  }
}

/**
 * `politeness`: two triggers, 'assertive' and 'off' (see LIVE REGION / POLITENESS above for why
 * 'polite' itself — the default — is already covered by every other scenario and not repeated
 * here). Neither sets `announcementMessage`, so each only changes the live element's
 * `aria-live` value (never its presence, and never a `role` attribute under Chromium). Clicking
 * the second trigger exercises the replace path once more.
 */
@Component({
  template: `
    <div data-parity-root>
      <button (click)="show('assertive')">Assertive</button>
      <button (click)="show('off')">Off</button>
    </div>
  `,
})
export class SnackBarPoliteness {
  private snackBar = inject(MatSnackBar);

  show(politeness: AriaLivePoliteness) {
    this.snackBar.open('Announced message', '', {politeness});
  }
}

/**
 * Content component for the `custom-component` scenario below. Deliberately given an explicit
 * selector (see CUSTOM COMPONENT HOST TAG above) rather than relying on Angular's `ng-component`
 * fallback. Mirrors upstream's own annotated-custom-component example
 * (components-examples/material/snack-bar/snack-bar-annotated-component): a `matSnackBarLabel`
 * element, a `matSnackBarActions` wrapper containing one `matButton matSnackBarAction` button
 * that calls `dismissWithAction()` via the injected `MatSnackBarRef`.
 */
@Component({
  selector: 'parity-snack-bar-content',
  template: `
    <span matSnackBarLabel>Order confirmed</span>
    <span matSnackBarActions>
      <button matButton matSnackBarAction (click)="snackBarRef.dismissWithAction()">View</button>
    </span>
  `,
  imports: [MatButtonModule, MatSnackBarLabel, MatSnackBarActions, MatSnackBarAction],
})
export class ParitySnackBarContent {
  snackBarRef = inject<MatSnackBarRef<ParitySnackBarContent>>(MatSnackBarRef);
}

/**
 * `custom-component`: one trigger opens `snackBar.openFromComponent(ParitySnackBarContent)` (no
 * config — default politeness/position, no duration). Because the content provides its own
 * `matSnackBarLabel`, the outer `.mat-mdc-snack-bar-label` wrapper does NOT gain the extra
 * `mdc-snackbar__label` class (see LABEL CLASS note above; contrast with `from-template` below).
 */
@Component({
  template: `
    <div data-parity-root>
      <button (click)="open()">Show custom</button>
    </div>
  `,
})
export class SnackBarCustomComponent {
  private snackBar = inject(MatSnackBar);

  open() {
    this.snackBar.openFromComponent(ParitySnackBarContent);
  }
}

/**
 * `from-template`: one trigger opens `snackBar.openFromTemplate(this.tpl)`, where `tpl` is a
 * plain `<ng-template>` containing only interpolated text (`Delivered to {{ recipient }}`) —
 * mirrors upstream's own `snack-bar.spec.ts` `ComponentWithTemplateRef` fixture. Since the
 * rendered content is a bare text node with no element at all, the outer `.mat-mdc-snack-bar-
 * label` wrapper DOES gain the extra `mdc-snackbar__label` class this time (see LABEL CLASS note
 * above; contrast with `custom-component` above, which doesn't). A second trigger ("Dismiss")
 * calls `MatSnackBar.dismiss()`, re-confirming clean removal for this no-`matSnackBarLabel`
 * content path too.
 */
@Component({
  template: `
    <div data-parity-root>
      <button (click)="open()">Show template</button>
      <button (click)="dismiss()">Dismiss</button>
    </div>
    <ng-template #tpl>Delivered to {{ recipient }}</ng-template>
  `,
})
export class SnackBarFromTemplate {
  private snackBar = inject(MatSnackBar);
  recipient = 'Alex';

  @ViewChild('tpl') private tpl!: TemplateRef<unknown>;

  open() {
    this.snackBar.openFromTemplate(this.tpl);
  }

  dismiss() {
    this.snackBar.dismiss();
  }
}

export const SNACK_BAR_SCENARIOS: Record<string, Type<unknown>> = {
  'simple-message': SnackBarSimpleMessage,
  'with-action': SnackBarWithAction,
  'horizontal-position': SnackBarHorizontalPosition,
  'vertical-position': SnackBarVerticalPosition,
  'panel-class': SnackBarPanelClass,
  'politeness': SnackBarPoliteness,
  'custom-component': SnackBarCustomComponent,
  'from-template': SnackBarFromTemplate,
};
