/**
 * `useDataSourceConnection()` calls `useSignal()`/`useTask$()`/`useVisibleTask$()`, which
 * throw outside of a component's render (same `createDOM()`-unreliable note as
 * `use-selection-model.spec.ts` and `qwik-cdk/accordion/accordion-hooks.spec.ts`) — shape/
 * export sanity only here. The SSR-snapshot resolution logic it's built from
 * (`DataSource.connect()`'s synchronous-replay contract) is already covered end-to-end by
 * `data-source.spec.ts`'s `ArrayDataSource` tests; real rendered-DOM coverage for a
 * component actually using this hook belongs in a Playwright parity/functional spec once a
 * real consumer exists (see `SYNC.md`'s note on this).
 */
import {describe, expect, it} from 'vitest';
import {useDataSourceConnection} from './use-data-source-connection';

describe('qwik-cdk/collections useDataSourceConnection — sanity', () => {
  it('is exported and function-shaped', () => {
    expect(typeof useDataSourceConnection).toBe('function');
  });
});
