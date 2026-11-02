import {$, component$} from '@qwik.dev/core';
import {QwikMaterialProvider} from '@angular-community/qwik-material/dialog';
import {
  MatMenu,
  MatMenuItem,
  MatMenuTrigger,
  createMatMenu,
} from '@angular-community/qwik-material/menu';

/** Mirrors `src/dev-app/qwik-parity/menu.ts`'s `MenuPositions`. */
const Scenario = component$(() => {
  const items$ = $(() => (
    <>
      <MatMenuItem>Item 1</MatMenuItem>
      <MatMenuItem>Item 2</MatMenuItem>
    </>
  ));
  const beforeMenu = createMatMenu({xPosition: 'before', content$: items$});
  const afterMenu = createMatMenu({xPosition: 'after', content$: items$});
  const aboveMenu = createMatMenu({yPosition: 'above', content$: items$});
  const belowMenu = createMatMenu({yPosition: 'below', content$: items$});

  return (
    <div data-parity-root>
      <MatMenuTrigger
        as="button"
        class="menu-trigger"
        style="position: fixed; top: 80px; left: 360px; width: 140px; height: 48px;"
        menu={beforeMenu}
        aria-label="Open menu positioned before"
      >
        Before
      </MatMenuTrigger>
      <MatMenu />

      <MatMenuTrigger
        as="button"
        class="menu-trigger"
        style="position: fixed; top: 160px; left: 360px; width: 140px; height: 48px;"
        menu={afterMenu}
        aria-label="Open menu positioned after"
      >
        After
      </MatMenuTrigger>
      <MatMenu />

      <MatMenuTrigger
        as="button"
        class="menu-trigger"
        style="position: fixed; top: 320px; left: 360px; width: 140px; height: 48px;"
        menu={aboveMenu}
        aria-label="Open menu positioned above"
      >
        Above
      </MatMenuTrigger>
      <MatMenu />

      <MatMenuTrigger
        as="button"
        class="menu-trigger"
        style="position: fixed; top: 400px; left: 360px; width: 140px; height: 48px;"
        menu={belowMenu}
        aria-label="Open menu positioned below"
      >
        Below
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
