/**
 * MatGridList scenario port from src/material/grid-list/grid-list.spec.ts.
 *
 * Upstream has ~50 `it()` blocks — heavy on @ContentChildren QueryList
 * + ngAfterContentChecked re-layout assertions using getComputedStyle to
 * probe absolute-position inline styles. All of that is moot in the port
 * because layout is pure CSS grid (spec §5 deviations #1 & #2).
 * Restructured:
 *
 *   - Live sanity tests (5): typeof + context ids + config/instance
 *     shapes + props shape.
 *   - describe.skip DOM-rendered (7): container/tile rendering, rowHeight
 *     modes (fixed/ratio/fit), rowspan/colspan, gutter. Deferred to
 *     Playwright Task 9.
 *   - describe.skip Angular-only (3): NumberInput coercion,
 *     @ContentChildren QueryList / MAT_GRID_LIST DI, dev-mode throws.
 *     Deferred forever per spec §5 deviations #7 & #8.
 *
 * Real DOM assertions live in
 * src/qwik-cdk-parity-tests/specs/material-grid-list/*.spec.ts.
 */
import {describe, it, expect} from 'vitest';
import {
  MAT_GRID_LIST_CONFIG,
  MAT_GRID_LIST_INSTANCE,
  MAT_GRID_LIST_INSTANCE_DEFAULTS,
  MatGridList,
  MatGridTile,
  type MatGridListConfig,
  type MatGridListInstance,
  type MatGridListProps,
  type MatGridTileProps,
} from './public-api';

describe('MatGridList — sanity', () => {
  it('MatGridList and MatGridTile are exported', () => {
    expect(MatGridList).toBeDefined();
    expect(typeof MatGridList).toBe('function');
    expect(MatGridTile).toBeDefined();
    expect(typeof MatGridTile).toBe('function');
  });

  it('MAT_GRID_LIST_CONFIG carries the expected context id', () => {
    expect(MAT_GRID_LIST_CONFIG.id).toBe('qwik-material/grid-list-config');
  });

  it('MAT_GRID_LIST_INSTANCE carries the expected context id + full-shape defaults', () => {
    expect(MAT_GRID_LIST_INSTANCE.id).toBe('qwik-material/grid-list-instance');
    expect(MAT_GRID_LIST_INSTANCE_DEFAULTS).toEqual({
      rowHeight: '1:1',
      cols: 1,
      mode: 'ratio',
      ratioW: 1,
      ratioH: 1,
    });
  });

  it('MatGridListConfig accepts an empty object; MatGridListInstance accepts a full-shape object', () => {
    const cfg: MatGridListConfig = {};
    const inst: MatGridListInstance = {
      rowHeight: '4:3',
      cols: 3,
      mode: 'ratio',
      ratioW: 4,
      ratioH: 3,
    };
    expect(cfg).toBeDefined();
    expect(inst.mode).toBe('ratio');
  });

  it('MatGridListProps + MatGridTileProps accept full aria + class + id + role surface', () => {
    const listProps: MatGridListProps = {
      cols: 3,
      rowHeight: '4:3',
      gutterSize: '8px',
      role: 'list',
      'aria-label': 'Photo grid',
      'aria-labelledby': 'grid-heading',
      'aria-describedby': 'grid-desc',
      class: 'my-grid',
      id: 'photo-grid',
    };
    const tileProps: MatGridTileProps = {
      rowspan: 2,
      colspan: 1,
      role: 'listitem',
      'aria-label': 'Photo 1',
      class: 'my-tile',
      id: 'tile-1',
    };
    expect(listProps['aria-label']).toBe('Photo grid');
    expect(tileProps.rowspan).toBe(2);
  });
});

describe.skip('MatGridList DOM-rendered scenarios — deferred to Playwright Task 9', () => {
  it('renders <mat-grid-list> with class="mat-grid-list", cols attribute, data-mode attribute', () => {});
  it('renders projected <mat-grid-tile> children as grid items', () => {});
  it('rowHeight="100px" fixed mode — grid-auto-rows applied via --mat-grid-list-row-height', () => {});
  it('rowHeight="4:3" ratio mode — tiles carry inline aspect-ratio', () => {});
  it('rowHeight="fit" fit mode — grid-auto-rows: 1fr, fills container height', () => {});
  it('rowspan/colspan — tile spans multiple cells via inline grid-column/grid-row', () => {});
  it('gutterSize="8px" — gap applied to container', () => {});
});

describe.skip('MatGridList — Angular-only tests', () => {
  it('should coerce NumberInput attribute values via coerceNumberProperty', () => {
    // Omitted — Qwik JSX passes numbers directly (spec §5 deviation #8).
  });
  it('should enumerate tiles via @ContentChildren QueryList / MAT_GRID_LIST DI', () => {
    // Replaced by per-instance MAT_GRID_LIST_INSTANCE context (spec §5 deviation #8).
  });
  it('should throw in dev-mode for missing cols / invalid ratio / oversized colspan', () => {
    // Omitted — TypeScript makes cols required; browser silently ignores invalid CSS (spec §5 deviation #7).
  });
});
