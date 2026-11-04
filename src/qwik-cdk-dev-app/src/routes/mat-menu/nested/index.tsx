import {$, component$} from '@qwik.dev/core';
import {
  MatMenu,
  MatMenuItem,
  MatMenuTrigger,
  createMatMenu,
} from '@angular-community/qwik-material/menu';

/** Mirrors `src/dev-app/qwik-parity/menu.ts`'s `MenuNested`. */
const Scenario = component$(() => {
  const vertebrates = createMatMenu({
    content$: $(() => (
      <>
        <MatMenuItem>Fish</MatMenuItem>
        <MatMenuItem>Birds</MatMenuItem>
      </>
    )),
  });
  const animals = createMatMenu({
    content$: $(() => (
      <>
        <MatMenuItem menu={vertebrates}>Vertebrates</MatMenuItem>
        <MatMenuItem>Invertebrates</MatMenuItem>
      </>
    )),
  });

  return (
    <div data-parity-root>
      <MatMenuTrigger
        as="button"
        class="menu-trigger"
        style="position: fixed; top: 120px; left: 120px; width: 160px; height: 48px;"
        menu={animals}
        aria-label="Open nested menu"
      >
        Animals
      </MatMenuTrigger>
      <MatMenu />
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
