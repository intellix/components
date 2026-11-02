import {component$, Slot} from '@qwik.dev/core';
import {useLocation, type StaticGenerateHandler} from '@qwik.dev/router';
import SectionTabs from '../../../components/section-tabs';
import {CDK_ENTRIES} from '../../../data/cdk';

const TABS = [
  {id: 'overview', label: 'Overview'},
  {id: 'api', label: 'API'},
];

export default component$(() => {
  const loc = useLocation();
  const entry = CDK_ENTRIES.find(c => c.id === loc.params.id);

  if (!entry) {
    return (
      <div>
        <h1>Entry point not found</h1>
        <a href="/cdk/">Back to CDK</a>
      </div>
    );
  }

  return (
    <div>
      <header class="docs-page-header">
        <h1>{entry.name}</h1>
        <p class="docs-page-summary">{entry.summary}</p>
        <SectionTabs basePath={`/cdk/${entry.id}`} tabs={TABS} />
      </header>
      <div class="docs-shell-main">
        <Slot />
      </div>
    </div>
  );
});

export const onStaticGenerate: StaticGenerateHandler = () => {
  return {params: CDK_ENTRIES.map(c => ({id: c.id}))};
};
