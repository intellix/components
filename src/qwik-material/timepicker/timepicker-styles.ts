// Generated from scss/timepicker/timepicker-prebuilt.scss by scripts/component-styles.mjs — do not
// edit; run `pnpm -C src/qwik-material generate-component-styles`.
import {useStyles$} from '@qwik.dev/core';

/**
 * Registers this entry point's CSS — `scss/timepicker/timepicker-prebuilt.scss`, compiled inside
 * `@layer qwik-material` — for the rendering document, once: upstream's `MatTimepicker`'s
 * `styleUrl: 'timepicker.css'` (timepicker.ts) (src/material/timepicker/), attached when the
 * component is first created, unscoped (`ViewEncapsulation.None`). Server rendering writes it
 * before the first instance; a component first rendered in the browser brings it with its own
 * chunk. Call it as the component's FIRST hook — Qwik keys a `useStyles$` `<style>` by the call
 * site AND the hook's index in the component, so only first-hook calls share one `<style>` (README
 * "Component styles"). Exported for markup rendered without the component (a hand-written host, a
 * plain render function).
 */
export function useMatTimepickerStyles(): void {
  useStyles$(
    `@layer qwik-material{@keyframes _mat-timepicker-enter{from{opacity:0;transform:scaleY(0.8)}to{opacity:1;transform:none}}@keyframes _mat-timepicker-exit{from{opacity:1}to{opacity:0}}mat-timepicker{display:none}.mat-timepicker-panel{width:100%;max-height:256px;transform-origin:center top;overflow:auto;padding:8px 0;box-sizing:border-box;position:relative;border-bottom-left-radius:var(--mat-timepicker-container-shape, var(--mat-sys-corner-extra-small));border-bottom-right-radius:var(--mat-timepicker-container-shape, var(--mat-sys-corner-extra-small));box-shadow:var(--mat-timepicker-container-elevation-shadow, 0px 3px 1px -2px rgba(0, 0, 0, 0.2), 0px 2px 2px 0px rgba(0, 0, 0, 0.14), 0px 1px 5px 0px rgba(0, 0, 0, 0.12));background-color:var(--mat-timepicker-container-background-color, var(--mat-sys-surface-container))}@media(forced-colors: active){.mat-timepicker-panel{outline:solid 1px}}.mat-timepicker-above .mat-timepicker-panel{border-bottom-left-radius:0;border-bottom-right-radius:0;border-top-left-radius:var(--mat-timepicker-container-shape, var(--mat-sys-corner-extra-small));border-top-right-radius:var(--mat-timepicker-container-shape, var(--mat-sys-corner-extra-small))}.mat-timepicker-panel-animations-enabled{animation:_mat-timepicker-enter 120ms cubic-bezier(0, 0, 0.2, 1)}.mat-timepicker-panel-animations-enabled.mat-timepicker-panel-exit{animation:_mat-timepicker-exit 100ms linear}.mat-timepicker-input[readonly]{cursor:pointer}@media(forced-colors: active){.mat-timepicker-toggle-default-icon{color:CanvasText}}}`,
  );
}
