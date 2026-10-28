import {component$, useSignal} from '@builder.io/qwik';
import {MatSort, MatSortHeader, type Sort} from '@angular-community/qwik-material/sort';

export default component$(() => {
  const sort = useSignal<Sort>({active: 'name', direction: 'asc'});

  return (
    <>
      <div data-parity-root>
        <MatSort active="name" direction="asc" disabled onSortChange$={next => (sort.value = next)}>
          <tr>
            <MatSortHeader id="name">Name</MatSortHeader>
            <MatSortHeader id="population">Population</MatSortHeader>
          </tr>
        </MatSort>
        <p>
          Sort: {sort.value.active} {sort.value.direction}
        </p>
      </div>
      <main data-scenario-ready>ready</main>
    </>
  );
});
