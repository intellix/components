export type {
  MatSnackBarConfig,
  MatSnackBarHorizontalPosition,
  MatSnackBarVerticalPosition,
  AriaLivePoliteness,
} from './snack-bar-config';
export {createMatSnackBarConfig} from './snack-bar-config';
export type {MatSnackBarRef, MatSnackBarDismiss} from './mat-snack-bar-ref';
export {
  createMatSnackBarRef,
  MARK_OPENED,
  MARK_DISMISSED,
  REGISTER_EXIT_HANDLER,
} from './mat-snack-bar-ref';
export type {MatSnackBar, AttachSnackBarCtx} from './mat-snack-bar';
export {useMatSnackBar, attachSnackBar, mergeConfig} from './mat-snack-bar';
export {MatSnackBarContainer} from './mat-snack-bar-container';
export type {MatSnackBarContainerProps} from './mat-snack-bar-container';
export {SimpleSnackBar} from './simple-snack-bar';
export type {TextOnlySnackBarData} from './simple-snack-bar';
export {MatSnackBarLabel, MatSnackBarActions, MatSnackBarAction} from './mat-snack-bar-content';
export type {MatSnackBarContentProps, MatSnackBarActionProps} from './mat-snack-bar-content';
export {
  MAT_SNACK_BAR_DATA,
  MAT_SNACK_BAR_DEFAULT_OPTIONS,
  MAT_SNACK_BAR_REF,
  useMatSnackBarProvider,
} from './mat-snack-bar-tokens';
