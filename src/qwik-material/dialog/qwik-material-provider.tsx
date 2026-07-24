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

  return <Slot />;
});
