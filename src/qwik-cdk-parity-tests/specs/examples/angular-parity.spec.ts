import {test} from '@playwright/test';
import {expectMaterialParity, type ParityStep} from '../../lib/material-parity.js';

/**
 * Each component's headline material.angular.dev example (see
 * `src/dev-app/qwik-parity/examples.ts`): the Angular side renders the real example component
 * unmodified; the Qwik side is a faithful port at the same route
 * (`src/qwik-cdk-dev-app/src/routes/<component>/<route>/`). Besides parity, these are the pages to
 * use for visually checking the port against documented usage.
 *
 * `EXAMPLE_STEPS` adds interactions for examples whose main behavior is behind one (opening a
 * dialog, menu, select, ...); everything else is compared as rendered.
 */
const EXAMPLES: Record<string, string[]> = {
  'mat-autocomplete': ['example'],
  'mat-badge': ['example'],
  'mat-bottom-sheet': ['example'],
  'mat-button': ['example'],
  'mat-button-toggle': ['example'],
  'mat-card': ['example'],
  'mat-checkbox': ['example'],
  'mat-chips': ['example'],
  'mat-datepicker': ['example'],
  'mat-dialog': ['example'],
  'mat-divider': ['example'],
  'mat-expansion': ['example'],
  'mat-form-field': ['example', 'example-input'],
  'mat-grid-list': ['example'],
  'mat-icon': ['example'],
  'mat-list': ['example'],
  'mat-menu': ['example'],
  'mat-paginator': ['example'],
  'mat-progress-bar': ['example'],
  'mat-progress-spinner': ['example'],
  'mat-radio': ['example'],
  'mat-select': ['example'],
  'mat-sidenav': ['example'],
  'mat-slide-toggle': ['example'],
  'mat-slider': ['example'],
  'mat-snack-bar': ['example'],
  'mat-sort': ['example'],
  'mat-stepper': ['example'],
  'mat-table': ['example'],
  'mat-tabs': ['example'],
  'mat-timepicker': ['example'],
  'mat-toolbar': ['example'],
  'mat-tooltip': ['example'],
  'mat-tree': ['example'],
};

/** Interactions per `<component>/<route>`, added alongside each Qwik port as needed. */
const EXAMPLE_STEPS: Record<string, {steps: ParityStep[]; rootSelector?: string}[]> = {};

test.describe('material.angular.dev examples — Angular DOM parity', () => {
  for (const [component, routes] of Object.entries(EXAMPLES)) {
    for (const route of routes) {
      test(`${component}/${route}`, ({browser}) =>
        expectMaterialParity(browser, {pinRoot: true, route: component, scenario: route}));
      for (const [i, extra] of (EXAMPLE_STEPS[`${component}/${route}`] ?? []).entries()) {
        test(`${component}/${route} (interaction ${i + 1})`, ({browser}) =>
          expectMaterialParity(browser, {
            pinRoot: true,
            route: component,
            scenario: route,
            steps: extra.steps,
            rootSelector: extra.rootSelector,
          }));
      }
    }
  }
});
