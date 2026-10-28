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
import {focusVia, useIdGenerator, type AutoFocusTarget} from '@angular-community/qwik-cdk/a11y';
import {hasModifierKey} from '@angular-community/qwik-cdk/keycodes';
import {applyDrawerAutoFocus} from './focus-helpers';
import {
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
 *  transform 400ms ...; }` — see `settleTransition`'s doc comment for why this port times the
 *  transition with a fixed timer instead of a real `transitionend` listener. */
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

    const position = props.position === 'end' ? 'end' : 'start';
    const mode = props.mode ?? 'over';
    const disableClose = props.disableClose ?? false;
    const opened = props.opened ?? false;

    // Mirrors upstream `MatDrawer.toggle()`'s request path, flattened: this port's drawer is
    // fully controlled, so "closing" just means telling the consumer the new value — the visual
    // close happens once that round-trips back in as `opened={false}`.
    const requestClose$ = $(() => {
      if (!(props.opened ?? false)) return;
      props.onOpenedChange$?.(false);
    });

    // Registry sync — mirrors upstream's `@ContentChildren(MatDrawer) QueryList` iteration
    // (`MatDrawerContainer._validateDrawers()` / `_watchDrawerToggle()` / `updateContentMargins()`),
    // reframed as each drawer publishing its own slice of state into the container's registry
    // (see drawer-state.ts) rather than the container reaching into its children.
    useTask$(({track, cleanup}) => {
      const trackedPosition = track(() => position);
      const trackedMode = track(() => mode);
      const trackedOpened = track(() => opened);
      const trackedDisableClose = track(() => disableClose);
      const trackedWidth = track(() => widthPx.value);
      // Immutable reassignment, not a mutation — see drawer-state.ts's doc comment on
      // `registry` for why this is required for `MatDrawerContent` (a cross-`<Slot>` consumer)
      // to reactively pick up the change.
      containerState.registry.value = {
        ...containerState.registry.value,
        [id.value]: {
          position: trackedPosition,
          mode: trackedMode,
          opened: trackedOpened,
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

    // Settles an open/close transition: clears the transient animating class, fires the
    // opened-state outputs, and runs the matching focus side effect — mirrors upstream's
    // `_animationEnd`-driven `openedChange.emit()` subscription. Defined as a plain (non-`$()`)
    // closure, called via `setTimeout` from the reactive task below rather than from a real
    // `transitionend`/`transitioncancel` DOM listener — attaching `onTransitionEnd$`/
    // `onTransitionCancel$` to this component crashes Qwik's SSR container-pause serialization
    // step (`QError_verifySerializable`, Code(3)) in this project's pinned `@builder.io/qwik`
    // version, reproduced with a trivial no-op handler on both a static and a dynamically-typed
    // host tag, so it isn't specific to this component's logic or the `HostTag` pattern below —
    // empirically confirmed while porting this component, treated as an upstream Qwik
    // limitation rather than something to work around further. The timer uses the same fixed
    // 400ms duration the synced `drawer.scss` hardcodes for `.mat-drawer-transition &`'s
    // `transform` transition (never themeable upstream either), so it settles at the same wall
    // time a real `transitionend` would.
    const settleTransition = (isOpen: boolean) => {
      animating.value = false;
      props.onOpenedChange$?.(isOpen);
      const hostEl = hostRef.value;
      if (isOpen) {
        previouslyFocused.value = (document.activeElement as HTMLElement) ?? undefined;
        props.onOpened$?.();
        if (hostEl) {
          const autoFocus = props.autoFocus ?? (mode === 'side' ? 'dialog' : 'first-tabbable');
          applyDrawerAutoFocus(hostEl, autoFocus);
        }
      } else {
        props.onClosed$?.();
        const active = document.activeElement;
        if (hostEl && active && hostEl.contains(active)) {
          const target = previouslyFocused.value;
          if (target) {
            focusVia(target, 'program');
          } else {
            hostEl.blur();
          }
        }
        previouslyFocused.value = undefined;
      }
    };

    useTask$(({track}) => {
      const isOpen = track(() => opened);
      const isFirstRun = prevOpened.value === undefined;
      const wasOpen = prevOpened.value;
      prevOpened.value = isOpen;
      if (!isBrowser) return;
      if (!isFirstRun && isOpen === wasOpen) return;
      if (isFirstRun && !isOpen) return;

      if (isOpen) {
        props.onOpenedStart$?.();
      } else {
        props.onClosedStart$?.();
      }

      const transitionsOn = containerState.transitionsEnabled.value;
      if (transitionsOn && !isFirstRun) {
        animating.value = true;
        setTimeout(() => settleTransition(isOpen), DRAWER_TRANSITION_MS);
      } else {
        setTimeout(() => settleTransition(isOpen), 0);
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
        <div class="mat-drawer-inner-container">
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
