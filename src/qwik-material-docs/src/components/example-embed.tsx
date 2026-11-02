import {$, component$, useSignal} from '@qwik.dev/core';
import {MatButton} from '@angular-community/qwik-material/button';
import {MatIcon} from '@angular-community/qwik-material/icon';
import {PORTED_EXAMPLES, angularDocsExampleUrl} from '../data/examples-map';
import {EXAMPLE_COMPONENTS, loadExampleSource, type ExampleSourceBundle} from '../lib/example-registry';
import SourceViewer from './source-viewer';

export interface ExampleEmbedProps {
  /** `src/dev-app/qwik-parity/examples.ts` key, e.g. `mat-button`. */
  devAppId: string;
  /** material.angular.dev component slug, for the "not yet ported" / "Open in Angular docs" link. */
  componentSlug: string;
  /** Upstream example id from the `<!-- example(id) -->` marker, e.g. `button-overview`. */
  exampleId: string;
}

/**
 * Renders a guide's `<!-- example(id) -->` marker (upstream's own syntax — see
 * `src/material/<c>/<c>.md`). If this example has been ported
 * (`src/qwik-material-examples/<pkg>/<route>`), shows it live with a "View code" toggle revealing
 * its real source files; otherwise renders a clear placeholder linking to the real Angular
 * example, per the design doc's Phase 1 scope (only each component's headline example is ported
 * so far — Phase 2 ports the rest).
 */
export default component$<ExampleEmbedProps>(({devAppId, componentSlug, exampleId}) => {
  const showSource = useSignal(false);
  const source = useSignal<ExampleSourceBundle>();
  const entry = (PORTED_EXAMPLES[devAppId] ?? []).find(e => e.upstreamId === exampleId);

  if (!entry) {
    return (
      <div class="docs-example-placeholder">
        <span class="docs-example-placeholder-badge">Not yet ported to Qwik</span>
        <p>
          This example (<code>{exampleId}</code>) hasn't been ported yet — Phase 2 of the docs
          site adds the rest of each component's examples.
        </p>
        <a href={angularDocsExampleUrl(componentSlug, exampleId)} target="_blank" rel="noopener">
          View the original on material.angular.dev
        </a>
      </div>
    );
  }

  const key = `${entry.pkg}/${entry.route}`;
  const Live = EXAMPLE_COMPONENTS[key];

  const toggleSource$ = $(async () => {
    if (!showSource.value && !source.value) {
      source.value = await loadExampleSource(key);
    }
    showSource.value = !showSource.value;
  });

  return (
    <div class="docs-example">
      <div class="docs-example-preview">
        <Live />
      </div>
      <div class="docs-example-toolbar">
        <span class="docs-example-id">{exampleId}</span>
        <span style="flex: 1 1 auto" />
        <a
          href={angularDocsExampleUrl(componentSlug, exampleId)}
          target="_blank"
          rel="noopener"
          class="docs-example-angular-link"
        >
          Open in Angular docs
        </a>
        <MatButton onClick$={toggleSource$}>
          <MatIcon>{showSource.value ? 'expand_less' : 'code'}</MatIcon>
          View code
        </MatButton>
      </div>
      {showSource.value && source.value && <SourceViewer files={source.value.files} />}
    </div>
  );
});
