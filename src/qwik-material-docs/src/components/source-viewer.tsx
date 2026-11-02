import {component$, useSignal} from '@qwik.dev/core';
import type {ExampleSourceFile} from '../lib/example-registry';

export interface SourceViewerProps {
  files: ExampleSourceFile[];
}

/** Tabbed, Shiki-highlighted source panel for an example's "View code" toggle. */
export default component$<SourceViewerProps>(({files}) => {
  const active = useSignal(0);
  const file = files[active.value] ?? files[0];

  return (
    <div class="docs-example-source">
      {files.length > 1 && (
        <div class="docs-example-source-tabs" role="tablist">
          {files.map((f, i) => (
            <button
              key={f.name}
              type="button"
              role="tab"
              aria-selected={i === active.value ? 'true' : 'false'}
              class="docs-example-source-tab"
              onClick$={() => (active.value = i)}
            >
              {f.name}
            </button>
          ))}
        </div>
      )}
      <div dangerouslySetInnerHTML={file.html} />
    </div>
  );
});
