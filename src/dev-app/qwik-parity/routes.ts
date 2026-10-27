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
import {SLIDE_TOGGLE_SCENARIOS} from './slide-toggle';
import {CHECKBOX_SCENARIOS} from './checkbox';
import {RADIO_SCENARIOS} from './radio';
import {EXPANSION_SCENARIOS} from './expansion';
import {SORT_SCENARIOS} from './sort';
import {SIDENAV_SCENARIOS} from './sidenav';
import {FORM_FIELD_SCENARIOS} from './form-field';
import {TABS_SCENARIOS} from './tabs';
import {TOOLTIP_SCENARIOS} from './tooltip';
import {SNACK_BAR_SCENARIOS} from './snack-bar';
import {BOTTOM_SHEET_SCENARIOS} from './bottom-sheet';
import {STEPPER_SCENARIOS} from './stepper';
import {MENU_SCENARIOS} from './menu';
import {SLIDER_SCENARIOS} from './slider';
import {CHIPS_SCENARIOS} from './chips';
import {SELECT_SCENARIOS} from './select';
import {PAGINATOR_SCENARIOS} from './paginator';
import {AUTOCOMPLETE_SCENARIOS} from './autocomplete';
import {TABLE_SCENARIOS} from './table';
import {TREE_SCENARIOS} from './tree';
import {TIMEPICKER_SCENARIOS} from './timepicker';
import {DATEPICKER_SCENARIOS} from './datepicker';

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
  'mat-slide-toggle': SLIDE_TOGGLE_SCENARIOS,
  'mat-checkbox': CHECKBOX_SCENARIOS,
  'mat-radio': RADIO_SCENARIOS,
  'mat-expansion': EXPANSION_SCENARIOS,
  'mat-sort': SORT_SCENARIOS,
  'mat-sidenav': SIDENAV_SCENARIOS,
  'mat-form-field': FORM_FIELD_SCENARIOS,
  'mat-tabs': TABS_SCENARIOS,
  'mat-tooltip': TOOLTIP_SCENARIOS,
  'mat-snack-bar': SNACK_BAR_SCENARIOS,
  'mat-bottom-sheet': BOTTOM_SHEET_SCENARIOS,
  'mat-stepper': STEPPER_SCENARIOS,
  'mat-menu': MENU_SCENARIOS,
  'mat-slider': SLIDER_SCENARIOS,
  'mat-chips': CHIPS_SCENARIOS,
  'mat-select': SELECT_SCENARIOS,
  'mat-paginator': PAGINATOR_SCENARIOS,
  'mat-autocomplete': AUTOCOMPLETE_SCENARIOS,
  'mat-table': TABLE_SCENARIOS,
  'mat-tree': TREE_SCENARIOS,
  'mat-timepicker': TIMEPICKER_SCENARIOS,
  'mat-datepicker': DATEPICKER_SCENARIOS,
};

export const QWIK_PARITY_ROUTES: Routes = Object.entries(SCENARIOS).flatMap(
  ([component, scenarios]) =>
    Object.entries(scenarios).map(([scenario, cmp]) => ({
      path: `${component}/${scenario}`,
      component: cmp,
    })),
);
