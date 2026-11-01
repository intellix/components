import {createContextId} from '@qwik.dev/core';

/** Mirrors upstream's `MatFormFieldAppearance`. */
export type MatFormFieldAppearance = 'fill' | 'outline';
/** Mirrors upstream's `FloatLabelType`. */
export type MatFormFieldFloatLabelType = 'always' | 'auto';
/** Mirrors upstream's `SubscriptSizing`. */
export type MatFormFieldSubscriptSizing = 'fixed' | 'dynamic';
/** Mirrors upstream's `ThemePalette`, scoped to what `MatFormField` accepts. */
export type MatFormFieldColor = 'primary' | 'accent' | 'warn';

/**
 * Defaults applied to every `MatFormField` in a subtree that doesn't set
 * its own. Mirrors upstream's `MatFormFieldDefaultOptions` +
 * `MAT_FORM_FIELD_DEFAULT_OPTIONS` (`src/material/form-field/form-field.ts`
 * lines 68-92). Consumers provide this via
 * `<QwikMaterialProvider matFormFieldConfig={{...}}>`.
 */
export interface MatFormFieldConfig {
  /** Upstream default: `'fill'`. */
  appearance?: MatFormFieldAppearance;
  /** M2-themes-only API (no effect in M3). Upstream default: `'primary'`
   *  (NOT `'accent'` — different from every control component ported so
   *  far; see `MatFormField`'s own `color: ThemePalette = 'primary'`
   *  field initializer). */
  color?: MatFormFieldColor;
  /** Upstream default: `false`. */
  hideRequiredMarker?: boolean;
  /** Upstream default: `'auto'`. */
  floatLabel?: MatFormFieldFloatLabelType;
  /** Upstream default: `'fixed'`. */
  subscriptSizing?: MatFormFieldSubscriptSizing;
}

/**
 * Context id used by `MatFormField` to read config. The id string is
 * exposed publicly and MUST remain stable across releases.
 */
export const MAT_FORM_FIELD_CONFIG = createContextId<MatFormFieldConfig>(
  'qwikMaterial/formFieldConfig',
);

/**
 * Mirrors upstream's hardcoded defaults (`DEFAULT_APPEARANCE`,
 * `DEFAULT_FLOAT_LABEL`, `DEFAULT_SUBSCRIPT_SIZING`, and `MatFormField`'s
 * own `color` field initializer) — used as the `useContext()` fallback when
 * no `<QwikMaterialProvider>` ancestor exists, and as `MatFormField`'s own
 * final fallback so a provider supplying an empty `matFormFieldConfig`
 * still behaves correctly.
 */
export const MAT_FORM_FIELD_CONFIG_DEFAULTS: MatFormFieldConfig = {
  appearance: 'fill',
  color: 'primary',
  hideRequiredMarker: false,
  floatLabel: 'auto',
  subscriptSizing: 'fixed',
};
