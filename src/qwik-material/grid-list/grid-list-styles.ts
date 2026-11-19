// Generated from scss/grid-list/grid-list-prebuilt.scss by scripts/component-styles.mjs — do not
// edit; run `pnpm -C src/qwik-material generate-component-styles`.
import {useStyles$} from '@qwik.dev/core';

/**
 * Registers this entry point's CSS — `scss/grid-list/grid-list-prebuilt.scss`, compiled inside
 * `@layer qwik-material` — for the rendering document, once: upstream's
 * `MatGridList`/`MatGridTile`'s `styleUrl: 'grid-list.css'` (src/material/grid-list/), attached
 * when the component is first created, unscoped (`ViewEncapsulation.None`). Server rendering writes
 * it before the first instance; a component first rendered in the browser brings it with its own
 * chunk. Call it as the component's FIRST hook — Qwik keys a `useStyles$` `<style>` by the call
 * site AND the hook's index in the component, so only first-hook calls share one `<style>` (README
 * "Component styles"). Exported for markup rendered without the component (a hand-written host, a
 * plain render function).
 */
export function useMatGridListStyles(): void {
  useStyles$(
    `@layer qwik-cdk,qwik-material;@layer qwik-material{.mat-grid-list{display:block;position:relative}.mat-grid-tile{display:block;position:absolute;overflow:hidden}.mat-grid-tile .mat-grid-tile-header,.mat-grid-tile .mat-grid-tile-footer{display:flex;align-items:center;height:48px;color:#fff;background:rgba(0,0,0,.38);overflow:hidden;padding:0 16px;position:absolute;left:0;right:0}.mat-grid-tile .mat-grid-tile-header>*,.mat-grid-tile .mat-grid-tile-footer>*{margin:0;padding:0;font-weight:normal;font-size:inherit}.mat-grid-tile .mat-grid-tile-header.mat-2-line,.mat-grid-tile .mat-grid-tile-footer.mat-2-line{height:68px}.mat-grid-tile .mat-grid-list-text{display:flex;flex-direction:column;flex:auto;box-sizing:border-box;overflow:hidden}.mat-grid-tile .mat-grid-list-text>*{margin:0;padding:0;font-weight:normal;font-size:inherit}.mat-grid-tile .mat-grid-list-text:empty{display:none}.mat-grid-tile .mat-grid-tile-header{top:0}.mat-grid-tile .mat-grid-tile-footer{bottom:0}.mat-grid-tile .mat-grid-avatar{padding-right:16px}[dir=rtl] .mat-grid-tile .mat-grid-avatar{padding-right:0;padding-left:16px}.mat-grid-tile .mat-grid-avatar:empty{display:none}.mat-grid-tile-header{font-size:var(--mat-grid-list-tile-header-primary-text-size)}.mat-grid-tile-header .mat-line{white-space:nowrap;overflow:hidden;text-overflow:ellipsis;display:block;box-sizing:border-box}.mat-grid-tile-header .mat-line:nth-child(n+2){font-size:var(--mat-grid-list-tile-header-secondary-text-size)}.mat-grid-tile-footer{font-size:var(--mat-grid-list-tile-footer-primary-text-size)}.mat-grid-tile-footer .mat-line{white-space:nowrap;overflow:hidden;text-overflow:ellipsis;display:block;box-sizing:border-box}.mat-grid-tile-footer .mat-line:nth-child(n+2){font-size:var(--mat-grid-list-tile-footer-secondary-text-size)}.mat-grid-tile-content{top:0;left:0;right:0;bottom:0;position:absolute;display:flex;align-items:center;justify-content:center;height:100%;padding:0;margin:0}}`,
  );
}
