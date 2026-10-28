import type {JSXOutput, QRL} from '@builder.io/qwik';
import type {MenuPositionX, MenuPositionY} from './menu-positions';

/**
 * Props accepted by `createMatMenu()`. Mirrors the upstream `<mat-menu>`
 * inputs (`src/material/menu/menu.ts`'s `MatMenu`) — see `menu-ref.ts`'s
 * module doc comment (index.ts re-exports it) and `menu/SYNC.md` for why
 * this is a plain factory function rather than a `<MatMenu>` JSX component
 * that takes children directly.
 */
export interface MatMenuProps {
  /**
   * Produces the menu's items, invoked fresh every time this menu (or any
   * trigger pointed at it) opens — mirrors upstream's `<mat-menu>` own
   * template being a *lone* `<ng-template>`, instantiated only once a
   * trigger attaches it to the overlay (see menu.html + this package's
   * design notes). Always wrap in `$()`.
   */
  content$: QRL<() => JSXOutput>;
  /** Mirrors `[xPosition]`. Falls back to the provider default, then `'after'`. */
  xPosition?: MenuPositionX;
  /** Mirrors `[yPosition]`. Falls back to the provider default, then `'below'`. */
  yPosition?: MenuPositionY;
  /** Mirrors `[overlapTrigger]`. Falls back to the provider default, then `false`. */
  overlapTrigger?: boolean;
  /**
   * Mirrors `[hasBackdrop]`. `undefined` (the default) mirrors upstream's
   * `menu.hasBackdrop == null` branch: a ROOT trigger gets a backdrop, a
   * submenu trigger never does, regardless of this value.
   */
  hasBackdrop?: boolean;
  /** Mirrors `[backdropClass]`. Falls back to the provider default, then `'cdk-overlay-transparent-backdrop'`. */
  backdropClass?: string;
  /** Mirrors `overlayPanelClass` (deprecated upstream `MatMenuDefaultOptions` field, kept for parity). */
  overlayPanelClass?: string | string[];
  /**
   * Mirrors `<mat-menu [class]="…">`'s `panelClass` input. Pass the SAME
   * value to `<MatMenu panelClass={…} />` (the placeholder) so its
   * `class=""` quirk (see mat-menu.tsx) matches.
   */
  panelClass?: string | ReadonlyArray<string>;
  /** Mirrors `[aria-label]`. Applied to the real overlay panel only — never the placeholder. */
  'aria-label'?: string;
  /** Mirrors `[aria-labelledby]`. */
  'aria-labelledby'?: string;
  /** Mirrors `[aria-describedby]`. */
  'aria-describedby'?: string;
}

/**
 * Returned by `createMatMenu()`. A plain, serializable config object (one
 * QRL field) — safe to pass as a prop into `<MatMenuTrigger menu={…}>` /
 * `<MatMenuItem menu={…}>`, and safe to close over from a DIFFERENT menu's
 * `content$` QRL (nested/submenu scenarios). Deliberately carries NO
 * `JSXOutput` field (unlike an early design this package's SYNC.md
 * documents and rejects) — only `content$` ever touches JSX, and only once
 * invoked, entirely client-side, well after any SSR serialization boundary.
 */
export interface MatMenuRef extends MatMenuProps {
  /** Opaque marker so `MatMenuTrigger`/`MatMenuItem` can validate their `menu` prop at runtime. */
  readonly __matMenu: true;
}

/**
 * Builds a `MatMenuRef` — the Qwik-port equivalent of declaring
 * `<mat-menu #menu="matMenu">…</mat-menu>` and later referencing `#menu` via
 * `[matMenuTriggerFor]`. Call it as a plain function (not JSX) wherever you
 * would declare the Angular template's `<mat-menu>` tag; pass the result to
 * `<MatMenuTrigger menu={…}>` (top-level triggers) or `<MatMenuItem
 * menu={…}>` (submenu triggers), and ALSO render `<MatMenu panelClass={…}
 * />` as a sibling of the trigger to reproduce the empty placeholder host
 * element Angular leaves at the `<mat-menu>` declaration site (see
 * mat-menu.tsx). See `menu/SYNC.md` for the full rationale.
 */
export function createMatMenu(props: MatMenuProps): MatMenuRef {
  return {...props, __matMenu: true};
}
