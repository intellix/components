import {component$} from '@qwik.dev/core';
import type {ContentSegment} from '../lib/markdown';
import ExampleEmbed from './example-embed';

export interface MarkdownContentProps {
  segments: ContentSegment[];
  devAppId: string;
  componentSlug: string;
}

/** Renders a Markdown document's segments (see `lib/markdown.ts`): static HTML chunks via
 *  `dangerouslySetInnerHTML`, and a live, interactive `<ExampleEmbed>` at each
 *  `<!-- example(id) -->` marker — the reason the content is split into segments at all, rather
 *  than rendered as one HTML string. */
export default component$<MarkdownContentProps>(({segments, devAppId, componentSlug}) => (
  <div class="docs-prose">
    {segments.map((seg, i) =>
      seg.type === 'html' ? (
        <div key={i} dangerouslySetInnerHTML={seg.html} />
      ) : (
        <ExampleEmbed key={i} devAppId={devAppId} componentSlug={componentSlug} exampleId={seg.id} />
      ),
    )}
  </div>
));
