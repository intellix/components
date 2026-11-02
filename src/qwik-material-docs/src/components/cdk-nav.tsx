import {component$} from '@qwik.dev/core';
import {useLocation} from '@qwik.dev/router';
import {MatNavList, MatListItem, MatSubheader} from '@angular-community/qwik-material/list';
import {CDK_ENTRIES} from '../data/cdk';

export default component$(() => {
  const loc = useLocation();
  const path = loc.url.pathname;

  return (
    <nav class="docs-nav" aria-label="CDK">
      <MatNavList>
        <MatSubheader as="h3">CDK entry points</MatSubheader>
        {CDK_ENTRIES.map(entry => {
          const href = `/cdk/${entry.id}/`;
          return (
            <MatListItem
              key={entry.id}
              as="a"
              href={href}
              activated={path.startsWith(href)}
              content={entry.name}
            />
          );
        })}
      </MatNavList>
    </nav>
  );
});
