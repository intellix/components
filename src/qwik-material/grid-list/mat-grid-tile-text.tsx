import type {JSXChildren, JSXOutput} from '@qwik.dev/core';
import {partitionDirectChildren} from './jsx-children';
import {MatGridAvatar} from './mat-grid-avatar';
import {lineCountClass, MatLine} from './mat-line';

/**
 * Port of upstream's grid-tile header/footer trio
 * (`src/material/grid-list/grid-tile.ts` + `grid-tile-text.html`):
 *   - `MatGridTileHeaderCssMatStyler` / `MatGridTileFooterCssMatStyler`
 *     (`@Directive`s that add the `mat-grid-tile-header` / `-footer` class)
 *   - `MatGridTileText` (the `@Component` that actually owns the template,
 *     matching the *same* `mat-grid-tile-header, mat-grid-tile-footer`
 *     selector, and calls `setLines()`)
 *
 * Both directive-added class and component template collapse into one Qwik
 * component per tag, since Qwik has no equivalent of "two things attached to
 * the same selector". `grid-tile-text.html` is:
 *
 *   <ng-content select="[mat-grid-avatar], [matGridAvatar]"></ng-content>
 *   <div class="mat-grid-list-text"><ng-content select="[mat-line], [matLine]"></ng-content></div>
 *   <ng-content></ng-content>
 *
 * i.e. avatar content first, then line content wrapped in `.mat-grid-list-text`,
 * then everything else. Qwik has no `ng-content select`, so direct children
 * are partitioned by type instead of by a consumer-authored selector:
 * `<MatGridAvatar>` / `<MatLine>` children (this package's components,
 * matching the directive-to-component migration already used for
 * `MatGridAvatar`/`MatLine` themselves) go to the first two buckets, anything
 * else is "default" content. Only direct children are inspected — see
 * `jsx-children.ts#partitionDirectChildren`.
 *
 * **Plain functions, not `component$`** — same reason as `<MatGridList>`
 * (see mat-grid-list.tsx's header comment): partitioning direct children by
 * type needs the real `props.children`, which Qwik strips from every
 * `component$`'s props. Neither of these reads any Qwik hook, so there's no
 * cost to not being a `component$` here (no own render boundary needed).
 *
 * No parity scenario exercises these (none in the Angular mirror or the
 * qwik-cdk-dev-app routes use header/footer/avatar — see grid-list/SYNC.md);
 * covered by vitest shape checks only.
 */
export interface MatGridTileTextProps {
  class?: string | ReadonlyArray<string>;
  id?: string;
  children?: JSXChildren;
}

export function MatGridTileHeader(props: MatGridTileTextProps): JSXOutput {
  const {avatar, lines, rest} = partitionDirectChildren(props.children, MatGridAvatar, MatLine);
  const classes = ['mat-grid-tile-header', lineCountClass(lines.length), props.class].filter(
    Boolean,
  ) as string[];

  return (
    <mat-grid-tile-header id={props.id} class={classes}>
      {avatar}
      <div class="mat-grid-list-text">{lines}</div>
      {rest}
    </mat-grid-tile-header>
  );
}

export function MatGridTileFooter(props: MatGridTileTextProps): JSXOutput {
  const {avatar, lines, rest} = partitionDirectChildren(props.children, MatGridAvatar, MatLine);
  const classes = ['mat-grid-tile-footer', lineCountClass(lines.length), props.class].filter(
    Boolean,
  ) as string[];

  return (
    <mat-grid-tile-footer id={props.id} class={classes}>
      {avatar}
      <div class="mat-grid-list-text">{lines}</div>
      {rest}
    </mat-grid-tile-footer>
  );
}
