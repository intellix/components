import {
  $,
  component$,
  noSerialize,
  useContext,
  useSignal,
  type Component,
  type NoSerialize,
  type QRL,
  type Signal,
} from '@builder.io/qwik';
import {QWIK_CDK} from '@angular-community/qwik-cdk';
import {
  createOverlayService,
  createGlobalPositionStrategy,
  type GlobalPositionStrategy,
  type OverlayRef,
  type OverlayRegistry,
} from '@angular-community/qwik-cdk/overlay';
import {
  createLiveAnnouncer,
  type IdGenerator,
  type LiveAnnouncer,
} from '@angular-community/qwik-cdk/a11y';
import {createMatSnackBarConfig, type MatSnackBarConfig} from './snack-bar-config';
import {MAT_SNACK_BAR_DEFAULT_OPTIONS} from './mat-snack-bar-tokens';
import {createMatSnackBarRef, type MatSnackBarRef} from './mat-snack-bar-ref';
import {MatSnackBarContainer} from './mat-snack-bar-container';
import {SimpleSnackBar, type TextOnlySnackBarData} from './simple-snack-bar';

/**
 * Internal wrapper component the service opens via the cdk overlay. Mirrors
 * `qwik-material/dialog`'s `MatDialogWrapper` — composes the container with
 * the consumer's (or `SimpleSnackBar`'s) content as its child.
 */
const MatSnackBarWrapper = component$<{
  config: Partial<MatSnackBarConfig>;
  ContentComponent: Component<any>;
  contentProps: Record<string, unknown>;
  snackBarRef: NoSerialize<MatSnackBarRef> | undefined;
}>(({config, ContentComponent, contentProps, snackBarRef}) => {
  return (
    <MatSnackBarContainer config={config} snackBarRef={snackBarRef}>
      <ContentComponent {...(contentProps as any)} />
    </MatSnackBarContainer>
  );
});

/**
 * Consumer-facing service for dispatching Material snack bar messages.
 *
 * Deviations from upstream `MatSnackBar` (see SYNC.md):
 * - No parent/child injector hierarchy (`inject(MatSnackBar, {skipSelf: true})`)
 *   — "only one snack bar visible at a time" is tracked per `useMatSnackBar()`
 *   call, not as a true app-wide singleton. Every one of this port's
 *   scenarios calls `useMatSnackBar()` once per route and drives every
 *   trigger off the same returned object, which is sufficient for that
 *   invariant; a real multi-component app wanting the exact upstream
 *   singleton semantics would need to share one `useMatSnackBar()` call
 *   (e.g. via context) across components, same as it would share one
 *   `MatSnackBar` instance via DI.
 * - `openFromTemplate$` accepts a Qwik `Component` (no `TemplateRef` in
 *   Qwik) — identical mechanism to `openFromComponent$`. The DOM
 *   difference upstream's `TemplatePortal` produces (no wrapping host
 *   element, vs. `ComponentPortal`'s implicit host) is entirely a function
 *   of what the content component itself renders, not of this method — see
 *   the `from-template` dev-app scenario, whose content component renders
 *   bare text with no host tag at all.
 * - `MatSnackBarRef.instance` stays `null` — no `ComponentRef` to read a
 *   live instance from (same already-accepted deviation as
 *   `MatDialogRef.componentInstance`).
 * - `open$`/`openFromComponent$`/`openFromTemplate$` each independently
 *   inline the full "attach" sequence rather than sharing one `$()`
 *   helper QRL that all three call into. An earlier version of this port
 *   shared one — correct, but each `$()` boundary resolves via at least
 *   one microtask (dynamic `import()`, even for an already-loaded chunk),
 *   so chaining `onClick$` → `open$` → the shared `attach$` pushed the
 *   real DOM mutations (dismissing the previous snack bar, creating the
 *   new one) out past the parity spec's `waitSettled()` helper's very
 *   first poll, which would then see the *previous*, untouched, already-
 *   settled state and conclude the page had already settled before the
 *   replace even started (see `horizontal-position`/`vertical-position`/
 *   `politeness`, the three scenarios that click through a replace). A
 *   plain (non-`$()`) shared helper function doesn't work either — Qwik's
 *   optimizer can't handle one being referenced from three separate `$()`
 *   scopes (same family of issue as the one documented on
 *   `qwik-cdk/overlay/overlay-host.tsx`'s `OverlayHost`). Duplication is
 *   the correctness-first tradeoff.
 */
export interface MatSnackBar {
  /** Opens a snack bar with a message and an optional action. */
  open$: QRL<
    (
      message: string,
      action?: string,
      config?: MatSnackBarConfig,
    ) => NoSerialize<MatSnackBarRef<TextOnlySnackBarData>> | null
  >;
  /** Opens a snack bar with a custom Qwik component for the content. */
  openFromComponent$: QRL<
    <C, D = unknown>(
      component: Component<any>,
      config?: MatSnackBarConfig<D>,
    ) => NoSerialize<MatSnackBarRef<C>> | null
  >;
  /** See the `openFromTemplate$` deviation note above. */
  openFromTemplate$: QRL<
    <C, D = unknown>(
      component: Component<any>,
      config?: MatSnackBarConfig<D>,
    ) => NoSerialize<MatSnackBarRef<C>> | null
  >;
  /** Dismisses the currently-visible snack bar, if any. */
  dismiss$: QRL<() => void>;
}

export function useMatSnackBar(): MatSnackBar {
  const ctx = useContext(QWIK_CDK);
  const defaults = useContext(MAT_SNACK_BAR_DEFAULT_OPTIONS, {} as Partial<MatSnackBarConfig>);

  /** The currently-open snack bar at this `useMatSnackBar()` call — see the class deviation note. */
  const openedRef = useSignal<NoSerialize<MatSnackBarRef> | null>(null);
  /** Lazily created on first `announce()`-needing open — see `createLiveAnnouncer`'s doc comment. */
  const liveAnnouncer = useSignal<NoSerialize<LiveAnnouncer>>();

  const open$ = $(
    (
      message: string,
      action: string = '',
      config?: MatSnackBarConfig,
    ): NoSerialize<MatSnackBarRef<TextOnlySnackBarData>> | null => {
      const _config = {...defaults, ...config} as MatSnackBarConfig<TextOnlySnackBarData>;
      _config.data = {message, action};
      // Since the snack bar has `role="alert"`-equivalent live behaviour, don't announce twice.
      if (_config.announcementMessage === message) {
        _config.announcementMessage = undefined;
      }

      if (typeof document === 'undefined') return noSerialize(ssrNoOpRef()) as any;

      const merged = mergeConfig(defaults, _config);
      return noSerialize(
        attachSnackBar(ctx, openedRef, liveAnnouncer, SimpleSnackBar, merged),
      ) as unknown as NoSerialize<MatSnackBarRef<TextOnlySnackBarData>>;
    },
  );

  const openFromComponent$ = $(
    <C, D>(
      component: Component<any>,
      config?: MatSnackBarConfig<D>,
    ): NoSerialize<MatSnackBarRef<C>> | null => {
      if (typeof document === 'undefined') return noSerialize(ssrNoOpRef()) as any;
      const merged = mergeConfig(defaults, config);
      return noSerialize(attachSnackBar(ctx, openedRef, liveAnnouncer, component, merged)) as any;
    },
  );

  const openFromTemplate$ = $(
    <C, D>(
      component: Component<any>,
      config?: MatSnackBarConfig<D>,
    ): NoSerialize<MatSnackBarRef<C>> | null => {
      if (typeof document === 'undefined') return noSerialize(ssrNoOpRef()) as any;
      const merged = mergeConfig(defaults, config);
      return noSerialize(attachSnackBar(ctx, openedRef, liveAnnouncer, component, merged)) as any;
    },
  );

  const dismiss$ = $(() => {
    openedRef.value?.dismiss();
  });

  return {open$, openFromComponent$, openFromTemplate$, dismiss$};
}

// ---------------------------------------------------------------------------
// Module-level helpers. Deliberately NOT closures over `useMatSnackBar()`'s
// hook-local signals (ctx/openedRef/liveAnnouncer are passed in explicitly)
// so each can be called from any of the three `$()` scopes above without
// tripping the optimizer issue described in `useMatSnackBar()`'s doc
// comment. `attachSnackBar` is still only invoked from inside an already-
// resolved `$()` callback body (never itself `$()`-wrapped), so calling it
// doesn't add another lazy-load hop.
// ---------------------------------------------------------------------------

/**
 * Exported for the vitest harness only (see mat-snack-bar-scenarios.spec.ts)
 * — not part of the consumer API, which is `useMatSnackBar()`.
 */
export interface AttachSnackBarCtx {
  idCounter: Signal<number>;
  entries: Signal<readonly any[]>;
  overlayContainerCreated: Signal<boolean>;
}

/** Mirrors upstream's `{...new MatSnackBarConfig(), ...this._defaultConfig, ...userConfig}`. */
export function mergeConfig<D>(
  defaults: Partial<MatSnackBarConfig>,
  userConfig: Partial<MatSnackBarConfig<D>> | undefined,
): MatSnackBarConfig<D> {
  return {
    ...createMatSnackBarConfig<D>(),
    ...defaults,
    ...userConfig,
  } as MatSnackBarConfig<D>;
}

/** Pre-dismissed SSR no-op ref so awaiters don't hang. */
function ssrNoOpRef(): MatSnackBarRef<unknown> {
  const instance = {value: null} as Signal<unknown>;
  return createMatSnackBarRef<unknown>({
    id: 'mat-snack-bar-ssr-noop',
    instance,
    dispose() {},
    closed: true,
  });
}

/**
 * The shared "attach" sequence every `open*` method needs: mirrors upstream
 * `MatSnackBar._attach()` + `_createOverlay()` + `_animateSnackBar()`. Takes
 * every piece of hook state it needs as an explicit argument (see the file-
 * level comment above for why).
 */
export function attachSnackBar<D>(
  ctx: AttachSnackBarCtx,
  openedRef: Signal<NoSerialize<MatSnackBarRef> | null>,
  liveAnnouncer: Signal<NoSerialize<LiveAnnouncer> | undefined>,
  content: Component<any>,
  merged: MatSnackBarConfig<D>,
): MatSnackBarRef<unknown> {
  const idGen = makeCtxIdGen(ctx.idCounter);
  const registry = makeCtxRegistry(ctx.entries, ctx.overlayContainerCreated);
  const overlay = createOverlayService(registry, idGen);

  // Mirrors upstream `MatSnackBar._createOverlay()`'s horizontal/vertical
  // position mapping exactly (see angular-parity.spec.ts's "OVERLAY
  // POSITIONING" header note for the LTR collapse table this produces).
  const isRtl = merged.direction === 'rtl';
  const isLeft =
    merged.horizontalPosition === 'left' ||
    (merged.horizontalPosition === 'start' && !isRtl) ||
    (merged.horizontalPosition === 'end' && isRtl);
  const isRight = !isLeft && merged.horizontalPosition !== 'center';
  const positionStrategy: GlobalPositionStrategy = createGlobalPositionStrategy();
  if (isLeft) {
    positionStrategy.left('0');
  } else if (isRight) {
    positionStrategy.right('0');
  } else {
    positionStrategy.centerHorizontally();
  }
  if (merged.verticalPosition === 'top') {
    positionStrategy.top('0');
  } else {
    positionStrategy.bottom('0');
  }

  const id = idGen.getId('mat-snack-bar-');
  const instance = {value: null} as Signal<unknown>;
  let overlayRef: OverlayRef | null = null;
  const ref = createMatSnackBarRef<unknown>({
    id,
    instance,
    dispose() {
      overlayRef?.dispose();
    },
  });

  // Mirrors upstream `_attachSnackBarContainer` + `overlayRef.attach(...)`:
  // creates (and immediately enters) the overlay + container NOW,
  // regardless of whether a previous snack bar is still open/exiting.
  // Upstream's `_attach()` ALSO attaches the new container before
  // `_animateSnackBar()` even looks at whether to dismiss a previous one
  // — `_attachSnackBarContainer` runs before `_animateSnackBar`, so both
  // containers really do briefly coexist (old exiting, new entering)
  // within the same synchronous tick, before either side's own exit/enter
  // CSS animation has had a chance to run a single frame.
  // `_animateSnackBar` only *defers the new one's `enter()` call* when a
  // previous ref exists, but that deferred call fires synchronously off
  // the old ref's `afterDismissed` (an RxJS Subject, delivered
  // synchronously to subscribers) the instant the old one finishes
  // disposing — i.e. still within one synchronous flush, not a
  // separately-observable delay. Deferring the WHOLE creation here (an
  // earlier version of this port did) is observably different: it leaves
  // a window where only the old (now-exiting) container exists, which a
  // polling check like the parity spec's `waitSettled()` (exactly one
  // container, no `[aria-hidden]` left) can mistake for "already settled"
  // well before the replace actually finishes. Creating both immediately
  // avoids that window.
  overlayRef = overlay.create(
    MatSnackBarWrapper as Component<any>,
    {
      config: {...merged},
      ContentComponent: content,
      contentProps: {},
      snackBarRef: noSerialize(ref),
    },
    {
      direction: merged.direction,
      positionStrategy,
    },
  );

  // Mirrors upstream `_animateSnackBar`: if a snack bar is already open,
  // dismiss it (its own container drives its exit animation independently
  // of the new one's enter animation above).
  const previous = openedRef.value;
  previous?.dismiss();

  if (merged.duration && merged.duration > 0) {
    ref.afterOpened.then(() => ref._dismissAfter(merged.duration!));
  }

  if (merged.announcementMessage) {
    const message = merged.announcementMessage;
    const politeness = merged.politeness;
    if (!liveAnnouncer.value) liveAnnouncer.value = noSerialize(createLiveAnnouncer());
    // Mirrors upstream waiting for the container's screen-reader-announce
    // move before delivering this message; approximated here via
    // `afterOpened` (enter-animation complete) rather than threading a
    // dedicated "announced" signal through the ref — see SYNC.md.
    ref.afterOpened.then(() => liveAnnouncer.value?.announce(message, politeness));
    ref.afterDismissed.then(() => liveAnnouncer.value?.clear());
  }

  openedRef.value = noSerialize(ref);
  ref.afterDismissed.then(() => {
    if (openedRef.value?.id === ref.id) openedRef.value = null;
  });

  return ref;
}

function makeCtxIdGen(counter: Signal<number>): IdGenerator {
  return {
    getId(prefix) {
      return `${prefix}${counter.value++}`;
    },
  };
}

function makeCtxRegistry(
  entries: Signal<readonly any[]>,
  overlayContainerCreated: Signal<boolean>,
): OverlayRegistry {
  return {
    entries,
    push: e => {
      overlayContainerCreated.value = true;
      entries.value = [...entries.value, e];
    },
    remove: id => {
      entries.value = entries.value.filter(x => x.id !== id);
    },
    get: id => entries.value.find(x => x.id === id),
  };
}
