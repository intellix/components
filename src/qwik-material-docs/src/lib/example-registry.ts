import type {Component} from '@qwik.dev/core';

// ---------------------------------------------------------------------------------------------
// Live example components. One static import per `src/qwik-material-examples/<pkg>/<route>`
// module (all 35 — see that package's `package.json` `exports`). Static, not `import()`, because
// Qwik's optimizer already code-splits every `component$` call into its own lazily-loaded chunk
// regardless of how the reference reaches this file — eagerly listing them here costs nothing at
// runtime and keeps this registry a plain, generatable lookup table.
// ---------------------------------------------------------------------------------------------
import Ex_autocomplete_example from '@angular-community/qwik-material-examples/autocomplete/example';
import Ex_badge_example from '@angular-community/qwik-material-examples/badge/example';
import Ex_bottom_sheet_example from '@angular-community/qwik-material-examples/bottom-sheet/example';
import Ex_button_example from '@angular-community/qwik-material-examples/button/example';
import Ex_button_button_disabled_interactive from '@angular-community/qwik-material-examples/button/button-disabled-interactive';
import Ex_button_toggle_example from '@angular-community/qwik-material-examples/button-toggle/example';
import Ex_button_toggle_mode from '@angular-community/qwik-material-examples/button-toggle/button-toggle-mode';
import Ex_button_toggle_appearance from '@angular-community/qwik-material-examples/button-toggle/button-toggle-appearance';
import Ex_card_example from '@angular-community/qwik-material-examples/card/example';
import Ex_checkbox_example from '@angular-community/qwik-material-examples/checkbox/example';
import Ex_chips_example from '@angular-community/qwik-material-examples/chips/example';
import Ex_datepicker_example from '@angular-community/qwik-material-examples/datepicker/example';
import Ex_dialog_example from '@angular-community/qwik-material-examples/dialog/example';
import Ex_divider_example from '@angular-community/qwik-material-examples/divider/example';
import Ex_expansion_example from '@angular-community/qwik-material-examples/expansion/example';
import Ex_form_field_example from '@angular-community/qwik-material-examples/form-field/example';
import Ex_form_field_example_input from '@angular-community/qwik-material-examples/form-field/example-input';
import Ex_grid_list_example from '@angular-community/qwik-material-examples/grid-list/example';
import Ex_icon_example from '@angular-community/qwik-material-examples/icon/example';
import Ex_list_example from '@angular-community/qwik-material-examples/list/example';
import Ex_menu_example from '@angular-community/qwik-material-examples/menu/example';
import Ex_paginator_example from '@angular-community/qwik-material-examples/paginator/example';
import Ex_progress_bar_example from '@angular-community/qwik-material-examples/progress-bar/example';
import Ex_progress_bar_indeterminate from '@angular-community/qwik-material-examples/progress-bar/progress-bar-indeterminate';
import Ex_progress_bar_buffer from '@angular-community/qwik-material-examples/progress-bar/progress-bar-buffer';
import Ex_progress_bar_query from '@angular-community/qwik-material-examples/progress-bar/progress-bar-query';
import Ex_progress_spinner_example from '@angular-community/qwik-material-examples/progress-spinner/example';
import Ex_radio_example from '@angular-community/qwik-material-examples/radio/example';
import Ex_select_example from '@angular-community/qwik-material-examples/select/example';
import Ex_sidenav_example from '@angular-community/qwik-material-examples/sidenav/example';
import Ex_slide_toggle_example from '@angular-community/qwik-material-examples/slide-toggle/example';
import Ex_slider_example from '@angular-community/qwik-material-examples/slider/example';
import Ex_slider_range from '@angular-community/qwik-material-examples/slider/slider-range';
import Ex_slider_formatting from '@angular-community/qwik-material-examples/slider/slider-formatting';
import Ex_snack_bar_example from '@angular-community/qwik-material-examples/snack-bar/example';
import Ex_sort_example from '@angular-community/qwik-material-examples/sort/example';
import Ex_stepper_example from '@angular-community/qwik-material-examples/stepper/example';
import Ex_table_example from '@angular-community/qwik-material-examples/table/example';
import Ex_tabs_example from '@angular-community/qwik-material-examples/tabs/example';
import Ex_timepicker_example from '@angular-community/qwik-material-examples/timepicker/example';
import Ex_toolbar_example from '@angular-community/qwik-material-examples/toolbar/example';
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
  'badge/example': Ex_badge_example,
  'bottom-sheet/example': Ex_bottom_sheet_example,
  'button/example': Ex_button_example,
  'button/button-disabled-interactive': Ex_button_button_disabled_interactive,
  'button-toggle/example': Ex_button_toggle_example,
  'button-toggle/button-toggle-mode': Ex_button_toggle_mode,
  'button-toggle/button-toggle-appearance': Ex_button_toggle_appearance,
  'card/example': Ex_card_example,
  'checkbox/example': Ex_checkbox_example,
  'chips/example': Ex_chips_example,
  'datepicker/example': Ex_datepicker_example,
  'dialog/example': Ex_dialog_example,
  'divider/example': Ex_divider_example,
  'expansion/example': Ex_expansion_example,
  'form-field/example': Ex_form_field_example,
  'form-field/example-input': Ex_form_field_example_input,
  'grid-list/example': Ex_grid_list_example,
  'icon/example': Ex_icon_example,
  'list/example': Ex_list_example,
  'menu/example': Ex_menu_example,
  'paginator/example': Ex_paginator_example,
  'progress-bar/example': Ex_progress_bar_example,
  'progress-bar/progress-bar-indeterminate': Ex_progress_bar_indeterminate,
  'progress-bar/progress-bar-buffer': Ex_progress_bar_buffer,
  'progress-bar/progress-bar-query': Ex_progress_bar_query,
  'progress-spinner/example': Ex_progress_spinner_example,
  'radio/example': Ex_radio_example,
  'select/example': Ex_select_example,
  'sidenav/example': Ex_sidenav_example,
  'slide-toggle/example': Ex_slide_toggle_example,
  'slider/example': Ex_slider_example,
  'slider/slider-range': Ex_slider_range,
  'slider/slider-formatting': Ex_slider_formatting,
  'snack-bar/example': Ex_snack_bar_example,
  'sort/example': Ex_sort_example,
  'stepper/example': Ex_stepper_example,
  'table/example': Ex_table_example,
  'tabs/example': Ex_tabs_example,
  'timepicker/example': Ex_timepicker_example,
  'toolbar/example': Ex_toolbar_example,
  'tooltip/example': Ex_tooltip_example,
  'tree/example': Ex_tree_example,
};

