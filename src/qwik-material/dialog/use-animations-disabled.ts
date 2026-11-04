import {useContext, useContextProvider, useSignal, type Signal} from '@qwik.dev/core';
import {MAT_ANIMATIONS_DISABLED} from './mat-dialog-tokens';

/**
 * A frozen no-animations-disabled default. Consumers who don't call
 * `useMatAnimationsProvider()` get this shim; every reader reads `.value`
 * (never mutates), so the frozen shape is fine.
 */
const _ANIMATIONS_ENABLED_DEFAULT: Signal<boolean> = Object.freeze({
  value: false,
}) as Signal<boolean>;

/**
 * Reads the MAT_ANIMATIONS_DISABLED context, falling back to the frozen
 * default when no provider is present.
 */
export function useAnimationsDisabled(): Signal<boolean> {
  return useContext(MAT_ANIMATIONS_DISABLED, _ANIMATIONS_ENABLED_DEFAULT);
}

/**
 * Provides {@link MAT_ANIMATIONS_DISABLED} for this subtree — call once near the root (or
 * anywhere deeper) to disable every Material animation below it. `disabled` seeds the
 * underlying `Signal<boolean>` ONCE, at this call's first render (same "one-time seed" shape
 * as every other provider hook in this project) — flip animations on/off later at runtime by
 * writing `.value` on the signal this function RETURNS, not by changing the `disabled`
 * argument on a later render (which is ignored, same as every other `useSignal()` initializer).
 */
export function useMatAnimationsProvider(disabled?: boolean): Signal<boolean> {
  const animationsDisabled = useSignal(disabled ?? false);
  useContextProvider(MAT_ANIMATIONS_DISABLED, animationsDisabled);
  return animationsDisabled;
}
