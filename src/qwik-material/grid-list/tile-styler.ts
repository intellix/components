// Port of src/material/grid-list/tile-styler.ts (upstream TileStyler +
// FixedTileStyler + RatioTileStyler + FitTileStyler).
//
// Upstream mutates a `MatGridTile` instance imperatively via `tile._setStyle`
// (needed because Angular can't re-derive the whole subtree declaratively on
// every change-detection pass). Qwik re-renders declaratively from scratch,
// so each `getXStyles` method here *returns* a style-declaration record
// instead of mutating anything — same arithmetic, same calc() strings, same
// property names, just functional instead of imperative. `MatGridList`
// (mat-grid-list.tsx) calls these once per render, for every tile, before
// returning its own JSX — see that file for why this must happen eagerly
// (the list's own `height`/`padding-bottom` style depends on every tile).
//
// `reset()` (upstream clears inline styles when the user swaps `rowHeight`
// mode at runtime) has no equivalent here: Qwik's VDOM diff removes/replaces
// the `style` attribute from the new render output automatically — there is
// no leftover imperative mutation to undo.

import type {TileCoordinator} from './tile-coordinator';

/** Minimal tile shape the styler needs — see `jsx-children.ts`. */
export interface TileSpan {
  rowspan: number;
  colspan: number;
}

/**
 * Sets the style properties for an individual tile, given the position calculated by the
 * Tile Coordinator.
 * @docs-private
 */
export abstract class TileStyler {
  _gutterSize!: string;
  _rows = 0;
  _rowspan = 0;
  _cols!: number;
  _direction!: string;

  /**
   * Adds grid-list layout info once it is available. Cannot be processed in the constructor
   * because these properties haven't been calculated by that point.
   *
   * @param gutterSize Size of the grid's gutter.
   * @param tracker Instance of the TileCoordinator.
   * @param cols Amount of columns in the grid.
   * @param direction Layout direction of the grid.
   */
  init(gutterSize: string, tracker: TileCoordinator, cols: number, direction: string): void {
    this._gutterSize = normalizeUnits(gutterSize);
    this._rows = tracker.rowCount;
    this._rowspan = tracker.rowspan;
    this._cols = cols;
    this._direction = direction;
  }

  /**
   * Computes the amount of space a single 1x1 tile would take up (width or height).
   * Used as a basis for other calculations.
   * @param sizePercent Percent of the total grid-list space that one 1x1 tile would take up.
   * @param gutterFraction Fraction of the gutter size taken up by one 1x1 tile.
   * @return The size of a 1x1 tile as an expression that can be evaluated via CSS calc().
   */
  getBaseTileSize(sizePercent: number, gutterFraction: number): string {
    // Take the base size percent (as would be if evenly dividing the size between cells),
    // and then subtracting the size of one gutter. However, since there are no gutters on the
    // edges, each tile only uses a fraction (gutterShare = numGutters / numCells) of the gutter
    // size. (Imagine having one gutter per tile, and then breaking up the extra gutter on the
    // edge evenly among the cells).
    return `(${sizePercent}% - (${this._gutterSize} * ${gutterFraction}))`;
  }

  /**
   * Gets The horizontal or vertical position of a tile, e.g., the 'top' or 'left' property value.
   * @param offset Number of tiles that have already been rendered in the row/column.
   * @param baseSize Base size of a 1x1 tile (as computed in getBaseTileSize).
   * @return Position of the tile as a CSS calc() expression.
   */
  getTilePosition(baseSize: string, offset: number): string {
    // The position comes the size of a 1x1 tile plus gutter for each previous tile in the
    // row/column (offset).
    return offset === 0 ? '0' : calc(`(${baseSize} + ${this._gutterSize}) * ${offset}`);
  }

  /**
   * Gets the actual size of a tile, e.g., width or height, taking rowspan or colspan into account.
   * @param baseSize Base size of a 1x1 tile (as computed in getBaseTileSize).
   * @param span The tile's rowspan or colspan.
   * @return Size of the tile as a CSS calc() expression.
   */
  getTileSize(baseSize: string, span: number): string {
    return `(${baseSize} * ${span}) + (${span - 1} * ${this._gutterSize})`;
  }

  /**
   * Gets the style properties to be applied to a tile for the given row and column index.
   * @param tile Tile span being positioned.
   * @param rowIndex Index of the tile's row.
   * @param colIndex Index of the tile's column.
   */
  getTileStyle(tile: TileSpan, rowIndex: number, colIndex: number): Record<string, string> {
    // Percent of the available horizontal space that one column takes up.
    const percentWidthPerTile = 100 / this._cols;

    // Fraction of the vertical gutter size that each column takes up.
    // For example, if there are 5 columns, each column uses 4/5 = 0.8 times the gutter width.
    const gutterWidthFractionPerTile = (this._cols - 1) / this._cols;

    return {
      ...this.getColStyles(tile, colIndex, percentWidthPerTile, gutterWidthFractionPerTile),
      ...this.getRowStyles(tile, rowIndex, percentWidthPerTile, gutterWidthFractionPerTile),
    };
  }

  /** Gets the horizontal placement of the tile in the list. */
  getColStyles(
    tile: TileSpan,
    colIndex: number,
    percentWidth: number,
    gutterWidth: number,
  ): Record<string, string> {
    // Base horizontal size of a column.
    const baseTileWidth = this.getBaseTileSize(percentWidth, gutterWidth);

    // The width and horizontal position of each tile is always calculated the same way, but the
    // height and vertical position depends on the rowMode.
    const side = this._direction === 'rtl' ? 'right' : 'left';
    return {
      [side]: this.getTilePosition(baseTileWidth, colIndex),
      width: calc(this.getTileSize(baseTileWidth, tile.colspan)),
    };
  }

  /**
   * Calculates the total size taken up by gutters across one axis of a list.
   */
  getGutterSpan(): string {
    return `${this._gutterSize} * (${this._rowspan} - 1)`;
  }

  /**
   * Calculates the total size taken up by tiles across one axis of a list.
   * @param tileHeight Height of the tile.
   */
  getTileSpan(tileHeight: string): string {
    return `${this._rowspan} * ${this.getTileSize(tileHeight, 1)}`;
  }

  /**
   * Gets the style properties for the vertical placement of the tile in the list.
   * This method is implemented by each type of TileStyler.
   * @docs-private
   */
  abstract getRowStyles(
    tile: TileSpan,
    rowIndex: number,
    percentWidth: number,
    gutterWidth: number,
  ): Record<string, string>;

  /**
   * Calculates the computed height and returns the correct style property to set.
   * This method can be implemented by each type of TileStyler.
   * @docs-private
   */
  getComputedHeight(): [string, string] | null {
    return null;
  }
}

/**
 * This type of styler is instantiated when the user passes in a fixed row height.
 * Example `<mat-grid-list cols="3" rowHeight="100px">`
 * @docs-private
 */
export class FixedTileStyler extends TileStyler {
  constructor(public fixedRowHeight: string) {
    super();
  }

  override init(gutterSize: string, tracker: TileCoordinator, cols: number, direction: string) {
    super.init(gutterSize, tracker, cols, direction);
    this.fixedRowHeight = normalizeUnits(this.fixedRowHeight);
    // Upstream throws in dev-mode when `fixedRowHeight` isn't calc()-safe.
    // Omitted — the browser silently ignores an invalid `calc()` value in an
    // inline style, same end result without a dev-mode-only code path.
  }

  override getRowStyles(tile: TileSpan, rowIndex: number): Record<string, string> {
    return {
      top: this.getTilePosition(this.fixedRowHeight, rowIndex),
      height: calc(this.getTileSize(this.fixedRowHeight, tile.rowspan)),
    };
  }

  override getComputedHeight(): [string, string] {
    return ['height', calc(`${this.getTileSpan(this.fixedRowHeight)} + ${this.getGutterSpan()}`)];
  }
}

/**
 * This type of styler is instantiated when the user passes in a width:height ratio
 * for the row height.  Example `<mat-grid-list cols="3" rowHeight="3:1">`
 * @docs-private
 */
export class RatioTileStyler extends TileStyler {
  /** Ratio width:height given by user to determine row height. */
  rowHeightRatio!: number;
  baseTileHeight!: string;

  constructor(value: string) {
    super();
    this._parseRatio(value);
  }

  override getRowStyles(
    tile: TileSpan,
    rowIndex: number,
    percentWidth: number,
    gutterWidth: number,
  ): Record<string, string> {
    const percentHeightPerTile = percentWidth / this.rowHeightRatio;
    this.baseTileHeight = this.getBaseTileSize(percentHeightPerTile, gutterWidth);

    // Use margin-top and padding-top to maintain the given aspect ratio, as
    // a percentage-based value for these properties is applied versus the *width* of the
    // containing block. See http://www.w3.org/TR/CSS2/box.html#margin-properties
    return {
      marginTop: this.getTilePosition(this.baseTileHeight, rowIndex),
      paddingTop: calc(this.getTileSize(this.baseTileHeight, tile.rowspan)),
    };
  }

  override getComputedHeight(): [string, string] {
    return [
      'paddingBottom',
      calc(`${this.getTileSpan(this.baseTileHeight)} + ${this.getGutterSpan()}`),
    ];
  }

  private _parseRatio(value: string): void {
    const ratioParts = value.split(':');
    // Upstream throws in dev-mode when `ratioParts.length !== 2`. Omitted —
    // a malformed ratio just yields NaN, which the browser silently ignores
    // in the resulting inline style.
    this.rowHeightRatio = parseFloat(ratioParts[0]) / parseFloat(ratioParts[1]);
  }
}

/**
 * This type of styler is instantiated when the user selects a "fit" row height mode.
 * In other words, the row height will reflect the total height of the container divided
 * by the number of rows.  Example `<mat-grid-list cols="3" rowHeight="fit">`
 *
 * @docs-private
 */
export class FitTileStyler extends TileStyler {
  override getRowStyles(tile: TileSpan, rowIndex: number): Record<string, string> {
    // Percent of the available vertical space that one row takes up.
    const percentHeightPerTile = 100 / this._rowspan;

    // Fraction of the horizontal gutter size that each column takes up.
    const gutterHeightPerTile = (this._rows - 1) / this._rows;

    // Base vertical size of a column.
    const baseTileHeight = this.getBaseTileSize(percentHeightPerTile, gutterHeightPerTile);

    return {
      top: this.getTilePosition(baseTileHeight, rowIndex),
      height: calc(this.getTileSize(baseTileHeight, tile.rowspan)),
    };
  }

  // getComputedHeight: inherited `null` — upstream sets no height on the
  // list in fit mode either; the consumer's CSS must size the container
  // (see the `fit` parity scenario: a `.fit-host { height: 400px }` ancestor
  // plus a `.fit-host > .fit-grid { height: 100% }` rule on the list itself).
}

/** Wraps a CSS string in a calc function */
function calc(exp: string): string {
  return `calc(${exp})`;
}

/** Appends pixels to a CSS string if no units are given. */
function normalizeUnits(value: string): string {
  return value.match(/([A-Za-z%]+)$/) ? value : `${value}px`;
}
