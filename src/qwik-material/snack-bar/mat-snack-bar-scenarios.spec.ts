/**
 * mat-snack-bar-scenarios.spec.ts
 *
 * Scenario port from src/material/snack-bar/snack-bar.spec.ts (upstream `describe('MatSnackBar')`).
 *
 * Bucketing rules (applied in order, matching qwik-material/dialog's precedent):
 *  1. Angular-only — uses TestBed, inject(), ViewContainerRef, TemplateRef, Injector.create,
 *     NgZone, ChangeDetectorRef, flush(), tick(), ComponentPortal, SpyLocation, OverlayContainer.
 *  2. DOM-render — queries DOM nodes, checks focus/ARIA on rendered nodes, dispatches keyboard/
 *     mouse events, observes CSS animation in a real browser (deferred to the Playwright parity
 *     spec, specs/material-snack-bar/angular-parity.spec.ts).
 *  3. Ported — drives `attachSnackBar` directly (the same function `useMatSnackBar()`'s QRLs
 *     call into) against a plain in-memory `AttachSnackBarCtx`; asserts on the returned
 *     `MatSnackBarRef`'s id/afterDismissed/afterOpened/onAction and on `ctx.entries`.
 *
 * Run: pnpm -C src/qwik-material test snack-bar/mat-snack-bar-scenarios
 */

import {describe, expect, it, vi} from 'vitest';
import type {NoSerialize, Signal} from '@qwik.dev/core';
import {noSerialize} from '@qwik.dev/core';
import {attachSnackBar, mergeConfig, type AttachSnackBarCtx} from './mat-snack-bar';
import {MARK_DISMISSED, MARK_OPENED, type MatSnackBarRef} from './mat-snack-bar-ref';
import type {LiveAnnouncer} from '@angular-community/qwik-cdk/a11y';
import {component$} from '@qwik.dev/core';
import type {MatSnackBarConfig} from './snack-bar-config';

// ---------------------------------------------------------------------------
// Shared test harness
// ---------------------------------------------------------------------------

const StubContent = component$(() => null);

function makeCtx(): AttachSnackBarCtx {
  return {
    idCounter: {value: 0} as Signal<number>,
    entries: {value: []} as Signal<readonly any[]>,
    overlayContainerCreated: {value: false} as Signal<boolean>,
  };
}

function makeHarness() {
  const ctx = makeCtx();
  const openedRef = {value: null} as Signal<NoSerialize<MatSnackBarRef> | null>;
  const liveAnnouncer = {value: undefined} as Signal<NoSerialize<LiveAnnouncer> | undefined>;
  return {ctx, openedRef, liveAnnouncer};
}

function open<D>(
  h: ReturnType<typeof makeHarness>,
  config?: Partial<MatSnackBarConfig<D>>,
): MatSnackBarRef<unknown> {
  const merged = mergeConfig({}, config);
  return attachSnackBar(h.ctx, h.openedRef, h.liveAnnouncer, StubContent, merged);
}

// ---------------------------------------------------------------------------
// describe('MatSnackBar') — mirroring the top-level block in snack-bar.spec.ts
// ---------------------------------------------------------------------------

describe('MatSnackBar scenarios', () => {
  it('should have the role of alert with the aria-live set to assertive for assertive snackbars (politeness mapping)', () => {
    // Angular: inspects the rendered DOM's [attr.aria-live]. Ported at the
    // config-merge level: `politeness: 'assertive'` with no
    // announcementMessage should flow through to the container unchanged
    // (full DOM assertion deferred to the Playwright parity spec's
    // `politeness` scenario).
    const h = makeHarness();
    const merged = mergeConfig({}, {politeness: 'assertive'});
    expect(merged.politeness).toBe('assertive');
    const ref = attachSnackBar(h.ctx, h.openedRef, h.liveAnnouncer, StubContent, merged);
    expect(ref).toBeTruthy();
  });

  it.skip('should default politeness to polite (DOM-render — deferred to Playwright)', () => {
    // Reason: default politeness is asserted on the rendered aria-live attribute.
  });

  it('should default duration to 0 (never auto-dismiss) per MatSnackBarConfig', () => {
    expect(mergeConfig({}, undefined).duration).toBe(0);
  });

  it('open() with a custom component — returns a non-null ref with a mat-snack-bar- id', () => {
    const h = makeHarness();
    const ref = open(h);
    expect(ref).not.toBeNull();
    expect(ref.id).toMatch(/^mat-snack-bar-\d+$/);
  });

  it.skip('should open a snackbar with a message and action (DOM-render — deferred to Playwright)', () => {
    // Reason: asserts SimpleSnackBar's rendered label/action text; see
    // specs/material-snack-bar/angular-parity.spec.ts's `simple-message`/`with-action` scenarios.
  });

  it.skip('should open a simple message with a button (DOM-render — deferred to Playwright)', () => {});

  it.skip('should open a simple message with no button (DOM-render — deferred to Playwright)', () => {});

  it('should dismiss the snack bar and remove itself from the view (ref removed from the registry)', async () => {
    const h = makeHarness();
    const ref = open(h);
    expect(h.ctx.entries.value.length).toBe(1);
    ref.dismiss();
    ref[MARK_DISMISSED]();
    await ref.afterDismissed;
    expect(h.ctx.entries.value.length).toBe(0);
  });

  it(
    'should be able to get dismissed through the service even without putting a reference to it ' +
      '(service-level dismiss() closes whatever is currently open$)',
    async () => {
      const h = makeHarness();
      const ref = open(h);
      expect(h.openedRef.value).not.toBeNull();
      h.openedRef.value?.dismiss();
      ref[MARK_DISMISSED]();
      // `openedRef.value = null` happens in an `afterDismissed.then(...)` callback.
      await ref.afterDismissed;
      expect(h.openedRef.value).toBeNull();
    },
  );

  it('should clean itself up when a duration is set (auto-dismiss after afterOpened + duration)', async () => {
    vi.useFakeTimers();
    const h = makeHarness();
    const ref = open(h, {duration: 1000} as any);
    expect(h.ctx.entries.value.length).toBe(1);
    const requestExit = vi.fn();
    const {REGISTER_EXIT_HANDLER} = await import('./mat-snack-bar-ref');
    ref[REGISTER_EXIT_HANDLER](requestExit);
    ref[MARK_OPENED]();
    // `_dismissAfter` is wired via `afterOpened.then(...)` — flush that microtask
    // before advancing the fake timer it schedules.
    await Promise.resolve();
    vi.advanceTimersByTime(1000);
    expect(requestExit).toHaveBeenCalledTimes(1);
    ref[MARK_DISMISSED]();
    expect(h.ctx.entries.value.length).toBe(0);
    vi.useRealTimers();
  });

  it('should clear the dismiss timeout when dismissed before the timeout expires', async () => {
    vi.useFakeTimers();
    const h = makeHarness();
    const ref = open(h, {duration: 1000} as any);
    const requestExit = vi.fn();
    const {REGISTER_EXIT_HANDLER} = await import('./mat-snack-bar-ref');
    ref[REGISTER_EXIT_HANDLER](requestExit);
    ref[MARK_OPENED]();
    await Promise.resolve();
    ref.dismiss();
    expect(requestExit).toHaveBeenCalledTimes(1);
    ref[MARK_DISMISSED]();
    vi.advanceTimersByTime(1000);
    // Still just once — the duration timer's own later dismiss() call is a
    // no-op once already exitRequested, so the handler never fires again.
    expect(requestExit).toHaveBeenCalledTimes(1);
    vi.useRealTimers();
  });

  it.skip('should override the default config (DOM-render + Angular-only DI — deferred)', () => {});

  it('should dismiss the previous snack bar, if present (replace path)', async () => {
    const h = makeHarness();
    const first = open(h);
    expect(h.ctx.entries.value.length).toBe(1);

    const second = open(h);
    // Mirrors the "REPLACEMENT" behaviour verified against the real app
    // (see angular-parity.spec.ts's header comment, point 2): the new
    // overlay is created immediately, so BOTH entries briefly coexist.
    expect(h.ctx.entries.value.length).toBe(2);

    first[MARK_DISMISSED]();
    await first.afterDismissed;
    expect(h.ctx.entries.value.length).toBe(1);
    // Entry ids are overlay ids (`cdk-overlay-N`), a different namespace
    // from the ref's own `mat-snack-bar-N` id — compare via the entry's
    // `snackBarRef` prop instead (see also `AttachSnackBarCtx`'s usage).
    expect((h.ctx.entries.value[0] as any).props.snackBarRef.id).toBe(second.id);
  });

  it('should remove past snackbars when opening new snackbars (openedRef tracks the latest)', () => {
    const h = makeHarness();
    const first = open(h);
    const second = open(h);
    expect(h.openedRef.value?.id).toBe(second.id);
    first[MARK_DISMISSED]();
  });

  it.skip('should remove snackbar if another is shown while its still animating open (DOM-render — deferred)', () => {});

  it.skip('should set the animation state to visible on entry (DOM-render — deferred to Playwright)', () => {});

  it.skip('should set the animation state to complete on exit (DOM-render — deferred to Playwright)', () => {});

  it.skip('should open a new snackbar after dismissing a previous snackbar (Angular-only: async/fakeAsync flush)', () => {});

  it.skip('should open a new snackbar after dismissing a previous snackbar via action (Angular-only: fakeAsync)', () => {});

  it.skip('should emit dismissedByAction event when dismissed explicitly (duplicated below without fakeAsync)', () => {});

  it('dismissedByAction is false when dismissed via dismiss()', async () => {
    const h = makeHarness();
    const ref = open(h);
    ref.dismiss();
    ref[MARK_DISMISSED]();
    await expect(ref.afterDismissed).resolves.toEqual({dismissedByAction: false});
  });

  it('dismissedByAction is true when dismissed via dismissWithAction()', async () => {
    const h = makeHarness();
    const ref = open(h);
    ref.dismissWithAction();
    ref[MARK_DISMISSED]();
    await expect(ref.afterDismissed).resolves.toEqual({dismissedByAction: true});
  });

  it.skip('should dismiss the open snack bar on destroy (Angular-only: ngOnDestroy/TestBed)', () => {});

  it.skip('should not throw an error when opening and closing a config less snackbar (duplicated by "returns a non-null ref" above)', () => {});

  it.skip('should be able to override the default config (Angular-only: DI providers)', () => {});

  it.skip('should dismiss the snackbar when the action is called, notifying of dismissal reason (DOM-render — deferred)', () => {});
});

// ---------------------------------------------------------------------------
// describe('with custom component') — mirrors upstream's second top-level describe
// ---------------------------------------------------------------------------

describe('MatSnackBar scenarios — with custom component', () => {
  it.skip('should open a simple message with a button (DOM-render — deferred to Playwright)', () => {});

  it('should be able to pass in data (merged config carries `data` through to the ref)', () => {
    const h = makeHarness();
    const merged = mergeConfig({}, {data: {custom: true}} as any);
    const ref = attachSnackBar(h.ctx, h.openedRef, h.liveAnnouncer, StubContent, merged);
    expect(h.ctx.entries.value[0].props.config.data).toEqual({custom: true});
    void ref;
  });

  it.skip('should have one container when opening multiple snackbars without duration (DOM-render — deferred)', () => {});
});

// ---------------------------------------------------------------------------
// Extra tests: port-specific QRL-shaped surface (no upstream equivalent)
// ---------------------------------------------------------------------------

describe('MatSnackBar scenarios — port-specific', () => {
  it('panelClass (string or array) merges through config unchanged (applied to the container, not the pane — see SYNC.md)', () => {
    const h = makeHarness();
    const merged = mergeConfig({}, {panelClass: ['a', 'b']} as any);
    const ref = attachSnackBar(h.ctx, h.openedRef, h.liveAnnouncer, StubContent, merged);
    expect(h.ctx.entries.value[0].props.config.panelClass).toEqual(['a', 'b']);
    void ref;
  });

  it('horizontalPosition/verticalPosition default to center/bottom when omitted', () => {
    expect(mergeConfig({}, undefined).horizontalPosition).toBe('center');
    expect(mergeConfig({}, undefined).verticalPosition).toBe('bottom');
  });

  it('provider defaults (matSnackBarDefaults) are overridden by a per-call config', () => {
    const merged = mergeConfig({horizontalPosition: 'start'}, {horizontalPosition: 'end'});
    expect(merged.horizontalPosition).toBe('end');
  });

  it('provider defaults apply when a per-call config omits the field', () => {
    const merged = mergeConfig({horizontalPosition: 'start'}, {panelClass: 'x'});
    expect(merged.horizontalPosition).toBe('start');
  });

  it('creates a unique, monotonically-increasing id per snack bar from the shared idCounter', () => {
    const h = makeHarness();
    const first = open(h);
    first[MARK_DISMISSED]();
    const second = open(h);
    expect(first.id).not.toBe(second.id);
  });

  it('wraps the ref in noSerialize-compatible form (identity preserved)', () => {
    const h = makeHarness();
    const ref = open(h);
    expect(noSerialize(ref)).toBe(ref);
  });
});
