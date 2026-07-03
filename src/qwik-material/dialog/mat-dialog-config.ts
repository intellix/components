import type {QRL} from '@builder.io/qwik';
import type {ScrollStrategy, OverlayContextOverride} from '@angular-community/qwik-cdk/overlay';

/** Options for where to set focus to automatically on dialog open. */
export type AutoFocusTarget = 'dialog' | 'first-tabbable' | 'first-heading' | string;

/** Valid ARIA roles for a dialog element. */
export type DialogRole = 'dialog' | 'alertdialog';

/** Possible overrides for a dialog's position. */
export interface DialogPosition {
  top?: string;
  bottom?: string;
  left?: string;
  right?: string;
}

/**
 * Configuration for opening a Material Design modal dialog with useMatDialog().
 *
 * Supersets qwik-cdk's DialogConfig with Material-specific fields
 * (enterAnimationDuration, exitAnimationDuration, position). See design spec
 * §5 for the full field catalog and §10 for deviations from Angular Material.
 */
export interface MatDialogConfig<D = unknown> {
  // --- CDK-inherited fields ---
  id?: string;
  role?: DialogRole;
  panelClass?: string | string[];
  hasBackdrop?: boolean;
  backdropClass?: string | string[];
  disableClose?: boolean;

  width?: string;
  height?: string;
  minWidth?: string | number;
  minHeight?: string | number;
  maxWidth?: string | number;
  maxHeight?: string | number;

  direction?: 'ltr' | 'rtl';

  ariaDescribedBy?: string | null;
  ariaLabelledBy?: string | null;
  ariaLabel?: string | null;
  /** Whether the dialog is a modal (traps focus, dims background). Default true. */
  ariaModal?: boolean;

  autoFocus?: AutoFocusTarget | false;
  restoreFocus?: boolean | string | HTMLElement;
  closeOnNavigation?: boolean;

  data?: D | null;

  scrollStrategy?: ScrollStrategy;
  context?: OverlayContextOverride[];

  // --- QRL callbacks (Qwik replacement for RxJS streams) ---
  onBackdropClick$?: QRL<(e: MouseEvent) => void>;
  onKeydown$?: QRL<(e: KeyboardEvent) => void>;
  onOutsidePointer$?: QRL<(e: MouseEvent) => void>;

  // --- Material-specific ---
  /** Duration of the enter animation, in ms (number) or CSS time string. Default 150. */
  enterAnimationDuration?: number | string;
  /** Duration of the exit animation, in ms (number) or CSS time string. Default 75. */
  exitAnimationDuration?: number | string;
  /** Custom position override applied via matDialogRef.updatePosition(). */
  position?: DialogPosition;
}
