import {component$, Slot, useContext, useContextProvider} from '@builder.io/qwik';
import {MAT_GRID_LIST_CONFIG, type MatGridListConfig} from './grid-list-config';
import {MAT_GRID_LIST_INSTANCE, type MatGridListInstance} from './grid-list-context';

/**
 * Props for <MatGridList>. Renders a <mat-grid-list> custom element as a
 * CSS-grid container. `cols` is required; `rowHeight` defaults to "1:1"
 * (matches upstream); `gutterSize` defaults to "1px". See design spec §3.1
 * for rendered DOM shape.
 */
export interface MatGridListProps {
  /** Number of columns. Required. Values less than 1 are clamped to 1. */
  cols: number;
  /** Row height mode. Default "1:1". Accepts:
   *  - fixed:  "100px", "5em", "250" (px assumed)
   *  - ratio:  "4:3" (width:height)
   *  - fit:    "fit" (distributes container height across rows) */
  rowHeight?: string | number;
  /** Space between tiles. Default "1px". */
  gutterSize?: string;
  'aria-label'?: string;
  'aria-labelledby'?: string;
  'aria-describedby'?: string;
  /** Optional role — upstream defaults to none (decorative); pass "list"
   *  per grid-list.md guidance when the tiles hold non-interactive content. */
  role?: string;
  class?: string | ReadonlyArray<string>;
  id?: string;
}

const CONFIG_DEFAULTS: MatGridListConfig = {};

/**
 * Parse a raw rowHeight prop into a normalised MatGridListInstance.
 * Extracted to the module level (not inline in component$) so it doesn't
 * get captured as a Qwik QRL reassignment (Badge Task 7 precedent —
 * inline mutation inside component$ triggers "Illegal reassignment of
 * import" at Rollup time).
 */
function parseInstance(
  rawRowHeight: string | number | undefined,
  rawCols: number,
): MatGridListInstance {
  const rowHeight =
    typeof rawRowHeight === 'number' ? String(rawRowHeight) : (rawRowHeight ?? '1:1');
  const cols = Math.max(1, Math.round(rawCols));

  if (rowHeight === 'fit') {
    return {rowHeight, cols, mode: 'fit', ratioW: 1, ratioH: 1};
  }
  if (rowHeight.includes(':')) {
    const [w, h] = rowHeight.split(':').map(parseFloat);
    // Invalid ratio (NaN) passes through — browser silently ignores
    // invalid aspect-ratio in the tile's inline style (spec §5 deviation #7).
    return {rowHeight, cols, mode: 'ratio', ratioW: w, ratioH: h};
  }
  return {rowHeight, cols, mode: 'fixed', ratioW: 1, ratioH: 1};
}

export const MatGridList = component$<MatGridListProps>(props => {
  // Read config for family-shape consistency, even though it currently has
  // no fields to resolve. The read pattern is established so future config
  // fields plug in without a component-file rewrite.
  useContext(MAT_GRID_LIST_CONFIG, CONFIG_DEFAULTS);

  const instance = parseInstance(props.rowHeight, props.cols);
  const gutterSize = props.gutterSize ?? '1px';

  // Publish the per-instance context so descendant MatGridTile components
  // can read the parent's layout state.
  useContextProvider(MAT_GRID_LIST_INSTANCE, instance);

  const classes = ['mat-grid-list', props.class].filter(Boolean) as string[];

  // Build inline style: cols + gutter always, row-height only in fixed mode
  // (ratio + fit derive row height from grid-auto-rows CSS directly).
  const style: Record<string, string> = {
    '--mat-grid-list-cols': String(instance.cols),
    '--mat-grid-list-gutter': gutterSize,
  };
  if (instance.mode === 'fixed') {
    // Normalise unit-less fixed value to px (mirrors upstream's normalizeUnits).
    const rh = instance.rowHeight;
    const normalised = /[a-z%]$/i.test(rh) ? rh : `${rh}px`;
    style['--mat-grid-list-row-height'] = normalised;
  }

  return (
    <mat-grid-list
      id={props.id}
      class={classes}
      cols={instance.cols}
      data-mode={instance.mode}
      style={style}
      role={props.role}
      aria-label={props['aria-label']}
      aria-labelledby={props['aria-labelledby']}
      aria-describedby={props['aria-describedby']}
    >
      <Slot />
    </mat-grid-list>
  );
});
