// Generated from scss/tree/tree-prebuilt.scss by scripts/component-styles.mjs — do not
// edit; run `pnpm -C src/qwik-material generate-component-styles`.
import {useStyles$} from '@qwik.dev/core';

/**
 * Registers this entry point's CSS — `scss/tree/tree-prebuilt.scss`, compiled inside `@layer
 * qwik-material` — for the rendering document, once: upstream's `MatTree`'s `styleUrl: 'tree.css'`
 * (tree.ts) (src/material/tree/), attached when the component is first created, unscoped
 * (`ViewEncapsulation.None`). Server rendering writes it before the first instance; a component
 * first rendered in the browser brings it with its own chunk. Call it as the component's FIRST hook
 * — Qwik keys a `useStyles$` `<style>` by the call site AND the hook's index in the component, so
 * only first-hook calls share one `<style>` (README "Component styles"). Exported for markup
 * rendered without the component (a hand-written host, a plain render function).
 */
export function useMatTreeStyles(): void {
  useStyles$(
    `@layer qwik-material{.mat-tree{display:block;background-color:var(--mat-tree-container-background-color, var(--mat-sys-surface))}.mat-tree-node,.mat-nested-tree-node{color:var(--mat-tree-node-text-color, var(--mat-sys-on-surface));font-family:var(--mat-tree-node-text-font, var(--mat-sys-body-large-font));font-size:var(--mat-tree-node-text-size, var(--mat-sys-body-large-size));font-weight:var(--mat-tree-node-text-weight, var(--mat-sys-body-large-weight))}.mat-tree-node{display:flex;align-items:center;flex:1;word-wrap:break-word;min-height:var(--mat-tree-node-min-height, 48px)}.mat-nested-tree-node{border-bottom-width:0}}`,
  );
}
