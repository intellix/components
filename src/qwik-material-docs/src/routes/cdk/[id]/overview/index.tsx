import {component$} from '@qwik.dev/core';
import {useLocation, type StaticGenerateHandler} from '@qwik.dev/router';
import {CDK_ENTRIES} from '../../../../data/cdk';

export default component$(() => {
  const loc = useLocation();
  const entry = CDK_ENTRIES.find(c => c.id === loc.params.id);
  if (!entry) return null;

  return (
    <div class="docs-prose">
      <p>{entry.summary}</p>
      <p>
        See the <a href={`/cdk/${entry.id}/api/`}>API reference</a> for every exported hook,
        function, and type in <code>@angular-community/qwik-cdk/{entry.id}</code>.
      </p>
    </div>
  );
});

export const onStaticGenerate: StaticGenerateHandler = () => {
  return {params: CDK_ENTRIES.map(c => ({id: c.id}))};
};
