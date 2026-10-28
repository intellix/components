import {Component, Type} from '@angular/core';
import {MatSortModule, Sort} from '@angular/material/sort';

// Each scenario mirrors a route under src/qwik-cdk-dev-app/src/routes/mat-sort/. See
// button-toggle.ts for the general approach. A plain `<table matSort>` / `<th mat-sort-header>`
// is used throughout — matSort does not depend on mat-table/cdk-table, so no table/tbody rows
// are rendered, just the header row. Non-selector inputs use `[prop]` bindings: a static
// attribute input is also echoed onto the host element by Angular, which a Qwik component
// cannot distinguish from a prop. The directive *selector* attributes themselves (`matSort`,
// `mat-sort-header="<id>"`) are written the way real consumers write them (static), per the
// spec's header comment.

@Component({
  template: `
    <div data-parity-root>
      <table matSort (matSortChange)="sort = $event">
        <tr>
          <th mat-sort-header="name">Name</th>
          <th mat-sort-header="population">Population</th>
        </tr>
      </table>
      <p>Sort: {{ sort.active }} {{ sort.direction }}</p>
    </div>
  `,
  imports: [MatSortModule],
})
export class SortBasic {
  sort: Sort = {active: '', direction: ''};
}

@Component({
  template: `
    <div data-parity-root>
      <table
        matSort
        [matSortActive]="'population'"
        [matSortDirection]="'desc'"
        (matSortChange)="sort = $event">
        <tr>
          <th mat-sort-header="name">Name</th>
          <th mat-sort-header="population">Population</th>
        </tr>
      </table>
      <p>Sort: {{ sort.active }} {{ sort.direction }}</p>
    </div>
  `,
  imports: [MatSortModule],
})
export class SortInitialActiveDirection {
  sort: Sort = {active: 'population', direction: 'desc'};
}

@Component({
  template: `
    <div data-parity-root>
      <table matSort [matSortStart]="'desc'" (matSortChange)="sort = $event">
        <tr>
          <th mat-sort-header="name">Name</th>
          <th mat-sort-header="population">Population</th>
        </tr>
      </table>
      <p>Sort: {{ sort.active }} {{ sort.direction }}</p>
    </div>
  `,
  imports: [MatSortModule],
})
export class SortStartDesc {
  sort: Sort = {active: '', direction: ''};
}

@Component({
  template: `
    <div data-parity-root>
      <table matSort [matSortDisableClear]="true" (matSortChange)="sort = $event">
        <tr>
          <th mat-sort-header="name">Name</th>
          <th mat-sort-header="population">Population</th>
        </tr>
      </table>
      <p>Sort: {{ sort.active }} {{ sort.direction }}</p>
    </div>
  `,
  imports: [MatSortModule],
})
export class SortDisableClear {
  sort: Sort = {active: '', direction: ''};
}

@Component({
  template: `
    <div data-parity-root>
      <table matSort (matSortChange)="sort = $event">
        <tr>
          <th mat-sort-header="name" [disabled]="true">Name</th>
          <th mat-sort-header="population">Population</th>
        </tr>
      </table>
      <p>Sort: {{ sort.active }} {{ sort.direction }}</p>
    </div>
  `,
  imports: [MatSortModule],
})
export class SortDisabledHeader {
  sort: Sort = {active: '', direction: ''};
}

@Component({
  template: `
    <div data-parity-root>
      <table
        matSort
        [matSortActive]="'name'"
        [matSortDirection]="'asc'"
        [matSortDisabled]="true"
        (matSortChange)="sort = $event">
        <tr>
          <th mat-sort-header="name">Name</th>
          <th mat-sort-header="population">Population</th>
        </tr>
      </table>
      <p>Sort: {{ sort.active }} {{ sort.direction }}</p>
    </div>
  `,
  imports: [MatSortModule],
})
export class SortDisabledSort {
  sort: Sort = {active: 'name', direction: 'asc'};
}

@Component({
  template: `
    <div data-parity-root>
      <table matSort (matSortChange)="sort = $event">
        <tr>
          <th mat-sort-header="name" [arrowPosition]="'before'">Name</th>
          <th mat-sort-header="population">Population</th>
        </tr>
      </table>
      <p>Sort: {{ sort.active }} {{ sort.direction }}</p>
    </div>
  `,
  imports: [MatSortModule],
})
export class SortArrowPositionBefore {
  sort: Sort = {active: '', direction: ''};
}

@Component({
  template: `
    <div data-parity-root>
      <table matSort (matSortChange)="sort = $event">
        <tr>
          <th mat-sort-header="name" [sortActionDescription]="'Sort by name'">Name</th>
          <th mat-sort-header="population">Population</th>
        </tr>
      </table>
      <p>Sort: {{ sort.active }} {{ sort.direction }}</p>
    </div>
  `,
  imports: [MatSortModule],
})
export class SortActionDescription {
  sort: Sort = {active: '', direction: ''};
}

export const SORT_SCENARIOS: Record<string, Type<unknown>> = {
  'basic': SortBasic,
  'initial-active-direction': SortInitialActiveDirection,
  'start-desc': SortStartDesc,
  'disable-clear': SortDisableClear,
  'disabled-header': SortDisabledHeader,
  'disabled-sort': SortDisabledSort,
  'arrow-position-before': SortArrowPositionBefore,
  'sort-action-description': SortActionDescription,
};
