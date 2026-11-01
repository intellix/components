import {createContextId, type QRL, type Signal} from '@qwik.dev/core';

/** Drawer and SideNav display modes. Mirrors upstream `MatDrawerMode` (`src/material/sidenav/drawer.ts`). */
export type MatDrawerMode = 'over' | 'push' | 'side';

/** The side a drawer is attached to. Mirrors upstream's `position` input. */
export type MatDrawerPosition = 'start' | 'end';

/**
 * Per-drawer data `MatDrawer`/`MatSidenav` publish into their owning
 * container's registry (see `MatDrawerContainerState` below) — the
 * Qwik-reactive replacement for upstream's `@ContentChildren(MatDrawer)
 * QueryList` iteration. Written synchronously by each drawer (both at
 * SSR-render time and on every subsequent prop/width change); read by the
 * container and by `MatDrawerContent`/`MatSidenavContent` to derive
 * backdrop visibility, the `mat-drawer-container-has-open` class and
 * content margins — all pure functions below, so a reader never needs to
 * know HOW the registry got populated.
 */
export interface DrawerRegistration {
  position: MatDrawerPosition;
  mode: MatDrawerMode;
  /** Current (immediate) opened state — mirrors upstream's `_opened` signal, read directly rather
   *  than through the animation-delayed `openedChange` output. See SYNC.md's "derived state is
   *  immediate" deviation for why this port doesn't replicate upstream's finer-grained,
   *  inconsistent real/delayed split for the purely-CSS-driven classes/attrs below. */
  opened: boolean;
  /**
   * False only for a drawer whose VERY FIRST render already has `opened: true` (a static
   * `opened={true}`, never toggled) — mirrors a genuine upstream quirk, verified live: a
   * drawer's `_setOpen()` call registers the content's 50ms-delayed `inert` update via
   * `_drawerToggled()`, but the FIRST such call (processing a static `[opened]="true"` input)
   * runs before `MatDrawerContainer`'s `_content`/`_userContent` `@ContentChild`/`@ViewChild`
   * have resolved, so `(this._container?._content || this._container?._userContent)
   * ?._drawerToggled(this)` is a no-op THAT ONE TIME — `inert` then never gets applied for
   * that drawer, even though its backdrop is genuinely shown (confirmed live: `autosize`,
   * whose drawer starts `opened="true"`, shows `mat-drawer-shown` on the backdrop but never
   * `inert` on the content — contrast every click-driven open in mode-over/has-backdrop-false/
   * disable-close, all of which DO eventually get `inert`, because their first `_setOpen()`
   * call happens well after content has resolved). Becomes `true` forever after this
   * drawer's first REAL (post-mount) opened-state change. Only consulted for `inert` — the
   * backdrop's `mat-drawer-shown` class and the focus-trap anchors' `tabindex` are separate
   * upstream mechanisms, unaffected by this same-lifecycle quirk (see `isShowingBackdrop` vs
   * `isShowingBackdropForInert` below).
   */
  inertEligible: boolean;
  disableClose: boolean;
  /** Measured `offsetWidth`, kept live via a ResizeObserver (see `mat-drawer.tsx`). 0 on the
   *  server and before the first client measurement — matches upstream's `_getWidth()`, which
   *  also reads 0 via `offsetWidth` before the browser has laid anything out. */
  width: number;
  /** The drawer's own host element — used by the container to resolve the focus-trap anchors'
   *  tab-wrap target (`focus-helpers.ts`'s `getFirstTabbableElement`/`getLastTabbableElement`). */
  hostRef: Signal<HTMLElement | undefined>;
  /** Asks the drawer to close itself — the container's backdrop-click handler calls this on every
   *  open, backdrop-having, not-disableClose drawer. Mirrors upstream's
   *  `_closeModalDrawersViaBackdrop()`. Since this port's drawer is a controlled component (design
   *  doc: "API stays migration-friendly"), this only invokes the drawer's own `onOpenedChange$` —
   *  the visual close happens once the consumer feeds the new value back in as `opened={false}`. */
  requestClose$: QRL<() => void>;
}

/** State `MatDrawerContainer`/`MatSidenavContainer` publish for descendant drawers/content. */
export interface MatDrawerContainerState {
  /**
   * Reactive registry of every currently-mounted drawer, keyed by an internal per-instance id.
   * A `Signal` holding a plain record, reassigned immutably on every registration/update/
   * unregistration (never mutated in place) — `useStore()` is NOT used here: this project found
   * (see `qwik-material/button-toggle/button-toggle-group-state.ts`'s doc comment) that a
   * cross-`<Slot>` context consumer (`MatDrawerContent`, here) only reactively re-renders when
   * it dereferences `.value` on a signal that's later REASSIGNED — not from a plain object (or,
   * untested here but treated the same way per that precedent, a `useStore()` deep-proxy)
   * threaded through `useContextProvider()`.
   */
  registry: Signal<Record<string, DrawerRegistration>>;
  /** `null` = no explicit `[hasBackdrop]`; otherwise the explicit override. Mirrors upstream's
   *  `_backdropOverride`. A signal (not a plain value) so `MatDrawerContent`/`MatDrawer` — which
   *  read it across a `<Slot>` projection boundary, not as a direct child render — stay
   *  reactively subscribed if it's ever changed after mount (no scenario does, but the registry
   *  fields follow the same rule for values that DO change after mount, so this stays
   *  consistent). */
  backdropOverride: Signal<boolean | null>;
  /** Whether the container's own `mat-drawer-transition` class has landed yet (~200ms after
   *  mount) — mirrors upstream's `_transitionsEnabled`. A drawer only runs a real CSS transition
   *  (and so only ever shows `mat-drawer-animating`) while this is true. */
  transitionsEnabled: Signal<boolean>;
  /**
   * The container's own host element, populated by its `ref` — exposed here so a registering
   * `MatDrawer`/`MatSidenav` can imperatively toggle `mat-drawer-container-has-open` on it
   * (mirrors upstream's `_setContainerClass()`, called per-drawer from each non-side drawer's
   * own `openedChange` — "last write wins" across drawers if more than one is non-side, matching
   * upstream, not a true OR; see `mat-drawer.tsx`). A `useTask$` declared directly in
   * `MatDrawerContainer`/`MatDrawerContent` that tracks `registry`/`backdropOverride` to do this
   * same imperative work itself was empirically found, while porting this component, to never
   * run at all on the client (no diagnostics, just silently never invoked) — routing the work
   * through the ONE task in `MatDrawer` that IS confirmed to reliably run (it also owns the
   * `mat-drawer-opened` class toggle) avoids whatever that is.
   */
  containerHostRef: Signal<HTMLElement | undefined>;
  /**
   * The single `MatDrawerContent`/`MatSidenavContent`'s host element, populated by ITS `ref`
   * (assigned directly to this shared signal, not a local one — see that component) — exposed
   * here for the same reason as `containerHostRef`: a registering `MatDrawer`/`MatSidenav`
   * imperatively applies the aggregate content margins + `inert` here after every registry
   * change, instead of `MatDrawerContent` doing it from its own (empirically non-firing) task.
   */
  contentHostRef: Signal<HTMLElement | undefined>;
}

export const MAT_DRAWER_CONTAINER_STATE = createContextId<MatDrawerContainerState>(
  'qwikMaterial/drawerContainerState',
);

function findByPosition(
  registry: Record<string, DrawerRegistration>,
  position: MatDrawerPosition,
): DrawerRegistration | undefined {
  for (const entry of Object.values(registry)) {
    if (entry.position === position) return entry;
  }
  return undefined;
}

/** Mirrors upstream `MatDrawerContainer._drawerHasBackdrop(drawer)`. */
export function drawerHasBackdrop(
  entry: DrawerRegistration | undefined,
  backdropOverride: boolean | null,
): boolean {
  if (backdropOverride == null) return !!entry && entry.mode !== 'side';
  return backdropOverride;
}

/** Mirrors upstream `MatDrawerContainer.hasBackdrop` getter — whether the backdrop `<div>`
 *  exists AT ALL (independent of whether it's currently shown). LTR only: `start`/`end` stand in
 *  for upstream's direction-resolved `_left`/`_right` (no scenario exercises RTL — same gap this
 *  codebase's button-toggle group already documents). */
export function containerHasBackdrop(
  registry: Record<string, DrawerRegistration>,
  backdropOverride: boolean | null,
): boolean {
  const start = findByPosition(registry, 'start');
  const end = findByPosition(registry, 'end');
  return drawerHasBackdrop(start, backdropOverride) || drawerHasBackdrop(end, backdropOverride);
}

/** Mirrors upstream `MatDrawerContainer._isShowingBackdrop()`. */
export function isShowingBackdrop(
  registry: Record<string, DrawerRegistration>,
  backdropOverride: boolean | null,
): boolean {
  for (const entry of Object.values(registry)) {
    if (entry.opened && drawerHasBackdrop(entry, backdropOverride)) return true;
  }
  return false;
}

/** Like `isShowingBackdrop`, but for `MatDrawerContent`'s `inert` attribute specifically — see
 *  `inertEligible`'s doc comment above for the upstream lifecycle quirk this additionally
 *  excludes (a drawer that's `opened` from its very first render never gets `inert` applied at
 *  all, even while its backdrop is genuinely shown). */
export function isShowingBackdropForInert(
  registry: Record<string, DrawerRegistration>,
  backdropOverride: boolean | null,
): boolean {
  for (const entry of Object.values(registry)) {
    if (entry.opened && entry.inertEligible && drawerHasBackdrop(entry, backdropOverride)) {
      return true;
    }
  }
  return false;
}

/** Mirrors upstream's `_watchDrawerToggle` container-class subscription, simplified to a plain
 *  OR across every non-side drawer (see SYNC.md: upstream's actual per-drawer-event
 *  last-write-wins toggle only differs from this when TWO non-side drawers independently open/
 *  close, which no scenario does). */
export function hasOpenNonSide(registry: Record<string, DrawerRegistration>): boolean {
  for (const entry of Object.values(registry)) {
    if (entry.mode !== 'side' && entry.opened) return true;
  }
  return false;
}

/** Mirrors upstream `MatDrawerContainer.updateContentMargins()` (LTR only — see
 *  `containerHasBackdrop`'s doc comment for the same documented RTL gap). */
export function computeContentMargins(registry: Record<string, DrawerRegistration>): {
  left: number | null;
  right: number | null;
} {
  const start = findByPosition(registry, 'start');
  const end = findByPosition(registry, 'end');
  let left = 0;
  let right = 0;

  if (start?.opened) {
    if (start.mode === 'side') {
      left += start.width;
    } else if (start.mode === 'push') {
      left += start.width;
      right -= start.width;
    }
  }

  if (end?.opened) {
    if (end.mode === 'side') {
      right += end.width;
    } else if (end.mode === 'push') {
      right += end.width;
      left -= end.width;
    }
  }

  return {left: left || null, right: right || null};
}

/** Whether this drawer's own focus trap should be enabled — mirrors upstream
 *  `_updateFocusTrapState()`'s `this.opened && !!this._container?._isShowingBackdrop()`. */
export function trapEnabledFor(
  entry: DrawerRegistration,
  registry: Record<string, DrawerRegistration>,
  backdropOverride: boolean | null,
): boolean {
  return entry.opened && isShowingBackdrop(registry, backdropOverride);
}
