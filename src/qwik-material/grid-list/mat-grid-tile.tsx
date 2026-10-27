import {component$, Slot, type JSXChildren, type JSXOutput} from '@builder.io/qwik';

/**
 * Props for <MatGridTile>. Rendered as <mat-grid-tile> with an inner
 * .mat-grid-tile-content wrapper matching upstream's grid-tile.html.
 *
 * Used two ways:
 *   - Standalone (no <MatGridList> ancestor): renders with no position
 *     style at all — matches upstream, which never calls `_setStyle` when
 *     `_gridList` is absent (grid-tile.ts).
 *   - Nested inside <MatGridList>: `<MatGridList>` reads this component's
 *     *props* directly off its JSX children (rowspan/colspan/content/aria/…)
 *     and renders the positioned `<mat-grid-tile>` itself via
 *     `renderGridTile` below — this component's own render function never
 *     actually runs in that case. See mat-grid-list.tsx's header comment for
 *     why (Qwik strips `children` from every `component$`'s props; a parent
 *     can't read a child `component$`'s children either way, so the parent
 *     has to render the tile's final markup itself once it has the data).
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

/** Everything `renderGridTile` needs beyond the projected content. */
export interface GridTileRenderProps {
  id?: string;
  class?: string | ReadonlyArray<string>;
  rowspan: number;
  colspan: number;
  /** Inline position/size style. `undefined` for a standalone tile (no list). */
  style?: Record<string, string>;
  role?: string;
  ariaLabel?: string;
  ariaLabelledby?: string;
  ariaDescribedby?: string;
}

/**
 * Builds the `<mat-grid-tile>` markup shared by `MatGridTile` (standalone)
 * and `MatGridList` (positioned, rendered inline — see mat-grid-list.tsx).
 * One source of truth for the attribute/class/wrapper shape so the two call
 * sites can't drift apart.
 */
export function renderGridTile(p: GridTileRenderProps, content: JSXChildren): JSXOutput {
  const classes = ['mat-grid-tile', p.class].filter(Boolean) as string[];
  return (
    <mat-grid-tile
      id={p.id}
      class={classes}
      rowspan={p.rowspan}
      colspan={p.colspan}
      style={p.style}
      role={p.role}
      aria-label={p.ariaLabel}
      aria-labelledby={p.ariaLabelledby}
      aria-describedby={p.ariaDescribedby}
    >
      <div class="mat-grid-tile-content">{content}</div>
    </mat-grid-tile>
  );
}

export const MatGridTile = component$<MatGridTileProps>(props => {
  // Mirrors upstream's rowspan/colspan setters: Math.round only, no clamp —
  // `<MatGridTile rowspan={0}>` really does reflect `rowspan="0"`, same as
  // Angular's `[attr.rowspan]="rowspan"` host binding.
  const rowspan = props.rowspan != null ? Math.round(props.rowspan) : 1;
  const colspan = props.colspan != null ? Math.round(props.colspan) : 1;

  return renderGridTile(
    {
      id: props.id,
      class: props.class,
      rowspan,
      colspan,
      role: props.role,
      ariaLabel: props['aria-label'],
      ariaLabelledby: props['aria-labelledby'],
      ariaDescribedby: props['aria-describedby'],
    },
    <Slot />,
  );
});
