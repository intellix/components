import {Component, Type, ViewChild} from '@angular/core';
import {MatTable, MatTableModule} from '@angular/material/table';
import {MatSortModule, Sort} from '@angular/material/sort';

// Each scenario mirrors a route under src/qwik-cdk-dev-app/src/routes/mat-table/. See
// button-toggle.ts for the general approach. Inputs use [prop] bindings: a static attribute
// input is also echoed onto the host element by Angular, which a Qwik component cannot
// distinguish from a prop. See the spec's header comment for the exhaustive, verified-live DOM
// contract every scenario below renders to.

interface PeriodicElement {
  position: number;
  name: string;
  weight: number;
  symbol: string;
}

const ELEMENTS: PeriodicElement[] = [
  {position: 1, name: 'Hydrogen', weight: 1.0079, symbol: 'H'},
  {position: 2, name: 'Helium', weight: 4.0026, symbol: 'He'},
  {position: 3, name: 'Lithium', weight: 6.941, symbol: 'Li'},
  {position: 4, name: 'Beryllium', weight: 9.0122, symbol: 'Be'},
];

@Component({
  template: `
    <div data-parity-root>
      <table mat-table [dataSource]="dataSource">
        <ng-container matColumnDef="position">
          <th mat-header-cell *matHeaderCellDef>No.</th>
          <td mat-cell *matCellDef="let element">{{ element.position }}</td>
        </ng-container>
        <ng-container matColumnDef="name">
          <th mat-header-cell *matHeaderCellDef>Name</th>
          <td mat-cell *matCellDef="let element">{{ element.name }}</td>
        </ng-container>
        <ng-container matColumnDef="weight">
          <th mat-header-cell *matHeaderCellDef>Weight</th>
          <td mat-cell *matCellDef="let element">{{ element.weight }}</td>
        </ng-container>
        <ng-container matColumnDef="symbol">
          <th mat-header-cell *matHeaderCellDef>Symbol</th>
          <td mat-cell *matCellDef="let element">{{ element.symbol }}</td>
        </ng-container>
        <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
        <tr mat-row *matRowDef="let row; columns: displayedColumns"></tr>
      </table>
    </div>
  `,
  imports: [MatTableModule],
})
export class TableBasic {
  displayedColumns = ['position', 'name', 'weight', 'symbol'];
  dataSource: PeriodicElement[] = ELEMENTS;
}

@Component({
  template: `
    <div data-parity-root>
      <mat-table [dataSource]="dataSource">
        <ng-container matColumnDef="position">
          <mat-header-cell *matHeaderCellDef>No.</mat-header-cell>
          <mat-cell *matCellDef="let element">{{ element.position }}</mat-cell>
        </ng-container>
        <ng-container matColumnDef="name">
          <mat-header-cell *matHeaderCellDef>Name</mat-header-cell>
          <mat-cell *matCellDef="let element">{{ element.name }}</mat-cell>
        </ng-container>
        <ng-container matColumnDef="weight">
          <mat-header-cell *matHeaderCellDef>Weight</mat-header-cell>
          <mat-cell *matCellDef="let element">{{ element.weight }}</mat-cell>
        </ng-container>
        <ng-container matColumnDef="symbol">
          <mat-header-cell *matHeaderCellDef>Symbol</mat-header-cell>
          <mat-cell *matCellDef="let element">{{ element.symbol }}</mat-cell>
        </ng-container>
        <mat-header-row *matHeaderRowDef="displayedColumns"></mat-header-row>
        <mat-row *matRowDef="let row; columns: displayedColumns"></mat-row>
      </mat-table>
    </div>
  `,
  imports: [MatTableModule],
})
export class TableFlex {
  displayedColumns = ['position', 'name', 'weight', 'symbol'];
  dataSource: PeriodicElement[] = ELEMENTS;
}

@Component({
  template: `
    <div data-parity-root>
      <table mat-table [dataSource]="dataSource">
        <ng-container matColumnDef="position">
          <th mat-header-cell *matHeaderCellDef>No.</th>
          <td mat-cell *matCellDef="let element">{{ element.position }}</td>
          <td mat-footer-cell *matFooterCellDef></td>
        </ng-container>
        <ng-container matColumnDef="name">
          <th mat-header-cell *matHeaderCellDef>Name</th>
          <td mat-cell *matCellDef="let element">{{ element.name }}</td>
          <td mat-footer-cell *matFooterCellDef>Total</td>
        </ng-container>
        <ng-container matColumnDef="weight">
          <th mat-header-cell *matHeaderCellDef>Weight</th>
          <td mat-cell *matCellDef="let element">{{ element.weight }}</td>
          <td mat-footer-cell *matFooterCellDef>{{ totalWeight() }}</td>
        </ng-container>
        <ng-container matColumnDef="symbol">
          <th mat-header-cell *matHeaderCellDef>Symbol</th>
          <td mat-cell *matCellDef="let element">{{ element.symbol }}</td>
          <td mat-footer-cell *matFooterCellDef></td>
        </ng-container>
        <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
        <tr mat-row *matRowDef="let row; columns: displayedColumns"></tr>
        <tr mat-footer-row *matFooterRowDef="displayedColumns"></tr>
      </table>
    </div>
  `,
  imports: [MatTableModule],
})
export class TableFooterRow {
  displayedColumns = ['position', 'name', 'weight', 'symbol'];
  dataSource: PeriodicElement[] = ELEMENTS;

  totalWeight(): number {
    return this.dataSource.reduce((sum, el) => sum + el.weight, 0);
  }
}

@Component({
  template: `
    <div data-parity-root>
      <div style="height: 140px; width: 420px; overflow: auto">
        <table mat-table [dataSource]="dataSource">
          <ng-container matColumnDef="name" [sticky]="true">
            <th mat-header-cell *matHeaderCellDef>Name</th>
            <td mat-cell *matCellDef="let element">{{ element.name }}</td>
          </ng-container>
          <ng-container matColumnDef="position">
            <th mat-header-cell *matHeaderCellDef>No.</th>
            <td mat-cell *matCellDef="let element">{{ element.position }}</td>
          </ng-container>
          <ng-container matColumnDef="weight">
            <th mat-header-cell *matHeaderCellDef>Weight</th>
            <td mat-cell *matCellDef="let element">{{ element.weight }}</td>
          </ng-container>
          <ng-container matColumnDef="actions" [stickyEnd]="true">
            <th mat-header-cell *matHeaderCellDef aria-label="row actions">Actions</th>
            <td mat-cell *matCellDef="let element">View</td>
          </ng-container>
          <tr mat-header-row *matHeaderRowDef="displayedColumns; sticky: true"></tr>
          <tr mat-row *matRowDef="let row; columns: displayedColumns"></tr>
        </table>
      </div>
    </div>
  `,
  imports: [MatTableModule],
})
export class TableStickyHeaderColumnEnd {
  displayedColumns = ['name', 'position', 'weight', 'actions'];
  dataSource: PeriodicElement[] = ELEMENTS;
}

@Component({
  template: `
    <div data-parity-root>
      <table mat-table [dataSource]="dataSource">
        <mat-text-column [name]="'position'"></mat-text-column>
        <mat-text-column [name]="'name'"></mat-text-column>
        <mat-text-column [name]="'weight'"></mat-text-column>
        <mat-text-column [name]="'symbol'"></mat-text-column>
        <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
        <tr mat-row *matRowDef="let row; columns: displayedColumns"></tr>
      </table>
    </div>
  `,
  imports: [MatTableModule],
})
export class TableTextColumn {
  displayedColumns = ['position', 'name', 'weight', 'symbol'];
  dataSource: PeriodicElement[] = ELEMENTS;
}

@Component({
  template: `
    <div data-parity-root>
      <table mat-table [dataSource]="dataSource">
        <ng-container matColumnDef="position">
          <th mat-header-cell *matHeaderCellDef>No.</th>
          <td mat-cell *matCellDef="let element">{{ element.position }}</td>
        </ng-container>
        <ng-container matColumnDef="name">
          <th mat-header-cell *matHeaderCellDef>Name</th>
          <td mat-cell *matCellDef="let element">{{ element.name }}</td>
        </ng-container>
        <ng-container matColumnDef="symbol">
          <th mat-header-cell *matHeaderCellDef>Symbol</th>
          <td mat-cell *matCellDef="let element">{{ element.symbol }}</td>
        </ng-container>
        <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
        <tr mat-row *matRowDef="let row; columns: displayedColumns"></tr>
        <tr class="mat-row" *matNoDataRow>
          <td class="mat-cell" colspan="3">No data</td>
        </tr>
      </table>
    </div>
  `,
  imports: [MatTableModule],
})
export class TableNoDataRow {
  displayedColumns = ['position', 'name', 'symbol'];
  dataSource: PeriodicElement[] = [];
}

@Component({
  template: `
    <div data-parity-root>
      <table mat-table [dataSource]="dataSource" matSort (matSortChange)="onSortChange($event)">
        <ng-container matColumnDef="position">
          <th mat-header-cell *matHeaderCellDef mat-sort-header>No.</th>
          <td mat-cell *matCellDef="let element">{{ element.position }}</td>
        </ng-container>
        <ng-container matColumnDef="name">
          <th mat-header-cell *matHeaderCellDef mat-sort-header>Name</th>
          <td mat-cell *matCellDef="let element">{{ element.name }}</td>
        </ng-container>
        <ng-container matColumnDef="weight">
          <th mat-header-cell *matHeaderCellDef mat-sort-header>Weight</th>
          <td mat-cell *matCellDef="let element">{{ element.weight }}</td>
        </ng-container>
        <ng-container matColumnDef="symbol">
          <th mat-header-cell *matHeaderCellDef mat-sort-header>Symbol</th>
          <td mat-cell *matCellDef="let element">{{ element.symbol }}</td>
        </ng-container>
        <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
        <tr mat-row *matRowDef="let row; columns: displayedColumns"></tr>
      </table>
      <p>Sort: {{ sortState.active }} {{ sortState.direction }}</p>
    </div>
  `,
  imports: [MatTableModule, MatSortModule],
})
export class TableSortable {
  displayedColumns = ['position', 'name', 'weight', 'symbol'];
  dataSource: PeriodicElement[] = [...ELEMENTS];
  sortState: Sort = {active: '', direction: ''};

  onSortChange(sort: Sort) {
    this.sortState = sort;
    const data = [...ELEMENTS];
    if (!sort.active || sort.direction === '') {
      this.dataSource = data;
      return;
    }
    const dir = sort.direction === 'asc' ? 1 : -1;
    this.dataSource = data.sort((a, b) => {
      const av = a[sort.active as keyof PeriodicElement];
      const bv = b[sort.active as keyof PeriodicElement];
      return av < bv ? -dir : av > bv ? dir : 0;
    });
  }
}

@Component({
  template: `
    <div data-parity-root>
      <table mat-table [dataSource]="dataSource">
        <ng-container matColumnDef="position">
          <th mat-header-cell *matHeaderCellDef>No.</th>
          <td mat-cell *matCellDef="let element">{{ element.position }}</td>
        </ng-container>
        <ng-container matColumnDef="name">
          <th mat-header-cell *matHeaderCellDef>Name</th>
          <td mat-cell *matCellDef="let element">{{ element.name }}</td>
        </ng-container>
        <ng-container matColumnDef="weight">
          <th mat-header-cell *matHeaderCellDef>Weight</th>
          <td mat-cell *matCellDef="let element">{{ element.weight }}</td>
        </ng-container>
        <ng-container matColumnDef="symbol">
          <th mat-header-cell *matHeaderCellDef>Symbol</th>
          <td mat-cell *matCellDef="let element">{{ element.symbol }}</td>
        </ng-container>
        <ng-container matColumnDef="basic-info">
          <th mat-header-cell *matHeaderCellDef>Basic Info</th>
        </ng-container>
        <ng-container matColumnDef="measurement-info">
          <th mat-header-cell *matHeaderCellDef>Measurement</th>
        </ng-container>
        <tr mat-header-row *matHeaderRowDef="['basic-info', 'measurement-info']"></tr>
        <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
        <tr mat-row *matRowDef="let row; columns: displayedColumns"></tr>
      </table>
    </div>
  `,
  imports: [MatTableModule],
})
export class TableMultipleHeaderRows {
  displayedColumns = ['position', 'name', 'weight', 'symbol'];
  dataSource: PeriodicElement[] = ELEMENTS;
}

@Component({
  template: `
    <div data-parity-root>
      <button type="button" (click)="addRow()">Add row</button>
      <button type="button" [disabled]="!dataSource.length" (click)="removeRow()">
        Remove row
      </button>
      <table mat-table [dataSource]="dataSource">
        <ng-container matColumnDef="position">
          <th mat-header-cell *matHeaderCellDef>No.</th>
          <td mat-cell *matCellDef="let element">{{ element.position }}</td>
        </ng-container>
        <ng-container matColumnDef="name">
          <th mat-header-cell *matHeaderCellDef>Name</th>
          <td mat-cell *matCellDef="let element">{{ element.name }}</td>
        </ng-container>
        <ng-container matColumnDef="weight">
          <th mat-header-cell *matHeaderCellDef>Weight</th>
          <td mat-cell *matCellDef="let element">{{ element.weight }}</td>
        </ng-container>
        <ng-container matColumnDef="symbol">
          <th mat-header-cell *matHeaderCellDef>Symbol</th>
          <td mat-cell *matCellDef="let element">{{ element.symbol }}</td>
        </ng-container>
        <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
        <tr mat-row *matRowDef="let row; columns: displayedColumns"></tr>
      </table>
      <p>Rows: {{ dataSource.length }}</p>
    </div>
  `,
  imports: [MatTableModule],
})
export class TableDataChange {
  displayedColumns = ['position', 'name', 'weight', 'symbol'];
  dataSource: PeriodicElement[] = [...ELEMENTS];

  private readonly _extra: PeriodicElement[] = [
    {position: 5, name: 'Boron', weight: 10.811, symbol: 'B'},
    {position: 6, name: 'Carbon', weight: 12.0107, symbol: 'C'},
  ];
  private _addedCount = 0;

  @ViewChild(MatTable) table!: MatTable<PeriodicElement>;

  addRow() {
    const next = this._extra[this._addedCount % this._extra.length];
    this._addedCount++;
    this.dataSource.push(next);
    this.table.renderRows();
  }

  removeRow() {
    this.dataSource.pop();
    this.table.renderRows();
  }
}

export const TABLE_SCENARIOS: Record<string, Type<unknown>> = {
  'basic': TableBasic,
  'flex': TableFlex,
  'footer-row': TableFooterRow,
  'sticky-header-column-end': TableStickyHeaderColumnEnd,
  'text-column': TableTextColumn,
  'no-data-row': TableNoDataRow,
  'sortable': TableSortable,
  'multiple-header-rows': TableMultipleHeaderRows,
  'data-change': TableDataChange,
};
