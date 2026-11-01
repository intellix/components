// src/qwik-cdk/dialog/dialog-config.ts
import type {QRL} from '@qwik.dev/core';
import type {Direction} from '../bidi/directionality';
import type {PositionStrategy} from '../overlay/position/position-strategy';
import type {ScrollStrategy} from '../overlay/scroll/scroll-strategy';
import type {OverlayContextOverride} from '../overlay/overlay-context';

export interface DialogConfig<D = unknown, R = unknown> {
  data?: D | null;
  direction?: Direction;
  id?: string;
  role?: 'dialog' | 'alertdialog';
  panelClass?: string | string[];
  hasBackdrop?: boolean;
  backdropClass?: string | string[];
  disableClose?: boolean;
  closePredicate?: QRL<(result: R | undefined) => boolean | Promise<boolean>>;

  width?: string;
  height?: string;
  minWidth?: string | number;
  minHeight?: string | number;
  maxWidth?: string | number;
  maxHeight?: string | number;

  positionStrategy?: PositionStrategy;
  scrollStrategy?: ScrollStrategy;

  ariaDescribedBy?: string | null;
  ariaLabelledBy?: string | null;
  ariaLabel?: string | null;
  ariaModal?: boolean;

  autoFocus?: 'dialog' | 'first-tabbable' | 'first-heading' | string | false;
  restoreFocus?: boolean | string | HTMLElement;

  closeOnNavigation?: boolean;
  closeOnOverlayDetachments?: boolean;
  disableAnimations?: boolean;

  context?: OverlayContextOverride[];

  // Event callbacks (Qwik-idiomatic replacement for RxJS streams)
  onBackdropClick$?: QRL<(e: MouseEvent) => void>;
  onKeydown$?: QRL<(e: KeyboardEvent) => void>;
  onOutsidePointer$?: QRL<(e: MouseEvent) => void>;
}
