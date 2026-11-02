import {component$, Slot} from '@qwik.dev/core';
import {useLocation, type StaticGenerateHandler} from '@qwik.dev/router';
import SectionTabs from '../../../components/section-tabs';
import {COMPONENTS} from '../../../data/components';

const TABS = [
  {id: 'overview', label: 'Overview'},
  {id: 'api', label: 'API'},
  {id: 'examples', label: 'Examples'},
];

export default component$(() => {
  const loc = useLocation();
  const id = loc.params.id;
  const entry = COMPONENTS.find(c => c.id === id);

  if (!entry) {
    return (
      <div>
        <h1>Component not found</h1>
        <p>
          No component named <code>{id}</code>. <a href="/components/">Back to all components</a>
        </p>
      </div>
    );
  }

  return (
    <div>
      <header class="docs-page-header">
        <h1>{entry.name}</h1>
        <p class="docs-page-summary">{entry.summary}</p>
        <SectionTabs basePath={`/components/${entry.id}`} tabs={TABS} />
      </header>
      <div class="docs-shell-main">
        <Slot />
      </div>
    </div>
  );
});

export const onStaticGenerate: StaticGenerateHandler = () => {
  return {params: COMPONENTS.map(c => ({id: c.id}))};
};
