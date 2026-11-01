import {
  $,
  component$,
  Slot,
  useContext,
  useContextProvider,
  useSignal,
  useTask$,
  useVisibleTask$,
  type Component,
  type FunctionComponent,
  type QRL,
} from '@qwik.dev/core';
import {createInteractivityChecker} from '@angular-community/qwik-cdk/a11y';
import {getFirstTabbableElement, getLastTabbableElement} from './focus-helpers';
import {MAT_SIDENAV_CONFIG, type MatSidenavConfig} from './sidenav-config';
import {
  containerHasBackdrop,
  drawerHasBackdrop,
  hasOpenNonSide,
  isShowingBackdrop,
  MAT_DRAWER_CONTAINER_STATE,
  trapEnabledFor,
  type DrawerRegistration,
  type MatDrawerContainerState,
} from './drawer-state';

/**
 * Props for `<MatDrawerContainer>`/`<MatSidenavContainer>`.
 *
 * Children: place at most one `<MatDrawer q:slot="start-drawer">` (or
 * `q:slot="end-drawer"` for a `position="end"` drawer — the slot name must
 * match the drawer's own `position` prop), at most one of each, plus a
 * `<MatDrawerContent>`/`<MatSidenavContent>` in the DEFAULT (unnamed) slot.
 * Qwik has no equivalent of upstream's `<ng-content select="mat-drawer,
 * mat-sidenav">` (content reordered by element selector regardless of
 * source position) — named slots stand in for it, same pattern
 * `qwik-material/expansion`'s `MatExpansionPanel` already uses for its
 * header/title/description/actionRow. This also means upstream's automatic
 * "no explicit `<mat-drawer-content>`? wrap the default content in one"
 * fallback (`drawer-container.html`'s `@if (!_content)`) isn't replicated —
 * every consumer must render its own `MatDrawerContent`/`MatSidenavContent`
 * explicitly (true of every scenario this port targets).
 */
export interface MatDrawerContainerProps {
  /** Whether to automatically resize whenever a drawer's content size changes. Falls back to
   *  the provider config, then false — mirrors `MAT_DRAWER_DEFAULT_AUTOSIZE`. NOTE: this port
   *  always keeps drawer widths live via a `ResizeObserver` (see `mat-drawer.tsx`), so this prop
   *  has no behavioral effect here — kept for API parity only. See SYNC.md. */
  autosize?: boolean;
  /** Whether the container should have a backdrop while a drawer is open. `undefined` (the
   *  default) means "backdrop for `over`/`push`, none for `side`"; an explicit `true`/`false`
   *  overrides that for every mode. Mirrors upstream's `hasBackdrop` input. */
  hasBackdrop?: boolean;
  /** Fires when the backdrop is clicked. Mirrors upstream's `backdropClick` output. */
  onBackdropClick$?: QRL<() => void>;
  style?: string | Record<string, string>;
  class?: string | ReadonlyArray<string>;
  id?: string;
}

const CONFIG_DEFAULTS: MatSidenavConfig = {};

/**
 * Anchors a drawer's tab-wrap boundary — mirrors upstream's CDK
 * `FocusTrap`'s start/end anchor `<div>`s (`FocusTrapFactory.create`,
 * `ngAfterViewInit`), rendered declaratively here (so they're present in
 * SSR output, per the design doc's "render state on the server" rule)
 * rather than inserted imperatively by `qwik-cdk/a11y`'s
 * `createFocusTrap()`/`useFocusTrap()` — see `focus-helpers.ts`'s doc
 * comment for why that hook isn't reused wholesale for this component.
 * `boundary='start'` is upstream's *start* anchor (wraps Shift+Tab back to
 * the LAST tabbable element); `boundary='end'` is the *end* anchor (wraps
 * Tab forward to the FIRST).
 */
const FocusTrapAnchor = component$<{
  entry: DrawerRegistration;
  enabled: boolean;
  boundary: 'start' | 'end';
}>(({entry, enabled, boundary}) => {
  const onFocus$ = $(() => {
    const host = entry.hostRef.value;
    if (!host) return;
    const checker = createInteractivityChecker();
    const target =
      boundary === 'start'
        ? getLastTabbableElement(host, checker)
        : getFirstTabbableElement(host, checker);
    target?.focus();
  });
  return (
    <div
      class="cdk-visually-hidden cdk-focus-trap-anchor"
      aria-hidden="true"
      tabIndex={enabled ? 0 : undefined}
      onFocus$={onFocus$}
    />
  );
});

/**
 * Shared implementation behind `MatDrawerContainer`/`MatSidenavContainer` —
 * mirrors upstream's `MatSidenavContainer extends MatDrawerContainer`
 * (`src/material/sidenav/sidenav.ts`): identical behavior, different host
 * tag + an extra static class.
 */
function createContainer(
  hostTag: 'mat-drawer-container' | 'mat-sidenav-container',
  extraHostClass: string | undefined,
): Component<MatDrawerContainerProps> {
  return component$<MatDrawerContainerProps>(props => {
    const config = useContext(MAT_SIDENAV_CONFIG, CONFIG_DEFAULTS);
    void (props.autosize ?? config.autosize ?? false); // see doc comment above — accepted, inert.

    // A Signal (not `useStore()`) holding a plain record, reassigned immutably by each
    // registering `MatDrawer`/`MatSidenav` — see drawer-state.ts's doc comment on `registry`.
    const registry = useSignal<Record<string, DrawerRegistration>>({});
    const backdropOverride = useSignal<boolean | null>(props.hasBackdrop ?? null);
    const transitionsEnabled = useSignal(false);
    const hostRef = useSignal<HTMLElement>();
    // Populated by `MatDrawerContent`/`MatSidenavContent`'s own `ref` directly (not a local
    // signal of its own) — see drawer-state.ts's doc comment on `contentHostRef`.
    const contentHostRef = useSignal<HTMLElement>();

    useTask$(({track}) => {
      const explicit = track(() => props.hasBackdrop);
      backdropOverride.value = explicit === undefined ? null : explicit;
    });

    const containerState: MatDrawerContainerState = {
      registry,
      backdropOverride,
      transitionsEnabled,
      containerHostRef: hostRef,
      contentHostRef,
    };
    useContextProvider(MAT_DRAWER_CONTAINER_STATE, containerState);

    // Mirrors upstream's constructor: `setTimeout(() => { classList.add('mat-drawer-transition');
    // this._transitionsEnabled = true; }, 200)` — skips animating a drawer that's open by default.
    // A justified, one-time, mount-driven `useVisibleTask$` exception (design doc) — no user
    // interaction to lazily hang this on, same category as `qwik-material/expansion`'s delayed
    // animations-enabled class.
    //
    // The class itself is toggled IMPERATIVELY on the real DOM element (`classList.add`, matching
    // upstream's own imperative approach above) rather than through the reactive `classes` array
    // below — empirically confirmed while porting this component that re-renders of THIS
    // component triggered solely by `transitionsEnabled.value` flipping (no other tracked value
    // changing in the same render) do not reliably reach the DOM's `class` attribute in this
    // project's pinned Qwik version, even though the component function demonstrably re-executes
    // (confirmed via logging) — some other class-array-producing read apparently needs to change
    // in the SAME render for the patch to actually apply. `transitionsEnabled` itself is still a
    // real signal (read via context by `MatDrawer`'s task, which is NOT affected by this same
    // issue), so its only remaining job is that cross-component read — the host's own visible
    // class no longer depends on reading it reactively here.
    useVisibleTask$(({cleanup}) => {
      const timer = setTimeout(() => {
        transitionsEnabled.value = true;
        const el = hostRef.value;
        if (el) el.classList.add('mat-drawer-transition');
      }, 200);
      cleanup(() => clearTimeout(timer));
    });

    // `mat-drawer-container-has-open` is NOT set from a task here — see `containerHostRef`'s
    // doc comment in drawer-state.ts for why (a task declared directly in this component,
    // analogous to the one below for `mat-drawer-transition`, was empirically found to never
    // run on the client at all). Each registering `MatDrawer`/`MatSidenav` toggles it directly
    // via `containerHostRef`, in the same already-reliable task that toggles its own
    // `mat-drawer-opened` class.

    const hasBackdrop = containerHasBackdrop(registry.value, backdropOverride.value);
    const showingBackdrop = isShowingBackdrop(registry.value, backdropOverride.value);
    const hasOpen = hasOpenNonSide(registry.value);

    // Qwik v2 regression: the backdrop `<div>` is the FIRST JSX child, but it
    // (like the focus-trap anchors around it) only starts rendering once a
    // registering `MatDrawer`/`MatSidenav`'s own task has populated
    // `registry` — which happens on the client, strictly after this
    // container's OWN first SSR render (the raw SSR HTML has no backdrop/
    // anchor at all; confirmed live). That means the backdrop's first real
    // appearance is a brand-new PREPEND into a parent that already has
    // other children (`<mat-drawer>`/`<mat-drawer-content>`, present since
    // SSR via `<Slot>`) — and under v2 that specific shape (a new leading
    // child inserted where NO sibling existed before it, while OTHER new
    // siblings — the focus-trap anchors — are inserted in the very same
    // pass) lands the new node at the wrong spot: appended as the LAST
    // child of the container instead of prepended as the first (confirmed
    // live; the anchors, whose own "insert before" reference is an
    // already-existing node from SSR, land correctly). Adding a `key` to
    // every one of these conditionally-rendered siblings did not change
    // this. Patched imperatively, the same escape-hatch category already
    // used elsewhere in this file (`mat-drawer-transition`'s class toggle
    // above) for a declarative update that doesn't reliably land.
    const backdropRef = useSignal<HTMLElement>();
    useVisibleTask$(({track}) => {
      // Re-derive from tracked SIGNALS (not the outer, plain `hasBackdrop`
      // const) so this task actually re-fires on every registration change
      // — `track()` only establishes a subscription for a reactive read.
      const reg = track(() => registry.value);
      const override = track(() => backdropOverride.value);
      const show = containerHasBackdrop(reg, override);
      if (!show) return;
      const el = backdropRef.value;
      const parent = hostRef.value;
      if (el && parent && parent.firstChild !== el) {
        parent.insertBefore(el, parent.firstChild);
      }
    });

    const startEntry = Object.values(registry.value).find(d => d.position === 'start');
    const endEntry = Object.values(registry.value).find(d => d.position === 'end');

    const onBackdropClicked$ = $(() => {
      props.onBackdropClick$?.();
      for (const entry of Object.values(registry.value)) {
        if (
          entry.opened &&
          !entry.disableClose &&
          drawerHasBackdrop(entry, backdropOverride.value)
        ) {
          entry.requestClose$();
        }
      }
    });

    const classes = [
      'mat-drawer-container',
      extraHostClass,
      backdropOverride.value === true && 'mat-drawer-container-explicit-backdrop',
      transitionsEnabled.value && 'mat-drawer-transition',
      hasOpen && 'mat-drawer-container-has-open',
      props.class,
    ].filter(Boolean) as string[];

    const HostTag = hostTag as unknown as FunctionComponent<Record<string, unknown>>;

    return (
      <HostTag ref={hostRef} id={props.id} class={classes} style={props.style}>
        {hasBackdrop && (
          <div
            ref={backdropRef}
            key="backdrop"
            class={['mat-drawer-backdrop', showingBackdrop && 'mat-drawer-shown'].filter(Boolean)}
            onClick$={onBackdropClicked$}
          />
        )}
        {startEntry && (
          <FocusTrapAnchor
            key="start-anchor-begin"
            entry={startEntry}
            enabled={trapEnabledFor(startEntry, registry.value, backdropOverride.value)}
            boundary="start"
          />
        )}
        <Slot name="start-drawer" />
        {startEntry && (
          <FocusTrapAnchor
            key="start-anchor-end"
            entry={startEntry}
            enabled={trapEnabledFor(startEntry, registry.value, backdropOverride.value)}
            boundary="end"
          />
        )}
        <Slot />
        {endEntry && (
          <FocusTrapAnchor
            key="end-anchor-begin"
            entry={endEntry}
            enabled={trapEnabledFor(endEntry, registry.value, backdropOverride.value)}
            boundary="start"
          />
        )}
        <Slot name="end-drawer" />
        {endEntry && (
          <FocusTrapAnchor
            key="end-anchor-end"
            entry={endEntry}
            enabled={trapEnabledFor(endEntry, registry.value, backdropOverride.value)}
            boundary="end"
          />
        )}
      </HostTag>
    );
  });
}

/** `<mat-drawer-container>` — see `MatDrawerContainerProps`'s doc comment. */
export const MatDrawerContainer: Component<MatDrawerContainerProps> = createContainer(
  'mat-drawer-container',
  undefined,
);

/** `<mat-sidenav-container>` — see `MatDrawerContainerProps`'s doc comment. */
export const MatSidenavContainer: Component<MatDrawerContainerProps> = createContainer(
  'mat-sidenav-container',
  'mat-sidenav-container',
);
