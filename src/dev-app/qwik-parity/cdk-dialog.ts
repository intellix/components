import {Component, ElementRef, Injector, Type, afterNextRender, inject} from '@angular/core';
import {DIALOG_DATA, Dialog} from '@angular/cdk/dialog';
import {createBlockScrollStrategy, createGlobalPositionStrategy} from '@angular/cdk/overlay';

// Each scenario mirrors src/qwik-cdk-dev-app/src/routes/dialog/<name>/index.tsx, which uses the
// `AutoOpen` helper (src/qwik-cdk-dev-app/src/scenarios/_template.tsx): the dialog opens itself
// once the component mounts on the client, via `useVisibleTask$` — there is no trigger button to
// click. The Angular mirror reproduces that with `afterNextRender` in the constructor, the closest
// browser-only "after this rendered" hook available. `[data-parity-root]` therefore wraps only the
// page's own (non-dialog) content, which is empty for every scenario except `restore-focus`. The
// dialog itself renders into `.cdk-overlay-container` under <body>, which the spec compares via
// `rootSelector: '.cdk-overlay-container'`.
//
// Content components (below) are opened via the real `Dialog.open(Component, config)` API (not
// MatDialog), matching the Qwik scenario bodies in src/qwik-cdk-dev-app/src/scenarios/_template.tsx
// 1:1. Note: Angular's `ComponentPortal` always instantiates a host element for the attached
// component (tag name = its selector); Qwik's `component$` bodies have no such host wrapper. This
// means every scenario below will show one extra wrapper element around the dialog body content
// that has no Qwik equivalent — see the SYNC/report notes, this is architectural and not fixed here.

@Component({
  selector: 'cdk-dialog-scenario-body',
  template: `<div class="scenario-body">scenario</div>`,
})
export class CdkDialogScenarioBody {}

@Component({
  selector: 'cdk-dialog-data-body',
  template: `<div class="scenario-body">{{ data.msg }}</div>`,
})
export class CdkDialogDataBody {
  data = inject<{msg: string}>(DIALOG_DATA);
}

@Component({
  selector: 'cdk-dialog-focusable-body',
  template: `
    <h2>Heading</h2>
    <button class="first-button">First</button>
    <input class="text-input" type="text" />
  `,
})
export class CdkDialogFocusableBody {}

@Component({
  selector: 'cdk-dialog-labelled-body',
  template: `
    <h2 id="dialog-title">Title</h2>
    <p>Content</p>
  `,
})
export class CdkDialogLabelledBody {}

@Component({
  selector: 'cdk-dialog-described-body',
  template: `
    <h2>Title</h2>
    <p id="dialog-desc">Description</p>
  `,
})
export class CdkDialogDescribedBody {}

@Component({template: `<div data-parity-root></div>`})
export class CdkDialogBasic {
  private dialog = inject(Dialog);
  constructor() {
    afterNextRender(() => {
      this.dialog.open(CdkDialogScenarioBody, {hasBackdrop: true});
    });
  }
}

@Component({template: `<div data-parity-root></div>`})
export class CdkDialogAriaLabel {
  private dialog = inject(Dialog);
  constructor() {
    afterNextRender(() => {
      this.dialog.open(CdkDialogScenarioBody, {hasBackdrop: true, ariaLabel: 'Settings dialog'});
    });
  }
}

@Component({template: `<div data-parity-root></div>`})
export class CdkDialogAriaLabelledby {
  private dialog = inject(Dialog);
  constructor() {
    afterNextRender(() => {
      this.dialog.open(CdkDialogLabelledBody, {hasBackdrop: true, ariaLabelledBy: 'dialog-title'});
    });
  }
}

@Component({template: `<div data-parity-root></div>`})
export class CdkDialogAriaDescribedby {
  private dialog = inject(Dialog);
  constructor() {
    afterNextRender(() => {
      this.dialog.open(CdkDialogDescribedBody, {hasBackdrop: true, ariaDescribedBy: 'dialog-desc'});
    });
  }
}

@Component({template: `<div data-parity-root></div>`})
export class CdkDialogAlertdialogRole {
  private dialog = inject(Dialog);
  constructor() {
    afterNextRender(() => {
      this.dialog.open(CdkDialogScenarioBody, {hasBackdrop: true, role: 'alertdialog'});
    });
  }
}

@Component({template: `<div data-parity-root></div>`})
export class CdkDialogAutoFocusDisabled {
  private dialog = inject(Dialog);
  constructor() {
    afterNextRender(() => {
      this.dialog.open(CdkDialogFocusableBody, {hasBackdrop: true, autoFocus: false});
    });
  }
}

@Component({template: `<div data-parity-root></div>`})
export class CdkDialogAutoFocusFirstHeading {
  private dialog = inject(Dialog);
  constructor() {
    afterNextRender(() => {
      this.dialog.open(CdkDialogFocusableBody, {hasBackdrop: true, autoFocus: 'first-heading'});
    });
  }
}

@Component({template: `<div data-parity-root></div>`})
export class CdkDialogAutoFocusFirstTabbable {
  private dialog = inject(Dialog);
  constructor() {
    afterNextRender(() => {
      this.dialog.open(CdkDialogFocusableBody, {hasBackdrop: true, autoFocus: 'first-tabbable'});
    });
  }
}

@Component({template: `<div data-parity-root></div>`})
export class CdkDialogBackdropClickClose {
  private dialog = inject(Dialog);
  constructor() {
    afterNextRender(() => {
      this.dialog.open(CdkDialogScenarioBody, {hasBackdrop: true});
    });
  }
}

@Component({template: `<div data-parity-root></div>`})
export class CdkDialogCustomPanelClass {
  private dialog = inject(Dialog);
  constructor() {
    afterNextRender(() => {
      this.dialog.open(CdkDialogScenarioBody, {
        hasBackdrop: true,
        panelClass: ['my-panel', 'another-panel'],
      });
    });
  }
}

@Component({template: `<div data-parity-root></div>`})
export class CdkDialogCustomPosition {
  private dialog = inject(Dialog);
  private injector = inject(Injector);
  constructor() {
    afterNextRender(() => {
      const positionStrategy = createGlobalPositionStrategy(this.injector).top('10px').left('20px');
      this.dialog.open(CdkDialogScenarioBody, {hasBackdrop: true, positionStrategy});
    });
  }
}

@Component({template: `<div data-parity-root></div>`})
export class CdkDialogCustomScrollStrategy {
  private dialog = inject(Dialog);
  private injector = inject(Injector);
  constructor() {
    afterNextRender(() => {
      const scrollStrategy = createBlockScrollStrategy(this.injector);
      this.dialog.open(CdkDialogScenarioBody, {hasBackdrop: true, scrollStrategy});
    });
  }
}

@Component({template: `<div data-parity-root></div>`})
export class CdkDialogDisableClose {
  private dialog = inject(Dialog);
  constructor() {
    afterNextRender(() => {
      this.dialog.open(CdkDialogScenarioBody, {hasBackdrop: true, disableClose: true});
    });
  }
}

@Component({template: `<div data-parity-root></div>`})
export class CdkDialogEscapeClose {
  private dialog = inject(Dialog);
  constructor() {
    afterNextRender(() => {
      this.dialog.open(CdkDialogScenarioBody, {hasBackdrop: true});
    });
  }
}

@Component({template: `<div data-parity-root></div>`})
export class CdkDialogMinMax {
  private dialog = inject(Dialog);
  constructor() {
    afterNextRender(() => {
      this.dialog.open(CdkDialogScenarioBody, {
        hasBackdrop: true,
        minWidth: '100px',
        maxWidth: '500px',
        minHeight: '100px',
        maxHeight: '300px',
      });
    });
  }
}

@Component({template: `<div data-parity-root></div>`})
export class CdkDialogMultipleStacked {
  private dialog = inject(Dialog);
  constructor() {
    afterNextRender(() => {
      this.dialog.open(CdkDialogScenarioBody, {id: 'a', hasBackdrop: true});
      this.dialog.open(CdkDialogScenarioBody, {id: 'b', hasBackdrop: true});
    });
  }
}

@Component({template: `<div data-parity-root></div>`})
export class CdkDialogNoBackdrop {
  private dialog = inject(Dialog);
  constructor() {
    afterNextRender(() => {
      this.dialog.open(CdkDialogScenarioBody, {hasBackdrop: false});
    });
  }
}

@Component({
  template: `
    <div data-parity-root>
      <button class="restore-trigger">trigger</button>
    </div>
  `,
})
export class CdkDialogRestoreFocus {
  private dialog = inject(Dialog);
  private elementRef: ElementRef<HTMLElement> = inject(ElementRef);
  constructor() {
    afterNextRender(() => {
      const trigger = this.elementRef.nativeElement.querySelector<HTMLElement>('.restore-trigger');
      trigger?.focus();
      this.dialog.open(CdkDialogScenarioBody, {hasBackdrop: true, restoreFocus: true});
    });
  }
}

@Component({template: `<div data-parity-root></div>`})
export class CdkDialogWidthHeight {
  private dialog = inject(Dialog);
  constructor() {
    afterNextRender(() => {
      this.dialog.open(CdkDialogScenarioBody, {hasBackdrop: true, width: '300px', height: '200px'});
    });
  }
}

@Component({template: `<div data-parity-root></div>`})
export class CdkDialogWithData {
  private dialog = inject(Dialog);
  constructor() {
    afterNextRender(() => {
      this.dialog.open(CdkDialogDataBody, {hasBackdrop: true, data: {msg: 'hello world'}});
    });
  }
}

export const CDK_DIALOG_SCENARIOS: Record<string, Type<unknown>> = {
  'alertdialog-role': CdkDialogAlertdialogRole,
  'aria-describedby': CdkDialogAriaDescribedby,
  'aria-label': CdkDialogAriaLabel,
  'aria-labelledby': CdkDialogAriaLabelledby,
  'auto-focus-disabled': CdkDialogAutoFocusDisabled,
  'auto-focus-first-heading': CdkDialogAutoFocusFirstHeading,
  'auto-focus-first-tabbable': CdkDialogAutoFocusFirstTabbable,
  'backdrop-click-close': CdkDialogBackdropClickClose,
  'basic': CdkDialogBasic,
  'custom-panel-class': CdkDialogCustomPanelClass,
  'custom-position': CdkDialogCustomPosition,
  'custom-scroll-strategy': CdkDialogCustomScrollStrategy,
  'disable-close': CdkDialogDisableClose,
  'escape-close': CdkDialogEscapeClose,
  'min-max': CdkDialogMinMax,
  'multiple-stacked': CdkDialogMultipleStacked,
  'no-backdrop': CdkDialogNoBackdrop,
  'restore-focus': CdkDialogRestoreFocus,
  'width-height': CdkDialogWidthHeight,
  'with-data': CdkDialogWithData,
};
