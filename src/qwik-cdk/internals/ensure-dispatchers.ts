import {noSerialize} from '@qwik.dev/core';
import {createPlatform} from '../platform/platform';
import {
  createNoopScrollStrategy,
  createOverlayKeyboardDispatcher,
  createOverlayOutsideClickDispatcher,
  type OverlayKeyboardDispatcher,
  type OverlayOutsideClickDispatcher,
} from '../overlay/public-api';
import type {QwikCdkInternals} from './internals';

/**
 * Returns the browser-only overlay dispatchers, creating them on first use.
 *
 * `<QwikCdkRoot>` creates them in a `useVisibleTask$`, but visible tasks run in
 * no guaranteed order: a dialog opened from another visible task (or any
 * handler that runs first) would otherwise find them missing. Upstream gets
 * them from DI, which is always ready. Browser-only.
 */
export function ensureCdkDispatchers(internals: QwikCdkInternals): {
  keyboardDispatcher: OverlayKeyboardDispatcher;
  outsideClickDispatcher: OverlayOutsideClickDispatcher;
} {
  if (!internals.keyboardDispatcher || !internals.outsideClickDispatcher) {
    internals.keyboardDispatcher = noSerialize(createOverlayKeyboardDispatcher());
    internals.outsideClickDispatcher = noSerialize(
      createOverlayOutsideClickDispatcher(createPlatform()),
    );
  }
  if (!internals.dialogScrollStrategyFactory) {
    internals.dialogScrollStrategyFactory = noSerialize(() => createNoopScrollStrategy());
  }
  return {
    keyboardDispatcher: internals.keyboardDispatcher!,
    outsideClickDispatcher: internals.outsideClickDispatcher!,
  };
}
