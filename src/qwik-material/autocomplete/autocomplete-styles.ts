// Generated from scss/autocomplete/autocomplete-prebuilt.scss by scripts/component-styles.mjs — do not
// edit; run `pnpm -C src/qwik-material generate-component-styles`.
import {useStyles$} from '@qwik.dev/core';

/**
 * Registers this entry point's CSS — `scss/autocomplete/autocomplete-prebuilt.scss`, compiled
 * inside `@layer qwik-material` — for the rendering document, once: upstream's `MatAutocomplete`'s
 * `styleUrl: 'autocomplete.css'` (autocomplete.ts) (src/material/autocomplete/), attached when the
 * component is first created, unscoped (`ViewEncapsulation.None`). Server rendering writes it
 * before the first instance; a component first rendered in the browser brings it with its own
 * chunk. Call it as the component's FIRST hook — Qwik keys a `useStyles$` `<style>` by the call
 * site AND the hook's index in the component, so only first-hook calls share one `<style>` (README
 * "Component styles"). Exported for markup rendered without the component (a hand-written host, a
 * plain render function).
 */
export function useMatAutocompleteStyles(): void {
  useStyles$(
    `@layer qwik-cdk,qwik-material;@layer qwik-material{div.mat-mdc-autocomplete-panel{width:100%;max-height:256px;visibility:hidden;transform-origin:center top;overflow:auto;padding:8px 0;box-sizing:border-box;position:relative;border-radius:var(--mat-autocomplete-container-shape, var(--mat-sys-corner-extra-small));box-shadow:var(--mat-autocomplete-container-elevation-shadow, 0px 3px 1px -2px rgba(0, 0, 0, 0.2), 0px 2px 2px 0px rgba(0, 0, 0, 0.14), 0px 1px 5px 0px rgba(0, 0, 0, 0.12));background-color:var(--mat-autocomplete-background-color, var(--mat-sys-surface-container))}@media(forced-colors: active){div.mat-mdc-autocomplete-panel{outline:solid 1px}}.cdk-overlay-pane:not(.mat-mdc-autocomplete-panel-above) div.mat-mdc-autocomplete-panel{border-top-left-radius:0;border-top-right-radius:0}.mat-mdc-autocomplete-panel-above div.mat-mdc-autocomplete-panel{border-bottom-left-radius:0;border-bottom-right-radius:0;transform-origin:center bottom}div.mat-mdc-autocomplete-panel.mat-mdc-autocomplete-visible{visibility:visible}div.mat-mdc-autocomplete-panel.mat-mdc-autocomplete-hidden,.cdk-overlay-pane:has(>.mat-mdc-autocomplete-hidden){visibility:hidden;pointer-events:none}@keyframes _mat-autocomplete-enter{from{opacity:0;transform:scaleY(0.8)}to{opacity:1;transform:none}}.mat-autocomplete-panel-animations-enabled{animation:_mat-autocomplete-enter 120ms cubic-bezier(0, 0, 0.2, 1)}mat-autocomplete{display:none}}`,
  );
}
