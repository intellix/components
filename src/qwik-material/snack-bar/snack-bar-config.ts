import type {AriaLivePoliteness} from '@angular-community/qwik-cdk/a11y';

export type {AriaLivePoliteness};

/** Possible values for horizontalPosition on MatSnackBarConfig. */
export type MatSnackBarHorizontalPosition = 'start' | 'center' | 'end' | 'left' | 'right';

/** Possible values for verticalPosition on MatSnackBarConfig. */
export type MatSnackBarVerticalPosition = 'top' | 'bottom';

/**
 * Configuration used when opening a snack-bar with `useMatSnackBar()`.
 *
 * Deviations from upstream `MatSnackBarConfig` (see SYNC.md):
 * - `viewContainerRef` removed (no Angular DI view-container concept).
 * - `direction` narrowed to `'ltr' | 'rtl'` (no `Directionality` instance
 *   overload — matches `MatDialogConfig.direction`).
 */
export interface MatSnackBarConfig<D = unknown> {
  /** The politeness level for the LiveAnnouncer announcement. Default 'polite'. */
  politeness?: AriaLivePoliteness;

  /**
   * Message to be announced by the LiveAnnouncer. When opening a snack bar without a custom
   * component or template, the announcement message will default to the specified message.
   */
  announcementMessage?: string;

  /** The length of time in milliseconds to wait before automatically dismissing the snack bar. Default 0 (never). */
  duration?: number;

  /** Extra CSS classes to be added to the snack bar container. */
  panelClass?: string | string[];

  /** Text layout direction for the snack bar. */
  direction?: 'ltr' | 'rtl';

  /** Data being injected into the child component. */
  data?: D | null;

  /** The horizontal position to place the snack bar. Default 'center'. */
  horizontalPosition?: MatSnackBarHorizontalPosition;

  /** The vertical position to place the snack bar. Default 'bottom'. */
  verticalPosition?: MatSnackBarVerticalPosition;
}

/** Matches upstream's class-level field defaults (`new MatSnackBarConfig()`). */
export function createMatSnackBarConfig<D = unknown>(): MatSnackBarConfig<D> {
  return {
    politeness: 'polite',
    announcementMessage: '',
    duration: 0,
    data: null,
    horizontalPosition: 'center',
    verticalPosition: 'bottom',
  };
}
