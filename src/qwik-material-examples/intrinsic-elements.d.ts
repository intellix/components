import type {QwikIntrinsicElements} from '@qwik.dev/core';

/**
 * TypeScript augmentation for the custom-element host tags rendered by these docs-example
 * modules. Each tag mirrors the real upstream example component's own Angular `selector` — see
 * `src/qwik-cdk-dev-app/src/scenarios/_examples-intrinsic-elements.d.ts` for the (now partial,
 * dev-app-local) sibling declaration this supersedes for every module that lives here.
 */
declare module '@qwik.dev/core' {
  namespace QwikJSX {
    interface IntrinsicElements {
      'autocomplete-simple-example': QwikIntrinsicElements['div'];
      'badge-overview-example': QwikIntrinsicElements['div'];
      'bottom-sheet-overview-example': QwikIntrinsicElements['div'];
      'ripple-overview-example': QwikIntrinsicElements['div'];
      'button-overview-example': QwikIntrinsicElements['div'];
      'button-toggle-overview-example': QwikIntrinsicElements['div'];
      'card-overview-example': QwikIntrinsicElements['div'];
      'checkbox-overview-example': QwikIntrinsicElements['div'];
      'chips-overview-example': QwikIntrinsicElements['div'];
      'datepicker-overview-example': QwikIntrinsicElements['div'];
      'dialog-overview-example': QwikIntrinsicElements['div'];
      'divider-overview-example': QwikIntrinsicElements['div'];
      'expansion-overview-example': QwikIntrinsicElements['div'];
      'form-field-overview-example': QwikIntrinsicElements['div'];
      'grid-list-overview-example': QwikIntrinsicElements['div'];
      'icon-overview-example': QwikIntrinsicElements['div'];
      'input-overview-example': QwikIntrinsicElements['div'];
      'list-overview-example': QwikIntrinsicElements['div'];
      'menu-overview-example': QwikIntrinsicElements['div'];
      'paginator-overview-example': QwikIntrinsicElements['div'];
      'progress-bar-determinate-example': QwikIntrinsicElements['div'];
      'progress-spinner-overview-example': QwikIntrinsicElements['div'];
      'radio-overview-example': QwikIntrinsicElements['div'];
      'select-overview-example': QwikIntrinsicElements['div'];
      'sidenav-overview-example': QwikIntrinsicElements['div'];
      'slide-toggle-overview-example': QwikIntrinsicElements['div'];
      'slider-overview-example': QwikIntrinsicElements['div'];
      'snack-bar-overview-example': QwikIntrinsicElements['div'];
      'sort-overview-example': QwikIntrinsicElements['div'];
      'stepper-overview-example': QwikIntrinsicElements['div'];
      'table-basic-example': QwikIntrinsicElements['div'];
      'tab-group-basic-example': QwikIntrinsicElements['div'];
      'timepicker-overview-example': QwikIntrinsicElements['div'];
      'toolbar-overview-example': QwikIntrinsicElements['div'];
      'tooltip-overview-example': QwikIntrinsicElements['div'];
      'tree-flat-child-accessor-overview-example': QwikIntrinsicElements['div'];
      'tree-nested-child-accessor-overview-example': QwikIntrinsicElements['div'];
      'bottom-sheet-overview-example-sheet': QwikIntrinsicElements['div'];
      'dialog-overview-example-dialog': QwikIntrinsicElements['div'];
    }
  }
}
