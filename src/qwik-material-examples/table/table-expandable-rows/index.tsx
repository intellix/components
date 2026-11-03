import {$, component$, useSignal, useStyles$} from '@qwik.dev/core';
import {MatIconButton} from '@angular-community/qwik-material/button';
import {MatIcon} from '@angular-community/qwik-material/icon';
import {MatTable, type MatColumnDef, type MatTableRow} from '@angular-community/qwik-material/table';
import styles from './table-expandable-rows-example.css?inline';

// Qwik port of material.angular.dev's `table-expandable-rows` docs example — see
// src/components-examples/material/table/table-expandable-rows/
// table-expandable-rows-example.{ts,html}. Rendered unmodified by the Angular dev-app at
// /qwik-parity/examples/table-expandable-rows.
//
// Demonstrates upstream's `multiTemplateDataRows` pattern: TWO `MatTableRow` entries per data
// item in the flat `rows` array — a main row (`columnsToDisplayWithExpand`) immediately followed
// by a "detail" row rendering a single `expandedDetail` column that spans the full width
// (`cellProps.expandedDetail.colSpan`) — see `MatTableRow.columns`'s doc comment in
// mat-table-types.ts for why this needs no separate `multiTemplateDataRows` boolean: this port's
// flat, consumer-built `rows` array already allows any number of row entries per data item.

interface PeriodicElement {
  position: number;
  name: string;
  weight: number;
  symbol: string;
  description: string;
}

const ELEMENT_DATA: PeriodicElement[] = [
  {
    position: 1,
    name: 'Hydrogen',
    weight: 1.0079,
    symbol: 'H',
    description: `Hydrogen is a chemical element with symbol H and atomic number 1. With a standard
        atomic weight of 1.008, hydrogen is the lightest element on the periodic table.`,
  },
  {
    position: 2,
    name: 'Helium',
    weight: 4.0026,
    symbol: 'He',
    description: `Helium is a chemical element with symbol He and atomic number 2. It is a
        colorless, odorless, tasteless, non-toxic, inert, monatomic gas, the first in the noble gas
        group in the periodic table. Its boiling point is the lowest among all the elements.`,
  },
  {
    position: 3,
    name: 'Lithium',
    weight: 6.941,
    symbol: 'Li',
    description: `Lithium is a chemical element with symbol Li and atomic number 3. It is a soft,
        silvery-white alkali metal. Under standard conditions, it is the lightest metal and the
        lightest solid element.`,
  },
  {
    position: 4,
    name: 'Beryllium',
    weight: 9.0122,
    symbol: 'Be',
    description: `Beryllium is a chemical element with symbol Be and atomic number 4. It is a
        relatively rare element in the universe, usually occurring as a product of the spallation of
        larger atomic nuclei that have collided with cosmic rays.`,
  },
  {
    position: 5,
    name: 'Boron',
    weight: 10.811,
    symbol: 'B',
    description: `Boron is a chemical element with symbol B and atomic number 5. Produced entirely
        by cosmic ray spallation and supernovae and not by stellar nucleosynthesis, it is a
        low-abundance element in the Solar system and in the Earth's crust.`,
  },
  {
    position: 6,
    name: 'Carbon',
    weight: 12.0107,
    symbol: 'C',
    description: `Carbon is a chemical element with symbol C and atomic number 6. It is nonmetallic
        and tetravalent—making four electrons available to form covalent chemical bonds. It belongs
        to group 14 of the periodic table.`,
  },
  {
    position: 7,
    name: 'Nitrogen',
    weight: 14.0067,
    symbol: 'N',
    description: `Nitrogen is a chemical element with symbol N and atomic number 7. It was first
        discovered and isolated by Scottish physician Daniel Rutherford in 1772.`,
  },
  {
    position: 8,
    name: 'Oxygen',
    weight: 15.9994,
    symbol: 'O',
    description: `Oxygen is a chemical element with symbol O and atomic number 8. It is a member of
         the chalcogen group on the periodic table, a highly reactive nonmetal, and an oxidizing
         agent that readily forms oxides with most elements as well as with other compounds.`,
  },
  {
    position: 9,
    name: 'Fluorine',
    weight: 18.9984,
    symbol: 'F',
    description: `Fluorine is a chemical element with symbol F and atomic number 9. It is the
        lightest halogen and exists as a highly toxic pale yellow diatomic gas at standard
        conditions.`,
  },
  {
    position: 10,
    name: 'Neon',
    weight: 20.1797,
    symbol: 'Ne',
    description: `Neon is a chemical element with symbol Ne and atomic number 10. It is a noble gas.
        Neon is a colorless, odorless, inert monatomic gas under standard conditions, with about
        two-thirds the density of air.`,
  },
];

const columnsToDisplay = ['name', 'weight', 'symbol', 'position'];
const columnsToDisplayWithExpand = [...columnsToDisplay, 'expand'];

const columns: MatColumnDef[] = [
  {name: 'name', header: 'name'},
  {name: 'weight', header: 'weight'},
  {name: 'symbol', header: 'symbol'},
  {name: 'position', header: 'position'},
  {name: 'expand', header: ' ', headerAriaLabel: 'row actions'},
  {name: 'expandedDetail'},
];

export default component$(() => {
  useStyles$(styles);
  const expandedPosition = useSignal<number | null>(null);

  const rows: MatTableRow[] = ELEMENT_DATA.flatMap(element => {
    const isExpanded = expandedPosition.value === element.position;
    const toggle$ = $((event: MouseEvent) => {
      event.stopPropagation();
      expandedPosition.value = isExpanded ? null : element.position;
    });
    const mainRow: MatTableRow = {
      key: `main-${element.position}`,
      columns: columnsToDisplayWithExpand,
      class: ['example-element-row', isExpanded && 'example-expanded-row'].filter(
        Boolean,
      ) as string[],
      onClick$: $(() => {
        expandedPosition.value = isExpanded ? null : element.position;
      }),
      cells: {
        name: element.name,
        weight: element.weight,
        symbol: element.symbol,
        position: element.position,
        expand: (
          <MatIconButton
            ariaLabel="expand row"
            class={[
              'example-toggle-button',
              isExpanded && 'example-toggle-button-expanded',
            ].filter(Boolean)}
            onClick$={toggle$}
          >
            <MatIcon>keyboard_arrow_down</MatIcon>
          </MatIconButton>
        ),
      },
    };
    const detailRow: MatTableRow = {
      key: `detail-${element.position}`,
      columns: ['expandedDetail'],
      class: 'example-detail-row',
      cellProps: {expandedDetail: {colSpan: columnsToDisplayWithExpand.length}},
      cells: {
        expandedDetail: (
          <div
            class={[
              'example-element-detail-wrapper',
              isExpanded && 'example-element-detail-wrapper-expanded',
            ]
              .filter(Boolean)
              .join(' ')}
          >
            <div class="example-element-detail">
              <div class="example-element-diagram">
                <div class="example-element-position">{element.position}</div>
                <div class="example-element-symbol">{element.symbol}</div>
                <div class="example-element-name">{element.name}</div>
                <div class="example-element-weight">{element.weight}</div>
              </div>
              <div class="example-element-description">
                {element.description}
                <span class="example-element-description-attribution"> -- Wikipedia </span>
              </div>
            </div>
          </div>
        ),
      },
    };
    return [mainRow, detailRow];
  });

  return (
    <table-expandable-rows-example>
      <MatTable
        columns={columns}
        rows={rows}
        displayedColumns={columnsToDisplayWithExpand}
        class="mat-elevation-z8"
      />
    </table-expandable-rows-example>
  );
});
