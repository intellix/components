// Generated from scss/toolbar/toolbar-prebuilt.scss by scripts/component-styles.mjs — do not
// edit; run `pnpm -C src/qwik-material generate-component-styles`.
import {useStyles$} from '@qwik.dev/core';

/**
 * Registers this entry point's CSS — `scss/toolbar/toolbar-prebuilt.scss`, compiled inside `@layer
 * qwik-material` — for the rendering document, once: upstream's `MatToolbar`'s `styleUrl:
 * 'toolbar.css'` (toolbar.ts) (src/material/toolbar/), attached when the component is first
 * created, unscoped (`ViewEncapsulation.None`). Server rendering writes it before the first
 * instance; a component first rendered in the browser brings it with its own chunk. Call it as the
 * component's FIRST hook — Qwik keys a `useStyles$` `<style>` by the call site AND the hook's index
 * in the component, so only first-hook calls share one `<style>` (README "Component styles").
 * Exported for markup rendered without the component (a hand-written host, a plain render
 * function).
 */
export function useMatToolbarStyles(): void {
  useStyles$(
    `@layer qwik-material{.mat-toolbar{background:var(--mat-toolbar-container-background-color, var(--mat-sys-surface));color:var(--mat-toolbar-container-text-color, var(--mat-sys-on-surface))}.mat-toolbar,.mat-toolbar h1,.mat-toolbar h2,.mat-toolbar h3,.mat-toolbar h4,.mat-toolbar h5,.mat-toolbar h6{font-family:var(--mat-toolbar-title-text-font, var(--mat-sys-title-large-font));font-size:var(--mat-toolbar-title-text-size, var(--mat-sys-title-large-size));line-height:var(--mat-toolbar-title-text-line-height, var(--mat-sys-title-large-line-height));font-weight:var(--mat-toolbar-title-text-weight, var(--mat-sys-title-large-weight));letter-spacing:var(--mat-toolbar-title-text-tracking, var(--mat-sys-title-large-tracking));margin:0}@media(forced-colors: active){.mat-toolbar{outline:solid 1px}}.mat-toolbar .mat-form-field-underline,.mat-toolbar .mat-form-field-ripple,.mat-toolbar .mat-focused .mat-form-field-ripple{background-color:currentColor}.mat-toolbar .mat-form-field-label,.mat-toolbar .mat-focused .mat-form-field-label,.mat-toolbar .mat-select-value,.mat-toolbar .mat-select-arrow,.mat-toolbar .mat-form-field.mat-focused .mat-select-arrow{color:inherit}.mat-toolbar .mat-input-element{caret-color:currentColor}.mat-toolbar .mat-mdc-button-base.mat-mdc-button-base.mat-unthemed{--mat-button-text-label-text-color: var(--mat-toolbar-container-text-color, var(--mat-sys-on-surface));--mat-button-outlined-label-text-color: var(--mat-toolbar-container-text-color, var(--mat-sys-on-surface))}.mat-toolbar-row,.mat-toolbar-single-row{display:flex;box-sizing:border-box;padding:0 16px;width:100%;flex-direction:row;align-items:center;white-space:nowrap;height:var(--mat-toolbar-standard-height, 64px)}@media(max-width: 599px){.mat-toolbar-row,.mat-toolbar-single-row{height:var(--mat-toolbar-mobile-height, 56px)}}.mat-toolbar-multiple-rows{display:flex;box-sizing:border-box;flex-direction:column;width:100%;min-height:var(--mat-toolbar-standard-height, 64px)}@media(max-width: 599px){.mat-toolbar-multiple-rows{min-height:var(--mat-toolbar-mobile-height, 56px)}}}`,
  );
}
