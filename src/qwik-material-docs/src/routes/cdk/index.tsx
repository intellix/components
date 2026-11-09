import {component$} from '@qwik.dev/core';
import type {DocumentHead} from '@qwik.dev/router';
import EntryCard from '../../components/entry-card';
import {CDK_ENTRIES} from '../../data/cdk';
import {withBase} from '../../lib/base-path';

export default component$(() => (
  <div>
    <h1>CDK</h1>
    <p class="docs-page-summary">
      The ported `@angular-community/qwik-cdk` entry points — unstyled behavior primitives that
      qwik-material's components build on, usable directly in your own components too.
    </p>
    <div class="docs-card-grid">
      {CDK_ENTRIES.map(c => (
        <EntryCard key={c.id} href={withBase(`/cdk/${c.id}/`)} name={c.name} summary={c.summary} />
      ))}
    </div>
  </div>
));

export const head: DocumentHead = {
  title: 'CDK — qwik-material',
};
