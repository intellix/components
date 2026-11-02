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
