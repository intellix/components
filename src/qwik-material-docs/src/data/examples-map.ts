/**
 * Mirrors `src/dev-app/qwik-parity/examples.ts`'s `MAIN_EXAMPLES` — the one headline
 * material.angular.dev example ported per component (two for `mat-form-field`: the form-field
 * example itself, and the plain `<input>` example, which is also `input`'s own headline example
 * on this site). Keep in sync with that file and with
 * `src/qwik-cdk-dev-app/src/routes/<devAppId>/<route>` / `src/qwik-material-examples/<pkg>/<route>`.
 *
 * `pkg` is the `@angular-community/qwik-material-examples/<pkg>/<route>` import segment (see that
 * package's `package.json` `exports`).
 */
export interface PortedExample {
  /** route segment under the dev-app's `<devAppId>/` (`example`, `example-input`). */
  route: string;
  /** Upstream example id — `src/components-examples/material/<component>/<exampleId>/`. */
  upstreamId: string;
  /** `qwik-material-examples` package segment (usually same as the component's `entryPoint`). */
  pkg: string;
}

/** devAppId -> ordered list of ported examples (first one is the "headline" example). */
export const PORTED_EXAMPLES: Record<string, PortedExample[]> = {
  'mat-autocomplete': [
    {route: 'example', upstreamId: 'autocomplete-simple', pkg: 'autocomplete'},
    {route: 'autocomplete-filter', upstreamId: 'autocomplete-filter', pkg: 'autocomplete'},
    {route: 'autocomplete-display', upstreamId: 'autocomplete-display', pkg: 'autocomplete'},
    {
      route: 'autocomplete-require-selection',
      upstreamId: 'autocomplete-require-selection',
      pkg: 'autocomplete',
    },
    {
      route: 'autocomplete-auto-active-first-option',
      upstreamId: 'autocomplete-auto-active-first-option',
      pkg: 'autocomplete',
    },
    {
      route: 'autocomplete-plain-input',
      upstreamId: 'autocomplete-plain-input',
      pkg: 'autocomplete',
    },
    {route: 'autocomplete-optgroup', upstreamId: 'autocomplete-optgroup', pkg: 'autocomplete'},
  ],
  'mat-badge': [{route: 'example', upstreamId: 'badge-overview', pkg: 'badge'}],
  'mat-bottom-sheet': [{route: 'example', upstreamId: 'bottom-sheet-overview', pkg: 'bottom-sheet'}],
  'mat-button': [
    {route: 'example', upstreamId: 'button-overview', pkg: 'button'},
    {
      route: 'button-disabled-interactive',
      upstreamId: 'button-disabled-interactive',
      pkg: 'button',
    },
  ],
  'mat-button-toggle': [
    {route: 'example', upstreamId: 'button-toggle-overview', pkg: 'button-toggle'},
    {route: 'button-toggle-mode', upstreamId: 'button-toggle-mode', pkg: 'button-toggle'},
    {
      route: 'button-toggle-appearance',
      upstreamId: 'button-toggle-appearance',
      pkg: 'button-toggle',
    },
    {route: 'button-toggle-forms', upstreamId: 'button-toggle-forms', pkg: 'button-toggle'},
  ],
  'mat-card': [{route: 'example', upstreamId: 'card-overview', pkg: 'card'}],
  'mat-checkbox': [
    {route: 'example', upstreamId: 'checkbox-overview', pkg: 'checkbox'},
    {route: 'checkbox-reactive-forms', upstreamId: 'checkbox-reactive-forms', pkg: 'checkbox'},
  ],
  'mat-chips': [
    {route: 'example', upstreamId: 'chips-overview', pkg: 'chips'},
    {route: 'chips-input', upstreamId: 'chips-input', pkg: 'chips'},
    {route: 'chips-template-form', upstreamId: 'chips-template-form', pkg: 'chips'},
    {route: 'chips-reactive-form', upstreamId: 'chips-reactive-form', pkg: 'chips'},
    {route: 'chips-autocomplete', upstreamId: 'chips-autocomplete', pkg: 'chips'},
    {route: 'chips-avatar', upstreamId: 'chips-avatar', pkg: 'chips'},
    {route: 'chips-stacked', upstreamId: 'chips-stacked', pkg: 'chips'},
  ],
  'mat-datepicker': [
    {route: 'example', upstreamId: 'datepicker-overview', pkg: 'datepicker'},
    {route: 'datepicker-custom-icon', upstreamId: 'datepicker-custom-icon', pkg: 'datepicker'},
    {
      route: 'date-range-picker-overview',
      upstreamId: 'date-range-picker-overview',
      pkg: 'datepicker',
    },
    {route: 'date-range-picker-forms', upstreamId: 'date-range-picker-forms', pkg: 'datepicker'},
    {route: 'datepicker-start-view', upstreamId: 'datepicker-start-view', pkg: 'datepicker'},
    {route: 'datepicker-value', upstreamId: 'datepicker-value', pkg: 'datepicker'},
    {route: 'datepicker-min-max', upstreamId: 'datepicker-min-max', pkg: 'datepicker'},
    {route: 'datepicker-filter', upstreamId: 'datepicker-filter', pkg: 'datepicker'},
    {route: 'datepicker-events', upstreamId: 'datepicker-events', pkg: 'datepicker'},
    {route: 'datepicker-disabled', upstreamId: 'datepicker-disabled', pkg: 'datepicker'},
    {route: 'datepicker-actions', upstreamId: 'datepicker-actions', pkg: 'datepicker'},
    {route: 'datepicker-touch', upstreamId: 'datepicker-touch', pkg: 'datepicker'},
    {
      route: 'datepicker-inline-calendar',
      upstreamId: 'datepicker-inline-calendar',
      pkg: 'datepicker',
    },
    {route: 'datepicker-date-class', upstreamId: 'datepicker-date-class', pkg: 'datepicker'},
    {route: 'datepicker-locale', upstreamId: 'datepicker-locale', pkg: 'datepicker'},
  ],
  'mat-dialog': [
    {route: 'example', upstreamId: 'dialog-overview', pkg: 'dialog'},
    {route: 'dialog-data', upstreamId: 'dialog-data', pkg: 'dialog'},
    {route: 'dialog-content', upstreamId: 'dialog-content', pkg: 'dialog'},
    {route: 'dialog-animations', upstreamId: 'dialog-animations', pkg: 'dialog'},
  ],
  'mat-divider': [{route: 'example', upstreamId: 'divider-overview', pkg: 'divider'}],
  'mat-expansion': [{route: 'example', upstreamId: 'expansion-overview', pkg: 'expansion'}],
  'mat-form-field': [
    {route: 'example', upstreamId: 'form-field-overview', pkg: 'form-field'},
    {route: 'example-input', upstreamId: 'input-overview', pkg: 'form-field'},
    {route: 'form-field-appearance', upstreamId: 'form-field-appearance', pkg: 'form-field'},
    {route: 'form-field-label', upstreamId: 'form-field-label', pkg: 'form-field'},
    {route: 'form-field-hint', upstreamId: 'form-field-hint', pkg: 'form-field'},
    {route: 'form-field-error', upstreamId: 'form-field-error', pkg: 'form-field'},
    {route: 'form-field-prefix-suffix', upstreamId: 'form-field-prefix-suffix', pkg: 'form-field'},
    {
      route: 'input-error-state-matcher',
      upstreamId: 'input-error-state-matcher',
      pkg: 'form-field',
    },
  ],
  'mat-grid-list': [{route: 'example', upstreamId: 'grid-list-overview', pkg: 'grid-list'}],
  'mat-icon': [
    {route: 'example', upstreamId: 'icon-overview', pkg: 'icon'},
    {route: 'icon-svg', upstreamId: 'icon-svg', pkg: 'icon'},
  ],
  'mat-list': [{route: 'example', upstreamId: 'list-overview', pkg: 'list'}],
  'mat-menu': [
    {route: 'example', upstreamId: 'menu-overview', pkg: 'menu'},
    {route: 'menu-icons', upstreamId: 'menu-icons', pkg: 'menu'},
    {route: 'menu-position', upstreamId: 'menu-position', pkg: 'menu'},
    {route: 'menu-nested', upstreamId: 'menu-nested', pkg: 'menu'},
  ],
  'mat-paginator': [{route: 'example', upstreamId: 'paginator-overview', pkg: 'paginator'}],
  'mat-progress-bar': [
    {route: 'example', upstreamId: 'progress-bar-determinate', pkg: 'progress-bar'},
    {
      route: 'progress-bar-indeterminate',
      upstreamId: 'progress-bar-indeterminate',
      pkg: 'progress-bar',
    },
    {route: 'progress-bar-buffer', upstreamId: 'progress-bar-buffer', pkg: 'progress-bar'},
    {route: 'progress-bar-query', upstreamId: 'progress-bar-query', pkg: 'progress-bar'},
  ],
  'mat-progress-spinner': [
    {route: 'example', upstreamId: 'progress-spinner-overview', pkg: 'progress-spinner'},
  ],
  'mat-radio': [
    {route: 'example', upstreamId: 'radio-overview', pkg: 'radio'},
    {route: 'radio-ng-model', upstreamId: 'radio-ng-model', pkg: 'radio'},
  ],
  'mat-select': [
    {route: 'example', upstreamId: 'select-overview', pkg: 'select'},
    {route: 'select-value-binding', upstreamId: 'select-value-binding', pkg: 'select'},
    {route: 'select-form', upstreamId: 'select-form', pkg: 'select'},
    {route: 'select-hint-error', upstreamId: 'select-hint-error', pkg: 'select'},
    {route: 'select-disabled', upstreamId: 'select-disabled', pkg: 'select'},
    {route: 'select-reset', upstreamId: 'select-reset', pkg: 'select'},
    {route: 'select-optgroup', upstreamId: 'select-optgroup', pkg: 'select'},
    {route: 'select-multiple', upstreamId: 'select-multiple', pkg: 'select'},
    {route: 'select-custom-trigger', upstreamId: 'select-custom-trigger', pkg: 'select'},
    {route: 'select-panel-class', upstreamId: 'select-panel-class', pkg: 'select'},
  ],
  'mat-sidenav': [
    {route: 'example', upstreamId: 'sidenav-overview', pkg: 'sidenav'},
    {route: 'sidenav-drawer-overview', upstreamId: 'sidenav-drawer-overview', pkg: 'sidenav'},
    {route: 'sidenav-position', upstreamId: 'sidenav-position', pkg: 'sidenav'},
    {route: 'sidenav-open-close', upstreamId: 'sidenav-open-close', pkg: 'sidenav'},
    {route: 'sidenav-mode', upstreamId: 'sidenav-mode', pkg: 'sidenav'},
    {route: 'sidenav-backdrop', upstreamId: 'sidenav-backdrop', pkg: 'sidenav'},
    {route: 'sidenav-disable-close', upstreamId: 'sidenav-disable-close', pkg: 'sidenav'},
    {route: 'sidenav-autosize', upstreamId: 'sidenav-autosize', pkg: 'sidenav'},
    {route: 'sidenav-fixed', upstreamId: 'sidenav-fixed', pkg: 'sidenav'},
    {route: 'sidenav-responsive', upstreamId: 'sidenav-responsive', pkg: 'sidenav'},
  ],
  'mat-slide-toggle': [
    {route: 'example', upstreamId: 'slide-toggle-overview', pkg: 'slide-toggle'},
    {route: 'slide-toggle-forms', upstreamId: 'slide-toggle-forms', pkg: 'slide-toggle'},
  ],
  'mat-slider': [
    {route: 'example', upstreamId: 'slider-overview', pkg: 'slider'},
    {route: 'slider-range', upstreamId: 'slider-range', pkg: 'slider'},
    {route: 'slider-formatting', upstreamId: 'slider-formatting', pkg: 'slider'},
  ],
  'mat-snack-bar': [
    {route: 'example', upstreamId: 'snack-bar-overview', pkg: 'snack-bar'},
    {
      route: 'snack-bar-annotated-component',
      upstreamId: 'snack-bar-annotated-component',
      pkg: 'snack-bar',
    },
  ],
  'mat-sort': [
    {route: 'example', upstreamId: 'sort-overview', pkg: 'sort'},
    {route: 'table-sorting', upstreamId: 'table-sorting', pkg: 'table'},
  ],
  'mat-stepper': [
    {route: 'example', upstreamId: 'stepper-overview', pkg: 'stepper'},
    {route: 'stepper-vertical', upstreamId: 'stepper-vertical', pkg: 'stepper'},
    {route: 'stepper-label-position-bottom', upstreamId: 'stepper-label-position-bottom', pkg: 'stepper'},
    {route: 'stepper-header-position', upstreamId: 'stepper-header-position', pkg: 'stepper'},
    {route: 'stepper-animations', upstreamId: 'stepper-animations', pkg: 'stepper'},
    {route: 'stepper-lazy-content', upstreamId: 'stepper-lazy-content', pkg: 'stepper'},
    {route: 'stepper-optional', upstreamId: 'stepper-optional', pkg: 'stepper'},
    {route: 'stepper-editable', upstreamId: 'stepper-editable', pkg: 'stepper'},
    {route: 'stepper-states', upstreamId: 'stepper-states', pkg: 'stepper'},
  ],
  'mat-table': [
    {route: 'example', upstreamId: 'table-basic', pkg: 'table'},
    {route: 'table-sorting', upstreamId: 'table-sorting', pkg: 'table'},
    {route: 'table-column-styling', upstreamId: 'table-column-styling', pkg: 'table'},
    {route: 'table-pagination', upstreamId: 'table-pagination', pkg: 'table'},
    {route: 'table-filtering', upstreamId: 'table-filtering', pkg: 'table'},
    {route: 'table-selection', upstreamId: 'table-selection', pkg: 'table'},
    {route: 'table-footer-row', upstreamId: 'table-footer-row', pkg: 'table'},
    {route: 'table-sticky-header', upstreamId: 'table-sticky-header', pkg: 'table'},
    {route: 'table-sticky-footer', upstreamId: 'table-sticky-footer', pkg: 'table'},
    {route: 'table-sticky-columns', upstreamId: 'table-sticky-columns', pkg: 'table'},
    {route: 'table-row-binding', upstreamId: 'table-row-binding', pkg: 'table'},
    {route: 'table-expandable-rows', upstreamId: 'table-expandable-rows', pkg: 'table'},
  ],
  'mat-tabs': [
    {route: 'example', upstreamId: 'tab-group-basic', pkg: 'tabs'},
    {route: 'tab-group-custom-label', upstreamId: 'tab-group-custom-label', pkg: 'tabs'},
    {route: 'tab-group-dynamic-height', upstreamId: 'tab-group-dynamic-height', pkg: 'tabs'},
    {route: 'tab-nav-bar-basic', upstreamId: 'tab-nav-bar-basic', pkg: 'tabs'},
    {route: 'tab-group-lazy-loaded', upstreamId: 'tab-group-lazy-loaded', pkg: 'tabs'},
    {route: 'tab-group-align', upstreamId: 'tab-group-align', pkg: 'tabs'},
    {route: 'tab-group-animations', upstreamId: 'tab-group-animations', pkg: 'tabs'},
    {route: 'tab-group-preserve-content', upstreamId: 'tab-group-preserve-content', pkg: 'tabs'},
  ],
  'mat-timepicker': [
    {route: 'example', upstreamId: 'timepicker-overview', pkg: 'timepicker'},
    {route: 'timepicker-forms', upstreamId: 'timepicker-forms', pkg: 'timepicker'},
    {
      route: 'timepicker-datepicker-integration',
      upstreamId: 'timepicker-datepicker-integration',
      pkg: 'timepicker',
    },
    {route: 'timepicker-validation', upstreamId: 'timepicker-validation', pkg: 'timepicker'},
    {route: 'timepicker-options', upstreamId: 'timepicker-options', pkg: 'timepicker'},
    {route: 'timepicker-custom-icon', upstreamId: 'timepicker-custom-icon', pkg: 'timepicker'},
  ],
  'mat-toolbar': [
    {route: 'example', upstreamId: 'toolbar-overview', pkg: 'toolbar'},
    {route: 'toolbar-simple', upstreamId: 'toolbar-simple', pkg: 'toolbar'},
    {route: 'toolbar-multirow', upstreamId: 'toolbar-multirow', pkg: 'toolbar'},
  ],
  'mat-tooltip': [
    {route: 'example', upstreamId: 'tooltip-overview', pkg: 'tooltip'},
    {route: 'tooltip-position', upstreamId: 'tooltip-position', pkg: 'tooltip'},
    {route: 'tooltip-delay', upstreamId: 'tooltip-delay', pkg: 'tooltip'},
    {
      route: 'tooltip-modified-defaults',
      upstreamId: 'tooltip-modified-defaults',
      pkg: 'tooltip',
    },
    {route: 'tooltip-manual', upstreamId: 'tooltip-manual', pkg: 'tooltip'},
  ],
  'mat-tree': [
    {route: 'example', upstreamId: 'tree-flat-child-accessor-overview', pkg: 'tree'},
    {
      route: 'tree-nested-child-accessor-overview',
      upstreamId: 'tree-nested-child-accessor-overview',
      pkg: 'tree',
    },
  ],
};

/** The `input` component page's headline example is form-field's `example-input` route. */
export function headlineExampleFor(devAppId: string, componentId: string): PortedExample | undefined {
  const list = PORTED_EXAMPLES[devAppId];
  if (!list) return undefined;
  if (componentId === 'input') return list.find(e => e.route === 'example-input');
  return list.find(e => e.route === 'example') ?? list[0];
}

export function examplesFor(devAppId: string): PortedExample[] {
  return PORTED_EXAMPLES[devAppId] ?? [];
}

/** material.angular.dev's real URL for an example id, used by "not yet ported" placeholders and
 *  "Open in Angular docs" links. `componentSlug` is the upstream component id
 *  (`src/material/<slug>` / the material.angular.dev path segment) — usually same as this site's
 *  component id, with a couple of exceptions (see `data/components.ts`: `input`'s upstream slug is
 *  also `input`, `sort`'s is `sort`, so no exceptions today, but keep this centralized). */
export function angularDocsExampleUrl(componentSlug: string, exampleId: string): string {
  return `https://material.angular.dev/components/${componentSlug}/overview#${exampleId}`;
}

export function angularDocsComponentUrl(componentSlug: string): string {
  return `https://material.angular.dev/components/${componentSlug}/overview`;
}
