import {createContextId} from '@qwik.dev/core';
import type {MatButtonAppearance, MatButtonColor} from './button-appearance';

/**
 * Object that can be used to configure default options for every MatButton
 * variant (standard, icon, FAB, mini-FAB) rendered inside a
 * <QwikMaterialProvider matButtonConfig={…}> subtree.
 *
 * See design spec §2.1 and §2.3 for full field semantics.
 */
export interface MatButtonConfig {
  /**
   * Applied to buttons that don't set an explicit `color` prop.
   * Deprecated in M3 but honoured for backwards-compatibility.
   */
  color?: MatButtonColor | null;

  /**
   * Applied when a MatButton doesn't set an explicit `disabledInteractive`
   * prop. When true, disabled buttons keep focus + click events reachable
   * (useful for tooltip wrapping).
   */
  disabledInteractive?: boolean;

  /**
   * Default appearance for `<MatButton>` when neither the `appearance` prop
   * nor a caller-provided `appearance` is set. Not applied to `<MatIconButton>`,
   * `<MatFabButton>`, or `<MatMiniFabButton>` (those have only one appearance
   * each).
   */
  defaultAppearance?: MatButtonAppearance;
}

/**
 * Context token that installs default MatButton options in a subtree.
 * Provided by `<QwikMaterialProvider matButtonConfig={…}>`. Consumed by
 * every MatButton variant via `useContext(MAT_BUTTON_CONFIG, DEFAULTS)`.
 */
export const MAT_BUTTON_CONFIG = createContextId<MatButtonConfig>('qwikMaterial/buttonConfig');
