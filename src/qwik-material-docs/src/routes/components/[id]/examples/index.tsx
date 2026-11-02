import {component$} from '@qwik.dev/core';
import {useLocation, type StaticGenerateHandler} from '@qwik.dev/router';
import {COMPONENTS} from '../../../../data/components';
import {headlineExampleFor} from '../../../../data/examples-map';
import ExampleEmbed from '../../../../components/example-embed';

export default component$(() => {
  const loc = useLocation();
  const entry = COMPONENTS.find(c => c.id === loc.params.id);
  if (!entry) return null;

  const headline = headlineExampleFor(entry.devAppId, entry.id);

  return (
    <div>
      <p class="docs-page-summary">
        {entry.name}'s headline example from material.angular.dev, ported to Qwik.
      </p>
      {headline ? (
        <ExampleEmbed devAppId={entry.devAppId} componentSlug={entry.id} exampleId={headline.upstreamId} />
      ) : (
        <p>No example ported yet for this component.</p>
      )}
    </div>
  );
});

export const onStaticGenerate: StaticGenerateHandler = () => {
  return {params: COMPONENTS.map(c => ({id: c.id}))};
};
