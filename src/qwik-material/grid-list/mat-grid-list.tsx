import type {JSXChildren, JSXOutput} from '@qwik.dev/core';
import {collectTypedChildren} from './jsx-children';
import {MatGridTile, renderGridTile, type MatGridTileProps} from './mat-grid-tile';
import {TileCoordinator} from './tile-coordinator';
import {FitTileStyler, FixedTileStyler, RatioTileStyler, type TileStyler} from './tile-styler';

const MAT_FIT_MODE = 'fit';

/**
 * <MatGridList> is a **plain function component, not `component$`** — the
 * one deliberate exception in this package. Why:
 *
 * Upstream computes every tile's position via `@ContentChildren` + an
 * imperative `ngAfterContentChecked` pass that *mutates* already-existing
 * tile elements (`tile._setStyle(...)`) and the list's own element
 * (`_setListStyle`) — both only after the full tile set is known. Qwik has
 * no change-detection/content-query equivalent, and critically: a
 * `component$`'s render function is invoked with `children` **always
 * stripped from its props** (`setComponentProps$1` in Qwik core explicitly
 * skips the `children` key — by design, since content projection is
 * resolved separately, for resumability). A `component$` genuinely cannot
 * read what was written inside it, at all, under any technique — confirmed
 * empirically, not a guess (see this task's commit history for the dead
 * ends: reading `props.children` directly, a context + mutable cursor
 * handed to child `MatGridTile`s, etc. — all boil down to the same wall).
 *
 * The list's own `height`/`padding-bottom` style depends on *every* tile's
 * span (`TileCoordinator`/`TileStyler` need the whole set up front), and
 * that style has to be on the `<mat-grid-list>` open tag, which is written
 * before any child in the HTML stream — there is no "render children, look
 * at what they turned out to be, then decide the parent's own attributes"
 * order available to a `component$`.
 *
 * A **plain** function component is different: it's just a normal function
 * call, inlined into whoever renders `<MatGridList>` — not a Qwik-tracked
 * boundary — so `props.children` is the real, unfiltered JSXNode data the
 * caller wrote, including each `<MatGridTile>`'s already-evaluated
 * `rowspan`/`colspan`/`children` (JSX prop values are plain data at the
 * point the caller's JSX is built; no QRL is involved in reading them).
 * That's enough to run the full upstream algorithm synchronously and emit
 * the list's style correctly on the first pass.
 *
 * The cost: `<MatGridTile>` instances nested inside `<MatGridList>` are
 * never actually mounted as components — `<MatGridList>` reads their props
 * as configuration and renders the final `<mat-grid-tile>` markup itself
 * (via `renderGridTile`, shared with `MatGridTile`'s own standalone
 * rendering in mat-grid-tile.tsx) — and, because a plain function has no
 * Qwik component boundary, it cannot call Qwik hooks (`useContext`, etc.):
 * there's nothing to read `MAT_GRID_LIST_CONFIG` with here anymore (dropped
 * — see grid-list/SYNC.md). None of this is visible to a consumer: the JSX
 * authoring ergonomic (`<MatGridList><MatGridTile>…</MatGridTile>…</MatGridList>`)
 * and the rendered DOM are both unchanged.
 */
export interface MatGridListProps {
  /** Number of columns. Required. Values less than 1 are clamped to 1
   *  (matches upstream's `Math.max(1, Math.round(...))` on `cols`). */
  cols: number;
  /** Row height mode. Default "1:1". Accepts:
   *  - fixed:  "100px", "5em", "250" (px assumed)
   *  - ratio:  "4:3" (width:height)
   *  - fit:    "fit" (distributes container height across rows; the
   *    *container* needs an explicit height — see grid-list.md) */
  rowHeight?: string | number;
  /** Space between tiles. Default "1px". */
  gutterSize?: string;
  'aria-label'?: string;
  'aria-labelledby'?: string;
  'aria-describedby'?: string;
  /** Optional role — upstream sets none by default. */
  role?: string;
  class?: string | ReadonlyArray<string>;
  id?: string;
  /** `<MatGridTile>` children. Explicitly typed here (unlike every other
   *  component in this package) because `MatGridList` is a plain function —
   *  see the header comment above. */
  children?: JSXChildren;
}

/** Picks the TileStyler subtype for a parsed rowHeight — mirrors upstream's `_setTileStyler`. */
function createTileStyler(rowHeight: string): TileStyler {
  if (rowHeight === MAT_FIT_MODE) {
    return new FitTileStyler();
  }
  if (rowHeight && rowHeight.indexOf(':') > -1) {
    return new RatioTileStyler(rowHeight);
  }
  return new FixedTileStyler(rowHeight);
}

export function MatGridList(props: MatGridListProps): JSXOutput {
  // Mirrors upstream's `cols` setter: Math.max(1, Math.round(coerceNumberProperty(value))).
  const cols = Math.max(1, Math.round(props.cols));
  // Mirrors upstream's `rowHeight` setter default: falsy -> "1:1" ("checkRowHeight").
  const rawRowHeight =
    typeof props.rowHeight === 'number' ? String(props.rowHeight) : props.rowHeight;
  const rowHeight = rawRowHeight || '1:1';
  // Mirrors upstream's `gutterSize` setter default: absent -> "1px" (field initializer).
  const gutterSize = props.gutterSize ?? '1px';
  // Direction is always 'ltr' here — upstream falls back to the same when no
  // `Directionality` is injected. Nothing in this package wires `dir` yet;
  // `tile-styler.ts`'s `_direction` plumbing is ready for it when it does.
  const direction = 'ltr';

  // Read every tile's rowspan/colspan/content directly off the JSX, in
  // document order — the SSR-safe stand-in for upstream's `@ContentChildren`
  // query. See this file's header comment for why this requires a plain
  // function, and jsx-children.ts for the walk itself.
  const tiles = collectTypedChildren<MatGridTileProps>(props.children, MatGridTile);
  const tileSpans = tiles.map(tile => ({
    // Mirrors upstream's rowspan/colspan setters: Math.round only, no clamp
    // (an explicit rowspan={0} really does produce rowspan 0, same as Angular).
    rowspan: tile.props.rowspan != null ? Math.round(tile.props.rowspan) : 1,
    colspan: tile.props.colspan != null ? Math.round(tile.props.colspan) : 1,
  }));

  const tracker = new TileCoordinator();
  tracker.update(cols, tileSpans);

  const styler = createTileStyler(rowHeight);
  styler.init(gutterSize, tracker, cols, direction);

  const renderedTiles = tiles.map((tile, i) => {
    const pos = tracker.positions[i];
    const style = styler.getTileStyle(tileSpans[i], pos.row, pos.col);
    return renderGridTile(
      {
        id: tile.props.id,
        class: tile.props.class,
        rowspan: tileSpans[i].rowspan,
        colspan: tileSpans[i].colspan,
        style,
        role: tile.props.role,
        ariaLabel: tile.props['aria-label'],
        ariaLabelledby: tile.props['aria-labelledby'],
        ariaDescribedby: tile.props['aria-describedby'],
      },
      (tile.props as {children?: JSXChildren}).children,
    );
  });

  const classes = ['mat-grid-list', props.class].filter(Boolean) as string[];

  // The list's own style: `height` (fixed), `padding-bottom` (ratio), or
  // nothing at all (fit — the consumer's CSS must size the container, same
  // as upstream). Exactly one declaration, same as `_setListStyle`.
  const computedHeight = styler.getComputedHeight();
  const listStyle: Record<string, string> | undefined = computedHeight
    ? {[computedHeight[0]]: computedHeight[1]}
    : undefined;

  return (
    <mat-grid-list
      id={props.id}
      class={classes}
      cols={cols}
      style={listStyle}
      role={props.role}
      aria-label={props['aria-label']}
      aria-labelledby={props['aria-labelledby']}
      aria-describedby={props['aria-describedby']}
    >
      <div>{renderedTiles}</div>
    </mat-grid-list>
  );
}
