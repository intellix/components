import {$, useSignal, type QRL, type Signal} from '@qwik.dev/core';

/**
 * Mirrors upstream's `MatDrawerToggleResult` (`src/material/sidenav/drawer.ts`) — the value
 * `MatDrawer.open()`/`.close()`/`.toggle()` resolve their returned `Promise` with.
 */
export type MatDrawerToggleResult = 'open' | 'close';

/**
 * Imperative handle for one `<MatDrawer>`/`<MatSidenav>` — the Qwik-idiomatic replacement for
 * upstream's template-ref-exposed `open()`/`close()`/`toggle()` instance methods (no `exportAs`
 * equivalent exists; see `mat-drawer.tsx`'s own doc comment). Built on TOP of the existing
 * controlled `opened`/`onOpenedChange$` API — see `useMatDrawerRef()`'s doc comment — so it
 * coexists with that prop with ZERO changes to `<MatDrawer>`/`<MatSidenav>` themselves: a
 * consumer that doesn't need the imperative surface keeps writing `opened={...}
 * onOpenedChange$={...}` exactly as before.
 *
 * Same architectural precedent as `qwik-material/timepicker`'s `useMatTimepicker()` (a hook
 * called ONCE by the consumer, in THEIR OWN render, returning a plain bag of `Signal`s/`QRL`s
 * that's then threaded down as an ordinary prop) and `qwik-material/dialog`'s `useMatDialog()`
 * (a hook returning `QRL`-typed imperative methods usable from anywhere the returned object is
 * held) — not a NEW pattern invented for sidenav.
 */
export interface MatDrawerRef {
  /** Live desired-opened signal. Wire directly: `<MatDrawer opened={ref.opened.value}>`. */
  opened: Signal<boolean>;
  /**
   * Wire directly: `<MatDrawer onOpenedChange$={ref.onOpenedChange$}>`. Settles whichever
   * `open$()`/`close$()`/`toggle$()` call is currently pending and mirrors the new value into
   * `opened` (so the signal stays correct even if the drawer's close was triggered some OTHER
   * way — Escape, backdrop click, `disableClose` — not just through this handle). If the hook
   * was given its own `onOpenedChange$` (see `UseMatDrawerRefOptions`), that is invoked too,
   * after the handle's own bookkeeping — so a consumer who ALSO wants to observe every settle
   * can still do so.
   */
  onOpenedChange$: QRL<(opened: boolean) => void>;
  /** Opens the drawer. Resolves once the open has settled (or immediately, if already open) —
   *  mirrors upstream's `MatDrawer.open()`. */
  open$: QRL<() => Promise<MatDrawerToggleResult>>;
  /** Closes the drawer. Resolves once the close has settled (or immediately, if already
   *  closed) — mirrors upstream's `MatDrawer.close()`. */
  close$: QRL<() => Promise<MatDrawerToggleResult>>;
  /** Toggles the drawer, or forces it to `isOpen` when given. Mirrors upstream's
   *  `MatDrawer.toggle(isOpen?)`. */
  toggle$: QRL<(isOpen?: boolean) => Promise<MatDrawerToggleResult>>;
}

export interface UseMatDrawerRefOptions {
  /** Initial opened state. Default false. */
  opened?: boolean;
  /** Forwarded from `onOpenedChange$` above, after the handle's own bookkeeping runs — same
   *  settle-timing contract as `MatDrawerProps.onOpenedChange$`. */
  onOpenedChange$?: QRL<(opened: boolean) => void>;
}

/**
 * Creates an imperative handle for one `<MatDrawer>`/`<MatSidenav>`. Usable from anywhere the
 * returned object is held (a toolbar button elsewhere in the page, a layout service/store) —
 * not just from inside the drawer's own subtree — because it's plain data (`Signal`s + `QRL`s),
 * not a context value or component ref.
 *
 * ```tsx
 * const drawerRef = useMatDrawerRef();
 *
 * <MatDrawerContainer>
 *   <MatDrawer opened={drawerRef.opened.value} onOpenedChange$={drawerRef.onOpenedChange$}>
 *     ...
 *   </MatDrawer>
 *   <MatDrawerContent>
 *     <button onClick$={() => drawerRef.toggle$()}>Toggle</button>
 *   </MatDrawerContent>
 * </MatDrawerContainer>
 * ```
 *
 * `open$()`/`close$()`/`toggle$()` set `opened` immediately (triggering `<MatDrawer>`'s own
 * transition, exactly as a direct `opened` prop write would) and resolve once the NEXT
 * `onOpenedChange$` settle notification arrives — mirrors upstream's `_setOpen()`, whose
 * returned Promise resolves off the next `openedChange` emission (`take(1)`), not a check that
 * the settled value specifically matches what was requested. A call made while the drawer is
 * ALREADY at the requested state resolves immediately with no transition, matching upstream's
 * `_setOpen()` early return (`isOpen === this.opened`).
 */
export function useMatDrawerRef(options: UseMatDrawerRefOptions = {}): MatDrawerRef {
  const opened = useSignal(options.opened ?? false);
  // Bumped by `onOpenedChange$` on every settle; polled by `waitForNextSettle` below. Avoids
  // needing a `NoSerialize` resolver registry for what is, in practice, always a client-only
  // call (open$/close$/toggle$ only ever get invoked from a post-resume event handler).
  const settleSeq = useSignal(0);
  const settledOpened = useSignal(options.opened ?? false);

  const onOpenedChange$ = $((next: boolean) => {
    settledOpened.value = next;
    settleSeq.value++;
    opened.value = next;
    options.onOpenedChange$?.(next);
  });

  const waitForNextSettle$ = $(async (): Promise<MatDrawerToggleResult> => {
    const seqAtCall = settleSeq.value;
    await new Promise<void>(resolve => {
      const poll = () => {
        if (settleSeq.value !== seqAtCall) resolve();
        else setTimeout(poll, 16);
      };
      poll();
    });
    return settledOpened.value ? 'open' : 'close';
  });

  const toggle$ = $(async (isOpen?: boolean): Promise<MatDrawerToggleResult> => {
    const target = isOpen ?? !opened.value;
    if (target === opened.value) {
      return target ? 'open' : 'close';
    }
    opened.value = target;
    return waitForNextSettle$();
  });

  const open$ = $((): Promise<MatDrawerToggleResult> => toggle$(true));
  const close$ = $((): Promise<MatDrawerToggleResult> => toggle$(false));

  return {opened, onOpenedChange$, open$, close$, toggle$};
}
