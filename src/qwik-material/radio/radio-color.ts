/**
 * MatRadio color variants applied via the `.mat-<color>` host class. Narrowed
 * from upstream's ThemePalette (a superset) to the three values Angular
 * Material actually uses for radio buttons. See
 * src/material/radio/radio.ts's `color` Input (M2-only; no effect in M3
 * themes, matched here too — this port has no runtime M2/M3 theming switch).
 */
export type MatRadioColor = 'primary' | 'accent' | 'warn';
