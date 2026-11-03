import {$, component$} from '@qwik.dev/core';
import {QwikMaterialProvider} from '@angular-community/qwik-material/dialog';
import {
  MatMenu,
  MatMenuItem,
  MatMenuTrigger,
  createMatMenu,
} from '@angular-community/qwik-material/menu';
import {createBlockScrollStrategy} from '@angular-community/qwik-cdk/overlay';

/**
 * Demonstrates the `MAT_MENU_SCROLL_STRATEGY` (upstream equivalent) API
 * shape: a menu configured to use the `block` scroll strategy instead of
 * the default `reposition` one, via `<QwikMaterialProvider
 * matMenuScrollStrategyFactory={…}>`.
 *
 * KNOWN GAP (see `menu/SYNC.md`'s "scroll-strategy configuration" entry):
 * the custom factory does not actually take effect yet — confirmed via
 * `specs/material-menu/scroll-strategy.spec.ts`'s skipped case. The menu
 * still opens correctly and silently keeps using `reposition` (no
 * regression; just not customizable yet). Kept as a route so the intended
 * API shape is exercised by at least the "still opens" case and ready for
 * whoever fixes the underlying bug.
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
  <QwikMaterialProvider matMenuScrollStrategyFactory={() => createBlockScrollStrategy()}>
    <Scenario />
    <main data-scenario-ready>ready</main>
  </QwikMaterialProvider>
));
