import {$, component$} from '@qwik.dev/core';
import {MatButton} from '@angular-community/qwik-material/button';
import {
  MatMenu,
  MatMenuItem,
  createMatMenu,
  useMatMenuTrigger,
} from '@angular-community/qwik-material/menu';

/**
 * Port of material.angular.dev's `menu-overview` docs example
 * (src/components-examples/material/menu/menu-overview/). The real template combines TWO
 * directives on one native `<button>` — bare `matButton` (no appearance value, so the "text"
 * appearance) AND `[matMenuTriggerFor]="menu"`. Reproduced here with the "directive hooks"
 * pattern (`qwik-material/README.md`'s "Composing directives" section):
 * `useMatMenuTrigger()` returns exactly what `[matMenuTriggerFor]` contributes to its host
 * (`hostProps` — class, `aria-haspopup`/`aria-expanded`/`aria-controls`, `ref`, the open/close
 * click/keydown handlers), spread directly onto `<MatButton>`. This is the SAME engine
 * `<MatMenuTrigger as="button">` uses internally (`qwik-material/menu/use-mat-menu-trigger.ts`),
 * just called here the way a real consumer migrating this exact Angular template would.
 *
 * Scope: this route's own interaction (see specs/examples/angular-parity.spec.ts) only opens the
 * menu — the trigger button never loses/regains focus in that flow (confirmed live: Angular
 * auto-focuses the first menu item on open, so the trigger itself never shows a FocusMonitor
 * class at the compared step), so `MatButton`'s own `useFocusOrigin()` tracking is unaffected
 * either way.
 */

export default component$(() => {
  const menu = createMatMenu({
    content$: $(() => (
      <>
        <MatMenuItem>Item 1</MatMenuItem>
        <MatMenuItem>Item 2</MatMenuItem>
      </>
    )),
  });

  const trigger = useMatMenuTrigger({menu});

  return (
    <menu-overview-example>
      <MatButton {...trigger.hostProps}>Menu</MatButton>
      <MatMenu />
    </menu-overview-example>
  );
});
