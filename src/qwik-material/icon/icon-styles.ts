// Generated from scss/icon/icon-prebuilt.scss by scripts/component-styles.mjs — do not
// edit; run `pnpm -C src/qwik-material generate-component-styles`.
import {useStyles$} from '@qwik.dev/core';

/**
 * Registers this entry point's CSS — `scss/icon/icon-prebuilt.scss`, compiled inside `@layer
 * qwik-material` — for the rendering document, once: upstream's `MatIcon`'s `styleUrl: 'icon.css'`
 * (icon.ts) (src/material/icon/), attached when the component is first created, unscoped
 * (`ViewEncapsulation.None`). Server rendering writes it before the first instance; a component
 * first rendered in the browser brings it with its own chunk. Call it as the component's FIRST hook
 * — Qwik keys a `useStyles$` `<style>` by the call site AND the hook's index in the component, so
 * only first-hook calls share one `<style>` (README "Component styles"). Exported for markup
 * rendered without the component (a hand-written host, a plain render function).
 */
export function useMatIconStyles(): void {
  useStyles$(
    `@layer qwik-material{mat-icon,mat-icon.mat-primary,mat-icon.mat-accent,mat-icon.mat-warn{color:var(--mat-icon-color, inherit)}.mat-icon{-webkit-user-select:none;user-select:none;background-repeat:no-repeat;display:inline-block;fill:currentColor;height:24px;width:24px;overflow:hidden}.mat-icon.mat-icon-inline{font-size:inherit;height:inherit;line-height:inherit;width:inherit}.mat-icon.mat-ligature-font[fontIcon]::before{content:attr(fontIcon)}[dir=rtl] .mat-icon-rtl-mirror{transform:scale(-1, 1)}.mat-form-field:not(.mat-form-field-appearance-legacy) .mat-form-field-prefix .mat-icon,.mat-form-field:not(.mat-form-field-appearance-legacy) .mat-form-field-suffix .mat-icon{display:block}.mat-form-field:not(.mat-form-field-appearance-legacy) .mat-form-field-prefix .mat-icon-button .mat-icon,.mat-form-field:not(.mat-form-field-appearance-legacy) .mat-form-field-suffix .mat-icon-button .mat-icon{margin:auto}}`,
  );
}
