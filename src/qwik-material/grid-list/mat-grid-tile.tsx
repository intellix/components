import {component$, Slot, useContext} from '@builder.io/qwik';
import {MAT_GRID_LIST_INSTANCE, MAT_GRID_LIST_INSTANCE_DEFAULTS} from './grid-list-context';

/**
 * Props for <MatGridTile>. Rendered as <mat-grid-tile> with an inner
 * .mat-grid-tile-content wrapper matching upstream's grid-tile.html for
 * CSS-selector parity. Computes its own grid-column/grid-row span from
 * rowspan/colspan, and (in ratio mode) an inline aspect-ratio from the
 * parent's ratio and its own span. See design spec §3.2 for rendered DOM.
 */
export interface MatGridTileProps {
  /** Rows this tile spans. Default 1. */
  rowspan?: number;
  /** Columns this tile spans. Default 1. */
  colspan?: number;
  'aria-label'?: string;
  'aria-labelledby'?: string;
  'aria-describedby'?: string;
  role?: string;
  class?: string | ReadonlyArray<string>;
  id?: string;
}

export const MatGridTile = component$<MatGridTileProps>(props => {
  // Read parent's layout state; SSR-safe fallback for standalone tiles.
  const instance = useContext(MAT_GRID_LIST_INSTANCE, MAT_GRID_LIST_INSTANCE_DEFAULTS);

  const rowspan = Math.max(1, Math.round(props.rowspan ?? 1));
  const colspan = Math.max(1, Math.round(props.colspan ?? 1));

  const classes = ['mat-grid-tile', props.class].filter(Boolean) as string[];

  const style: Record<string, string> = {
    'grid-column': `span ${colspan}`,
    'grid-row': `span ${rowspan}`,
  };

  // Aspect-ratio only in ratio mode. Formula: parent ratio W:H, tile aspect
  // = (colspan * W) / (rowspan * H). Gutter contribution to the aspect is
  // ignored (sub-pixel at typical 1px gutter — visually indistinguishable).
  if (instance.mode === 'ratio') {
    const aspectW = colspan * instance.ratioW;
    const aspectH = rowspan * instance.ratioH;
    style['aspect-ratio'] = `${aspectW} / ${aspectH}`;
  }

  return (
    <mat-grid-tile
      id={props.id}
      class={classes}
      rowspan={rowspan}
      colspan={colspan}
      style={style}
      role={props.role}
      aria-label={props['aria-label']}
      aria-labelledby={props['aria-labelledby']}
      aria-describedby={props['aria-describedby']}
    >
      <div class="mat-grid-tile-content">
        <Slot />
      </div>
    </mat-grid-tile>
  );
});
