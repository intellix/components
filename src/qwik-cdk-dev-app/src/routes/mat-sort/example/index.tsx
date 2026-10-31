import {component$, useSignal} from '@builder.io/qwik';
import {MatSort, MatSortHeader, type Sort} from '@angular-community/qwik-material/sort';
import './sort-overview-example.css';

// Qwik port of material.angular.dev's `sort-overview` docs example — see
// src/components-examples/material/sort/sort-overview/sort-overview-example.{ts,html,css}.
// Rendered unmodified by the Angular dev-app at /qwik-parity/mat-sort/example
// (src/dev-app/qwik-parity/examples.ts). Host tag mirrors the example's own component selector
// (`sort-overview-example`). `<MatSort as="table">` (the default) renders the bare `<table
// matSort>` itself; upstream's own template has no `<thead>`/`<tbody>` wrapper at all (bare
// `<tr>`s directly inside `<table>`).
//
// This route still wraps them in one plain, attribute-less `<tbody>` — NOT a structural-parity
// difference (the browser's HTML parser inserts exactly this same implicit, attribute-less
// `<tbody>` around a bare `<table><tr>` anyway, when building it from SSR'd markup, a standard
// HTML5 table-parsing rule — already documented in `qwik-material/sort/SYNC.md` deviation #4 and
// normalized away by the parity harness, see `material-parity.ts`'s `elementChildren` comment),
// but a REAL functional requirement: Qwik's resumability needs its serialized vnode tree to
// match the LIVE DOM it resumes into, and the browser inserting a tbody IT doesn't know about
// (bare `<tr>`s crash on the first client-side re-render that touches this table — confirmed
// live, `sortedData.value = ...` after a sort-header click threw "Cannot set properties of
// undefined (setting '__virtual')" deep in Qwik's own vnode diffing). Writing the SAME tbody
// explicitly keeps Qwik's own vnode tree and the parsed DOM in agreement from the start.
interface Dessert {
  calories: number;
  carbs: number;
  fat: number;
  name: string;
  protein: number;
}

const DESSERTS: Dessert[] = [
  {name: 'Frozen yogurt', calories: 159, fat: 6, carbs: 24, protein: 4},
  {name: 'Ice cream sandwich', calories: 237, fat: 9, carbs: 37, protein: 4},
  {name: 'Eclair', calories: 262, fat: 16, carbs: 24, protein: 6},
  {name: 'Cupcake', calories: 305, fat: 4, carbs: 67, protein: 4},
  {name: 'Gingerbread', calories: 356, fat: 16, carbs: 49, protein: 4},
];

function compare(a: number | string, b: number | string, isAsc: boolean): number {
  return (a < b ? -1 : 1) * (isAsc ? 1 : -1);
}

function sortDesserts(sort: Sort): Dessert[] {
  const data = DESSERTS.slice();
  if (!sort.active || sort.direction === '') {
    return data;
  }
  return data.sort((a, b) => {
    const isAsc = sort.direction === 'asc';
    switch (sort.active) {
      case 'name':
        return compare(a.name, b.name, isAsc);
      case 'calories':
        return compare(a.calories, b.calories, isAsc);
      case 'fat':
        return compare(a.fat, b.fat, isAsc);
      case 'carbs':
        return compare(a.carbs, b.carbs, isAsc);
      case 'protein':
        return compare(a.protein, b.protein, isAsc);
      default:
        return 0;
    }
  });
}

export default component$(() => {
  const sortedData = useSignal<Dessert[]>(DESSERTS.slice());

  return (
    <>
      <div data-parity-root>
        <sort-overview-example>
          <MatSort
            onSortChange$={sort => {
              sortedData.value = sortDesserts(sort);
            }}
          >
            <tbody>
              <tr>
                <MatSortHeader id="name">Dessert (100g)</MatSortHeader>
                <MatSortHeader id="calories">Calories</MatSortHeader>
                <MatSortHeader id="fat">Fat (g)</MatSortHeader>
                <MatSortHeader id="carbs">Carbs (g)</MatSortHeader>
                <MatSortHeader id="protein">Protein (g)</MatSortHeader>
              </tr>
              {sortedData.value.map(dessert => (
                <tr key={dessert.name}>
                  <td>{dessert.name}</td>
                  <td>{dessert.calories}</td>
                  <td>{dessert.fat}</td>
                  <td>{dessert.carbs}</td>
                  <td>{dessert.protein}</td>
                </tr>
              ))}
            </tbody>
          </MatSort>
        </sort-overview-example>
      </div>
      <main data-scenario-ready>ready</main>
    </>
  );
});
