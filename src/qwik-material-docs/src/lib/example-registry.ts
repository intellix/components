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
import Ex_button_button_disabled_interactive from '@angular-community/qwik-material-examples/button/button-disabled-interactive';
import Ex_button_toggle_example from '@angular-community/qwik-material-examples/button-toggle/example';
import Ex_button_toggle_mode from '@angular-community/qwik-material-examples/button-toggle/button-toggle-mode';
import Ex_button_toggle_appearance from '@angular-community/qwik-material-examples/button-toggle/button-toggle-appearance';
import Ex_card_example from '@angular-community/qwik-material-examples/card/example';
import Ex_checkbox_example from '@angular-community/qwik-material-examples/checkbox/example';
import Ex_chips_example from '@angular-community/qwik-material-examples/chips/example';
import Ex_chips_input from '@angular-community/qwik-material-examples/chips/chips-input';
import Ex_chips_template_form from '@angular-community/qwik-material-examples/chips/chips-template-form';
import Ex_chips_reactive_form from '@angular-community/qwik-material-examples/chips/chips-reactive-form';
import Ex_chips_autocomplete from '@angular-community/qwik-material-examples/chips/chips-autocomplete';
import Ex_chips_avatar from '@angular-community/qwik-material-examples/chips/chips-avatar';
import Ex_chips_stacked from '@angular-community/qwik-material-examples/chips/chips-stacked';
import Ex_datepicker_example from '@angular-community/qwik-material-examples/datepicker/example';
import Ex_datepicker_custom_icon from '@angular-community/qwik-material-examples/datepicker/datepicker-custom-icon';
import Ex_date_range_picker_overview from '@angular-community/qwik-material-examples/datepicker/date-range-picker-overview';
import Ex_date_range_picker_forms from '@angular-community/qwik-material-examples/datepicker/date-range-picker-forms';
import Ex_datepicker_start_view from '@angular-community/qwik-material-examples/datepicker/datepicker-start-view';
import Ex_datepicker_value from '@angular-community/qwik-material-examples/datepicker/datepicker-value';
import Ex_datepicker_min_max from '@angular-community/qwik-material-examples/datepicker/datepicker-min-max';
import Ex_datepicker_filter from '@angular-community/qwik-material-examples/datepicker/datepicker-filter';
import Ex_datepicker_events from '@angular-community/qwik-material-examples/datepicker/datepicker-events';
import Ex_datepicker_disabled from '@angular-community/qwik-material-examples/datepicker/datepicker-disabled';
import Ex_datepicker_actions from '@angular-community/qwik-material-examples/datepicker/datepicker-actions';
import Ex_datepicker_touch from '@angular-community/qwik-material-examples/datepicker/datepicker-touch';
import Ex_datepicker_inline_calendar from '@angular-community/qwik-material-examples/datepicker/datepicker-inline-calendar';
import Ex_dialog_example from '@angular-community/qwik-material-examples/dialog/example';
import Ex_dialog_data from '@angular-community/qwik-material-examples/dialog/dialog-data';
import Ex_dialog_content from '@angular-community/qwik-material-examples/dialog/dialog-content';
import Ex_dialog_animations from '@angular-community/qwik-material-examples/dialog/dialog-animations';
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
import Ex_progress_bar_indeterminate from '@angular-community/qwik-material-examples/progress-bar/progress-bar-indeterminate';
import Ex_progress_bar_buffer from '@angular-community/qwik-material-examples/progress-bar/progress-bar-buffer';
import Ex_progress_bar_query from '@angular-community/qwik-material-examples/progress-bar/progress-bar-query';
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
import Ex_sidenav_drawer_overview from '@angular-community/qwik-material-examples/sidenav/sidenav-drawer-overview';
import Ex_sidenav_position from '@angular-community/qwik-material-examples/sidenav/sidenav-position';
import Ex_sidenav_open_close from '@angular-community/qwik-material-examples/sidenav/sidenav-open-close';
import Ex_sidenav_mode from '@angular-community/qwik-material-examples/sidenav/sidenav-mode';
import Ex_sidenav_backdrop from '@angular-community/qwik-material-examples/sidenav/sidenav-backdrop';
import Ex_sidenav_disable_close from '@angular-community/qwik-material-examples/sidenav/sidenav-disable-close';
import Ex_sidenav_autosize from '@angular-community/qwik-material-examples/sidenav/sidenav-autosize';
import Ex_sidenav_fixed from '@angular-community/qwik-material-examples/sidenav/sidenav-fixed';
import Ex_sidenav_responsive from '@angular-community/qwik-material-examples/sidenav/sidenav-responsive';
import Ex_slide_toggle_example from '@angular-community/qwik-material-examples/slide-toggle/example';
import Ex_slider_example from '@angular-community/qwik-material-examples/slider/example';
import Ex_slider_range from '@angular-community/qwik-material-examples/slider/slider-range';
import Ex_slider_formatting from '@angular-community/qwik-material-examples/slider/slider-formatting';
import Ex_snack_bar_example from '@angular-community/qwik-material-examples/snack-bar/example';
import Ex_snack_bar_annotated_component from '@angular-community/qwik-material-examples/snack-bar/snack-bar-annotated-component';
import Ex_sort_example from '@angular-community/qwik-material-examples/sort/example';
import Ex_stepper_example from '@angular-community/qwik-material-examples/stepper/example';
import Ex_stepper_vertical from '@angular-community/qwik-material-examples/stepper/stepper-vertical';
import Ex_stepper_label_position_bottom from '@angular-community/qwik-material-examples/stepper/stepper-label-position-bottom';
import Ex_stepper_header_position from '@angular-community/qwik-material-examples/stepper/stepper-header-position';
import Ex_stepper_animations from '@angular-community/qwik-material-examples/stepper/stepper-animations';
import Ex_stepper_lazy_content from '@angular-community/qwik-material-examples/stepper/stepper-lazy-content';
import Ex_stepper_optional from '@angular-community/qwik-material-examples/stepper/stepper-optional';
import Ex_stepper_editable from '@angular-community/qwik-material-examples/stepper/stepper-editable';
import Ex_table_example from '@angular-community/qwik-material-examples/table/example';
import Ex_table_column_styling from '@angular-community/qwik-material-examples/table/table-column-styling';
import Ex_table_pagination from '@angular-community/qwik-material-examples/table/table-pagination';
import Ex_table_filtering from '@angular-community/qwik-material-examples/table/table-filtering';
import Ex_table_selection from '@angular-community/qwik-material-examples/table/table-selection';
import Ex_table_footer_row from '@angular-community/qwik-material-examples/table/table-footer-row';
import Ex_table_sticky_header from '@angular-community/qwik-material-examples/table/table-sticky-header';
import Ex_table_sticky_footer from '@angular-community/qwik-material-examples/table/table-sticky-footer';
import Ex_table_sticky_columns from '@angular-community/qwik-material-examples/table/table-sticky-columns';
import Ex_table_sorting from '@angular-community/qwik-material-examples/table/table-sorting';
import Ex_tabs_example from '@angular-community/qwik-material-examples/tabs/example';
import Ex_tab_group_custom_label from '@angular-community/qwik-material-examples/tabs/tab-group-custom-label';
import Ex_tab_group_dynamic_height from '@angular-community/qwik-material-examples/tabs/tab-group-dynamic-height';
import Ex_tab_nav_bar_basic from '@angular-community/qwik-material-examples/tabs/tab-nav-bar-basic';
import Ex_tab_group_lazy_loaded from '@angular-community/qwik-material-examples/tabs/tab-group-lazy-loaded';
import Ex_tab_group_align from '@angular-community/qwik-material-examples/tabs/tab-group-align';
import Ex_tab_group_animations from '@angular-community/qwik-material-examples/tabs/tab-group-animations';
import Ex_tab_group_preserve_content from '@angular-community/qwik-material-examples/tabs/tab-group-preserve-content';
import Ex_timepicker_example from '@angular-community/qwik-material-examples/timepicker/example';
import Ex_timepicker_forms from '@angular-community/qwik-material-examples/timepicker/timepicker-forms';
import Ex_timepicker_datepicker_integration from '@angular-community/qwik-material-examples/timepicker/timepicker-datepicker-integration';
import Ex_timepicker_validation from '@angular-community/qwik-material-examples/timepicker/timepicker-validation';
import Ex_timepicker_options from '@angular-community/qwik-material-examples/timepicker/timepicker-options';
import Ex_timepicker_custom_icon from '@angular-community/qwik-material-examples/timepicker/timepicker-custom-icon';
import Ex_toolbar_example from '@angular-community/qwik-material-examples/toolbar/example';
import Ex_toolbar_simple from '@angular-community/qwik-material-examples/toolbar/toolbar-simple';
import Ex_toolbar_multirow from '@angular-community/qwik-material-examples/toolbar/toolbar-multirow';
import Ex_tooltip_example from '@angular-community/qwik-material-examples/tooltip/example';
import Ex_tooltip_position from '@angular-community/qwik-material-examples/tooltip/tooltip-position';
import Ex_tooltip_delay from '@angular-community/qwik-material-examples/tooltip/tooltip-delay';
import Ex_tooltip_modified_defaults from '@angular-community/qwik-material-examples/tooltip/tooltip-modified-defaults';
import Ex_tooltip_manual from '@angular-community/qwik-material-examples/tooltip/tooltip-manual';
import Ex_tree_example from '@angular-community/qwik-material-examples/tree/example';
import Ex_tree_nested_child_accessor_overview from '@angular-community/qwik-material-examples/tree/tree-nested-child-accessor-overview';

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
  'button/button-disabled-interactive': Ex_button_button_disabled_interactive,
  'button-toggle/example': Ex_button_toggle_example,
  'button-toggle/button-toggle-mode': Ex_button_toggle_mode,
  'button-toggle/button-toggle-appearance': Ex_button_toggle_appearance,
  'card/example': Ex_card_example,
  'checkbox/example': Ex_checkbox_example,
  'chips/example': Ex_chips_example,
  'chips/chips-input': Ex_chips_input,
  'chips/chips-template-form': Ex_chips_template_form,
  'chips/chips-reactive-form': Ex_chips_reactive_form,
  'chips/chips-autocomplete': Ex_chips_autocomplete,
  'chips/chips-avatar': Ex_chips_avatar,
  'chips/chips-stacked': Ex_chips_stacked,
  'datepicker/example': Ex_datepicker_example,
  'datepicker/datepicker-custom-icon': Ex_datepicker_custom_icon,
  'datepicker/date-range-picker-overview': Ex_date_range_picker_overview,
  'datepicker/date-range-picker-forms': Ex_date_range_picker_forms,
  'datepicker/datepicker-start-view': Ex_datepicker_start_view,
  'datepicker/datepicker-value': Ex_datepicker_value,
  'datepicker/datepicker-min-max': Ex_datepicker_min_max,
  'datepicker/datepicker-filter': Ex_datepicker_filter,
  'datepicker/datepicker-events': Ex_datepicker_events,
  'datepicker/datepicker-disabled': Ex_datepicker_disabled,
  'datepicker/datepicker-actions': Ex_datepicker_actions,
  'datepicker/datepicker-touch': Ex_datepicker_touch,
  'datepicker/datepicker-inline-calendar': Ex_datepicker_inline_calendar,
  'dialog/example': Ex_dialog_example,
  'dialog/dialog-data': Ex_dialog_data,
  'dialog/dialog-content': Ex_dialog_content,
  'dialog/dialog-animations': Ex_dialog_animations,
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
  'progress-bar/progress-bar-indeterminate': Ex_progress_bar_indeterminate,
  'progress-bar/progress-bar-buffer': Ex_progress_bar_buffer,
  'progress-bar/progress-bar-query': Ex_progress_bar_query,
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
  'sidenav/sidenav-drawer-overview': Ex_sidenav_drawer_overview,
  'sidenav/sidenav-position': Ex_sidenav_position,
  'sidenav/sidenav-open-close': Ex_sidenav_open_close,
  'sidenav/sidenav-mode': Ex_sidenav_mode,
  'sidenav/sidenav-backdrop': Ex_sidenav_backdrop,
  'sidenav/sidenav-disable-close': Ex_sidenav_disable_close,
  'sidenav/sidenav-autosize': Ex_sidenav_autosize,
  'sidenav/sidenav-fixed': Ex_sidenav_fixed,
  'sidenav/sidenav-responsive': Ex_sidenav_responsive,
  'slide-toggle/example': Ex_slide_toggle_example,
  'slider/example': Ex_slider_example,
  'slider/slider-range': Ex_slider_range,
  'slider/slider-formatting': Ex_slider_formatting,
  'snack-bar/example': Ex_snack_bar_example,
  'snack-bar/snack-bar-annotated-component': Ex_snack_bar_annotated_component,
  'sort/example': Ex_sort_example,
  'stepper/example': Ex_stepper_example,
  'stepper/stepper-vertical': Ex_stepper_vertical,
  'stepper/stepper-label-position-bottom': Ex_stepper_label_position_bottom,
  'stepper/stepper-header-position': Ex_stepper_header_position,
  'stepper/stepper-animations': Ex_stepper_animations,
  'stepper/stepper-lazy-content': Ex_stepper_lazy_content,
  'stepper/stepper-optional': Ex_stepper_optional,
  'stepper/stepper-editable': Ex_stepper_editable,
  'table/example': Ex_table_example,
  'table/table-column-styling': Ex_table_column_styling,
  'table/table-pagination': Ex_table_pagination,
  'table/table-filtering': Ex_table_filtering,
  'table/table-selection': Ex_table_selection,
  'table/table-footer-row': Ex_table_footer_row,
  'table/table-sticky-header': Ex_table_sticky_header,
  'table/table-sticky-footer': Ex_table_sticky_footer,
  'table/table-sticky-columns': Ex_table_sticky_columns,
  'table/table-sorting': Ex_table_sorting,
  'tabs/example': Ex_tabs_example,
  'tabs/tab-group-custom-label': Ex_tab_group_custom_label,
  'tabs/tab-group-dynamic-height': Ex_tab_group_dynamic_height,
  'tabs/tab-nav-bar-basic': Ex_tab_nav_bar_basic,
  'tabs/tab-group-lazy-loaded': Ex_tab_group_lazy_loaded,
  'tabs/tab-group-align': Ex_tab_group_align,
  'tabs/tab-group-animations': Ex_tab_group_animations,
  'tabs/tab-group-preserve-content': Ex_tab_group_preserve_content,
  'timepicker/example': Ex_timepicker_example,
  'timepicker/timepicker-forms': Ex_timepicker_forms,
  'timepicker/timepicker-datepicker-integration': Ex_timepicker_datepicker_integration,
  'timepicker/timepicker-validation': Ex_timepicker_validation,
  'timepicker/timepicker-options': Ex_timepicker_options,
  'timepicker/timepicker-custom-icon': Ex_timepicker_custom_icon,
  'toolbar/example': Ex_toolbar_example,
  'toolbar/toolbar-simple': Ex_toolbar_simple,
  'toolbar/toolbar-multirow': Ex_toolbar_multirow,
  'tooltip/example': Ex_tooltip_example,
  'tooltip/tooltip-position': Ex_tooltip_position,
  'tooltip/tooltip-delay': Ex_tooltip_delay,
  'tooltip/tooltip-modified-defaults': Ex_tooltip_modified_defaults,
  'tooltip/tooltip-manual': Ex_tooltip_manual,
  'tree/example': Ex_tree_example,
  'tree/tree-nested-child-accessor-overview': Ex_tree_nested_child_accessor_overview,
};

