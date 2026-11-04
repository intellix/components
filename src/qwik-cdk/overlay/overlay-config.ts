/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.dev/license
 */

import type {PositionStrategy} from './position/position-strategy';
import type {Direction, Directionality} from '../bidi/directionality';
import type {ScrollStrategy} from './scroll/scroll-strategy';
import type {BuiltinScrollStrategyDescriptor} from './scroll/scroll-strategy-descriptor';
import type {OverlayContextOverride} from './overlay-context';

/** Initial configuration used when creating an overlay. */
export interface OverlayConfig {
  /** Strategy with which to position the overlay. */
  positionStrategy?: PositionStrategy;

  /**
   * Strategy to be used when handling scroll events while the overlay is
   * open — either an already-built `ScrollStrategy` instance, or a
   * `BuiltinScrollStrategyDescriptor` (`'block'`, `{type: 'reposition',
   * scrollThrottle: 20}`, …) resolved synchronously by
   * `createOverlayService().create()`. The `QRL` escape hatch that
   * `ScrollStrategyDescriptor` also allows isn't accepted here — this
   * raw CDK layer's `create()` is intentionally synchronous; the `QRL`
   * form is only resolved by the (`async`) qwik-material layer services
   * (`useMatDialog()`, …) that already need an `await` for other reasons.
   * See `scroll/scroll-strategy-descriptor.ts`'s own doc comment.
   */
  scrollStrategy?: ScrollStrategy | BuiltinScrollStrategyDescriptor;

  /** Custom class to add to the overlay pane. */
  panelClass?: string | string[];

  /** Whether the overlay has a backdrop. */
  hasBackdrop?: boolean;

  /** Custom class to add to the backdrop */
  backdropClass?: string | string[];

  /** Whether to disable any built-in animations. */
  disableAnimations?: boolean;

  /** The width of the overlay panel. If a number is provided, pixel units are assumed. */
  width?: number | string;

  /** The height of the overlay panel. If a number is provided, pixel units are assumed. */
  height?: number | string;

  /** The min-width of the overlay panel. If a number is provided, pixel units are assumed. */
  minWidth?: number | string;

  /** The min-height of the overlay panel. If a number is provided, pixel units are assumed. */
  minHeight?: number | string;

  /** The max-width of the overlay panel. If a number is provided, pixel units are assumed. */
  maxWidth?: number | string;

  /** The max-height of the overlay panel. If a number is provided, pixel units are assumed. */
  maxHeight?: number | string;

  /**
   * Direction of the text in the overlay panel. If a `Directionality` instance
   * is passed in, the overlay will handle changes to its value automatically.
   */
  direction?: Direction | Directionality;

  /**
   * Whether the overlay should be disposed of when the user goes backwards/forwards in history.
   * Note that this usually doesn't include clicking on links (unless the user is using
   * the `HashLocationStrategy`).
   */
  disposeOnNavigation?: boolean;

  /**
   * Whether the overlay should be rendered as a native popover element,
   * rather than placing it inside of the overlay container.
   */
  usePopover?: boolean;

  /**
   * Function that determines if the overlay should receive a specific
   * event or if the event should go to the next overlay in the stack.
   */
  eventPredicate?: (event: Event) => boolean;

  /**
   * Qwik context values re-provided directly above the attached
   * component, inside `OverlayHost`. Qwik-specific — there is no upstream
   * equivalent (upstream's dialog/overlay content is a normal descendant
   * of the opener's own injector, so Angular DI inheritance already
   * solves this; `<OverlayContainerOutlet>` renders overlay content as a
   * SIBLING of the opener under `<QwikCdkRoot>`, not a descendant, so
   * Qwik context providers between the root and the opener — e.g. a
   * nested `useMat*Provider()` call — don't reach it on their own).
   * `useDialog()`/`useMatDialog()`/`useMatBottomSheet()` populate this
   * automatically from `config.context` plus every qwik-material
   * configuration context visible where the hook is called — see
   * `qwik-material/core/mat-context-snapshot.ts`'s
   * `useMatContextSnapshot()`. A raw `useOverlay()` consumer can
   * also set this directly, as the generic opt-in.
   */
  context?: OverlayContextOverride[];
}

/**
 * App-wide defaults merged into every overlay's `OverlayConfig` at creation
 * time, qwik-cdk's equivalent of upstream `OVERLAY_DEFAULT_CONFIG`.
 * Provided by `<QwikCdkRoot overlayDefaultConfig={…}>`; consumed by every
 * `createOverlayService()` call site (dialog, bottom-sheet, select, menu,
 * autocomplete, tooltip, datepicker, timepicker, snack-bar) via
 * `QwikCdkInternals.overlayDefaultConfig`. A per-overlay `OverlayConfig`
 * field always wins over this default when both are set.
 */
export interface OverlayDefaultConfig {
  /**
   * Default for `OverlayConfig.usePopover` when an individual overlay
   * doesn't specify one. qwik-cdk's own fallback (browser supports the
   * Popover API) stays `true` when this is unset.
   */
  usePopover?: boolean;
}
