import {component$} from '@qwik.dev/core';
import {routeLoader$, type StaticGenerateHandler} from '@qwik.dev/router';
import {GUIDES, getGuide} from '../../../data/guides';
import {GUIDE_MARKDOWN} from '../../../content/guide-registry';
import {renderContent} from '../../../lib/markdown';
import MarkdownContent from '../../../components/markdown-content';

export const useGuide = routeLoader$(async ({params}) => {
  const guide = getGuide(params.id);
  if (!guide) return null;
  const md = GUIDE_MARKDOWN[guide.id] ?? `# ${guide.name}\n\nContent coming soon.`;
  return {name: guide.name, segments: await renderContent(md)};
});

export default component$(() => {
  const data = useGuide().value;
  if (!data) return null;

  return (
    <div class="docs-shell-content">
      <MarkdownContent segments={data.segments} devAppId="" componentSlug="" />
    </div>
  );
});

export const onStaticGenerate: StaticGenerateHandler = () => {
  return {params: GUIDES.map(g => ({id: g.id}))};
};
