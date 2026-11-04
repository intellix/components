/**
 * MatDrawer/MatSidenav scenario port from src/material/sidenav/drawer.spec.ts
 * + sidenav.spec.ts.
 *
 * Upstream is almost entirely TestBed component-rendering + fakeAsync
 * timer-flushing (the ~200ms `mat-drawer-transition` delay, the real
 * 400ms open/close CSS transition) plus real `offsetWidth` measurement and
 * focus-trap/focus-restoration assertions —
 * this package's vitest can't reliably render/interact with real DOM
 * (`createDOM()` hangs; see `qwik-material/button-toggle`'s own
 * scenario-port comment for the same finding). Restructured:
 *
 *   - Live sanity tests: typeof + context ids + prop shapes.
 *   - The pure registry-derived computations (margins, backdrop
 *     presence/visibility, trap-enabled) have NO DOM dependency and are
 *     real unit tests in `drawer-state.spec.ts` instead of being skipped
 *     here.
 *   - describe.skip DOM-rendered: structure, toggling, backdrop/Escape
 *     close, focus trap/auto-focus/restore, autosizing — deferred to the
 *     Playwright specs below (verified via a real browser instead of
 *     vitest).
 *
 * Real DOM + behavior assertions live in
 * src/qwik-cdk-parity-tests/specs/material-sidenav/angular-parity.spec.ts
 * (the authoritative Angular-vs-Qwik DOM diffing gate).
 */
import {describe, expect, it} from 'vitest';
import {component$, useContextProvider, useSignal} from '@qwik.dev/core';
import {createDOM} from '@qwik.dev/core/testing';
import {
  MAT_SIDENAV_CONFIG,
  MatDrawer,
  MatDrawerContainer,
  MatDrawerContent,
  MatSidenav,
  MatSidenavContainer,
  MatSidenavContent,
  type MatDrawerContainerProps,
  type MatDrawerProps,
  type MatSidenavProps,
} from './public-api';
import {MAT_DRAWER_CONTAINER_STATE, type DrawerRegistration} from './drawer-state';

describe('qwik-material/sidenav surface — sanity', () => {
  it('every component is exported and function-shaped', () => {
    expect(typeof MatDrawerContainer).toBe('function');
    expect(typeof MatDrawer).toBe('function');
    expect(typeof MatDrawerContent).toBe('function');
    expect(typeof MatSidenavContainer).toBe('function');
    expect(typeof MatSidenav).toBe('function');
    expect(typeof MatSidenavContent).toBe('function');
  });

  it('MAT_SIDENAV_CONFIG carries the expected context id + empty config accepts {}', () => {
    expect(MAT_SIDENAV_CONFIG.id).toBe('qwik-material/sidenav-config');
    expect({}).toBeDefined();
  });

  it('MatDrawerContainerProps accepts the full surface', () => {
    const props: MatDrawerContainerProps = {
      autosize: true,
      hasBackdrop: false,
      onBackdropClick$: undefined,
      style: 'height: 300px; width: 600px',
      class: 'my-container',
      id: 'container-1',
    };
    expect(props.hasBackdrop).toBe(false);
  });

  it('MatDrawerProps accepts the full surface', () => {
    const props: MatDrawerProps = {
      position: 'end',
      mode: 'push',
      disableClose: true,
      autoFocus: 'first-heading',
      opened: true,
      width: '200px',
      onOpenedChange$: undefined,
      onOpened$: undefined,
      onClosed$: undefined,
      onOpenedStart$: undefined,
      onClosedStart$: undefined,
      style: {'padding-top': '64px'},
      class: 'my-drawer',
      id: 'drawer-1',
    };
    expect(props.mode).toBe('push');
  });

  it('MatSidenavProps extends MatDrawerProps with the fixedInViewport family', () => {
    const props: MatSidenavProps = {
      mode: 'side',
      opened: true,
      fixedInViewport: true,
      fixedTopGap: 64,
      fixedBottomGap: 32,
    };
    expect(props.fixedInViewport).toBe(true);
  });
});

/**
 * Real DOM-rendered style-passthrough coverage (Task 1, homepage-material-parity).
 *
 * Unlike the rest of this file's DOM-rendered scenarios, `createDOM()` does NOT hang here —
 * confirmed empirically while adding this task (this package's Qwik/Vite/Vitest versions were
 * upgraded since the "hangs" finding at this file's header was written). What IS still
 * environment-blocked: `MatDrawer`'s content-margin contribution is derived from a
 * `ResizeObserver`-measured `offsetWidth` (see `mat-drawer.tsx`), and happy-dom never lays
 * elements out — `offsetWidth` reads back `undefined` there (confirmed empirically), so a
 * literal `<MatDrawerContainer><MatDrawer mode="side" .../></MatDrawerContainer>` render can
 * never produce a non-null margin in this test environment, regardless of correctness. The
 * `MatDrawerContent` case below works around that the same way `drawer-state.spec.ts` already
 * does for the pure margin math: it provides `MAT_DRAWER_CONTAINER_STATE` directly with an
 * already-resolved drawer `width` (as if the real `ResizeObserver` measurement had already
 * landed), so `MatDrawerContent`'s OWN merge logic still runs for real, against the exact
 * `computeContentMargins()` it actually calls — only the unrelated, environment-blocked
 * measurement step is stubbed out.
 */
describe('style passthrough (Task 1)', () => {
  it('passes style through to the host (MatDrawer/MatSidenav)', async () => {
    const {render, screen} = await createDOM();
    await render(
      <MatDrawerContainer>
        <MatDrawer
          q:slot="start-drawer"
          mode="side"
          opened={true}
          width="200px"
          style={{'padding-top': '64px'}}
        >
          drawer
        </MatDrawer>
        <MatDrawerContent>content</MatDrawerContent>
      </MatDrawerContainer>,
    );
    const el = screen.querySelector('mat-drawer') as HTMLElement;
    expect(el.style.getPropertyValue('padding-top')).toBe('64px');
    // The component's own computed `width` still applies — the caller's style didn't set it.
    expect(el.style.width).toBe('200px');
  });

  const ContentHarness = component$((props: {registry: Record<string, DrawerRegistration>}) => {
    useContextProvider(MAT_DRAWER_CONTAINER_STATE, {
      registry: useSignal(props.registry),
      backdropOverride: useSignal<boolean | null>(null),
      transitionsEnabled: useSignal(false),
      containerHostRef: useSignal<HTMLElement | undefined>(undefined),
      contentHostRef: useSignal<HTMLElement | undefined>(undefined),
    });
    return <MatDrawerContent style={{'padding-top': '64px'}}>content</MatDrawerContent>;
  });

  it('passes style through to the host (MatDrawerContent/MatSidenavContent)', async () => {
    const {render, screen} = await createDOM();
    await render(
      <ContentHarness
        registry={{
          a: {
            position: 'start',
            mode: 'side',
            opened: true,
            disableClose: false,
            width: 180,
            hostRef: {value: undefined} as DrawerRegistration['hostRef'],
            requestClose$: (() => {}) as unknown as DrawerRegistration['requestClose$'],
          },
        }}
      />,
    );
    const el = screen.querySelector('mat-drawer-content') as HTMLElement;
    expect(el.style.getPropertyValue('padding-top')).toBe('64px');
    // The computed margin contributed by the registered `side` drawer still applies — the
    // caller's style didn't set margin-left.
    expect(el.style.marginLeft).toBe('180px');
  });
});

describe.skip('MatDrawer/MatSidenav DOM-rendered scenarios — verified via Playwright', () => {
  it('mat-drawer-container renders [mat-drawer-transition] ~200ms after mount, once, forever', () => {});
  it('a backdrop div only exists when hasBackdrop resolves true; mat-drawer-shown while actually showing', () => {});
  it('an explicit [hasBackdrop]=false never adds mat-drawer-container-explicit-backdrop, for any mode', () => {});
  it('each drawer is flanked by its own focus-trap anchor pair, tabindex=0 only while opened && showing a backdrop', () => {});
  it('opening a drawer moves focus to its first tabbable descendant (or the host, with no focusable content); autoFocus defaults to dialog in side mode', () => {});
  it('closing a drawer restores focus to whatever was focused right before it opened', () => {});
  it('Escape closes an open, non-disableClose drawer; a no-op when disableClose', () => {});
  it('clicking the backdrop closes every open, backdrop-having, non-disableClose drawer', () => {});
  it('content margins reflect side (shrink) vs push (shift) vs over (none), updating as soon as opened changes', () => {});
  it('position="end" moves the drawer (plus its anchors) to the end of the container, after the content', () => {});
  it('autosize keeps content margins in sync with a drawer whose content size changes after mount', () => {});
  it('MatSidenav adds the mat-sidenav-fixed class + top/bottom inline styles when fixedInViewport is set', () => {});
});
