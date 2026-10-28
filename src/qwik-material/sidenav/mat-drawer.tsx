import {
  $,
  component$,
  Slot,
  useContext,
  useSignal,
  useTask$,
  useVisibleTask$,
  type Component,
  type FunctionComponent,
  type QRL,
} from '@builder.io/qwik';
import {isBrowser} from '@builder.io/qwik/build';
import {useIdGenerator, type AutoFocusTarget} from '@angular-community/qwik-cdk/a11y';
import {hasModifierKey} from '@angular-community/qwik-cdk/keycodes';
import {applyDrawerAutoFocus} from './focus-helpers';
import {
  computeContentMargins,
  isShowingBackdropForInert,
  MAT_DRAWER_CONTAINER_STATE,
  type MatDrawerMode,
  type MatDrawerPosition,
} from './drawer-state';

/**
 * Props shared by `<MatDrawer>` and `<MatSidenav>`. Controlled component
 * (design spec: "API stays migration-friendly") — the consumer owns
 * `opened` via a signal fed through `onOpenedChange$`, mirroring upstream's
 * two-way-bindable `opened` `@Input`/`openedChange` `@Output` pair
 * (`[(opened)]`). There is no Qwik equivalent of a template-ref-exposed
 * `open()`/`close()`/`toggle()` instance method (no `exportAs`), so a
 * consumer that would write `<mat-drawer #d>` + `d.toggle()` in Angular
 * instead flips its own `opened` signal directly — see
 * `src/qwik-cdk-dev-app/src/routes/mat-sidenav/*` for the pattern.
 *
 * Must be rendered inside a `<MatDrawerContainer>`/`<MatSidenavContainer>`
 * (reads `MAT_DRAWER_CONTAINER_STATE` with no default — throws otherwise,
 * same as every other qwik-material context that has no sensible
 * standalone fallback). Place it in the container's `start-drawer` or
 * `end-drawer` named slot matching its own `position` prop — see
 * `MatDrawerContainerProps`'s doc comment.
 */
export interface MatDrawerProps {
  /** The side this drawer is attached to. Default 'start'. Must match whichever of the
   *  container's `start-drawer`/`end-drawer` slots this element is placed in. */
  position?: MatDrawerPosition;
  /** Mode of the drawer. Default 'over'. */
  mode?: MatDrawerMode;
  /** Whether the drawer can be closed with Escape or by clicking the backdrop. Default false. */
  disableClose?: boolean;
  /** Where to move focus automatically once the drawer opens. Defaults to `'dialog'` (no
   *  auto-focus) when `mode` is `'side'`, otherwise `'first-tabbable'` — mirrors upstream's
   *  `autoFocus` getter. */
  autoFocus?: AutoFocusTarget;
  /** Whether the drawer is opened. Consumer owns the state. Default false. */
  opened?: boolean;
  /** Inline width — e.g. `'200px'` or `'auto'`. The compiled theme otherwise gives every drawer
   *  a fixed width (360px); scenarios that need the drawer to size to its content (see
   *  `MatDrawerContainerProps.autosize`) must pass `width="auto"`. */
  width?: string;
  /** Fires on every opened-state change, once the open/close transition settles (or
   *  immediately, with no transition, when animations are disabled) — mirrors upstream's
   *  `openedChange` output. */
  onOpenedChange$?: QRL<(opened: boolean) => void>;
  /** Fires once the drawer has opened. Mirrors upstream's `opened` output. */
  onOpened$?: QRL<() => void>;
  /** Fires once the drawer has closed. Mirrors upstream's `closed` output. */
  onClosed$?: QRL<() => void>;
  /** Fires when the drawer has started opening. Mirrors upstream's `openedStart` output. */
  onOpenedStart$?: QRL<() => void>;
  /** Fires when the drawer has started closing. Mirrors upstream's `closedStart` output. */
  onClosedStart$?: QRL<() => void>;
  class?: string | ReadonlyArray<string>;
  id?: string;
}

/** Matches `scss/sidenav/drawer.scss`'s hardcoded `.mat-drawer-transition & { transition:
 *  transform 400ms ...; }` — see the combined task's doc comment below for why this port times
 *  the transition with a fixed timer instead of a real `transitionend` listener. */
const DRAWER_TRANSITION_MS = 400;

/** Props for `<MatSidenav>` — adds the `MatSidenav`-only `fixedInViewport` family. */
export interface MatSidenavProps extends MatDrawerProps {
  /** Whether the sidenav is fixed in the viewport. Default false. */
  fixedInViewport?: boolean;
  /** Gap, in px, between the top of the sidenav and the top of the viewport when
   *  `fixedInViewport` is set. Default 0. */
  fixedTopGap?: number;
  /** Gap, in px, between the bottom of the sidenav and the bottom of the viewport when
   *  `fixedInViewport` is set. Default 0. */
  fixedBottomGap?: number;
}

/**
 * Shared implementation behind `MatDrawer`/`MatSidenav` — mirrors upstream's
 * `MatSidenav extends MatDrawer` (`src/material/sidenav/sidenav.ts`): same
 * behavior, different host tag + an extra static class + (for `MatSidenav`)
 * the `fixedInViewport` family. Parameterized the same way
 * `createSpinner()` parameterizes `MatProgressSpinner`/`MatSpinner` (see
 * `qwik-material/progress-spinner/mat-progress-spinner.tsx`).
 */
function createDrawer(
  hostTag: 'mat-drawer' | 'mat-sidenav',
  extraHostClass: string | undefined,
): Component<MatSidenavProps> {
  return component$<MatSidenavProps>(props => {
    const containerState = useContext(MAT_DRAWER_CONTAINER_STATE);
    const idGen = useIdGenerator();
    const id = useSignal(() => idGen.getId('mat-drawer-child-'));

    const hostRef = useSignal<HTMLElement>();
    const widthPx = useSignal(0);
    const animating = useSignal(false);
    const previouslyFocused = useSignal<HTMLElement | undefined>(undefined);
    // `undefined` means "the animation task hasn't run yet" — distinguishes a drawer that
    // starts `opened` from a later transition INTO opened (see the task below).
    const prevOpened = useSignal<boolean | undefined>(undefined);
    // Mirrors `inertEligible`'s doc comment in drawer-state.ts — becomes `true` permanently the
    // first time `opened` ACTUALLY transitions (not merely the first time this task happens to
    // run again for an unrelated reason, e.g. `widthPx` changing once the initial
    // `ResizeObserver` measurement lands — confirmed empirically to otherwise incorrectly
    // flip this on that measurement alone, well before the drawer ever really toggles).
    const inertEligible = useSignal(false);

    const position = props.position === 'end' ? 'end' : 'start';
    const mode = props.mode ?? 'over';
    const opened = props.opened ?? false;

    // Mirrors upstream `MatDrawer.toggle()`'s request path, flattened: this port's drawer is
    // fully controlled, so "closing" just means telling the consumer the new value — the visual
    // close happens once that round-trips back in as `opened={false}`.
    const requestClose$ = $(() => {
      if (!(props.opened ?? false)) return;
      props.onOpenedChange$?.(false);
    });

    // Mount-driven width measurement, kept live via ResizeObserver (so `autosize` content
    // changes are picked up without the consumer doing anything) — a justified,
    // `useVisibleTask$` exception for mount-driven timing with no user interaction to lazily
    // hang it on, same category as `qwik-material/expansion`'s delayed animations-enabled class
    // (see design doc). `offsetWidth` is always measurable even while the drawer is visually
    // off-screen/closed — `.mat-drawer` is hidden via `visibility`/`transform`, never `display:
    // none` (see scss/sidenav/drawer.scss) — matching upstream's `_getWidth()`.
    useVisibleTask$(({cleanup}) => {
      const el = hostRef.value;
      if (!el) return;
      const measure = () => {
        widthPx.value = el.offsetWidth;
      };
      measure();
      const ro = new ResizeObserver(measure);
      ro.observe(el);
      cleanup(() => ro.disconnect());
    });

    // Single combined task: registry sync (mirrors upstream's `@ContentChildren(MatDrawer)
    // QueryList` iteration — `MatDrawerContainer._validateDrawers()` / `_watchDrawerToggle()` /
    // `updateContentMargins()` — reframed as each drawer publishing its own slice of state into
    // the container's registry, see drawer-state.ts) PLUS the opened-transition timing below,
    // in one task rather than two. `track()` reads `props.*` DIRECTLY (not the outer-scope
    // `position`/`mode`/`opened` consts computed once above) — `track()` only subscribes to
    // reactive reads (signals/props) made INSIDE the tracked callback; tracking a plain local
    // const closes over whatever value it happened to hold when this task was first created and
    // never re-runs on a later prop change (the same stale-capture pitfall slide-toggle/
    // button-toggle's SYNC.md document for `$()` handlers, which applies equally to `track()`
    // callbacks — confirmed empirically while porting this component).
    //
    // The opened-transition settling logic (clears the transient animating class, fires the
    // opened-state outputs, runs the matching focus side effect — mirrors upstream's
    // `_animationEnd`-driven `openedChange.emit()` subscription) is INLINED directly into the
    // `setTimeout` callback below rather than factored into a separately-named function this
    // task calls. Both are empirically-confirmed-necessary workarounds for the SAME underlying
    // Qwik limitation in this project's pinned version: a task that establishes a REAL tracked
    // subscription (as this one does, via `track(() => props.opened ...)`) crashes Qwik's SSR
    // container-pause serialization step (`QError_verifySerializable`, Code(3)) if it calls out
    // to a plain function defined elsewhere in the component body — reproduced with a function
    // as trivial as `() => { animating.value = false; }`, so it isn't about this logic's
    // complexity. Likewise, attaching a real `onTransitionEnd$`/`onTransitionCancel$` DOM
    // listener (the more natural way to detect the transition ending) crashes the same step —
    // see the `setTimeout`'s own doc note below. Both confirmed while porting this component.
    useTask$(({track, cleanup}) => {
      const trackedPosition = track(() => (props.position === 'end' ? 'end' : 'start'));
      const trackedMode = track(() => props.mode ?? 'over');
      const isOpen = track(() => props.opened ?? false);
      const trackedDisableClose = track(() => props.disableClose ?? false);
      const trackedWidth = track(() => widthPx.value);

      // Computed BEFORE the registry write below so `inertEligible` can be stored alongside
      // this drawer's other registry fields — see that field's doc comment in drawer-state.ts.
      const isFirstRun = prevOpened.value === undefined;
      const wasOpen = prevOpened.value;
      const openedActuallyChanged = !isFirstRun && isOpen !== wasOpen;
      prevOpened.value = isOpen;
      if (openedActuallyChanged) {
        inertEligible.value = true;
      }

      // Immutable reassignment, not a mutation — see drawer-state.ts's doc comment on
      // `registry` for why this is required for `MatDrawerContent` (a cross-`<Slot>` consumer)
      // to reactively pick up the change.
      containerState.registry.value = {
        ...containerState.registry.value,
        [id.value]: {
          position: trackedPosition,
          mode: trackedMode,
          opened: isOpen,
          inertEligible: inertEligible.value,
          disableClose: trackedDisableClose,
          width: trackedWidth,
          hostRef,
          requestClose$,
        },
      };
      cleanup(() => {
        const next = {...containerState.registry.value};
        delete next[id.value];
        containerState.registry.value = next;
      });

      // Imperative, not just the reactive `classes` array below — see the container's analogous
      // `mat-drawer-transition` doc comment (mat-drawer-container.tsx) for why: a re-render
      // triggered solely by a signal this component already rendered with (here, `props.opened`
      // changing after mount) doesn't reliably reach the DOM's `class` attribute in this
      // project's pinned Qwik version, confirmed empirically while porting this component. The
      // `classes` array still includes it too, both for the initial SSR/resume render (which
      // DOES correctly reflect it) and as a safety net for whenever this component re-renders
      // for some other reason.
      // `isBrowser`-guarded, not just an `if (hostRef.value)` truthiness check: during SSR,
      // `hostRef.value` is a non-null SSR-internal node placeholder (not a real `HTMLElement`),
      // so it has no `.classList` — `.toggle()` on that throws. Confirmed empirically while
      // porting this component.
      if (isBrowser) {
        const elForOpenedClass = hostRef.value;
        if (elForOpenedClass) elForOpenedClass.classList.toggle('mat-drawer-opened', isOpen);

        // Cross-component imperative updates, applied from THIS task (confirmed to reliably
        // run) rather than from a task declared directly in `MatDrawerContainer`/
        // `MatDrawerContent` (confirmed, while porting this component, to never run at all on
        // the client) — see `containerHostRef`/`contentHostRef`'s doc comments in
        // drawer-state.ts for the full rationale.
        //
        // `mat-drawer-container-has-open` — mirrors upstream's `_setContainerClass()`, called
        // from EACH non-side drawer's own `openedChange` ("last write wins" if more than one
        // non-side drawer exists, matching upstream, not a true OR — see drawer-state.ts's
        // `hasOpenNonSide` doc comment for the same documented simplification elsewhere).
        if (trackedMode !== 'side') {
          const containerEl = containerState.containerHostRef.value;
          if (containerEl) containerEl.classList.toggle('mat-drawer-container-has-open', isOpen);
        }

        // Content margins + `inert` — mirrors upstream's `updateContentMargins()` /
        // `_drawerToggled()`. Recomputed from the FULL registry (already reflecting this
        // drawer's own just-written entry above), so it stays correct with two drawers too.
        const contentEl = containerState.contentHostRef.value;
        if (contentEl) {
          const margins = computeContentMargins(containerState.registry.value);
          contentEl.style.marginLeft = margins.left != null ? `${margins.left}px` : '';
          contentEl.style.marginRight = margins.right != null ? `${margins.right}px` : '';
          const shouldBeInert = isShowingBackdropForInert(
            containerState.registry.value,
            containerState.backdropOverride.value,
          );
          if (shouldBeInert) {
            contentEl.setAttribute('inert', 'true');
          } else {
            contentEl.removeAttribute('inert');
          }
        }
      }

      if (!isBrowser) return;
      if (!isFirstRun && isOpen === wasOpen) return;
      if (isFirstRun && !isOpen) return;

      if (isOpen) {
        props.onOpenedStart$?.();
      } else {
        props.onClosedStart$?.();
      }

      // Timed with a fixed duration matching the synced `drawer.scss`'s hardcoded
      // `.mat-drawer-transition & { transition: transform 400ms ...; }` (never themeable
      // upstream either) instead of a real `transitionend` listener — see this task's own doc
      // comment above for why.
      const transitionsOn = containerState.transitionsEnabled.value;
      const delay = transitionsOn ? DRAWER_TRANSITION_MS : 0;
      setTimeout(() => {
        animating.value = false;
        const hostEl = hostRef.value;
        if (hostEl) hostEl.classList.remove('mat-drawer-animating');
        props.onOpenedChange$?.(isOpen);
        if (isOpen) {
          previouslyFocused.value = (document.activeElement as HTMLElement) ?? undefined;
          props.onOpened$?.();
          if (hostEl) {
            const autoFocus =
              props.autoFocus ?? (props.mode === 'side' ? 'dialog' : 'first-tabbable');
            applyDrawerAutoFocus(hostEl, autoFocus);
          }
        } else {
          props.onClosed$?.();
          const active = document.activeElement;
          if (hostEl && active && hostEl.contains(active)) {
            const target = previouslyFocused.value;
            if (target) {
              // Plain `.focus()`, not `focusVia()`: the restored-to element is whatever the
              // CONSUMER had focused before opening (e.g. a plain `<button>` in every scenario
              // here) — `focusVia()`'s pending-origin handoff attribute
              // (`data-cdk-pending-focus-origin`) is only ever consumed by a `useFocusOrigin()`
              // listener on the SAME element, and a plain element has none, so the attribute
              // would be set and never cleared, leaking into the DOM. Upstream's real
              // `FocusMonitor.focusVia()` has no such DOM footprint (it tracks origin in a
              // WeakMap, not an attribute) and only visibly applies `cdk-*-focused` classes to
              // elements that separately opted into being monitored — a plain, unmonitored
              // button gets none either way, so this is behaviorally equivalent for every
              // scenario here. Confirmed empirically while porting this component.
              target.focus();
            } else {
              hostEl.blur();
            }
          }
          previouslyFocused.value = undefined;
        }
      }, delay);
      if (transitionsOn) {
        animating.value = true;
        const elForAnimating = hostRef.value;
        if (elForAnimating) elForAnimating.classList.add('mat-drawer-animating');
      }
    });

    const onKeyDown$ = $((event: KeyboardEvent) => {
      if (event.key !== 'Escape' || (props.disableClose ?? false) || hasModifierKey(event)) {
        return;
      }
      event.preventDefault();
      event.stopPropagation();
      props.onOpenedChange$?.(false);
    });

    const isSidenav = hostTag === 'mat-sidenav';
    const fixedInViewport = isSidenav && (props.fixedInViewport ?? false);

    const classes = [
      'mat-drawer',
      extraHostClass,
      position === 'end' && 'mat-drawer-end',
      mode === 'over' && 'mat-drawer-over',
      mode === 'push' && 'mat-drawer-push',
      mode === 'side' && 'mat-drawer-side',
      opened && 'mat-drawer-opened',
      animating.value && 'mat-drawer-animating',
      fixedInViewport && 'mat-sidenav-fixed',
      props.class,
    ].filter(Boolean) as string[];

    const style: Record<string, string> = {};
    if (props.width != null) style.width = props.width;
    if (fixedInViewport) {
      style.top = `${props.fixedTopGap ?? 0}px`;
      style.bottom = `${props.fixedBottomGap ?? 0}px`;
    }

    const tabIndexValue = mode !== 'side' ? -1 : undefined;

    // Dynamic host tag — see createSpinner() in qwik-material/progress-spinner for the same
    // FunctionComponent-typed-alias pattern.
    const HostTag = hostTag as unknown as FunctionComponent<Record<string, unknown>>;

    return (
      <HostTag
        ref={hostRef}
        id={props.id}
        class={classes}
        style={style}
        tabIndex={tabIndexValue}
        onKeyDown$={onKeyDown$}
      >
        {/* `cdkscrollable` mirrors upstream's bare `cdkScrollable` directive-selector attribute
            (`drawer.html`'s `<div class="mat-drawer-inner-container" cdkScrollable>`) — a static,
            no-value marker Angular echoes onto the host, same category as slide-toggle's
            `mat-ripple` span. Cast past the intrinsic `<div>` type since it's not a recognized
            HTML attribute. */}
        <div
          class="mat-drawer-inner-container"
          {...({cdkscrollable: ''} as Record<string, string>)}
        >
          <Slot />
        </div>
      </HostTag>
    );
  });
}

/** `<mat-drawer>` — see `MatDrawerProps`'s doc comment. */
export const MatDrawer: Component<MatDrawerProps> = createDrawer('mat-drawer', undefined);

/** `<mat-sidenav>` — see `MatSidenavProps`'s doc comment. */
export const MatSidenav: Component<MatSidenavProps> = createDrawer('mat-sidenav', 'mat-sidenav');
