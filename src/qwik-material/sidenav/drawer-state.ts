import {createContextId, type QRL, type Signal} from '@builder.io/qwik';

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
}

export const MAT_DRAWER_CONTAINER_STATE = createContextId<MatDrawerContainerState>(
  'qwik-material/drawer-container-state',
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
