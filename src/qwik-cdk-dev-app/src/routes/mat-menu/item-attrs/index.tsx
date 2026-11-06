import {$, component$} from '@qwik.dev/core';
import {MatButton} from '@angular-community/qwik-material/button';
import {
  createMatMenu,
  MatMenu,
  MatMenuItem,
  useMatMenuTrigger,
} from '@angular-community/qwik-material/menu';

/** Bespoke scenario: extra attributes on a `MatMenuItem` reach its rendered `<button>`. */
export default component$(() => {
  const menu = createMatMenu({
    content$: $(() => (
      <MatMenuItem data-testid="logout-item" title="Sign out of this device">
        Log out
      </MatMenuItem>
    )),
  });
  const trigger = useMatMenuTrigger({menu});
  return (
    <>
      <div data-parity-root>
        <MatButton {...trigger.hostProps}>Account</MatButton>
        <MatMenu />
      </div>
      <main data-scenario-ready>ready</main>
    </>
  );
});
