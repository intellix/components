/**
 * Faithful port of `StickyStyler` (src/cdk/table/sticky-styler.ts).
 *
 * Upstream mutates REAL `HTMLElement`s imperatively (`classList.add/remove`,
 * `element.style[dir] = ...`), deferred to an `afterNextRender`
 * `{earlyRead, write}` pass so geometry reads never interleave with style
 * writes (layout-thrash avoidance) and so sticky positioning is recomputed
 * after Angular's own change-detection-driven DOM mutations land.
 *
 * Qwik has no persistent, imperatively-mutated DOM to replay this against —
 * every render recomputes the table's markup fresh (there's no stale sticky
 * state from a PREVIOUS render to "clear" the way `clearStickyPositioning`
 * does upstream; a fresh element never had sticky styling to begin with).
 * So this port keeps the exact ALGORITHM (position math, z-index formula,
 * class names, the native-vs-flex "stick every cell" vs "stick the row"
 * branch, the footer-reversal offset accumulation, the "all sticky including
 * vacuously when there are zero footer rows" Safari tfoot quirk) but
 * operates on a lightweight in-memory `VirtualStickyElement` (a plain
 * `classes`/`style` bag) instead of a real `HTMLElement`, and drops the
 * `earlyRead`/`write`/`afterNextRender` scheduling entirely — the caller
 * (qwik-material/table's `MatTable`) builds one `VirtualStickyElement` per
 * cell/row during its own synchronous render pass (SSR-safe: no DOM, no
 * client-only timing) and reads the final `classes`/`style` back into JSX
 * `class`/`style` props directly.
 *
 * Width/height measurement: upstream measures real `getBoundingClientRect()`
 * sizes (cached, `ResizeObserver`-invalidated, replayed after a debounce).
 * This port has no DOM to measure during SSR, so callers pass in whatever
 * widths/heights they have (0 when unknown). The position math
 * (`getStickyStartColumnPositions`/`getStickyEndColumnPositions`) only
 * actually NEEDS real widths when there are 2+ sticky columns on the SAME
 * side (the offset accumulates PRECEDING sticky columns' widths) — with at
 * most one sticky-start and one sticky-end column, every offset is
 * mathematically `0` regardless of the real width, so passing `0` is exact,
 * not an approximation, for that common case. A consumer with 2+ same-side
 * sticky columns needs to supply real measured widths for a correct result;
 * this port does not (yet) wire up a client-side remeasure/ResizeObserver
 * pass — see SYNC.md.
 */

export type StickyDirection = 'top' | 'bottom' | 'left' | 'right';

export const STICKY_DIRECTIONS: readonly StickyDirection[] = ['top', 'bottom', 'left', 'right'];

const Z_INDEX_INCREMENTS: Record<StickyDirection, number> = {
  top: 100,
  bottom: 10,
  left: 1,
  right: 1,
};

/** A plain in-memory stand-in for an `HTMLElement`'s `classList` + `style`. */
export interface VirtualStickyElement {
  classes: Set<string>;
  /** Only the subset of inline-style properties `StickyStyler` ever touches. */
  style: Partial<Record<StickyDirection | 'zIndex' | 'position', string>>;
}

export function createVirtualStickyElement(): VirtualStickyElement {
  return {classes: new Set<string>(), style: {}};
}

/** `StickyStyler._getCalculatedZIndex`: sums `{top:100,bottom:10,left:1,right:1}`
 *  for every direction CURRENTLY set as an inline style on `el` — live, not
 *  from a separately-tracked state map, so call this AFTER setting the
 *  direction whose style you just wrote (mirrors upstream's own ordering
 *  inside `_addStickyStyle`: the direction is assigned before z-index is
 *  (re)computed, so the just-applied direction is already visible to this
 *  read). Returns `''` (not `'0'`) when nothing is sticky, matching
 *  upstream exactly. */
export function getCalculatedZIndex(el: VirtualStickyElement): string {
  let zIndex = 0;
  for (const dir of STICKY_DIRECTIONS) {
    if (el.style[dir]) {
      zIndex += Z_INDEX_INCREMENTS[dir];
    }
  }
  return zIndex ? `${zIndex}` : '';
}

function lastIndexOfTrue(states: readonly boolean[]): number {
  for (let i = states.length - 1; i >= 0; i--) {
    if (states[i]) return i;
  }
  return -1;
}

export class StickyStyler {
  private readonly borderCellCss: Record<StickyDirection, string>;

  constructor(
    /** `table.stickyCssClass` — `'cdk-table-sticky'` upstream base,
     *  `'mat-mdc-table-sticky'` for Material (`MatTable`'s override). */
    private readonly stickCellCss: string,
    /** `table.needsPositionStickyOnElement` — base CDK default `true`;
     *  Material overrides to `false` (relies purely on the CSS class, which
     *  itself declares `position: sticky !important`). */
    private readonly needsPositionStickyOnElement: boolean = true,
    public direction: 'ltr' | 'rtl' = 'ltr',
  ) {
    this.borderCellCss = {
      top: `${stickCellCss}-border-elem-top`,
      bottom: `${stickCellCss}-border-elem-bottom`,
      left: `${stickCellCss}-border-elem-left`,
      right: `${stickCellCss}-border-elem-right`,
    };
  }

  /** `StickyStyler._addStickyStyle`, verbatim (minus the real-DOM
   *  `position: -webkit-sticky; position: sticky;` cssText fallback trick —
   *  a plain `position: 'sticky'` value renders identically once parsed by
   *  a real browser, which is all the parity harness ever observes; see
   *  SYNC.md). */
  addStickyStyle(
    el: VirtualStickyElement,
    dir: StickyDirection,
    dirValue: number,
    isBorderElement: boolean,
  ): void {
    el.classes.add(this.stickCellCss);
    if (isBorderElement) {
      el.classes.add(this.borderCellCss[dir]);
    }
    el.style[dir] = `${dirValue}px`;
    el.style.zIndex = getCalculatedZIndex(el);
    if (this.needsPositionStickyOnElement) {
      el.style.position = 'sticky';
    }
  }

  /** `StickyStyler._removeStickyStyle`, verbatim. No-ops on an element that
   *  never had `stickCellCss` — exactly upstream's own short-circuit. */
  removeStickyStyle(el: VirtualStickyElement, dirs: readonly StickyDirection[]): void {
    if (!el.classes.has(this.stickCellCss)) return;
    for (const dir of dirs) {
      delete el.style[dir];
      el.classes.delete(this.borderCellCss[dir]);
    }
    const hasRemainingDirection = STICKY_DIRECTIONS.some(
      dir => !dirs.includes(dir) && el.style[dir],
    );
    if (hasRemainingDirection) {
      el.style.zIndex = getCalculatedZIndex(el);
    } else {
      delete el.style.zIndex;
      if (this.needsPositionStickyOnElement) delete el.style.position;
      el.classes.delete(this.stickCellCss);
    }
  }

  /** `StickyStyler._getStickyStartColumnPositions`, verbatim. */
  getStickyStartColumnPositions(
    widths: readonly number[],
    stickyStates: readonly boolean[],
  ): number[] {
    const positions: number[] = [];
    let nextPosition = 0;
    for (let i = 0; i < widths.length; i++) {
      if (stickyStates[i]) {
        positions[i] = nextPosition;
        nextPosition += widths[i];
      }
    }
    return positions;
  }

  /** `StickyStyler._getStickyEndColumnPositions`, verbatim — INCLUDING the
   *  upstream off-by-one loop bound (`i` starts at `widths.length`, an
   *  out-of-bounds index, and the loop stops before `i === 0`, so index `0`
   *  is never assigned). Kept exactly as upstream for byte-level parity;
   *  see this file's header comment. */
  getStickyEndColumnPositions(
    widths: readonly number[],
    stickyStates: readonly boolean[],
  ): number[] {
    const positions: number[] = [];
    let nextPosition = 0;
    for (let i = widths.length; i > 0; i--) {
      if (stickyStates[i]) {
        positions[i] = nextPosition;
        nextPosition += widths[i];
      }
    }
    return positions;
  }

  /**
   * `StickyStyler.stickRows`, verbatim algorithm. `rows` are given in
   * top-to-bottom document order regardless of `position`; for `'bottom'`
   * the row (and sticky-state) order is reversed internally, exactly
   * upstream, so offsets accumulate from the bottommost sticky row outward.
   *
   * `cellsOf(row)` / `rowElement(row)` let the caller supply native-table
   * cells vs the flex row element without this method needing to know the
   * table's shape itself — mirrors upstream's own
   * `this._isNativeHtmlTable ? Array.from(row.children) : [row]` branch.
   */
  stickRows(
    rows: ReadonlyArray<{
      sticky: boolean;
      height?: number;
      cells: VirtualStickyElement[];
      row: VirtualStickyElement;
    }>,
    position: 'top' | 'bottom',
    isNativeHtmlTable: boolean,
  ): void {
    const ordered = position === 'bottom' ? [...rows].reverse() : rows;
    const states = ordered.map(r => r.sticky);
    const borderedIndex = lastIndexOfTrue(states);
    let offset = 0;
    for (let i = 0; i < ordered.length; i++) {
      if (!states[i]) continue;
      const isBordered = i === borderedIndex;
      const elementsToStick = isNativeHtmlTable ? ordered[i].cells : [ordered[i].row];
      for (const el of elementsToStick) {
        this.addStickyStyle(el, position, offset, isBordered);
      }
      offset += ordered[i].height ?? 0;
    }
  }

  /**
   * `StickyStyler.updateStickyColumns`'s write phase, verbatim: per cell,
   * start-sticky style is applied before end-sticky (same loop iteration,
   * not two separate passes), so a cell that is simultaneously the
   * sticky-start AND the (already top/bottom-stuck) border column picks up
   * the correctly-accumulated z-index. `widths` are in the SAME column
   * order as `stickyStartStates`/`stickyEndStates` (i.e. the row's OWN
   * rendered column order — see this file's header comment re: `0` being
   * exact, not approximate, with at most one sticky column per side).
   */
  updateStickyColumns(
    rows: ReadonlyArray<{cells: VirtualStickyElement[]}>,
    stickyStartStates: readonly boolean[],
    stickyEndStates: readonly boolean[],
    widths: readonly number[],
  ): void {
    if (!rows.length || !(stickyStartStates.some(Boolean) || stickyEndStates.some(Boolean))) {
      return;
    }
    const isRtl = this.direction === 'rtl';
    const start: StickyDirection = isRtl ? 'right' : 'left';
    const end: StickyDirection = isRtl ? 'left' : 'right';
    const lastStickyStart = lastIndexOfTrue(stickyStartStates);
    const firstStickyEnd = stickyEndStates.indexOf(true);
    const startPositions = this.getStickyStartColumnPositions(widths, stickyStartStates);
    const endPositions = this.getStickyEndColumnPositions(widths, stickyEndStates);
    const numCells = rows[0]?.cells.length ?? 0;
    for (const row of rows) {
      for (let i = 0; i < numCells; i++) {
        const cell = row.cells[i];
        if (!cell) continue;
        if (stickyStartStates[i]) {
          this.addStickyStyle(cell, start, startPositions[i], i === lastStickyStart);
        }
        if (stickyEndStates[i]) {
          this.addStickyStyle(cell, end, endPositions[i], i === firstStickyEnd);
        }
      }
    }
  }

  /**
   * `StickyStyler.updateStickyFooterContainer` — the Safari always-sticky
   * `<tfoot>` workaround, verbatim condition: if AT LEAST ONE footer row is
   * not sticky, the container's own `bottom` sticky styling is removed;
   * otherwise (including the vacuous case of ZERO footer rows at all —
   * `[].some(...)` is `false`) the container gets `bottom: 0` added. Only
   * applies to native tables; callers should not invoke this for the flex
   * `<mat-table>` form (no `<tfoot>` exists there).
   */
  updateStickyFooterContainer(tfoot: VirtualStickyElement, stickyStates: readonly boolean[]): void {
    if (stickyStates.some(state => !state)) {
      this.removeStickyStyle(tfoot, ['bottom']);
    } else {
      this.addStickyStyle(tfoot, 'bottom', 0, false);
    }
  }
}

/** Converts a `VirtualStickyElement`'s accumulated classes/style into JSX-
 *  ready props. Returns `undefined` for `style` when nothing was ever set
 *  (matching a real DOM element that never gained a `style` attribute at
 *  all, rather than an empty-but-present one). */
export function virtualStickyElementToProps(el: VirtualStickyElement): {
  classes: string[];
  style: Record<string, string> | undefined;
} {
  const classes = Array.from(el.classes);
  const styleEntries = Object.entries(el.style).filter(([, v]) => v !== undefined) as Array<
    [string, string]
  >;
  return {
    classes,
    style: styleEntries.length ? Object.fromEntries(styleEntries) : undefined,
  };
}
