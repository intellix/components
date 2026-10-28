/**
 * Pure port of `CdkColumnDef`'s name -> CSS-class-friendly-name logic
 * (src/cdk/table/cell.ts's `_setNameInput`/`_updateColumnCssClassName`).
 *
 * Upstream regex is case-insensitive and replaces every disallowed
 * character with its OWN literal `-` (not collapsed), confirmed by
 * upstream's own spec: `crazy-column-NAME-1!@#$%^-_&*()2` ->
 * `crazy-column-NAME-1-------_----2`.
 */
export function cssClassFriendlyName(name: string): string {
  return name.replace(/[^a-z0-9_-]/gi, '-');
}

/** `cdk-column-<friendly-name>`, as `CdkColumnDef` sets via `classList.add`. */
export function cdkColumnClass(name: string): string {
  return `cdk-column-${cssClassFriendlyName(name)}`;
}

/** `mat-column-<friendly-name>`, Material's additional push (cell.ts
 *  `MatColumnDef._updateColumnCssClassName` override). */
export function matColumnClass(name: string): string {
  return `mat-column-${cssClassFriendlyName(name)}`;
}
