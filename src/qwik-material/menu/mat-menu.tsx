import {component$, type JSXChildren, type JSXOutput} from '@qwik.dev/core';
import {useMatMenuStyles} from './menu-styles';

/**
 * Props accepted by the `<MatMenu>` placeholder. Only `panelClass` affects
 * its own rendering (the `class=""` quirk below) — every other `<mat-menu>`
 * input lives on `createMatMenu()`'s config instead (see menu-ref.ts /
 * menu/SYNC.md for why the two are separate).
 */
export interface MatMenuPlaceholderProps {
  /** Pass the SAME `panelClass` given to `createMatMenu({panelClass: …})`. */
  panelClass?: string | ReadonlyArray<string>;
}

function hasNonEmptyPanelClass(panelClass: MatMenuPlaceholderProps['panelClass']): boolean {
  if (!panelClass) return false;
  return Array.isArray(panelClass) ? panelClass.length > 0 : panelClass.length > 0;
}

/**
 * The empty placeholder Angular leaves at a `<mat-menu>` declaration site.
 *
 * Upstream's `<mat-menu>` template (`menu.html`) is a *lone* `<ng-template>`:
 * its content is only ever instantiated later, inside the overlay, by
 * whichever trigger attaches it. But `<mat-menu>` is still a *component*
 * (selector `mat-menu`), so Angular still creates and renders its own HOST
 * element at the point it's declared — it just stays empty (no children)
 * there forever. `MatMenu`'s host bindings (`[attr.aria-label]`/
 * `[attr.aria-labelledby]`/`[attr.aria-describedby]` all hard-bound to
 * `null`) exist specifically to strip the static-attribute echo a bare
 * `aria-label="…"` would otherwise leave on this empty tag — irrelevant
 * here since this component never receives those props at all (the real
 * `aria-label` lives on `createMatMenu()`'s config, applied only to the real
 * overlay panel by `MenuPanel`).
 *
 * The one upstream quirk THIS placeholder must reproduce: `MatMenu.panelClass`'s
 * setter runs `this._elementRef.nativeElement.className = ''` whenever a
 * non-empty value is set — so the host renders `<mat-menu class="">`
 * (present, empty string) rather than no `class` attribute at all. A plain
 * function (not `component$`): purely static output, no hooks needed — except
 * the menu CSS (`mat-menu { display: none }` among it), registered by
 * `MenuStyles` just before the placeholder.
 */
export function MatMenu(props: MatMenuPlaceholderProps): JSXOutput {
  return (
    <>
      <MenuStyles />
      <mat-menu class={hasNonEmptyPanelClass(props.panelClass) ? '' : undefined} />
    </>
  );
}

/**
 * Registers the menu CSS where upstream's `MatMenu` component (`styleUrl: 'menu.css'`) is
 * created — its `<mat-menu>` host, which that CSS hides (`mat-menu { display: none }`) — since
 * the `MatMenu` placeholder is a plain function with no hook phase. A `component$` that renders
 * nothing, like upstream's own style loaders (`_CdkPrivateStyleLoader`) and grid-list's
 * `GridListStyles`; `MenuPanel` registers the same CSS for a panel opened without one.
 */
const MenuStyles = component$(() => {
  useMatMenuStyles();
  return null;
});

/**
 * Marks lazily-rendered menu content. Mirrors `<ng-template matMenuContent>`
 * (`src/material/menu/menu-content.ts`'s `MatMenuContent`, backed by a real
 * `DomPortalOutlet` whose own host is a bare, attribute-less `<div>`).
 * Use inside a `createMatMenu({content$: $(() => <MatMenuContent>…</MatMenuContent>)})`
 * body wherever upstream would nest `<ng-template matMenuContent>` — it
 * reproduces the EXTRA wrapping `<div>` the real `DomPortalOutlet` leaves
 * around the lazily-attached content (confirmed live: a non-lazy menu's
 * `.mat-mdc-menu-content` contains its items directly, while a
 * `matMenuContent` one wraps them in one extra bare `<div>` — see
 * angular-parity.spec.ts's `lazy-content` scenario). A plain function —
 * purely structural, no hooks needed.
 */
export function MatMenuContent(props: {children?: JSXChildren}): JSXOutput {
  return <div>{props.children}</div>;
}
