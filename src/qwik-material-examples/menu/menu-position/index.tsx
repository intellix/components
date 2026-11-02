import {$, component$} from '@qwik.dev/core';
import {MatButton} from '@angular-community/qwik-material/button';
import {
  MatMenu,
  MatMenuItem,
  createMatMenu,
  useMatMenuTrigger,
} from '@angular-community/qwik-material/menu';

// Qwik port of material.angular.dev's `menu-position` docs example — see
// src/components-examples/material/menu/menu-position/menu-position-example.{ts,html}. Rendered
// unmodified by the Angular dev-app at /qwik-parity/examples/menu-position (the generic
// `examples/:exampleId` route). Each trigger stacks `matButton` AND `[matMenuTriggerFor]` on one
// `<button>` — reproduced with the directive-hooks pattern, same as `menu-overview`
// (menu/example/index.tsx).

export default component$(() => {
  const items$ = $(() => (
    <>
      <MatMenuItem>Item 1</MatMenuItem>
      <MatMenuItem>Item 2</MatMenuItem>
    </>
  ));
  const aboveMenu = createMatMenu({yPosition: 'above', content$: items$});
  const belowMenu = createMatMenu({yPosition: 'below', content$: items$});
  const beforeMenu = createMatMenu({xPosition: 'before', content$: items$});
  const afterMenu = createMatMenu({xPosition: 'after', content$: items$});

  const aboveTrigger = useMatMenuTrigger({menu: aboveMenu});
  const belowTrigger = useMatMenuTrigger({menu: belowMenu});
  const beforeTrigger = useMatMenuTrigger({menu: beforeMenu});
  const afterTrigger = useMatMenuTrigger({menu: afterMenu});

  return (
    <menu-position-example>
      <MatButton {...aboveTrigger.hostProps}>Above</MatButton>
      <MatMenu />

      <MatButton {...belowTrigger.hostProps}>Below</MatButton>
      <MatMenu />

      <MatButton {...beforeTrigger.hostProps}>Before</MatButton>
      <MatMenu />

      <MatButton {...afterTrigger.hostProps}>After</MatButton>
      <MatMenu />
    </menu-position-example>
  );
});
