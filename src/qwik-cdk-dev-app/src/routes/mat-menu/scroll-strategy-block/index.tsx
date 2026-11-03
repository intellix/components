import {$, component$} from '@qwik.dev/core';
import {QwikMaterialProvider} from '@angular-community/qwik-material/dialog';
import {
  MatMenu,
  MatMenuItem,
  MatMenuTrigger,
  createMatMenu,
} from '@angular-community/qwik-material/menu';

/**
 * Demonstrates the `MAT_MENU_SCROLL_STRATEGY` (upstream equivalent) API
 * shape: a menu configured to use the `block` scroll strategy instead of
 * the default `reposition` one, via `<QwikMaterialProvider
 * matMenuScrollStrategy="block">` — a plain, serializable
 * `ScrollStrategyDescriptor` (see `qwik-cdk/overlay/scroll/
 * scroll-strategy-descriptor.ts`), not a function factory.
 *
 * Fixed (see `menu/SYNC.md`'s "scroll-strategy configuration" entry): the
 * configured descriptor now survives a real SSR→CSR resume and IS honored
 * — confirmed via `specs/material-menu/scroll-strategy.spec.ts`'s
 * previously-skipped, now-passing case (after a real page load + open,
 * `<html>` gets `cdk-global-scrollblock`, the `block` strategy's marker
 * class).
 */
const Scenario = component$(() => {
  const menu = createMatMenu({
    content$: $(() => (
      <>
        <MatMenuItem>Refresh</MatMenuItem>
        <MatMenuItem>Settings</MatMenuItem>
      </>
    )),
  });

  return (
    <div data-parity-root>
      <MatMenuTrigger
        as="button"
        class="menu-trigger"
        style="position: fixed; top: 120px; left: 120px; width: 160px; height: 48px;"
        menu={menu}
        aria-label="Open menu"
      >
        Actions
      </MatMenuTrigger>
      <MatMenu />
      {/* Makes the page tall enough to scroll — BlockScrollStrategy only
          applies the 'cdk-global-scrollblock' class when the page can
          actually scroll (matches real browser behavior; this is NOT a
          scenario-specific default, just what makes the effect
          observable at all in a near-empty test page). */}
      <div style="height: 3000px;" />
    </div>
  );
});

export default component$(() => (
  <QwikMaterialProvider matMenuScrollStrategy="block">
    <Scenario />
    <main data-scenario-ready>ready</main>
  </QwikMaterialProvider>
));
