import {Type} from '@angular/core';
import {Routes} from '@angular/router';
import {BADGE_SCENARIOS} from './badge';
import {BUTTON_SCENARIOS} from './button';
import {BUTTON_TOGGLE_SCENARIOS} from './button-toggle';
import {CARD_SCENARIOS} from './card';
import {CDK_DIALOG_SCENARIOS} from './cdk-dialog';
import {DIALOG_SCENARIOS} from './dialog';
import {DIVIDER_SCENARIOS} from './divider';
import {GRID_LIST_SCENARIOS} from './grid-list';
import {ICON_SCENARIOS} from './icon';
import {LIST_SCENARIOS} from './list';
import {PROGRESS_BAR_SCENARIOS} from './progress-bar';
import {PROGRESS_SPINNER_SCENARIOS} from './progress-spinner';
import {TOOLBAR_SCENARIOS} from './toolbar';

/** Keys match the qwik dev-app route segments: /qwik-parity/<key>/<scenario>. */
const SCENARIOS: Record<string, Record<string, Type<unknown>>> = {
  'dialog': CDK_DIALOG_SCENARIOS,
  'mat-badge': BADGE_SCENARIOS,
  'mat-button': BUTTON_SCENARIOS,
  'mat-button-toggle': BUTTON_TOGGLE_SCENARIOS,
  'mat-card': CARD_SCENARIOS,
  'mat-dialog': DIALOG_SCENARIOS,
  'mat-divider': DIVIDER_SCENARIOS,
  'mat-grid-list': GRID_LIST_SCENARIOS,
  'mat-icon': ICON_SCENARIOS,
  'mat-list': LIST_SCENARIOS,
  'mat-progress-bar': PROGRESS_BAR_SCENARIOS,
  'mat-progress-spinner': PROGRESS_SPINNER_SCENARIOS,
  'mat-toolbar': TOOLBAR_SCENARIOS,
};

export const QWIK_PARITY_ROUTES: Routes = Object.entries(SCENARIOS).flatMap(
  ([component, scenarios]) =>
    Object.entries(scenarios).map(([scenario, cmp]) => ({
      path: `${component}/${scenario}`,
      component: cmp,
    })),
);
