// Generated from scss/divider/divider-prebuilt.scss by scripts/component-styles.mjs — do not
// edit; run `pnpm -C src/qwik-material generate-component-styles`.
import {useStyles$} from '@qwik.dev/core';

/**
 * Registers this entry point's CSS — `scss/divider/divider-prebuilt.scss`, compiled inside `@layer
 * qwik-material` — for the rendering document, once: upstream's `MatDivider`'s `styleUrl:
 * 'divider.css'` (divider.ts) (src/material/divider/), attached when the component is first
 * created, unscoped (`ViewEncapsulation.None`). Server rendering writes it before the first
 * instance; a component first rendered in the browser brings it with its own chunk. Call it as the
 * component's FIRST hook — Qwik keys a `useStyles$` `<style>` by the call site AND the hook's index
 * in the component, so only first-hook calls share one `<style>` (README "Component styles").
 * Exported for markup rendered without the component (a hand-written host, a plain render
 * function).
 */
export function useMatDividerStyles(): void {
  useStyles$(
    `@layer qwik-material{.mat-divider{display:block;margin:0;border-top-style:solid;border-top-color:var(--mat-divider-color, var(--mat-sys-outline-variant));border-top-width:var(--mat-divider-width, 1px)}.mat-divider.mat-divider-vertical{border-top:0;border-right-style:solid;border-right-color:var(--mat-divider-color, var(--mat-sys-outline-variant));border-right-width:var(--mat-divider-width, 1px)}.mat-divider.mat-divider-inset{margin-left:80px}[dir=rtl] .mat-divider.mat-divider-inset{margin-left:auto;margin-right:80px}}`,
  );
}
