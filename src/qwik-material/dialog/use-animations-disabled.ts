import {useContext, type Signal} from '@qwik.dev/core';
import {MAT_ANIMATIONS_DISABLED} from './mat-dialog-tokens';

/**
 * A frozen no-animations-disabled default. Consumers who don't mount
 * <QwikMaterialProvider> get this shim; the container reads .value
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
