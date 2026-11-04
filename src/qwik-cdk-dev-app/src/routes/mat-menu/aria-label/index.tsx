import {$, component$} from '@qwik.dev/core';
import {
  MatMenu,
  MatMenuItem,
  MatMenuTrigger,
  createMatMenu,
} from '@angular-community/qwik-material/menu';

/** Mirrors `src/dev-app/qwik-parity/menu.ts`'s `MenuAriaLabel`. */
const Scenario = component$(() => {
  const menu = createMatMenu({
    'aria-label': 'Account actions',
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
        aria-label="Open labeled menu"
      >
        Actions
      </MatMenuTrigger>
      <MatMenu />
    </div>
  );
});

export default component$(() => (
  <>
    <Scenario />
    <main data-scenario-ready>ready</main>
  </>
));
