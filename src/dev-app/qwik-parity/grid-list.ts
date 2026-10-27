import {Component, Type} from '@angular/core';
import {MatGridListModule} from '@angular/material/grid-list';

// Each scenario mirrors src/qwik-cdk-dev-app/src/routes/mat-grid-list/<name>/index.tsx.
// `cols`, `rowHeight` and `gutterSize` on <mat-grid-list>, and `rowspan`/`colspan`
// on <mat-grid-tile>, are bound with [prop] syntax: all four are @Input()s that
// Angular's grid-list/grid-tile host bindings also reflect back onto the host
// element (`[attr.cols]`, `[attr.rowspan]`, `[attr.colspan]`), and a static
// attribute input would additionally be echoed verbatim by Angular, which a
// Qwik component cannot distinguish from a prop. `role`/`aria-label` are plain
// HTML attributes (no matching @Input on either component), so they stay static.
//
// Angular positions tiles with inline `style` (top/left/width/height or
// margin-top/padding-top, computed by TileStyler) while the Qwik port uses
// CSS Grid (`grid-column`/`grid-row`, plus `aspect-ratio` in ratio mode) — the
// `style` attribute values are expected to differ. material-parity.ts's own
// snapshot (not structural-diff.ts's `snapshot`, which does ignore `style`)
// does not exclude the `style` attribute, so it is compared as a raw string.

@Component({
  template: `
    <div data-parity-root>
      <mat-grid-list [cols]="4" [rowHeight]="'100px'">
        <mat-grid-tile>Tile 1</mat-grid-tile>
        <mat-grid-tile>Tile 2</mat-grid-tile>
        <mat-grid-tile>Tile 3</mat-grid-tile>
        <mat-grid-tile>Tile 4</mat-grid-tile>
        <mat-grid-tile>Tile 5</mat-grid-tile>
        <mat-grid-tile>Tile 6</mat-grid-tile>
        <mat-grid-tile>Tile 7</mat-grid-tile>
        <mat-grid-tile>Tile 8</mat-grid-tile>
      </mat-grid-list>
    </div>
  `,
  imports: [MatGridListModule],
})
export class GridListBasic {}

@Component({
  template: `
    <div data-parity-root>
      <div class="fit-host" style="height: 400px">
        <mat-grid-list [cols]="4" [rowHeight]="'fit'" class="fit-grid">
          <mat-grid-tile>Fit 1</mat-grid-tile>
          <mat-grid-tile>Fit 2</mat-grid-tile>
          <mat-grid-tile>Fit 3</mat-grid-tile>
          <mat-grid-tile>Fit 4</mat-grid-tile>
          <mat-grid-tile>Fit 5</mat-grid-tile>
          <mat-grid-tile>Fit 6</mat-grid-tile>
          <mat-grid-tile>Fit 7</mat-grid-tile>
          <mat-grid-tile>Fit 8</mat-grid-tile>
        </mat-grid-list>
      </div>
    </div>
    <style>
      .fit-host > .fit-grid {
        height: 100%;
      }
    </style>
  `,
  imports: [MatGridListModule],
})
export class GridListFit {}

@Component({
  template: `
    <div data-parity-root>
      <mat-grid-list [cols]="3" [rowHeight]="'100px'" [gutterSize]="'16px'">
        <mat-grid-tile>Gutter 1</mat-grid-tile>
        <mat-grid-tile>Gutter 2</mat-grid-tile>
        <mat-grid-tile>Gutter 3</mat-grid-tile>
        <mat-grid-tile>Gutter 4</mat-grid-tile>
        <mat-grid-tile>Gutter 5</mat-grid-tile>
        <mat-grid-tile>Gutter 6</mat-grid-tile>
      </mat-grid-list>
    </div>
  `,
  imports: [MatGridListModule],
})
export class GridListGutter {}

@Component({
  template: `
    <div data-parity-root>
      <mat-grid-list [cols]="3" [rowHeight]="'4:3'">
        <mat-grid-tile>Ratio 1</mat-grid-tile>
        <mat-grid-tile>Ratio 2</mat-grid-tile>
        <mat-grid-tile>Ratio 3</mat-grid-tile>
        <mat-grid-tile>Ratio 4</mat-grid-tile>
        <mat-grid-tile>Ratio 5</mat-grid-tile>
        <mat-grid-tile>Ratio 6</mat-grid-tile>
      </mat-grid-list>
    </div>
  `,
  imports: [MatGridListModule],
})
export class GridListRatio {}

@Component({
  template: `
    <div data-parity-root>
      <mat-grid-list [cols]="4" [rowHeight]="'4:3'">
        <mat-grid-tile [rowspan]="2" [colspan]="2">Compound aspect 8:6</mat-grid-tile>
        <mat-grid-tile>Ratio fill 1</mat-grid-tile>
        <mat-grid-tile>Ratio fill 2</mat-grid-tile>
      </mat-grid-list>
    </div>
  `,
  imports: [MatGridListModule],
})
export class GridListRatioSpanning {}

@Component({
  template: `
    <div data-parity-root>
      <mat-grid-list [cols]="4" [rowHeight]="'100px'">
        <mat-grid-tile [rowspan]="2" [colspan]="2">Hero</mat-grid-tile>
        <mat-grid-tile>Fill 1</mat-grid-tile>
        <mat-grid-tile>Fill 2</mat-grid-tile>
        <mat-grid-tile>Fill 3</mat-grid-tile>
        <mat-grid-tile>Fill 4</mat-grid-tile>
        <mat-grid-tile>Fill 5</mat-grid-tile>
        <mat-grid-tile>Fill 6</mat-grid-tile>
      </mat-grid-list>
    </div>
  `,
  imports: [MatGridListModule],
})
export class GridListSpanning {}

@Component({
  template: `
    <div data-parity-root>
      <mat-grid-list [cols]="3" [rowHeight]="'100px'" role="list" aria-label="Photo grid">
        <mat-grid-tile role="listitem" aria-label="Photo 1">Photo 1</mat-grid-tile>
        <mat-grid-tile role="listitem" aria-label="Photo 2">Photo 2</mat-grid-tile>
        <mat-grid-tile role="listitem" aria-label="Photo 3">Photo 3</mat-grid-tile>
      </mat-grid-list>
    </div>
  `,
  imports: [MatGridListModule],
})
export class GridListAriaLabeled {}

export const GRID_LIST_SCENARIOS: Record<string, Type<unknown>> = {
  'basic': GridListBasic,
  'fit': GridListFit,
  'gutter': GridListGutter,
  'ratio': GridListRatio,
  'ratio-spanning': GridListRatioSpanning,
  'spanning': GridListSpanning,
  'aria-labeled': GridListAriaLabeled,
};
