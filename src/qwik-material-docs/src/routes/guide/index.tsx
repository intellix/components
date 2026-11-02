import {component$} from '@qwik.dev/core';
import type {DocumentHead} from '@qwik.dev/router';
import EntryCard from '../../components/entry-card';
import {GUIDES} from '../../data/guides';

export default component$(() => (
  <div class="docs-shell-content">
    <h1>Guides</h1>
    <div class="docs-card-grid">
      {GUIDES.map(g => (
        <EntryCard key={g.id} href={`/guide/${g.id}/`} name={g.name} summary={g.summary} />
      ))}
    </div>
  </div>
));

export const head: DocumentHead = {
  title: 'Guides — qwik-material',
};
