import {component$, noSerialize, Slot, useContextProvider, useSignal} from '@builder.io/qwik';
import type {ScrollStrategy} from '@angular-community/qwik-cdk/overlay';
import {createBlockScrollStrategy} from '@angular-community/qwik-cdk/overlay';
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
import type {MatRadioConfig} from '../radio/radio-config';
import {MAT_RADIO_CONFIG} from '../radio/radio-config';

export interface QwikMaterialProviderProps {
  /** Defaults merged into every MatDialog open() config. */
  matDialogDefaults?: Partial<MatDialogConfig>;
  /** Factory returning the default ScrollStrategy for MatDialog. Defaults to createBlockScrollStrategy(). */
  matDialogScrollStrategyFactory?: () => ScrollStrategy;
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
  /** Defaults applied to every MatRadioGroup / MatRadioButton in this subtree. */
  matRadioConfig?: MatRadioConfig;
}

export const QwikMaterialProvider = component$<QwikMaterialProviderProps>(props => {
  const animationsDisabled = useSignal(props.animationsDisabled ?? false);

  useContextProvider(MAT_DIALOG_DEFAULT_OPTIONS, props.matDialogDefaults ?? {});
  // The scroll-strategy factory is a plain function; wrap in noSerialize so
  // Qwik doesn't try to serialize it when consumer QRLs (useMatDialog.open$)
  // capture it via useContext.
  useContextProvider(
    MAT_DIALOG_SCROLL_STRATEGY,
    noSerialize(props.matDialogScrollStrategyFactory ?? (() => createBlockScrollStrategy())),
  );
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
  // MatRadioConfig falls back to {} here (same pattern as every other
  // config above) when the prop is omitted — MatRadioButton's own
  // color/disabledInteractive computation hardcodes the upstream
  // ('accent'/false) defaults as its FINAL fallback regardless, so this
  // stays correct even though {} isn't MAT_RADIO_CONFIG_DEFAULTS itself.
  useContextProvider(MAT_RADIO_CONFIG, props.matRadioConfig ?? {});

  return <Slot />;
});
