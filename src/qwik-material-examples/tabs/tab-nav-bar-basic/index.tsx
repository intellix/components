import {$, component$, useSignal} from '@qwik.dev/core';
import {useIdGenerator} from '@angular-community/qwik-cdk/a11y';
import {MatTabNav, MatTabLink, MatTabNavPanel} from '@angular-community/qwik-material/tabs';
import {MatButton} from '@angular-community/qwik-material/button';
import './tab-nav-bar-basic-example.css';

// Qwik port of material.angular.dev's `tab-nav-bar-basic` docs example. Rendered unmodified by
// the Angular dev-app at /qwik-parity/examples/tab-nav-bar-basic. Qwik has no `[tabPanel]`
// template-variable injection, so nav<->panel wiring is explicit ids -- same precedent as
// src/qwik-cdk-dev-app/src/routes/mat-tabs/nav-bar/index.tsx. Ids are minted directly by this
// route (not left to each link's own auto-gen) so the currently-active link's id can be computed
// synchronously for the panel's `aria-labelledby`.

export default component$(() => {
  const links = useSignal(['First', 'Second', 'Third']);
  const activeLink = useSignal(links.value[0]);

  const idGen = useIdGenerator();
  const panelId = useSignal(() => idGen.getId('mat-tab-nav-panel-'));
  const linkIds = useSignal(() => [idGen.getId('mat-tab-link-'), idGen.getId('mat-tab-link-'), idGen.getId('mat-tab-link-')]);
  const disabledLinkId = useSignal(() => idGen.getId('mat-tab-link-'));

  const activeIndex = links.value.indexOf(activeLink.value);
  const activeId = activeIndex >= 0 ? linkIds.value[activeIndex] : undefined;

  return (
    <tab-nav-bar-basic-example>
      <MatTabNav tabPanelId={panelId.value}>
        {links.value.map((link, i) => (
          <MatTabLink
            key={link}
            id={linkIds.value[i] ?? undefined}
            active={activeLink.value === link}
            onClick$={$(() => {
              activeLink.value = link;
            })}
          >
            {link}
          </MatTabLink>
        ))}
        <MatTabLink id={disabledLinkId.value} disabled>
          Disabled Link
        </MatTabLink>
      </MatTabNav>
      <MatTabNavPanel id={panelId.value} activeTabId={activeId} />

      <MatButton
        appearance="elevated"
        class="example-action-button"
        onClick$={$(() => {
          links.value = [...links.value, `Link ${links.value.length + 1}`];
        })}
      >
        Add link
      </MatButton>
    </tab-nav-bar-basic-example>
  );
});
