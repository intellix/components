import {component$} from '@qwik.dev/core';
import {renderInlineMarkdown} from '../lib/inline-markdown';

interface ApiProp {
  name: string;
  type: string;
  optional: boolean;
  summary: string;
  details: string;
  defaultHint?: string;
}

interface ApiComponent {
  name: string;
  summary: string;
  details: string;
  propsTypeName?: string;
  props: ApiProp[];
}

interface ApiHookOrFunction {
  name: string;
  summary: string;
  details: string;
  signature?: string;
}

interface ApiType {
  name: string;
  kind: 'interface' | 'type' | 'enum';
  summary: string;
  details: string;
  members?: ApiProp[];
  definition?: string;
}

interface ApiConstant {
  name: string;
  summary: string;
  details: string;
  type: string;
}

export interface ApiModule {
  id: string;
  error?: string;
  components?: ApiComponent[];
  hooks?: ApiHookOrFunction[];
  functions?: ApiHookOrFunction[];
  types?: ApiType[];
  constants?: ApiConstant[];
}

function PropsTable({props}: {props: ApiProp[]}) {
  if (props.length === 0) return <p class="docs-api-member-summary">No props.</p>;
  return (
    <table class="docs-api-prop-table">
      <thead>
        <tr>
          <th>Name</th>
          <th>Type</th>
          <th>Description</th>
        </tr>
      </thead>
      <tbody>
        {props.map(p => (
          <tr key={p.name}>
            <td>
              <code>
                {p.name}
                {p.optional ? '?' : ''}
              </code>
            </td>
            <td>
              <code>{p.type}</code>
            </td>
            <td>
              {renderInlineMarkdown(p.summary)}
              {p.details && (
                <details class="docs-api-details">
                  <summary>Details</summary>
                  <p>{renderInlineMarkdown(p.details)}</p>
                </details>
              )}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

/** Renders one entry point's generated API JSON (`scripts/generate-api.mjs`'s output) as the
 *  `/components/<id>/api` and `/cdk/<id>/api` tab content. */
export default component$<{data: ApiModule}>(({data}) => {
  if (data.error) {
    return <p>{data.error}</p>;
  }

  const hasAny =
    (data.components?.length ?? 0) +
      (data.hooks?.length ?? 0) +
      (data.functions?.length ?? 0) +
      (data.types?.length ?? 0) +
      (data.constants?.length ?? 0) >
    0;

  if (!hasAny) {
    return <p>No public API found for this entry point.</p>;
  }

  return (
    <div class="docs-api">
      {!!data.components?.length && (
        <section class="docs-api-group">
          <h2>Components</h2>
          {data.components.map(c => (
            <div class="docs-api-member" key={c.name}>
              <div class="docs-api-member-header">
                {c.name}
                {c.propsTypeName ? ` : Component<${c.propsTypeName}>` : ''}
              </div>
              <div class="docs-api-member-body">
                {(c.summary || c.details) && (
                  <p class="docs-api-member-summary">{renderInlineMarkdown(c.summary)}</p>
                )}
                {c.details && (
                  <details class="docs-api-details">
                    <summary>Details</summary>
                    <p>{renderInlineMarkdown(c.details)}</p>
                  </details>
                )}
                <PropsTable props={c.props} />
              </div>
            </div>
          ))}
        </section>
      )}

      {!!data.hooks?.length && (
        <section class="docs-api-group">
          <h2>Hooks</h2>
          {data.hooks.map(h => (
            <div class="docs-api-member" key={h.name}>
              <div class="docs-api-member-header">
                {h.name}
                {h.signature ? `: ${h.signature}` : '()'}
              </div>
              {(h.summary || h.details) && (
                <div class="docs-api-member-body">
                  <p class="docs-api-member-summary">{renderInlineMarkdown(h.summary)}</p>
                  {h.details && (
                    <details class="docs-api-details">
                      <summary>Details</summary>
                      <p>{renderInlineMarkdown(h.details)}</p>
                    </details>
                  )}
                </div>
              )}
            </div>
          ))}
        </section>
      )}

      {!!data.functions?.length && (
        <section class="docs-api-group">
          <h2>Functions</h2>
          {data.functions.map(f => (
            <div class="docs-api-member" key={f.name}>
              <div class="docs-api-member-header">
                {f.name}
                {f.signature ?? '()'}
              </div>
              {(f.summary || f.details) && (
                <div class="docs-api-member-body">
                  <p class="docs-api-member-summary">{renderInlineMarkdown(f.summary)}</p>
                  {f.details && (
                    <details class="docs-api-details">
                      <summary>Details</summary>
                      <p>{renderInlineMarkdown(f.details)}</p>
                    </details>
                  )}
                </div>
              )}
            </div>
          ))}
        </section>
      )}

      {!!data.types?.length && (
        <section class="docs-api-group">
          <h2>Types</h2>
          {data.types.map(t => (
            <div class="docs-api-member" key={t.name}>
              <div class="docs-api-member-header">{t.name}</div>
              <div class="docs-api-member-body">
                {(t.summary || t.details) && (
                  <p class="docs-api-member-summary">{renderInlineMarkdown(t.summary)}</p>
                )}
                {t.details && (
                  <details class="docs-api-details">
                    <summary>Details</summary>
                    <p>{renderInlineMarkdown(t.details)}</p>
                  </details>
                )}
                {t.members ? <PropsTable props={t.members} /> : <pre class="docs-code">{t.definition}</pre>}
              </div>
            </div>
          ))}
        </section>
      )}

      {!!data.constants?.length && (
        <section class="docs-api-group">
          <h2>Constants</h2>
          {data.constants.map(c => (
            <div class="docs-api-member" key={c.name}>
              <div class="docs-api-member-header">
                {c.name}: {c.type}
              </div>
              {(c.summary || c.details) && (
                <div class="docs-api-member-body">
                  <p class="docs-api-member-summary">{renderInlineMarkdown(c.summary)}</p>
                  {c.details && (
                    <details class="docs-api-details">
                      <summary>Details</summary>
                      <p>{renderInlineMarkdown(c.details)}</p>
                    </details>
                  )}
                </div>
              )}
            </div>
          ))}
        </section>
      )}
    </div>
  );
});
