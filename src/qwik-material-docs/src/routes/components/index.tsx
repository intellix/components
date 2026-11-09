import {component$} from '@qwik.dev/core';
import type {DocumentHead} from '@qwik.dev/router';
import EntryCard from '../../components/entry-card';
import {COMPONENT_CATEGORIES, componentsByCategory} from '../../data/components';
import {withBase} from '../../lib/base-path';

export default component$(() => (
  <div>
    <h1>Components</h1>
    <p class="docs-page-summary">
      All 35 ported qwik-material components, grouped the same way as material.angular.dev.
    </p>
    {COMPONENT_CATEGORIES.map(category => {
      const items = componentsByCategory(category.id);
      if (items.length === 0) return null;
      return (
        <div class="docs-category-block" key={category.id}>
          <h2>{category.name}</h2>
          <div class="docs-card-grid">
            {items.map(c => (
              <EntryCard
                key={c.id}
                href={withBase(`/components/${c.id}/`)}
                name={c.name}
                summary={c.summary}
              />
            ))}
          </div>
        </div>
      );
    })}
  </div>
));

export const head: DocumentHead = {
  title: 'Components — qwik-material',
};
