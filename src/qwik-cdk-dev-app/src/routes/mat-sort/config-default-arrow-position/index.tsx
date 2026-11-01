import {component$, useSignal} from '@qwik.dev/core';
import {QwikMaterialProvider} from '@angular-community/qwik-material/dialog';
import {MatSort, MatSortHeader, type Sort} from '@angular-community/qwik-material/sort';

/**
 * Qwik-only scenario (no Angular mirror). Exercises
 * `MAT_SORT_DEFAULT_OPTIONS.arrowPosition` (ported to
 * `MatSortConfig.arrowPosition`): a provider-level default applies to every
 * header that doesn't set its own `arrowPosition` prop, matching upstream's
 * "with default arrowPosition" / "should render arrows in proper position"
 * test (sort.spec.ts) — both headers below get
 * `mat-sort-header-position-before` with no per-header override.
 * See specs/material-sort/config-default-arrow-position.spec.ts.
 */
export default component$(() => {
  const sort = useSignal<Sort>({active: '', direction: ''});

  return (
    <QwikMaterialProvider matSortConfig={{arrowPosition: 'before'}}>
      <div data-parity-root>
        <MatSort onSortChange$={next => (sort.value = next)}>
          <thead>
            <tr>
              <MatSortHeader id="name">Name</MatSortHeader>
              <MatSortHeader id="population">Population</MatSortHeader>
            </tr>
          </thead>
        </MatSort>
        <p>
          Sort: {sort.value.active} {sort.value.direction}
        </p>
      </div>
      <main data-scenario-ready>ready</main>
    </QwikMaterialProvider>
  );
});
