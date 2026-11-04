import {component$, useSignal} from '@qwik.dev/core';
import {
  MatSort,
  MatSortHeader,
  type Sort,
  useMatSortProvider,
} from '@angular-community/qwik-material/sort';

/**
 * Qwik-only scenario (no Angular mirror). Exercises
 * `MAT_SORT_DEFAULT_OPTIONS.disableClear` (ported to `MatSortConfig.disableClear`):
 * a provider-level default applies when neither the table's own
 * `matSortDisableClear` nor a column's own `disableClear` is set, matching
 * upstream's "with default options" / "should be able to cycle from asc ->
 * desc from either start point" describe block (sort.spec.ts) — the cycle
 * never includes '' when the provider sets `disableClear: true`.
 * See specs/material-sort/config-default-disable-clear.spec.ts.
 */
export default component$(() => {
  const sort = useSignal<Sort>({active: '', direction: ''});

  useMatSortProvider({disableClear: true});
  return (
    <>
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
    </>
  );
});
