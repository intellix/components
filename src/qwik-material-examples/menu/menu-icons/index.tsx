import {$, component$} from '@qwik.dev/core';
import {MatIconButton} from '@angular-community/qwik-material/button';
import {QwikMaterialProvider} from '@angular-community/qwik-material/dialog';
import {MatIcon} from '@angular-community/qwik-material/icon';
import {
  MatMenu,
  MatMenuItem,
  createMatMenu,
  useMatMenuTrigger,
} from '@angular-community/qwik-material/menu';

// Qwik port of material.angular.dev's `menu-icons` docs example — see
// src/components-examples/material/menu/menu-icons/menu-icons-example.{ts,html}. Rendered
// unmodified by the Angular dev-app at /qwik-parity/examples/menu-icons (the generic
// `examples/:exampleId` route). Upstream's trigger stacks `matIconButton` AND
// `[matMenuTriggerFor]` on one `<button>` — reproduced with the directive-hooks pattern
// (`useMatMenuTrigger()`'s `hostProps` spread onto `<MatIconButton>`), same as the headline
// `menu-overview` example (menu/example/index.tsx). Each item's leading `<mat-icon>` is passed
// via `MatMenuItem`'s `icon` prop (content projected BEFORE the text span), not as a regular
// child — a plain child would land inside the item's own default-content wrapper instead of
// directly on the button, confirmed live against this exact scenario.
//
// Icon font-set: matches the Angular dev-app's own default (`material-symbols-outlined`,
// confirmed live — same precedent as `qwik-material-examples/tree/example/index.tsx`), via
// `<QwikMaterialProvider matIconConfig>`. CONFIRMED LIVE this must wrap the panel's content
// SEPARATELY, inside `content$` itself — a provider wrapping the trigger/placeholder in the
// outer tree does NOT reach the menu's overlay-portaled content (the panel renders into a
// disconnected root, not a context-propagating descendant of this component's own JSX).

export default component$(() => {
  const menu = createMatMenu({
    content$: $(() => (
      <QwikMaterialProvider matIconConfig={{fontSet: 'material-symbols-outlined'}}>
        <MatMenuItem icon={<MatIcon>dialpad</MatIcon>}>
          <span>Redial</span>
        </MatMenuItem>
        <MatMenuItem disabled icon={<MatIcon>voicemail</MatIcon>}>
          <span>Check voice mail</span>
        </MatMenuItem>
        <MatMenuItem icon={<MatIcon>notifications_off</MatIcon>}>
          <span>Disable alerts</span>
        </MatMenuItem>
      </QwikMaterialProvider>
    )),
  });

  const trigger = useMatMenuTrigger({menu});

  return (
    <menu-icons-example>
      <QwikMaterialProvider matIconConfig={{fontSet: 'material-symbols-outlined'}}>
        <MatIconButton {...trigger.hostProps} ariaLabel="Example icon-button with a menu">
          <MatIcon>more_vert</MatIcon>
        </MatIconButton>
      </QwikMaterialProvider>
      <MatMenu />
    </menu-icons-example>
  );
});
