import {component$, Slot, useContextProvider, useSignal} from '@builder.io/qwik';
import type {ScrollStrategy} from '@angular-community/qwik-cdk/overlay';
import {createBlockScrollStrategy} from '@angular-community/qwik-cdk/overlay';
import type {MatDialogConfig} from './mat-dialog-config';
import {
  MAT_ANIMATIONS_DISABLED,
  MAT_DIALOG_DEFAULT_OPTIONS,
  MAT_DIALOG_SCROLL_STRATEGY,
} from './mat-dialog-tokens';

export interface QwikMaterialProviderProps {
  /** Defaults merged into every MatDialog open() config. */
  matDialogDefaults?: Partial<MatDialogConfig>;
  /** Factory returning the default ScrollStrategy for MatDialog. Defaults to createBlockScrollStrategy(). */
  matDialogScrollStrategyFactory?: () => ScrollStrategy;
  /** Disables all Material animations globally when true. */
  animationsDisabled?: boolean;
}

export const QwikMaterialProvider = component$<QwikMaterialProviderProps>(props => {
  const animationsDisabled = useSignal(props.animationsDisabled ?? false);

  useContextProvider(MAT_DIALOG_DEFAULT_OPTIONS, props.matDialogDefaults ?? {});
  useContextProvider(
    MAT_DIALOG_SCROLL_STRATEGY,
    props.matDialogScrollStrategyFactory ?? (() => createBlockScrollStrategy()),
  );
  useContextProvider(MAT_ANIMATIONS_DISABLED, animationsDisabled);

  return <Slot />;
});
