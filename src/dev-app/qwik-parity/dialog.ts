import {Component, OnInit, Type, inject} from '@angular/core';
import {
  MatDialog,
  MatDialogActions,
  MatDialogClose,
  MatDialogContent,
  MatDialogTitle,
} from '@angular/material/dialog';

// Each scenario mirrors src/qwik-cdk-dev-app/src/routes/mat-dialog/<name>/index.tsx.
//
// Dialogs render into the CDK overlay container under <body>, not inside the
// routed component's own DOM, so `angular-parity.spec.ts` compares with
// `rootSelector: '.cdk-overlay-container'` rather than the default
// `[data-parity-root]`. The `<div data-parity-root>` below therefore only
// has to exist (expectMaterialParity's open() waits on it) — its own content
// is never diffed for this component.
//
// Most Qwik routes use the shared `<MatAutoOpen>` scenario helper
// (src/qwik-cdk-dev-app/src/scenarios/_mat-template.tsx), which opens the
// dialog itself from a useVisibleTask$ with no visible trigger element;
// those are mirrored here by opening MatDialog from ngOnInit, the closest
// Angular equivalent of "open as soon as this component mounts". The two
// routes with a real trigger button (close-with-result, restore-focus) are
// mirrored with an actual (click)-bound button using the same CSS class the
// spec clicks, so the step resolves identically on both pages.
//
// MatDialogClose/-Title/-Content/-Actions are real directives, not a wrapper
// that injects its own classes, so any @Input that must NOT be echoed onto
// the host as a static attribute (the close `result`, the actions `align`)
// is bound with `[prop]="..."` syntax — see button-toggle.ts for why a bare
// static attribute would leak onto the DOM there.
//
// Known drift (expected, not fixed here — qwik-material/dialog differs from
// the real directives):
//   - MatDialogConfig.ariaModal defaults to `false` upstream; qwik-material's
//     MatDialogContainer defaults it to `true`. None of these scenarios set
//     ariaModal explicitly, so every one of them will show a real `aria-modal`
//     mismatch ("false" vs "true").
//   - The real MatDialogClose directive has no default aria-label (host
//     binding is `ariaLabel || null`) and adds no CSS class of its own.
//     qwik-material's <MatDialogClose> always renders `aria-label="Close
//     dialog"` and a hardcoded `class="mat-mdc-dialog-close"`. Scenarios here
//     that use a bare `<button mat-dialog-close>` (restore-focus) will show
//     both of those as Qwik-only attributes/classes.

/** Shared body for scenarios that mirror Qwik's default `MatScenarioBody`. */
@Component({
  template: `<div class="mat-scenario-body">Material scenario body</div>`,
})
export class DialogScenarioBody {}

@Component({
  template: `<div data-parity-root></div>`,
})
export class DialogBasic implements OnInit {
  private dialog = inject(MatDialog);
  ngOnInit() {
    this.dialog.open(DialogScenarioBody, {hasBackdrop: true});
  }
}

@Component({
  template: `<div data-parity-root></div>`,
})
export class DialogAriaLabel implements OnInit {
  private dialog = inject(MatDialog);
  ngOnInit() {
    this.dialog.open(DialogScenarioBody, {hasBackdrop: true, ariaLabel: 'Settings dialog'});
  }
}

@Component({
  template: `
    <h2 mat-dialog-title>Custom title</h2>
    <p>Body</p>
  `,
  imports: [MatDialogTitle],
})
export class DialogAriaLabelledbyBody {}

@Component({
  template: `<div data-parity-root></div>`,
})
export class DialogAriaLabelledby implements OnInit {
  private dialog = inject(MatDialog);
  ngOnInit() {
    this.dialog.open(DialogAriaLabelledbyBody, {hasBackdrop: true});
  }
}

@Component({
  template: `<p id="my-desc">Description</p>`,
})
export class DialogAriaDescribedbyBody {}

@Component({
  template: `<div data-parity-root></div>`,
})
export class DialogAriaDescribedby implements OnInit {
  private dialog = inject(MatDialog);
  ngOnInit() {
    this.dialog.open(DialogAriaDescribedbyBody, {hasBackdrop: true, ariaDescribedBy: 'my-desc'});
  }
}

@Component({
  template: `<p>Click outside to close</p>`,
})
export class DialogCloseOnBackdropBody {}

@Component({
  template: `<div data-parity-root></div>`,
})
export class DialogCloseOnBackdrop implements OnInit {
  private dialog = inject(MatDialog);
  ngOnInit() {
    this.dialog.open(DialogCloseOnBackdropBody, {hasBackdrop: true});
  }
}

@Component({
  template: `<p>Press Escape to close</p>`,
})
export class DialogCloseOnEscapeBody {}

@Component({
  template: `<div data-parity-root></div>`,
})
export class DialogCloseOnEscape implements OnInit {
  private dialog = inject(MatDialog);
  ngOnInit() {
    this.dialog.open(DialogCloseOnEscapeBody, {hasBackdrop: true});
  }
}

@Component({
  template: `<button [mat-dialog-close]="'hello world'">Close with result</button>`,
  imports: [MatDialogClose],
})
export class DialogCloseWithResultBody {}

@Component({
  template: `
    <div data-parity-root>
      <button class="open-button" (click)="onOpen()">Open</button>
      <div class="result" data-result>{{ result }}</div>
    </div>
  `,
})
export class DialogCloseWithResult {
  private dialog = inject(MatDialog);
  result = '';

  onOpen() {
    const ref = this.dialog.open(DialogCloseWithResultBody, {hasBackdrop: true});
    ref.afterClosed().subscribe(r => {
      this.result = String(r ?? '(closed with no result)');
    });
  }
}

@Component({
  template: `<div data-parity-root></div>`,
})
export class DialogDisableClose implements OnInit {
  private dialog = inject(MatDialog);
  ngOnInit() {
    this.dialog.open(DialogScenarioBody, {hasBackdrop: true, disableClose: true});
  }
}

@Component({
  template: `
    <mat-dialog-content>Are you sure?</mat-dialog-content>
    <mat-dialog-actions [align]="'end'">
      <button [mat-dialog-close]="'no'">No</button>
      <button [mat-dialog-close]="'yes'">Yes</button>
    </mat-dialog-actions>
  `,
  imports: [MatDialogContent, MatDialogActions, MatDialogClose],
})
export class DialogHasActionsBody {}

@Component({
  template: `<div data-parity-root></div>`,
})
export class DialogHasActions implements OnInit {
  private dialog = inject(MatDialog);
  ngOnInit() {
    this.dialog.open(DialogHasActionsBody, {hasBackdrop: true});
  }
}

@Component({
  template: `<p>Panel classes applied</p>`,
})
export class DialogPanelClassBody {}

@Component({
  template: `<div data-parity-root></div>`,
})
export class DialogPanelClass implements OnInit {
  private dialog = inject(MatDialog);
  ngOnInit() {
    this.dialog.open(DialogPanelClassBody, {
      hasBackdrop: true,
      panelClass: ['my-panel-a', 'my-panel-b'],
    });
  }
}

@Component({
  template: `
    <button>Focus me</button>
    <button mat-dialog-close>Close</button>
  `,
  imports: [MatDialogClose],
})
export class DialogRestoreFocusBody {}

@Component({
  template: `
    <div data-parity-root>
      <button class="restore-trigger" (click)="onOpen()">Open</button>
    </div>
  `,
})
export class DialogRestoreFocus {
  private dialog = inject(MatDialog);
  onOpen() {
    this.dialog.open(DialogRestoreFocusBody, {hasBackdrop: true, restoreFocus: true});
  }
}

@Component({
  template: `<div data-parity-root></div>`,
})
export class DialogRoleAlertdialog implements OnInit {
  private dialog = inject(MatDialog);
  ngOnInit() {
    this.dialog.open(DialogScenarioBody, {hasBackdrop: true, role: 'alertdialog'});
  }
}

export const DIALOG_SCENARIOS: Record<string, Type<unknown>> = {
  'aria-describedby': DialogAriaDescribedby,
  'aria-label': DialogAriaLabel,
  'aria-labelledby': DialogAriaLabelledby,
  'basic': DialogBasic,
  'close-on-backdrop': DialogCloseOnBackdrop,
  'close-on-escape': DialogCloseOnEscape,
  'close-with-result': DialogCloseWithResult,
  'disable-close': DialogDisableClose,
  'has-actions': DialogHasActions,
  'panel-class': DialogPanelClass,
  'restore-focus': DialogRestoreFocus,
  'role-alertdialog': DialogRoleAlertdialog,
};
