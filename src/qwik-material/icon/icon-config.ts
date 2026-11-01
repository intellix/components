import {createContextId} from '@qwik.dev/core';
import type {MatIconColor} from './icon-color';

/**
 * Defaults applied to every <MatIcon> in a subtree. Consumers provide this via
 * <QwikMaterialProvider matIconConfig={...}>. Mirrors upstream
 * MatIconDefaultOptions (src/material/icon/icon.ts:31-42) for `color`, and
 * MatIconRegistry's app-wide `setDefaultFontSetClass` /
 * `getDefaultFontSetClass` (src/material/icon/icon-registry.ts) for `fontSet`
 * — there is no registry object in this port, so the one piece of its state
 * that affects rendering is folded in here.
 */
export interface MatIconConfig {
  /** Default M2 palette color. Adds the `.mat-<color>` class if set. */
  color?: MatIconColor;
  /**
   * Default font-set class(es) applied to the host in font mode when a
   * `<MatIcon>` has no explicit `fontSet` prop. May be space-separated
   * (e.g. the upstream registry default, `MAT_ICON_DEFAULT_FONT_SET_CLASS`).
   * Unlike the `fontSet` *prop*, this never feeds `data-mat-icon-namespace` —
   * upstream's registry default is class-ladder-only, never attribute-visible
   * (see MatIcon's `[attr.data-mat-icon-namespace]` host binding vs.
   * `_updateFontIconClasses`'s use of `getDefaultFontSetClass()`).
   */
  fontSet?: string;
}

/**
 * Upstream `MatIconRegistry`'s built-in default
 * (`_defaultFontSetClass = ['material-icons', 'mat-ligature-font']`,
 * src/material/icon/icon-registry.ts). Applied by `<MatIcon>` in font mode
 * whenever neither the `fontSet` prop nor `MatIconConfig.fontSet` is set.
 */
export const MAT_ICON_DEFAULT_FONT_SET_CLASS = 'material-icons mat-ligature-font';

/**
 * Context id used by <MatIcon> to read config. The id string is exposed
 * publicly and MUST remain stable across releases — consumers may inject it
 * directly in advanced scenarios.
 */
export const MAT_ICON_CONFIG = createContextId<MatIconConfig>('qwikMaterial/iconConfig');
