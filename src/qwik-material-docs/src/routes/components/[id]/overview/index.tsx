import {component$} from '@qwik.dev/core';
import {routeLoader$, type StaticGenerateHandler} from '@qwik.dev/router';
import {COMPONENTS} from '../../../../data/components';
import {OVERVIEW_MARKDOWN} from '../../../../content/overview-registry';
import {renderContent} from '../../../../lib/markdown';
import MarkdownContent from '../../../../components/markdown-content';
import {angularDocsComponentUrl} from '../../../../data/examples-map';

export const useOverview = routeLoader$(async ({params}) => {
  const entry = COMPONENTS.find(c => c.id === params.id);
  if (!entry) return null;

  const md = OVERVIEW_MARKDOWN[entry.id];
  return {
    entryId: entry.id,
    devAppId: entry.devAppId,
    hasGuide: !!md,
    segments: md ? await renderContent(md) : [],
  };
});

export default component$(() => {
  const data = useOverview().value;
  if (!data) return null;

  if (!data.hasGuide) {
    const entry = COMPONENTS.find(c => c.id === data.entryId)!;
    return (
      <div class="docs-overview-placeholder">
        <p>
          <strong>Overview being adapted</strong> — this component's Overview guide hasn't been
          written yet (Phase 2 of the docs site fills these in). In the meantime, see the real
          Angular Material guide:
        </p>
        <a href={angularDocsComponentUrl(entry.id)} target="_blank" rel="noopener">
          {entry.name} on material.angular.dev
        </a>
      </div>
    );
  }

  return (
    <div>
      <MarkdownContent segments={data.segments} devAppId={data.devAppId} componentSlug={data.entryId} />
    </div>
  );
});

export const onStaticGenerate: StaticGenerateHandler = () => {
  return {params: COMPONENTS.map(c => ({id: c.id}))};
};
