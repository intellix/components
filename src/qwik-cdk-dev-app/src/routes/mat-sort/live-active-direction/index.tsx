import {$, component$, useSignal} from '@qwik.dev/core';
import {MatButton} from '@angular-community/qwik-material/button';
import {MatSort, MatSortHeader, type Sort} from '@angular-community/qwik-material/sort';

/**
 * Qwik-only functional scenario (no Angular mirror — behavior-without-an-upstream-example):
 * `<MatSort>`'s `active`/`direction` props are now LIVE (see `mat-sort.tsx`'s
 * `MatSortProps.active` doc comment) — a later change to these props updates the header's
 * `aria-sort`/arrow classes WITHOUT emitting `onSortChange$` (matching upstream: a template
 * rebind only calls `ngOnChanges()`, never `sortChange.emit()`). A header click still emits.
 */
export default component$(() => {
  const sort = useSignal<Sort>({active: '', direction: ''});
  const changeCount = useSignal(0);
  const setFromOutside = useSignal<Sort>({active: 'population', direction: 'desc'});

  return (
    <>
      <div data-parity-root>
        <MatSort
          active={setFromOutside.value.active}
          direction={setFromOutside.value.direction}
          onSortChange$={$((next: Sort) => {
            sort.value = next;
            changeCount.value++;
          })}
        >
          <thead>
            <tr>
              <MatSortHeader id="name">Name</MatSortHeader>
              <MatSortHeader id="population">Population</MatSortHeader>
            </tr>
          </thead>
        </MatSort>
        <p data-sort-state>
          {sort.value.active} {sort.value.direction}
        </p>
        <p data-change-count>{changeCount.value}</p>
        <MatButton
          id="set-name-asc"
          onClick$={$(() => {
            setFromOutside.value = {active: 'name', direction: 'asc'};
          })}
        >
          Set name/asc from outside
        </MatButton>
        <MatButton
          id="set-population-desc"
          onClick$={$(() => {
            setFromOutside.value = {active: 'population', direction: 'desc'};
          })}
        >
          Set population/desc from outside
        </MatButton>
      </div>
      <main data-scenario-ready>ready</main>
    </>
  );
});
