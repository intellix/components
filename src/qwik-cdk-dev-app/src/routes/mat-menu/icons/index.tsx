import {$, component$} from '@qwik.dev/core';
import {QwikMaterialProvider} from '@angular-community/qwik-material/dialog';
import {
  MatMenu,
  MatMenuItem,
  MatMenuTrigger,
  createMatMenu,
} from '@angular-community/qwik-material/menu';

/**
 * Mirrors `src/dev-app/qwik-parity/menu.ts`'s `MenuIcons`. `matMenuItemIcon`
 * is a bare content-projection selector attribute with no backing directive
 * (see `src/material/menu/menu-item.html`: `<ng-content select="mat-icon,
 * [matMenuItemIcon]">`) — there is nothing to bind, so it's written as a
 * literal (lowercased by the DOM) attribute, same category as
 * `mat-card-avatar`.
 */
const Scenario = component$(() => {
  const menu = createMatMenu({
    content$: $(() => (
      <>
        <MatMenuItem
          icon={<span {...({matmenuitemicon: ''} as Record<string, string>)}>&#9742;</span>}
        >
          <span>Redial</span>
        </MatMenuItem>
        <MatMenuItem
          disabled
          icon={<span {...({matmenuitemicon: ''} as Record<string, string>)}>&#128222;</span>}
        >
          <span>Check voicemail</span>
        </MatMenuItem>
        <MatMenuItem
          icon={<span {...({matmenuitemicon: ''} as Record<string, string>)}>&#128263;</span>}
        >
          <span>Disable alerts</span>
        </MatMenuItem>
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
        aria-label="Open menu with icons"
      >
        Actions
      </MatMenuTrigger>
      <MatMenu />
    </div>
  );
});

export default component$(() => (
  <QwikMaterialProvider>
    <Scenario />
    <main data-scenario-ready>ready</main>
  </QwikMaterialProvider>
));
