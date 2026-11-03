import {component$, useContextProvider, useSignal, useVisibleTask$} from '@qwik.dev/core';
import type {OverlayEntry} from './overlay-registry';
import {
  applyPopoverInsertionPoint,
  resolvePopoverInsertionPoint,
} from './position/popover-insertion';

export const OverlayHost = component$<{entry: OverlayEntry}>(({entry}) => {
  const hostRef = useSignal<HTMLElement>();
  const paneRef = useSignal<HTMLElement>();
  // Real signals this component owns and reads directly in its own render —
  // unlike `entry.state.*`, mutating these always triggers a re-render.
  // `OverlayEntryState`'s plain-object fields only reflect correctly on this
  // component's *first* render (the entry is built inside a QRL, where Qwik
  // hooks can't run); visual changes made after mount — e.g.
  // `OverlayRef.detachBackdrop()` while a Material dialog's exit animation is
  // still running — go through these via `_onAttached`'s `visuals` callbacks.
  const backdropShowing = useSignal(entry.state.backdropShowing.value);
  const backdropDetached = useSignal(entry.state.backdropDetached.value);
  const panelClasses = useSignal(entry.state.panelClasses.value);
  // Snapshot of `entry.props` at first render — correct then (any
  // `updateProps()` call made before mount already mutated `entry.props`
  // itself), reactive thereafter via `_onAttached`'s `visuals.setProps`.
  // A whole-object `useSignal` (not a deep `useStore`): `entry.props` can
  // hold arbitrary consumer values (QRLs, NoSerialize refs, Component
  // references) that a deep reactive proxy shouldn't wrap.
  const props = useSignal<Record<string, unknown>>(entry.props);
  // See `OverlayVisualCallbacks.setDetached`'s doc comment (overlay-ref.ts):
  // this component unmounts its OWN previously-rendered host via a normal
  // conditional return (not the parent's list-keyed removal), which is the
  // only teardown path that still works once the host has been physically
  // relocated by `applyPopoverInsertionPoint` below.
  const detached = useSignal(entry.state.detached.value);

  // Re-provide every requested Qwik context value directly above the
  // attached component — see `OverlayConfig.context`'s doc comment for
  // why this is needed at all (this component renders under
  // `<OverlayContainerOutlet>`, a SIBLING of whatever opened the overlay,
  // not a descendant of any context provider the opener itself sees).
  // `entry.config.context` is a plain array fixed at `overlay.create()`
  // time (never mutated afterward), so looping over it unconditionally on
  // every render is safe and cheap — same call every time.
  for (const override of entry.config.context ?? []) {
    useContextProvider(override.ctx, override.value);
  }

  // Drive the OverlayRef lifecycle (host/pane attach, strategy apply, cleanup)
  // directly from this component$'s visible-task. We deliberately don't route
  // through entry-side QRL hooks — qwik's optimizer can't capture a
  // forward-referenced `ref` local across the $() boundary in
  // `createOverlayService`, so a `lifecycle.onAttached$` pattern compiles to a
  // chunk that hits `ReferenceError: ref is not defined` at runtime.
  useVisibleTask$(({cleanup}) => {
    if (!hostRef.value || !paneRef.value) return;
    const ref = entry.ref;
    if (!ref) return;
    ref._onAttached(hostRef.value, paneRef.value, {
      setBackdropShowing: v => (backdropShowing.value = v),
      setBackdropDetached: v => (backdropDetached.value = v),
      setPanelClasses: v => (panelClasses.value = v),
      setDetached: v => (detached.value = v),
      setProps: v => (props.value = v),
    });

    // Mirrors upstream `OverlayRef._attachHost()`: for a popover overlay
    // whose position strategy names a non-'global' insertion point (e.g.
    // `mat-select`'s inline `cdk-connected-overlay`), physically move the
    // host next to its origin (or into a custom parent) instead of leaving
    // it inside the shared `.cdk-overlay-container` this component just
    // rendered it into — see position/popover-insertion.ts. A no-op (the
    // overwhelmingly common case) whenever the strategy doesn't implement
    // `getPopoverInsertionPoint` (e.g. `GlobalPositionStrategy`) or
    // resolves to `'global'`.
    const insertionPoint = resolvePopoverInsertionPoint(
      entry.usePopover,
      entry.config.positionStrategy,
    );
    applyPopoverInsertionPoint(hostRef.value, insertionPoint);
    // Tell the ref it needs the `setDetached` teardown path — see
    // `OverlayRef._onReparented()`'s doc comment.
    if (insertionPoint) ref._onReparented();

    cleanup(() => ref._onDetached());
  });

  // See the `detached` signal's own doc comment above.
  if (detached.value) return null;

  const Comp = entry.Component;
  return (
    <div
      // A plain (non-QRL) ref callback, not `hostRef` directly — v2
      // regression fix. A `popover="manual"` element is native-hidden
      // (`display: none`, `:popover-open` false) until `.showPopover()` is
      // called; Qwik has no special-case handling for the `popover`
      // attribute, so nothing else ever calls it. `useVisibleTask$` (below)
      // can't be the one to make this call: its IntersectionObserver-based
      // `qvisible` trigger never fires for an element with no layout box in
      // the first place, so this element's OWN hidden state would block
      // the one task meant to un-hide it — a permanent deadlock (confirmed
      // live: v1 apparently tolerated this; v2's `useVisibleTask$` no
      // longer does — manually calling `.showPopover()` from devtools on a
      // stuck instance immediately un-blocks the pending visible task too,
      // so this is the only missing piece, not a deeper bug in
      // `_onAttached`/the position strategy). A ref callback runs the
      // moment this DOM node is created, independent of its visibility, so
      // it can resolve the deadlock before it ever applies — but two
      // ordering quirks (both confirmed live) mean it can't just call
      // `el.showPopover()` synchronously:
      //  1. This callback fires BEFORE Qwik's own attribute-flush for this
      //     same render commits, so the `popover={...}` JSX prop below
      //     hasn't landed on the element yet (`NotSupportedError: not
      //     supported on elements that are not popovers` without the
      //     `setAttribute` call below — idempotent with that JSX prop,
      //     same value either way).
      //  2. It ALSO fires before Qwik inserts the node into the live
      //     document (`InvalidStateError: Invalid on disconnected popover
      //     elements`) — poll across animation frames for `isConnected`
      //     rather than assume any fixed number of frames, since that's
      //     cheap (a handful of frames at most) and doesn't depend on
      //     Qwik's internal batching depth staying constant across
      //     versions.
      ref={(el: HTMLElement) => {
        hostRef.value = el;
        if (entry.usePopover) {
          el.setAttribute('popover', 'manual');
          const tryShow = () => {
            if (!el.isConnected) {
              // ssr-leak-ok: element ref callbacks only run in the browser.
              requestAnimationFrame(tryShow);
              return;
            }
            if (!el.matches(':popover-open')) el.showPopover();
          };
          requestAnimationFrame(tryShow);
        }
      }}
      class={entry.usePopover ? 'cdk-overlay-popover' : undefined}
      popover={entry.usePopover ? 'manual' : undefined}
      dir={entry.direction}
    >
      {entry.config.hasBackdrop && (
        <div
          class={[
            'cdk-overlay-backdrop',
            ...(backdropShowing.value ? ['cdk-overlay-backdrop-showing'] : []),
            ...(Array.isArray(entry.config.backdropClass)
              ? entry.config.backdropClass
              : entry.config.backdropClass
                ? [entry.config.backdropClass]
                : []),
          ].join(' ')}
          style={backdropDetached.value ? {pointerEvents: 'none'} : {}}
          // Mirrors upstream `BackdropRef`'s own click listener, which feeds
          // `OverlayRef.backdropClick()` unconditionally — qwik-cdk's
          // `OverlayRef.backdropClick(callback)` subscribers (see
          // overlay-ref.ts) are notified directly from here, independent of
          // the outside-click dispatcher any consumer may ALSO have wired up
          // for actual close behavior (same "always fires" contract already
          // established for `MatDialogRef`/`MatBottomSheetRef`).
          onClick$={(event: MouseEvent) => entry.ref?._notifyBackdropClick(event)}
        />
      )}
      <div
        ref={paneRef}
        id={entry.id}
        class={['cdk-overlay-pane', ...panelClasses.value].join(' ')}
        style={{
          width: entry.state.width.value,
          height: entry.state.height.value,
          minWidth: entry.state.minWidth.value,
          minHeight: entry.state.minHeight.value,
          maxWidth: entry.state.maxWidth.value,
          maxHeight: entry.state.maxHeight.value,
        }}
      >
        <Comp {...(props.value as any)} />
      </div>
    </div>
  );
});
