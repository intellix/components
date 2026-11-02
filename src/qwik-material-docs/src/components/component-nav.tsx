import {component$} from '@qwik.dev/core';
import {useLocation} from '@qwik.dev/router';
import {MatNavList, MatListItem, MatSubheader} from '@angular-community/qwik-material/list';
import {COMPONENT_CATEGORIES, componentsByCategory} from '../data/components';

/**
 * The left-hand component index — dogfoods `<MatNavList>`/`<MatListItem as="a">`, grouped into
 * the same categories material.angular.dev uses. Shared by every `/components/<id>/*` page via
 * `routes/components/layout.tsx`.
 */
export default component$(() => {
  const loc = useLocation();
  const path = loc.url.pathname;

  return (
    <nav class="docs-nav" aria-label="Components">
      <MatNavList>
        {COMPONENT_CATEGORIES.flatMap(category => {
          const items = componentsByCategory(category.id);
          if (items.length === 0) return [];
          return [
            <MatSubheader as="h3" key={`${category.id}-h`}>
              {category.name}
            </MatSubheader>,
            ...items.map(item => {
              const href = `/components/${item.id}/`;
              return (
                <MatListItem
                  key={item.id}
                  as="a"
                  href={href}
                  activated={path.startsWith(href)}
                  content={item.name}
                />
              );
            }),
          ];
        })}
      </MatNavList>
    </nav>
  );
});
