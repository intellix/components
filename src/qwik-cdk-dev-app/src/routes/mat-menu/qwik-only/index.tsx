import {$, component$, useSignal} from '@qwik.dev/core';
import {QwikMaterialProvider} from '@angular-community/qwik-material/dialog';
import {
  MatMenu,
  MatMenuItem,
  MatMenuTrigger,
  createMatMenu,
} from '@angular-community/qwik-material/menu';

/**
 * Qwik-only scenario — covers behaviour `angular-parity.spec.ts` doesn't
 * exercise: typeahead letter-key selection (`createFocusKeyManager(...).
 * withTypeAhead()`, wired up but never driven by a letter key in any
 * Angular-mirrored scenario), `matMenuTriggerRestoreFocus={false}`, and the
 * `onMenuOpened$`/`onMenuClosed$` callbacks. See
 * specs/material-menu/qwik-only.spec.ts.
 */
const Scenario = component$(() => {
  const typeaheadMenu = createMatMenu({
    content$: $(() => (
      <>
        <MatMenuItem>Apple</MatMenuItem>
        <MatMenuItem>Banana</MatMenuItem>
        <MatMenuItem>Cherry</MatMenuItem>
      </>
    )),
  });

  const noRestoreMenu = createMatMenu({
    content$: $(() => (
      <>
        <MatMenuItem>Item 1</MatMenuItem>
        <MatMenuItem>Item 2</MatMenuItem>
      </>
    )),
  });

  const openedCount = useSignal(0);
  const closedCount = useSignal(0);
  const callbacksMenu = createMatMenu({
    content$: $(() => (
      <>
        <MatMenuItem>Item 1</MatMenuItem>
      </>
    )),
  });

  return (
    <div data-parity-root>
      <MatMenuTrigger
        as="button"
        class="menu-trigger"
        style="position: fixed; top: 120px; left: 120px; width: 160px; height: 48px;"
        menu={typeaheadMenu}
        aria-label="Open typeahead menu"
      >
        Fruit
      </MatMenuTrigger>
      <MatMenu />

      <button
        class="focus-target"
        style="position: fixed; top: 120px; left: 320px; width: 100px; height: 40px;"
      >
        Elsewhere
      </button>
      <MatMenuTrigger
        as="button"
        class="menu-trigger no-restore-trigger"
        style="position: fixed; top: 200px; left: 120px; width: 160px; height: 48px;"
        menu={noRestoreMenu}
        restoreFocus={false}
        aria-label="Open menu without focus restore"
      >
        No Restore
      </MatMenuTrigger>
      <MatMenu />

      <MatMenuTrigger
        as="button"
        class="menu-trigger callbacks-trigger"
        style="position: fixed; top: 280px; left: 120px; width: 160px; height: 48px;"
        menu={callbacksMenu}
        onMenuOpened$={() => {
          openedCount.value++;
        }}
        onMenuClosed$={() => {
          closedCount.value++;
        }}
        aria-label="Open menu with callbacks"
      >
        Callbacks
      </MatMenuTrigger>
      <MatMenu />
      <span data-opened-count>{openedCount.value}</span>
      <span data-closed-count>{closedCount.value}</span>
    </div>
  );
});

export default component$(() => (
  <QwikMaterialProvider>
    <Scenario />
    <main data-scenario-ready>ready</main>
  </QwikMaterialProvider>
));
