import {component$, useSignal} from '@qwik.dev/core';
import {MatSort, MatSortHeader, type Sort} from '@angular-community/qwik-material/sort';

export default component$(() => {
  const sort = useSignal<Sort>({active: '', direction: ''});

  return (
    <>
      <div data-parity-root>
        <MatSort start="desc" onSortChange$={next => (sort.value = next)}>
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
