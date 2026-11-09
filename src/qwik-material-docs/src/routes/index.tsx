import {component$} from '@qwik.dev/core';
import type {DocumentHead} from '@qwik.dev/router';
import {MatButton} from '@angular-community/qwik-material/button';
import {MatDivider} from '@angular-community/qwik-material/divider';
import EntryCard from '../components/entry-card';
import {COMPONENTS} from '../data/components';
import {GUIDES} from '../data/guides';
import {withBase} from '../lib/base-path';

const FEATURED_IDS = ['button', 'form-field', 'select', 'card', 'dialog', 'table'];

export default component$(() => {
  const featured = FEATURED_IDS.map(id => COMPONENTS.find(c => c.id === id)!).filter(Boolean);

  return (
    <>
      <header class="docs-hero">
        <h1>qwik-material</h1>
        <p>A Qwik port of Angular Material — the same components, the Qwik way.</p>
        <MatButton appearance="filled" href={withBase('/guide/getting-started/')}>
          Get started
        </MatButton>
      </header>

      <section class="docs-section">
        <div class="docs-feature-grid">
          <div>
            <h2>High quality</h2>
            <p>
              Accessible, well-tested components with the same DOM and visual output as Angular
              Material — verified against a live parity suite, component by component.
            </p>
          </div>
          <div>
            <h2>Resumable</h2>
            <p>
              Built on Qwik's fine-grained reactivity and resumability — no framework bootstrap
              before the page is interactive.
            </p>
          </div>
          <div>
            <h2>Familiar</h2>
            <p>
              If you know Angular Material's API, you already know most of qwik-material's — see the
              migration guide for the concept-by-concept map.
            </p>
          </div>
        </div>
      </section>

      <MatDivider />

      <section class="docs-section">
        <div class="docs-section-header">
          <h2>Featured components</h2>
          <a href={withBase('/components/')}>View all components</a>
        </div>
        <div class="docs-card-grid">
          {featured.map(c => (
            <EntryCard
              key={c.id}
              href={withBase(`/components/${c.id}/`)}
              name={c.name}
              summary={c.summary}
            />
          ))}
        </div>
      </section>

      <MatDivider />

      <section class="docs-section">
        <div class="docs-section-header">
          <h2>Guides</h2>
          <a href={withBase('/guide/')}>View all guides</a>
        </div>
        <div class="docs-card-grid">
          {GUIDES.map(g => (
            <EntryCard
              key={g.id}
              href={withBase(`/guide/${g.id}/`)}
              name={g.name}
              summary={g.summary}
            />
          ))}
        </div>
      </section>
    </>
  );
});

export const head: DocumentHead = {
  title: 'qwik-material — Angular Material for Qwik',
  meta: [
    {
      name: 'description',
      content:
        'Browse qwik-material components, guides, and live examples — a Qwik port of Angular Material.',
    },
  ],
};
