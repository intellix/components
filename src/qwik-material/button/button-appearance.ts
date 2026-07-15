/**
 * Possible appearances for a `<MatButton>`.
 * See https://m3.material.io/components/buttons/overview.
 */
export type MatButtonAppearance = 'text' | 'filled' | 'elevated' | 'outlined' | 'tonal';

/**
 * Legacy M2 palette. Deprecated in M3 but still honoured by upstream
 * @angular/material for backwards-compatible themes. Applying `color` adds
 * a `mat-<color>` class that consumers can hook M2 palette theming into.
 */
export type MatButtonColor = 'primary' | 'accent' | 'warn';

/**
 * Classes that need to be set for each appearance of MatButton.
 * Mirrors src/material/button/button.ts line 16-22 with the Map converted to
 * a plain-object Record so lookup is a plain property access (no Map runtime
 * import in the consumer's bundle) and serialization is trivial.
 */
export const APPEARANCE_CLASSES: Record<MatButtonAppearance, readonly string[]> = {
  text: ['mat-mdc-button'],
  filled: ['mdc-button--unelevated', 'mat-mdc-unelevated-button'],
  elevated: ['mdc-button--raised', 'mat-mdc-raised-button'],
  outlined: ['mdc-button--outlined', 'mat-mdc-outlined-button'],
  tonal: ['mat-tonal-button'],
};
