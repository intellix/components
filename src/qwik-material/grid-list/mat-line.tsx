import {component$, Slot} from '@qwik.dev/core';

/**
 * Port of upstream `MatLine` (`src/material/core/line/line.ts`) — a
 * `[mat-line], [matLine]` attribute directive that adds the `mat-line`
 * class to whatever element the consumer puts it on. Per the DOM-parity
 * remediation's API rule (a consumer-side directive becomes a Qwik
 * component rendering the host element itself via a polymorphic `as` prop,
 * no extra wrapper — the pattern `MatListItem` already uses), `<MatLine>`
 * renders its own host tag instead of wrapping one.
 *
 * Used by `<MatGridTileHeader>` / `<MatGridTileFooter>` to count and project
 * "line" content the same way upstream's `setLines()` + `<ng-content
 * select="[mat-line]">` do — see `mat-grid-tile-text.tsx`.
 *
 * Note: `core/line` has not been ported as a shared qwik-material module
 * yet, so this is a grid-list-local stand-in. When it is, this file should
 * be replaced by an import from it (see grid-list/SYNC.md).
 */
export interface MatLineProps {
  /** Which host tag to render. Default 'div'. */
  as?: 'div' | 'span' | 'p';
  class?: string | ReadonlyArray<string>;
  id?: string;
}

export const MatLine = component$<MatLineProps>(props => {
  const as = props.as ?? 'div';
  const classes = ['mat-line', props.class].filter(Boolean) as string[];

  if (as === 'span') {
    return (
      <span id={props.id} class={classes}>
        <Slot />
      </span>
    );
  }
  if (as === 'p') {
    return (
      <p id={props.id} class={classes}>
        <Slot />
      </p>
    );
  }
  return (
    <div id={props.id} class={classes}>
      <Slot />
    </div>
  );
});

/**
 * Port of upstream `setLines()`'s class-selection logic
 * (`src/material/core/line/line.ts`): 2 or 3 lines get a dedicated class,
 * more than 3 get `-multi-line`, fewer than 2 get neither.
 */
export function lineCountClass(count: number, prefix = 'mat'): string | undefined {
  if (count === 2 || count === 3) return `${prefix}-${count}-line`;
  if (count > 3) return `${prefix}-multi-line`;
  return undefined;
}
