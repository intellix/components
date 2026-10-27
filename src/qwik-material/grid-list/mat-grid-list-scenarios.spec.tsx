/**
 * MatGridList scenario port from src/material/grid-list/grid-list.spec.ts.
 *
 * Upstream has ~50 `it()` blocks — heavy on @ContentChildren QueryList +
 * ngAfterContentChecked re-layout assertions using getComputedStyle to probe
 * absolute-position inline styles. This package's vitest setup doesn't run
 * Qwik's render pipeline for any component (every `*.spec.tsx` here is a
 * typeof/shape smoke test — see the sibling SYNC.md's "Pipeline" section),
 * so DOM-rendered assertions aren't portable into vitest at all; they live
 * in Playwright instead:
 *
 *   - specs/material-grid-list/angular-parity.spec.ts — the gating Angular-
 *     vs-Qwik DOM diff (7 scenarios: basic, fit, gutter, ratio,
 *     ratio-spanning, spanning, aria-labeled).
 *   - specs/material-grid-list/*.spec.ts — Qwik-only assertions per scenario.
 *
 * The actual tile-positioning *algorithm* (TileCoordinator + TileStyler) is
 * real unit-tested here, since it's pure TS with no Qwik dependency — see
 * tile-coordinator.spec.ts and tile-styler.spec.ts.
 */
import {describe, it, expect} from 'vitest';
import {
  MAT_GRID_LIST_CONFIG,
  MatGridAvatar,
  MatGridList,
  MatGridTile,
  MatGridTileFooter,
  MatGridTileHeader,
  MatLine,
  type MatGridListConfig,
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

  it('MatGridTileHeader/Footer, MatGridAvatar and MatLine are exported', () => {
    expect(typeof MatGridTileHeader).toBe('function');
    expect(typeof MatGridTileFooter).toBe('function');
    expect(typeof MatGridAvatar).toBe('function');
    expect(typeof MatLine).toBe('function');
  });

  it('MAT_GRID_LIST_CONFIG carries the expected context id (currently unconsumed — see SYNC.md)', () => {
    expect(MAT_GRID_LIST_CONFIG.id).toBe('qwik-material/grid-list-config');
  });

  it('MatGridListConfig accepts an empty object', () => {
    const cfg: MatGridListConfig = {};
    expect(cfg).toBeDefined();
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

describe.skip('MatGridList — Angular-only tests', () => {
  it('should coerce NumberInput attribute values via coerceNumberProperty', () => {
    // Omitted — Qwik JSX passes numbers directly (grid-list/SYNC.md deviation #5).
  });
  it('should enumerate tiles via @ContentChildren QueryList / MAT_GRID_LIST DI', () => {
    // Replaced by reading JSX children directly — see jsx-children.ts and
    // grid-list/SYNC.md deviation #1.
  });
  it('should throw in dev-mode for missing cols / invalid ratio / invalid fixed-height CSS', () => {
    // Omitted — TypeScript makes cols required; browser silently ignores
    // invalid CSS (grid-list/SYNC.md deviation #6). Oversized colspan still
    // throws (tile-coordinator.spec.ts covers it directly).
  });
});
