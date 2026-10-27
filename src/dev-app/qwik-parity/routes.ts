import {Type} from '@angular/core';
import {Routes} from '@angular/router';
import {BUTTON_TOGGLE_SCENARIOS} from './button-toggle';

/** Route prefix matches the qwik dev-app: /qwik-parity/mat-<component>/<scenario>. */
const SCENARIOS: Record<string, Record<string, Type<unknown>>> = {
  'mat-button-toggle': BUTTON_TOGGLE_SCENARIOS,
};

export const QWIK_PARITY_ROUTES: Routes = Object.entries(SCENARIOS).flatMap(
  ([component, scenarios]) =>
    Object.entries(scenarios).map(([scenario, cmp]) => ({
      path: `${component}/${scenario}`,
      component: cmp,
    })),
);
