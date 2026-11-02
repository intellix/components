import {component$, useSignal} from '@qwik.dev/core';
import {useIdGenerator} from '@angular-community/qwik-cdk/a11y';
import {MatTabNav, MatTabLink, MatTabNavPanel} from '@angular-community/qwik-material/tabs';

export default component$(() => {
  const links = ['First', 'Second', 'Third'];
  const activeLink = useSignal(links[0]);

  // Ids are minted directly by the route (not left to each component's own
  // auto-gen) so the currently-active link's id can be computed synchronously
  // for the panel's `aria-labelledby` — see tab-nav-state.ts's doc comment:
  // Qwik has no `[tabPanel]`-style instance-reference injection, so the
  // `MatTabNav` <-> `MatTabNavPanel` wiring (and which link is "active") is
  // the consumer's explicit responsibility, same as every other
  // controlled-component pair in this port.
  const idGen = useIdGenerator();
  const panelId = useSignal(() => idGen.getId('mat-tab-nav-panel-'));
  const linkIds = useSignal(() => links.map(() => idGen.getId('mat-tab-link-')));
  const disabledLinkId = useSignal(() => idGen.getId('mat-tab-link-'));

  const activeId = linkIds.value[links.indexOf(activeLink.value)];

  return (
    <>
      <div data-parity-root>
        <MatTabNav style="width: 480px" tabPanelId={panelId.value}>
          {links.map((link, i) => (
            <MatTabLink
              key={link}
              id={linkIds.value[i]}
              active={activeLink.value === link}
              onClick$={() => {
                activeLink.value = link;
              }}
            >
              {link}
            </MatTabLink>
          ))}
          <MatTabLink id={disabledLinkId.value} disabled>
            Disabled
          </MatTabLink>
        </MatTabNav>
        <MatTabNavPanel id={panelId.value} activeTabId={activeId}>
          <p>Panel content for {activeLink.value}</p>
        </MatTabNavPanel>
        <p>Selected: {activeLink.value}</p>
      </div>
      <main data-scenario-ready>ready</main>
    </>
  );
});
