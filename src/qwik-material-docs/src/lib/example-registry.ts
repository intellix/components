import type {Component} from '@qwik.dev/core';

// ---------------------------------------------------------------------------------------------
// Live example components. One static import per `src/qwik-material-examples/<pkg>/<route>`
// module (all 35 — see that package's `package.json` `exports`). Static, not `import()`, because
// Qwik's optimizer already code-splits every `component$` call into its own lazily-loaded chunk
// regardless of how the reference reaches this file — eagerly listing them here costs nothing at
// runtime and keeps this registry a plain, generatable lookup table.
// ---------------------------------------------------------------------------------------------
import Ex_autocomplete_example from '@angular-community/qwik-material-examples/autocomplete/example';
import Ex_autocomplete_filter from '@angular-community/qwik-material-examples/autocomplete/autocomplete-filter';
import Ex_autocomplete_display from '@angular-community/qwik-material-examples/autocomplete/autocomplete-display';
import Ex_autocomplete_require_selection from '@angular-community/qwik-material-examples/autocomplete/autocomplete-require-selection';
import Ex_autocomplete_auto_active_first_option from '@angular-community/qwik-material-examples/autocomplete/autocomplete-auto-active-first-option';
import Ex_autocomplete_plain_input from '@angular-community/qwik-material-examples/autocomplete/autocomplete-plain-input';
import Ex_autocomplete_optgroup from '@angular-community/qwik-material-examples/autocomplete/autocomplete-optgroup';
import Ex_badge_example from '@angular-community/qwik-material-examples/badge/example';
import Ex_bottom_sheet_example from '@angular-community/qwik-material-examples/bottom-sheet/example';
import Ex_button_example from '@angular-community/qwik-material-examples/button/example';
import Ex_button_toggle_example from '@angular-community/qwik-material-examples/button-toggle/example';
import Ex_card_example from '@angular-community/qwik-material-examples/card/example';
import Ex_checkbox_example from '@angular-community/qwik-material-examples/checkbox/example';
import Ex_chips_example from '@angular-community/qwik-material-examples/chips/example';
import Ex_datepicker_example from '@angular-community/qwik-material-examples/datepicker/example';
import Ex_dialog_example from '@angular-community/qwik-material-examples/dialog/example';
import Ex_divider_example from '@angular-community/qwik-material-examples/divider/example';
import Ex_expansion_example from '@angular-community/qwik-material-examples/expansion/example';
import Ex_form_field_example from '@angular-community/qwik-material-examples/form-field/example';
import Ex_form_field_example_input from '@angular-community/qwik-material-examples/form-field/example-input';
import Ex_form_field_appearance from '@angular-community/qwik-material-examples/form-field/form-field-appearance';
import Ex_form_field_label from '@angular-community/qwik-material-examples/form-field/form-field-label';
import Ex_form_field_hint from '@angular-community/qwik-material-examples/form-field/form-field-hint';
import Ex_form_field_error from '@angular-community/qwik-material-examples/form-field/form-field-error';
import Ex_form_field_prefix_suffix from '@angular-community/qwik-material-examples/form-field/form-field-prefix-suffix';
import Ex_grid_list_example from '@angular-community/qwik-material-examples/grid-list/example';
import Ex_icon_example from '@angular-community/qwik-material-examples/icon/example';
import Ex_list_example from '@angular-community/qwik-material-examples/list/example';
import Ex_menu_example from '@angular-community/qwik-material-examples/menu/example';
import Ex_menu_icons from '@angular-community/qwik-material-examples/menu/menu-icons';
import Ex_menu_position from '@angular-community/qwik-material-examples/menu/menu-position';
import Ex_menu_nested from '@angular-community/qwik-material-examples/menu/menu-nested';
import Ex_paginator_example from '@angular-community/qwik-material-examples/paginator/example';
import Ex_progress_bar_example from '@angular-community/qwik-material-examples/progress-bar/example';
import Ex_progress_spinner_example from '@angular-community/qwik-material-examples/progress-spinner/example';
import Ex_radio_example from '@angular-community/qwik-material-examples/radio/example';
import Ex_select_example from '@angular-community/qwik-material-examples/select/example';
import Ex_select_value_binding from '@angular-community/qwik-material-examples/select/select-value-binding';
import Ex_select_form from '@angular-community/qwik-material-examples/select/select-form';
import Ex_select_hint_error from '@angular-community/qwik-material-examples/select/select-hint-error';
import Ex_select_disabled from '@angular-community/qwik-material-examples/select/select-disabled';
import Ex_select_reset from '@angular-community/qwik-material-examples/select/select-reset';
import Ex_select_optgroup from '@angular-community/qwik-material-examples/select/select-optgroup';
import Ex_select_multiple from '@angular-community/qwik-material-examples/select/select-multiple';
import Ex_select_custom_trigger from '@angular-community/qwik-material-examples/select/select-custom-trigger';
import Ex_select_panel_class from '@angular-community/qwik-material-examples/select/select-panel-class';
import Ex_sidenav_example from '@angular-community/qwik-material-examples/sidenav/example';
import Ex_slide_toggle_example from '@angular-community/qwik-material-examples/slide-toggle/example';
import Ex_slider_example from '@angular-community/qwik-material-examples/slider/example';
import Ex_snack_bar_example from '@angular-community/qwik-material-examples/snack-bar/example';
import Ex_sort_example from '@angular-community/qwik-material-examples/sort/example';
import Ex_stepper_example from '@angular-community/qwik-material-examples/stepper/example';
import Ex_table_example from '@angular-community/qwik-material-examples/table/example';
import Ex_table_sorting from '@angular-community/qwik-material-examples/table/table-sorting';
import Ex_tabs_example from '@angular-community/qwik-material-examples/tabs/example';
import Ex_timepicker_example from '@angular-community/qwik-material-examples/timepicker/example';
import Ex_toolbar_example from '@angular-community/qwik-material-examples/toolbar/example';
import Ex_toolbar_simple from '@angular-community/qwik-material-examples/toolbar/toolbar-simple';
import Ex_toolbar_multirow from '@angular-community/qwik-material-examples/toolbar/toolbar-multirow';
import Ex_tooltip_example from '@angular-community/qwik-material-examples/tooltip/example';
import Ex_tree_example from '@angular-community/qwik-material-examples/tree/example';

// ---------------------------------------------------------------------------------------------
// Pre-highlighted source, generated by `scripts/generate-examples-source.mjs` from the SAME
// modules (`pnpm run generate:examples-source`). Unlike the live components above, these are
// loaded LAZILY, one file at a time, via `import.meta.glob` WITHOUT `eager: true` — all 35
// highlighted-HTML JSON blobs together are the bulk of this registry's byte size, and a reader
// only ever needs the one file for whatever example they just clicked "View code" on. Eagerly
// importing them (as this file did originally) merged all 35 into one ~700KB chunk alongside the
// live example components, downloaded the moment ANY example rendered on the client.
// ---------------------------------------------------------------------------------------------
const sourceLoaders = import.meta.glob('../generated/examples/*.json') as Record<
  string,
  () => Promise<{default: ExampleSourceBundle}>
>;

function keyFromGlobPath(path: string): string {
  // "../generated/examples/form-field__example-input.json" -> "form-field/example-input"
  const file = path.split('/').pop()!.replace(/\.json$/, '');
  const sep = file.indexOf('__');
  return `${file.slice(0, sep)}/${file.slice(sep + 2)}`;
}

const sourceLoadersByKey = new Map<string, () => Promise<{default: ExampleSourceBundle}>>();
for (const [path, loader] of Object.entries(sourceLoaders)) {
  sourceLoadersByKey.set(keyFromGlobPath(path), loader);
}

/** Lazily loads one example's pre-highlighted source bundle by `<pkg>/<route>` key. */
export async function loadExampleSource(key: string): Promise<ExampleSourceBundle | undefined> {
  const loader = sourceLoadersByKey.get(key);
  if (!loader) return undefined;
  const mod = await loader();
  return mod.default;
}

export interface ExampleSourceFile {
  name: string;
  lang: string;
  code: string;
  html: string;
}

export interface ExampleSourceBundle {
  pkg: string;
  route: string;
  files: ExampleSourceFile[];
}

/** `<pkg>/<route>` -> the live example component. */
export const EXAMPLE_COMPONENTS: Record<string, Component<Record<string, never>>> = {
  'autocomplete/example': Ex_autocomplete_example,
  'autocomplete/autocomplete-filter': Ex_autocomplete_filter,
  'autocomplete/autocomplete-display': Ex_autocomplete_display,
  'autocomplete/autocomplete-require-selection': Ex_autocomplete_require_selection,
  'autocomplete/autocomplete-auto-active-first-option': Ex_autocomplete_auto_active_first_option,
  'autocomplete/autocomplete-plain-input': Ex_autocomplete_plain_input,
  'autocomplete/autocomplete-optgroup': Ex_autocomplete_optgroup,
  'badge/example': Ex_badge_example,
  'bottom-sheet/example': Ex_bottom_sheet_example,
  'button/example': Ex_button_example,
  'button-toggle/example': Ex_button_toggle_example,
  'card/example': Ex_card_example,
  'checkbox/example': Ex_checkbox_example,
  'chips/example': Ex_chips_example,
  'datepicker/example': Ex_datepicker_example,
  'dialog/example': Ex_dialog_example,
  'divider/example': Ex_divider_example,
  'expansion/example': Ex_expansion_example,
  'form-field/example': Ex_form_field_example,
  'form-field/example-input': Ex_form_field_example_input,
  'form-field/form-field-appearance': Ex_form_field_appearance,
  'form-field/form-field-label': Ex_form_field_label,
  'form-field/form-field-hint': Ex_form_field_hint,
  'form-field/form-field-error': Ex_form_field_error,
  'form-field/form-field-prefix-suffix': Ex_form_field_prefix_suffix,
  'grid-list/example': Ex_grid_list_example,
  'icon/example': Ex_icon_example,
  'list/example': Ex_list_example,
  'menu/example': Ex_menu_example,
  'menu/menu-icons': Ex_menu_icons,
  'menu/menu-position': Ex_menu_position,
  'menu/menu-nested': Ex_menu_nested,
  'paginator/example': Ex_paginator_example,
  'progress-bar/example': Ex_progress_bar_example,
  'progress-spinner/example': Ex_progress_spinner_example,
  'radio/example': Ex_radio_example,
  'select/example': Ex_select_example,
  'select/select-value-binding': Ex_select_value_binding,
  'select/select-form': Ex_select_form,
  'select/select-hint-error': Ex_select_hint_error,
  'select/select-disabled': Ex_select_disabled,
  'select/select-reset': Ex_select_reset,
  'select/select-optgroup': Ex_select_optgroup,
  'select/select-multiple': Ex_select_multiple,
  'select/select-custom-trigger': Ex_select_custom_trigger,
  'select/select-panel-class': Ex_select_panel_class,
  'sidenav/example': Ex_sidenav_example,
  'slide-toggle/example': Ex_slide_toggle_example,
  'slider/example': Ex_slider_example,
  'snack-bar/example': Ex_snack_bar_example,
  'sort/example': Ex_sort_example,
  'stepper/example': Ex_stepper_example,
  'table/example': Ex_table_example,
  'table/table-sorting': Ex_table_sorting,
  'tabs/example': Ex_tabs_example,
  'timepicker/example': Ex_timepicker_example,
  'toolbar/example': Ex_toolbar_example,
  'toolbar/toolbar-simple': Ex_toolbar_simple,
  'toolbar/toolbar-multirow': Ex_toolbar_multirow,
  'tooltip/example': Ex_tooltip_example,
  'tree/example': Ex_tree_example,
};

