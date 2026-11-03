import type {QRL} from '@qwik.dev/core';
import type {OverlayContextOverride, ScrollStrategy} from '@angular-community/qwik-cdk/overlay';

/** Options for where to set focus to automatically on bottom sheet open. */
export type AutoFocusTarget = 'dialog' | 'first-tabbable' | 'first-heading' | string;

/**
 * Configuration used when opening a bottom sheet with useMatBottomSheet().
 *
 * Mirrors upstream `MatBottomSheetConfig` field-for-field (see
 * src/material/bottom-sheet/bottom-sheet-config.ts) with the same
 * Observable→QRL deviations already established for `qwik-material/dialog`
 * (`MatDialogConfig`'s `onBackdropClick$`/`onKeydown$`/`onOutsidePointer$`).
 * See SYNC.md §"Open deviations" for the full list of upstream fields
 * omitted as non-portable (`viewContainerRef`, `injector`, `bindings`) and
 * why `id` is intentionally absent (upstream `MatBottomSheetConfig` has no
 * `id` field either — the underlying `Dialog.open()` always mints one).
 */
export interface MatBottomSheetConfig<D = unknown> {
  /** Extra CSS classes to be added to the overlay panel containing the bottom sheet. */
  panelClass?: string | string[];
  /** Text layout direction for the bottom sheet. */
  direction?: 'ltr' | 'rtl';
  /** Data being injected into the content component via MAT_BOTTOM_SHEET_DATA. */
  data?: D | null;
  /**
   * Initial props passed to the opened component (Qwik's idiomatic
   * replacement for upstream's `bindings`/`ComponentRef.setInput`, which
   * don't apply to a Qwik `component$`). Updatable after open via
   * `MatBottomSheetRef.setInput`.
   */
  componentProps?: Record<string, unknown>;
  /**
   * Qwik context values re-provided directly above the opened component
   * — the generic opt-in for app contexts (e.g. a context an app's own
   * provider sets). `useMatBottomSheet().open$` automatically prepends
   * every visible qwik-material configuration context ahead of this; an
   * entry here for the same `ContextId` wins. See
   * `OverlayConfig.context`'s doc comment (qwik-cdk) for why this is
   * needed at all.
   */
  context?: OverlayContextOverride[];
  /** Whether the bottom sheet has a backdrop. Default true. */
  hasBackdrop?: boolean;
  /** Custom class for the backdrop. */
  backdropClass?: string | string[];
  /** Whether the user can use escape or clicking outside to close the bottom sheet. */
  disableClose?: boolean;
  /** Aria label to assign to the bottom sheet element. */
  ariaLabel?: string | null;
  /**
   * Whether this is a modal dialog. Used to set the `aria-modal` attribute.
   * Off by default — this is MatBottomSheetConfig's OWN real upstream
   * default (unlike qwik-material/dialog's `MatDialogContainer`, which
   * drifts to defaulting `true`; that drift must NOT be copied here, see
   * the dialog port's SYNC.md "known drift" note).
   */
  ariaModal?: boolean;
  /** Whether the bottom sheet should close when the user navigates. */
  closeOnNavigation?: boolean;
  /** Where the bottom sheet should focus on open. Default 'first-tabbable'. */
  autoFocus?: AutoFocusTarget | false;
  /** Configures the focus restoration behavior. Default true. */
  restoreFocus?: boolean | string | HTMLElement;
  /** Scroll strategy to be used for the bottom sheet. Default: block strategy. */
  scrollStrategy?: ScrollStrategy;
  /** Height for the bottom sheet. */
  height?: string;
  /** Minimum height for the bottom sheet. If a number is provided, assumes pixel units. */
  minHeight?: number | string;
  /** Maximum height for the bottom sheet. If a number is provided, assumes pixel units. */
  maxHeight?: number | string;

  // --- QRL callbacks (Qwik replacement for RxJS streams on MatBottomSheetRef) ---
  /** Replacement for `MatBottomSheetRef.backdropClick()`. */
  onBackdropClick$?: QRL<(e: MouseEvent) => void>;
  /** Replacement for `MatBottomSheetRef.keydownEvents()`. */
  onKeydown$?: QRL<(e: KeyboardEvent) => void>;
  /** Fires for any outside pointer event, regardless of `disableClose`. */
  onOutsidePointer$?: QRL<(e: MouseEvent) => void>;
}
