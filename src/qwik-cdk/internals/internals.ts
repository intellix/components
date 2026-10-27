/**
 * Central reactive state for qwik-cdk's consumer-facing hooks.
 *
 * Design rule: only serializable values (signals, plain data) are stored here.
 * Class instances that can't survive resume (dispatchers, browser feature
 * detectors) are wrapped in `NoSerialize` and re-populated by `<QwikCdkRoot>`'s
 * `useVisibleTask$` after hydration.
 *
 * Consumer hooks (`useDialog`, `useOverlay`) read this context and return QRLs
 * that close over the signals — so click handlers survive resume because the
 * QRLs are fetched on demand and their captured signals are serializable.
 */

import {createContextId, type Signal, type NoSerialize} from '@builder.io/qwik';
import type {OverlayEntry} from '../overlay/overlay-registry';
import type {DialogConfig} from '../dialog/dialog-config';
import type {DialogRef} from '../dialog/dialog-ref';
import type {OverlayKeyboardDispatcher} from '../overlay/dispatchers/overlay-keyboard-dispatcher';
import type {OverlayOutsideClickDispatcher} from '../overlay/dispatchers/overlay-outside-click-dispatcher';
import type {ScrollStrategy} from '../overlay/scroll/scroll-strategy';
import type {Direction} from '../bidi/directionality';

export interface QwikCdkInternals {
  /** Live registry of every open overlay; consumed by `<OverlayContainerOutlet>`. */
  entries: Signal<readonly OverlayEntry[]>;

  /**
   * Set the first time any overlay is ever created. Mirrors upstream
   * `OverlayContainer.getContainerElement()`: the `.cdk-overlay-container`
   * element is created lazily on first use and then kept in the DOM (even
   * once empty) for the page's lifetime — it does not exist at all before
   * the first overlay, and is never removed just because the last one
   * detached.
   */
  overlayContainerCreated: Signal<boolean>;

  /** Currently open dialog handles, in open order. */
  openDialogs: Signal<readonly NoSerialize<DialogRef>[]>;

  /** Defaults merged into every `DialogConfig` passed to `open$`. */
  dialogDefaults: Partial<DialogConfig>;

  /** Document direction; readable by overlay positioning. */
  direction: Signal<Direction>;

  /** Monotonic counter for `cdk-overlay-N` / `cdk-dialog-N` IDs. */
  idCounter: Signal<number>;

  /** Global keydown router. Populated client-side by `useVisibleTask$`. */
  keyboardDispatcher: NoSerialize<OverlayKeyboardDispatcher> | undefined;

  /** Global outside-click router. Populated client-side by `useVisibleTask$`. */
  outsideClickDispatcher: NoSerialize<OverlayOutsideClickDispatcher> | undefined;

  /** Default factory for `DialogConfig.scrollStrategy` when one isn't supplied. */
  dialogScrollStrategyFactory: NoSerialize<() => ScrollStrategy> | undefined;
}

/**
 * The single context every consumer hook reads. The store wrapping
 * (`useStore` in `<QwikCdkRoot>`) makes mutation of `keyboardDispatcher` /
 * `outsideClickDispatcher` from `useVisibleTask$` survive the SSR→CSR resume.
 */
export const QWIK_CDK = createContextId<QwikCdkInternals>('qwik-cdk/internals');
