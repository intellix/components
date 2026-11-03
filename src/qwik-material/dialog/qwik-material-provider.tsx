import {
  component$,
  Slot,
  useContext,
  useContextProvider,
  useSignal,
  type ContextId,
} from '@qwik.dev/core';
import type {
  OverlayContextOverride,
  ScrollStrategyDescriptor,
} from '@angular-community/qwik-cdk/overlay';
import type {MatDialogConfig} from './mat-dialog-config';
import {
  MAT_ANIMATIONS_DISABLED,
  MAT_DIALOG_DEFAULT_OPTIONS,
  MAT_DIALOG_SCROLL_STRATEGY,
} from './mat-dialog-tokens';
import type {MatButtonConfig} from '../button/button-config';
import {MAT_BUTTON_CONFIG} from '../button/button-config';
import type {MatCardConfig} from '../card/card-config';
import {MAT_CARD_CONFIG} from '../card/card-config';
import type {MatBadgeConfig} from '../badge/badge-config';
import {MAT_BADGE_CONFIG} from '../badge/badge-config';
import type {MatIconConfig} from '../icon/icon-config';
import {MAT_ICON_CONFIG} from '../icon/icon-config';
import type {MatProgressBarConfig} from '../progress-bar/progress-bar-config';
import {MAT_PROGRESS_BAR_CONFIG} from '../progress-bar/progress-bar-config';
import type {MatProgressSpinnerConfig} from '../progress-spinner/progress-spinner-config';
import {MAT_PROGRESS_SPINNER_CONFIG} from '../progress-spinner/progress-spinner-config';
import type {MatDividerConfig} from '../divider/divider-config';
import {MAT_DIVIDER_CONFIG} from '../divider/divider-config';
import type {MatGridListConfig} from '../grid-list/grid-list-config';
import {MAT_GRID_LIST_CONFIG} from '../grid-list/grid-list-config';
import type {MatListConfig} from '../list/list-config';
import {MAT_LIST_CONFIG} from '../list/list-config';
import type {MatButtonToggleConfig} from '../button-toggle/button-toggle-config';
import {MAT_BUTTON_TOGGLE_CONFIG} from '../button-toggle/button-toggle-config';
import type {MatSlideToggleConfig} from '../slide-toggle/slide-toggle-config';
import {MAT_SLIDE_TOGGLE_CONFIG} from '../slide-toggle/slide-toggle-config';
import type {MatExpansionConfig} from '../expansion/expansion-config';
import {MAT_EXPANSION_CONFIG} from '../expansion/expansion-config';
import type {MatRadioConfig} from '../radio/radio-config';
import {MAT_RADIO_CONFIG} from '../radio/radio-config';
import type {MatCheckboxConfig} from '../checkbox/checkbox-config';
import {MAT_CHECKBOX_CONFIG} from '../checkbox/checkbox-config';
import type {MatSortConfig} from '../sort/sort-config';
import {MAT_SORT_CONFIG} from '../sort/sort-config';
import type {MatTabsConfig} from '../tabs/tab-config';
import {MAT_TABS_CONFIG} from '../tabs/tab-config';
import type {MatSidenavConfig} from '../sidenav/sidenav-config';
import {MAT_SIDENAV_CONFIG} from '../sidenav/sidenav-config';
import type {MatSnackBarConfig} from '../snack-bar/snack-bar-config';
import {MAT_SNACK_BAR_DEFAULT_OPTIONS} from '../snack-bar/mat-snack-bar-tokens';
import type {MatBottomSheetConfig} from '../bottom-sheet/mat-bottom-sheet-config';
import {
  MAT_BOTTOM_SHEET_DEFAULT_OPTIONS,
  MAT_BOTTOM_SHEET_SCROLL_STRATEGY,
} from '../bottom-sheet/mat-bottom-sheet-tokens';
import type {MatFormFieldConfig} from '../form-field/form-field-config';
import {MAT_FORM_FIELD_CONFIG} from '../form-field/form-field-config';
import type {MatInputConfig} from '../input/input-config';
import {MAT_INPUT_CONFIG} from '../input/input-config';
import type {StepperOptions} from '@angular-community/qwik-cdk/stepper';
import {CDK_STEPPER_GLOBAL_OPTIONS} from '@angular-community/qwik-cdk/stepper';
import type {MatChipsConfig} from '../chips/tokens';
import {MAT_CHIPS_CONFIG} from '../chips/tokens';
import type {MatTooltipDefaultOptions} from '../tooltip/mat-tooltip-tokens';
import {MAT_TOOLTIP_DEFAULT_OPTIONS} from '../tooltip/mat-tooltip-tokens';
import type {MatSelectConfig} from '../select/select-config';
import {MAT_SELECT_CONFIG, MAT_SELECT_SCROLL_STRATEGY} from '../select/select-config';
import type {MatMenuDefaultOptions} from '../menu/mat-menu-tokens';
import {MAT_MENU_DEFAULT_OPTIONS, MAT_MENU_SCROLL_STRATEGY} from '../menu/mat-menu-tokens';
import type {MatTimepickerConfig} from '../timepicker/timepicker-config';
import {MAT_TIMEPICKER_CONFIG} from '../timepicker/timepicker-config';
import type {MatPaginatorConfig} from '../paginator/paginator-config';
import {MAT_PAGINATOR_CONFIG} from '../paginator/paginator-config';
import type {MatPaginatorIntl} from '../paginator/paginator-intl';
import {MAT_PAGINATOR_INTL, DEFAULT_PAGINATOR_INTL} from '../paginator/paginator-intl';
import type {MatAutocompleteConfig} from '../autocomplete/autocomplete-config';
import {
  MAT_AUTOCOMPLETE_CONFIG,
  MAT_AUTOCOMPLETE_SCROLL_STRATEGY,
} from '../autocomplete/autocomplete-config';

export interface QwikMaterialProviderProps {
  /** Defaults merged into every MatDialog open() config. */
  matDialogDefaults?: Partial<MatDialogConfig>;
  /**
   * Default `ScrollStrategy` descriptor for MatDialog (`'block'`, `{type:
   * 'reposition', scrollThrottle: 20}`, a `QRL<() => ScrollStrategy>`, …).
   * Defaults to `'block'` (upstream's own default).
   */
  matDialogScrollStrategy?: ScrollStrategyDescriptor;
  /** Disables all Material animations globally when true. */
  animationsDisabled?: boolean;
  /** Defaults applied to every MatButton / MatIconButton / MatFabButton / MatMiniFabButton in this subtree. */
  matButtonConfig?: MatButtonConfig;
  /** Defaults applied to every MatCard in this subtree. */
  matCardConfig?: MatCardConfig;
  /** Defaults applied to every MatBadge in this subtree. */
  matBadgeConfig?: MatBadgeConfig;
  /** Defaults applied to every MatIcon in this subtree. */
  matIconConfig?: MatIconConfig;
  /** Defaults applied to every MatProgressBar in this subtree. */
  matProgressBarConfig?: MatProgressBarConfig;
  /** Defaults applied to every MatProgressSpinner / MatSpinner in this subtree. */
  matProgressSpinnerConfig?: MatProgressSpinnerConfig;
  /** Defaults applied to every MatDivider in this subtree. */
  matDividerConfig?: MatDividerConfig;
  /** Defaults applied to every MatGridList in this subtree. */
  matGridListConfig?: MatGridListConfig;
  /** Defaults applied to every MatList / MatNavList / MatActionList / MatSubheader in this subtree. */
  matListConfig?: MatListConfig;
  /** Defaults applied to every MatButtonToggleGroup / MatButtonToggle in this subtree. */
  matButtonToggleConfig?: MatButtonToggleConfig;
  /** Defaults applied to every MatSlideToggle in this subtree. */
  matSlideToggleConfig?: MatSlideToggleConfig;
  /** Defaults applied to every MatExpansionPanel / MatExpansionPanelHeader in this subtree. */
  matExpansionConfig?: MatExpansionConfig;
  /** Defaults applied to every MatRadioGroup / MatRadioButton in this subtree. */
  matRadioConfig?: MatRadioConfig;
  /** Defaults applied to every MatCheckbox in this subtree. */
  matCheckboxConfig?: MatCheckboxConfig;
  /** Defaults applied to every MatSort / MatSortHeader in this subtree. */
  matSortConfig?: MatSortConfig;
  /** Defaults applied to every MatTabGroup / MatTabNav in this subtree. */
  matTabsConfig?: MatTabsConfig;
  /** Defaults applied to every MatDrawerContainer / MatSidenavContainer in this subtree. */
  matSidenavConfig?: MatSidenavConfig;
  /** Defaults merged into every useMatSnackBar() open()/openFromComponent()/openFromTemplate() config. */
  matSnackBarDefaults?: Partial<MatSnackBarConfig>;
  /** Defaults merged into every MatBottomSheet open() config. */
  matBottomSheetDefaults?: Partial<MatBottomSheetConfig>;
  /** Default `ScrollStrategy` descriptor for MatBottomSheet. Defaults to `'block'`. */
  matBottomSheetScrollStrategy?: ScrollStrategyDescriptor;
  /** Defaults applied to every MatFormField in this subtree. */
  matFormFieldConfig?: MatFormFieldConfig;
  /** Defaults applied to every MatInput in this subtree. */
  matInputConfig?: MatInputConfig;
  /** Qwik-context equivalent of `@angular/cdk/stepper`'s `STEPPER_GLOBAL_OPTIONS`
   *  — applies to every MatStepper in this subtree. */
  stepperGlobalOptions?: StepperOptions;
  /** Defaults applied to every MatChip family component in this subtree (separator keys,
   *  hideSingleSelectionIndicator, inputDisabledInteractive). */
  matChipsConfig?: MatChipsConfig;
  /** Defaults merged into every `<MatTooltip>`'s resolved config in this subtree. */
  matTooltipDefaults?: MatTooltipDefaultOptions;
  /** Defaults applied to every MatSelect in this subtree. */
  matSelectConfig?: MatSelectConfig;
  /** Default `ScrollStrategy` descriptor for MatSelect panels. Defaults to
   *  `{type: 'reposition'}` (this port's pre-existing hard-coded behaviour). */
  matSelectScrollStrategy?: ScrollStrategyDescriptor;
  /** Defaults merged into every `createMatMenu()`'s resolved config in this subtree. */
  matMenuDefaults?: MatMenuDefaultOptions;
  /** Default `ScrollStrategy` descriptor for menu panels. Defaults to
   *  `{type: 'reposition', scrollThrottle: 20}` (pre-existing hard-coded behaviour). */
  matMenuScrollStrategy?: ScrollStrategyDescriptor;
  /** Defaults applied to every `useMatTimepicker()` / `<MatTimepickerToggle>` in this subtree. */
  matTimepickerConfig?: MatTimepickerConfig;
  /** Defaults applied to every MatPaginator in this subtree (field-by-field fallback, like
   *  MatCheckboxConfig). */
  matPaginatorConfig?: MatPaginatorConfig;
  /** REPLACES the whole `MatPaginatorIntl` string bag for every MatPaginator in this subtree —
   *  mirrors upstream's `providers: [{provide: MatPaginatorIntl, useClass: ...}]` (a consumer
   *  supplies every field, not a per-field fallback merge — see paginator/paginator-intl.ts). */
  matPaginatorIntl?: MatPaginatorIntl;
  /** Defaults applied to every MatAutocomplete in this subtree. */
  matAutocompleteConfig?: MatAutocompleteConfig;
  /** Default `ScrollStrategy` descriptor for MatAutocomplete panels. Defaults to
   *  `{type: 'reposition'}` (pre-existing hard-coded behaviour). */
  matAutocompleteScrollStrategy?: ScrollStrategyDescriptor;
}

export const QwikMaterialProvider = component$<QwikMaterialProviderProps>(props => {
  const animationsDisabled = useSignal(props.animationsDisabled ?? false);

  useContextProvider(MAT_DIALOG_DEFAULT_OPTIONS, props.matDialogDefaults ?? {});
  // A plain, serializable descriptor — no noSerialize needed (unlike the
  // function factory this replaced; see MAT_DIALOG_SCROLL_STRATEGY's own
  // doc comment for why that doesn't survive into useMatDialog().open$).
  useContextProvider(MAT_DIALOG_SCROLL_STRATEGY, props.matDialogScrollStrategy ?? 'block');
  useContextProvider(MAT_ANIMATIONS_DISABLED, animationsDisabled);
  // MatButtonConfig is a plain object with primitive fields — no noSerialize needed.
  // Buttons outside a provider get the DEFAULTS declared in each Mat*Button
  // component; providing an empty object is equivalent to accepting all defaults.
  useContextProvider(MAT_BUTTON_CONFIG, props.matButtonConfig ?? {});
  // MatCardConfig is a plain object with primitive fields — no noSerialize needed.
  // Cards outside a provider get the DEFAULTS declared in MatCard; providing
  // an empty object is equivalent to accepting all defaults.
  useContextProvider(MAT_CARD_CONFIG, props.matCardConfig ?? {});
  // MatBadgeConfig is a plain object with primitive fields — no noSerialize needed.
  // Badges outside a provider get the DEFAULTS declared in MatBadge; providing
  // an empty object is equivalent to accepting all defaults.
  useContextProvider(MAT_BADGE_CONFIG, props.matBadgeConfig ?? {});
  // MatIconConfig is a plain object with primitive fields — no noSerialize needed.
  // Icons outside a provider get the DEFAULTS declared in MatIcon; providing
  // an empty object is equivalent to accepting all defaults.
  useContextProvider(MAT_ICON_CONFIG, props.matIconConfig ?? {});
  // MatProgressBarConfig is a plain object with primitive fields — no noSerialize needed.
  // Progress bars outside a provider get the DEFAULTS declared in MatProgressBar; providing
  // an empty object is equivalent to accepting all defaults.
  useContextProvider(MAT_PROGRESS_BAR_CONFIG, props.matProgressBarConfig ?? {});
  // MatProgressSpinnerConfig is a plain object with primitive fields — no noSerialize needed.
  // Spinners outside a provider get the DEFAULTS declared in createSpinner; providing
  // an empty object is equivalent to accepting all defaults.
  useContextProvider(MAT_PROGRESS_SPINNER_CONFIG, props.matProgressSpinnerConfig ?? {});
  // MatDividerConfig is a plain object (currently empty) — no noSerialize needed.
  // Dividers outside a provider get the DEFAULTS declared in MatDivider; providing
  // an empty object is equivalent to accepting all defaults.
  useContextProvider(MAT_DIVIDER_CONFIG, props.matDividerConfig ?? {});
  // MatGridListConfig is a plain object (currently empty) — no noSerialize needed.
  // Grid lists outside a provider get the CONFIG_DEFAULTS declared in MatGridList;
  // providing an empty object is equivalent to accepting all defaults.
  useContextProvider(MAT_GRID_LIST_CONFIG, props.matGridListConfig ?? {});
  // MatListConfig is a plain object (currently empty) — no noSerialize needed.
  // Lists outside a provider get the CONFIG_DEFAULTS declared in MatList/
  // MatNavList/MatActionList/MatSubheader; providing an empty object is
  // equivalent to accepting all defaults.
  useContextProvider(MAT_LIST_CONFIG, props.matListConfig ?? {});
  // MatButtonToggleConfig is a plain object (currently empty) — no noSerialize
  // needed. Button toggles outside a provider get the CONFIG_DEFAULTS declared
  // in MatButtonToggleGroup; providing an empty object is equivalent to
  // accepting all defaults.
  useContextProvider(MAT_BUTTON_TOGGLE_CONFIG, props.matButtonToggleConfig ?? {});
  // MatSlideToggleConfig is a plain object with primitive fields — no
  // noSerialize needed. Slide toggles outside a provider get the
  // CONFIG_DEFAULTS declared in MatSlideToggle; providing an empty object is
  // equivalent to accepting all defaults.
  useContextProvider(MAT_SLIDE_TOGGLE_CONFIG, props.matSlideToggleConfig ?? {});
  // MatExpansionConfig is a plain object with primitive fields — no noSerialize needed.
  // Expansion panels outside a provider get the CONFIG_DEFAULTS declared in
  // MatExpansionPanel/MatExpansionPanelHeader; providing an empty object is
  // equivalent to accepting all defaults.
  useContextProvider(MAT_EXPANSION_CONFIG, props.matExpansionConfig ?? {});
  // MatRadioConfig falls back to {} here (same pattern as every other
  // config above) when the prop is omitted — MatRadioButton's own
  // color/disabledInteractive computation hardcodes the upstream
  // ('accent'/false) defaults as its FINAL fallback regardless, so this
  // stays correct even though {} isn't MAT_RADIO_CONFIG_DEFAULTS itself.
  useContextProvider(MAT_RADIO_CONFIG, props.matRadioConfig ?? {});
  // MatCheckboxConfig is a plain object with primitive fields — no noSerialize needed.
  // Checkboxes outside a provider get the MAT_CHECKBOX_CONFIG_DEFAULTS declared in
  // checkbox-config.ts; providing an empty object here is NOT equivalent to those
  // defaults (MatCheckbox itself falls back per-field: `props.x ?? config.x ?? ownDefault`).
  useContextProvider(MAT_CHECKBOX_CONFIG, props.matCheckboxConfig ?? {});
  // MatSortConfig is a plain object with primitive fields — no noSerialize
  // needed. Sorts outside a provider get the CONFIG_DEFAULTS declared in
  // MatSort/MatSortHeader; providing an empty object is equivalent to
  // accepting all defaults.
  useContextProvider(MAT_SORT_CONFIG, props.matSortConfig ?? {});
  // MatTabsConfig is a plain object with primitive fields — no noSerialize
  // needed. Tab groups/navs outside a provider get the CONFIG_DEFAULTS
  // declared in MatTabGroup/MatTabNav; providing an empty object is
  // equivalent to accepting all defaults.
  useContextProvider(MAT_TABS_CONFIG, props.matTabsConfig ?? {});
  // MatSidenavConfig is a plain object with primitive fields — no noSerialize needed.
  // Drawer containers outside a provider get the DEFAULTS declared in
  // MatDrawerContainer/MatSidenavContainer; providing an empty object is equivalent to
  // accepting all defaults.
  useContextProvider(MAT_SIDENAV_CONFIG, props.matSidenavConfig ?? {});
  // MatSnackBarConfig's fields all have upstream class-level defaults of
  // their own (see `createMatSnackBarConfig()`); an empty object here is
  // equivalent to accepting all of them, same pattern as every config above.
  useContextProvider(MAT_SNACK_BAR_DEFAULT_OPTIONS, props.matSnackBarDefaults ?? {});
  useContextProvider(MAT_BOTTOM_SHEET_DEFAULT_OPTIONS, props.matBottomSheetDefaults ?? {});
  // A plain, serializable descriptor — see MAT_DIALOG_SCROLL_STRATEGY's own
  // provide call above for why this no longer needs noSerialize.
  useContextProvider(
    MAT_BOTTOM_SHEET_SCROLL_STRATEGY,
    props.matBottomSheetScrollStrategy ?? 'block',
  );
  // MatFormFieldConfig is a plain object with primitive fields — no
  // noSerialize needed. Form fields outside a provider get the
  // MAT_FORM_FIELD_CONFIG_DEFAULTS declared in form-field-config.ts;
  // providing an empty object here is NOT equivalent to those defaults
  // (MatFormField itself falls back per-field: `props.x ?? config.x ?? ownDefault`,
  // same convention as checkbox/radio).
  useContextProvider(MAT_FORM_FIELD_CONFIG, props.matFormFieldConfig ?? {});
  // MatInputConfig is a plain object with a single primitive field — no
  // noSerialize needed. Inputs outside a provider get the hardcoded
  // `false` fallback declared in MatInput; providing an empty object is
  // equivalent to accepting that default.
  useContextProvider(MAT_INPUT_CONFIG, props.matInputConfig ?? {});
  // StepperOptions is a plain object with primitive fields — no noSerialize
  // needed. Steppers outside a provider get {} (upstream's own un-provided
  // STEPPER_GLOBAL_OPTIONS default: showError falls back to per-step
  // `hasError` overrides only, displayDefaultIndicatorType defaults true).
  useContextProvider(CDK_STEPPER_GLOBAL_OPTIONS, props.stepperGlobalOptions ?? {});
  // MatChipsConfig is a plain object with primitive fields — no noSerialize needed. Chips
  // outside a provider get MAT_CHIPS_CONFIG_DEFAULTS declared in chips/tokens.ts; providing
  // an empty object here is NOT equivalent to those defaults (every chip-family component
  // falls back per-field: `props.x ?? config.x ?? ownDefault`, same convention as checkbox/
  // radio/form-field).
  useContextProvider(MAT_CHIPS_CONFIG, props.matChipsConfig ?? {});
  // MatTooltipDefaultOptions is a plain object with primitive fields — no
  // noSerialize needed. Tooltips outside a provider get the hardcoded
  // MAT_TOOLTIP_DEFAULT_OPTIONS_FACTORY fallbacks declared in
  // mat-tooltip.tsx's `resolveConfig`; providing an empty object here is
  // equivalent to accepting all of them.
  useContextProvider(MAT_TOOLTIP_DEFAULT_OPTIONS, props.matTooltipDefaults ?? {});
  // MatSelectConfig is a plain object with primitive fields — no
  // noSerialize needed. Selects outside a provider get the hardcoded
  // defaults declared in mat-select.tsx's own prop resolution; providing an
  // empty object here is equivalent to accepting all of them.
  useContextProvider(MAT_SELECT_CONFIG, props.matSelectConfig ?? {});
  // A plain, serializable descriptor — see MAT_DIALOG_SCROLL_STRATEGY's own
  // provide call above for why this no longer needs noSerialize.
  useContextProvider(
    MAT_SELECT_SCROLL_STRATEGY,
    props.matSelectScrollStrategy ?? {type: 'reposition'},
  );
  // MatMenuDefaultOptions is a plain object with primitive fields — no
  // noSerialize needed. Menus outside a provider get the hardcoded
  // MAT_MENU_DEFAULT_OPTIONS_FACTORY fallbacks declared in
  // menu-runtime.ts's `resolveMenuConfig`; providing an empty object here
  // is equivalent to accepting all of them.
  useContextProvider(MAT_MENU_DEFAULT_OPTIONS, props.matMenuDefaults ?? {});
  useContextProvider(
    MAT_MENU_SCROLL_STRATEGY,
    props.matMenuScrollStrategy ?? {type: 'reposition', scrollThrottle: 20},
  );
  // MatTimepickerConfig is a plain object with primitive fields — no
  // noSerialize needed. Timepickers outside a provider get the hardcoded
  // defaults declared in use-mat-timepicker.ts's own option resolution;
  // providing an empty object here is equivalent to accepting all of them.
  useContextProvider(MAT_TIMEPICKER_CONFIG, props.matTimepickerConfig ?? {});
  // MatPaginatorConfig is a plain object with primitive fields — no noSerialize needed.
  // Paginators outside a provider get {} (MatPaginator itself falls back per-field:
  // `props.x ?? config.x ?? <upstream's own hardcoded default>`, same convention as
  // checkbox/radio/form-field above).
  useContextProvider(MAT_PAGINATOR_CONFIG, props.matPaginatorConfig ?? {});
  // Unlike every config above, MatPaginatorIntl is NOT merged field-by-field — see
  // paginator/paginator-intl.ts's module doc comment. Paginators outside a provider get the
  // hardcoded English DEFAULT_PAGINATOR_INTL declared there.
  useContextProvider(MAT_PAGINATOR_INTL, props.matPaginatorIntl ?? DEFAULT_PAGINATOR_INTL);
  // MatAutocompleteConfig is a plain object with primitive fields — no
  // noSerialize needed. Autocompletes outside a provider get the hardcoded
  // defaults declared in mat-autocomplete.tsx's own prop resolution;
  // providing an empty object here is equivalent to accepting all of them.
  useContextProvider(MAT_AUTOCOMPLETE_CONFIG, props.matAutocompleteConfig ?? {});
  useContextProvider(
    MAT_AUTOCOMPLETE_SCROLL_STRATEGY,
    props.matAutocompleteScrollStrategy ?? {type: 'reposition'},
  );

  return <Slot />;
});

/**
 * Every configuration context `<QwikMaterialProvider>` provides, in the
 * same order its own body provides them. The canonical list backing
 * `useQwikMaterialContextSnapshot()` below — kept in this file precisely
 * so the two can't drift silently: adding a new config context to the
 * provider's body is the same change as adding it here.
 */
const QWIK_MATERIAL_CONTEXT_IDS: readonly ContextId<unknown>[] = [
  MAT_DIALOG_DEFAULT_OPTIONS,
  MAT_DIALOG_SCROLL_STRATEGY,
  MAT_ANIMATIONS_DISABLED,
  MAT_BUTTON_CONFIG,
  MAT_CARD_CONFIG,
  MAT_BADGE_CONFIG,
  MAT_ICON_CONFIG,
  MAT_PROGRESS_BAR_CONFIG,
  MAT_PROGRESS_SPINNER_CONFIG,
  MAT_DIVIDER_CONFIG,
  MAT_GRID_LIST_CONFIG,
  MAT_LIST_CONFIG,
  MAT_BUTTON_TOGGLE_CONFIG,
  MAT_SLIDE_TOGGLE_CONFIG,
  MAT_EXPANSION_CONFIG,
  MAT_RADIO_CONFIG,
  MAT_CHECKBOX_CONFIG,
  MAT_SORT_CONFIG,
  MAT_TABS_CONFIG,
  MAT_SIDENAV_CONFIG,
  MAT_SNACK_BAR_DEFAULT_OPTIONS,
  MAT_BOTTOM_SHEET_DEFAULT_OPTIONS,
  MAT_BOTTOM_SHEET_SCROLL_STRATEGY,
  MAT_FORM_FIELD_CONFIG,
  MAT_INPUT_CONFIG,
  CDK_STEPPER_GLOBAL_OPTIONS,
  MAT_CHIPS_CONFIG,
  MAT_TOOLTIP_DEFAULT_OPTIONS,
  MAT_SELECT_CONFIG,
  MAT_SELECT_SCROLL_STRATEGY,
  MAT_MENU_DEFAULT_OPTIONS,
  MAT_MENU_SCROLL_STRATEGY,
  MAT_TIMEPICKER_CONFIG,
  MAT_PAGINATOR_CONFIG,
  MAT_PAGINATOR_INTL,
  MAT_AUTOCOMPLETE_CONFIG,
  MAT_AUTOCOMPLETE_SCROLL_STRATEGY,
];

/**
 * Sentinel distinguishing "no provider for this context" from a real,
 * legitimately-provided value — including one that happens to also be an
 * empty object (several configs above default to `{}`). A plain frozen
 * object compared by reference, not a `Symbol`: a `Symbol` default can't
 * be SSR-serialized if it ever leaked into state (it doesn't here — this
 * stays a local variable — but there's no reason to risk it when a plain
 * object works just as well for reference-equality filtering).
 */
const NOT_PROVIDED: unknown = Object.freeze({});

/**
 * Snapshots every `<QwikMaterialProvider>` configuration context that IS
 * currently visible — i.e. every one of `QWIK_MATERIAL_CONTEXT_IDS` that
 * resolves to something other than `NOT_PROVIDED` — as an
 * `OverlayContextOverride[]` ready to merge into `OverlayConfig.context`.
 *
 * This is what makes "automatically carry every qwik-material
 * configuration context visible where `useMatDialog()`/
 * `useMatBottomSheet()` is called" possible: those hooks call this at the
 * point THEY are invoked (inside the opener's own render), capturing
 * whatever `<QwikMaterialProvider>` ancestors are in scope THERE, then
 * pass the result through to `OverlayHost` (a sibling of the opener,
 * under `<QwikCdkRoot>`, which otherwise can't see them — see
 * `OverlayConfig.context`'s doc comment) via `overlay.create()`'s config.
 *
 * Calling `useContext()` in a loop over a fixed, module-level-constant
 * array (same array, same order, every call) is safe: unlike
 * `useSignal`/`useStore`/`useTask$`, `useContext` allocates no sequential
 * per-call slot of its own — it's a pure lookup against the calling
 * component's live context map, so there is no "hook call order" to keep
 * consistent across renders here.
 */
export function useQwikMaterialContextSnapshot(): OverlayContextOverride[] {
  const result: OverlayContextOverride[] = [];
  for (const id of QWIK_MATERIAL_CONTEXT_IDS) {
    const value = useContext(id, NOT_PROVIDED);
    if (value !== NOT_PROVIDED) {
      result.push({ctx: id, value});
    }
  }
  return result;
}
