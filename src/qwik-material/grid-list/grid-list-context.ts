import {createContextId} from '@builder.io/qwik';

/** Row-height mode for a MatGridList. Selected via the container's `data-mode` attribute. */
export type MatGridListMode = 'fixed' | 'ratio' | 'fit';

/**
 * Per-instance context published by <MatGridList> and consumed by every
 * descendant <MatGridTile>. Contains the parent's parsed rowHeight, cols,
 * mode, and (in ratio mode) the ratio numerator/denominator that each tile
 * needs to compute its own inline `aspect-ratio`.
 *
 * First port on the branch to use a per-instance context in addition to
 * the global config token — precedent for future container-with-children
 * ports (tabs, stepper, etc.). See design spec §3.3.
 */
export interface MatGridListInstance {
  /** Normalised rowHeight string: "100px" | "4:3" | "fit" | "5em" | etc. */
  rowHeight: string;
  /** Number of columns in the parent grid-list. Always >= 1. */
  cols: number;
  /** Which of the 3 rowHeight modes is active. Drives CSS grid-auto-rows. */
  mode: MatGridListMode;
  /** Ratio numerator (parsed from "W:H"). Set to 1 in non-ratio modes so
   *  aspect-ratio computation is safe against divide-by-zero. */
  ratioW: number;
  /** Ratio denominator (parsed from "W:H"). Set to 1 in non-ratio modes. */
  ratioH: number;
}

/**
 * Context id used by <MatGridTile> to read its parent's layout state.
 * Stable id string.
 */
export const MAT_GRID_LIST_INSTANCE = createContextId<MatGridListInstance>(
  'qwik-material/grid-list-instance',
);

/**
 * Sensible defaults so a standalone <MatGridTile> (used outside a
 * <MatGridList> ancestor) still renders. Mirrors upstream's
 * `_gridList? = inject(MAT_GRID_LIST, {optional: true})` pattern.
 *
 * Every useContext(MAT_GRID_LIST_INSTANCE, ...) call MUST pass these
 * defaults as the second argument. A bare useContext without a fallback
 * would throw QError_notFoundContext (Code 13) when a tile is rendered
 * standalone. See Progress Bar / Progress Spinner post-mortem.
 */
export const MAT_GRID_LIST_INSTANCE_DEFAULTS: MatGridListInstance = {
  rowHeight: '1:1',
  cols: 1,
  mode: 'ratio',
  ratioW: 1,
  ratioH: 1,
};
