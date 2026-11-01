import {$, component$} from '@qwik.dev/core';
import {QwikMaterialProvider} from '@angular-community/qwik-material/dialog';
import {
  MatMenu,
  MatMenuItem,
  MatMenuTrigger,
  createMatMenu,
} from '@angular-community/qwik-material/menu';

/** Mirrors `src/dev-app/qwik-parity/menu.ts`'s `MenuOverlapTrigger`. */
const Scenario = component$(() => {
  const menu = createMatMenu({
    overlapTrigger: true,
    content$: $(() => (
      <>
        <MatMenuItem>Item 1</MatMenuItem>
        <MatMenuItem>Item 2</MatMenuItem>
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
        aria-label="Open overlapping menu"
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
