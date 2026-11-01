import {component$, useSignal, useVisibleTask$} from '@qwik.dev/core';
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
  // See `OverlayVisualCallbacks.setDetached`'s doc comment (overlay-ref.ts):
  // this component unmounts its OWN previously-rendered host via a normal
  // conditional return (not the parent's list-keyed removal), which is the
  // only teardown path that still works once the host has been physically
  // relocated by `applyPopoverInsertionPoint` below.
  const detached = useSignal(entry.state.detached.value);

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
      // A plain (non-QRL) ref callback, not `hostRef` directly: a
      // `popover="manual"` element is native-hidden (`display: none`,
      // `:popover-open` false) until `.showPopover()` is called — Qwik has
      // no special-case handling for the `popover` attribute, so nothing
      // else calls it. `useVisibleTask$` (below) can't be the one to do
      // this bootstrapping call: its IntersectionObserver-based `qvisible`
      // trigger never fires for an element with no layout box in the first
      // place — this element's own hidden state would block the one task
      // meant to un-hide it, a permanent deadlock. A ref callback runs the
      // moment this DOM node is created, independent of its visibility, so
      // it can resolve that deadlock before it ever applies. (Confirmed
      // live: manually calling `.showPopover()` from devtools on a
      // genuinely stuck instance immediately un-blocks the pending visible
      // task too — this is the only missing piece, not a deeper bug in
      // `_onAttached`/the position strategy.)
      ref={(el: HTMLElement) => {
        hostRef.value = el;
        if (entry.usePopover) {
          // Set the attribute ourselves instead of waiting for Qwik's own
          // `popover={...}` JSX prop below to land — confirmed live, this
          // ref callback fires before that attribute-flush commits (calling
          // `showPopover()` here throws `NotSupportedError: not supported
          // on elements that are not popovers` without it, even deferred
          // via a microtask or a `requestAnimationFrame`; this repo has no
          // other case of a ref callback that itself also needs this same
          // render's OWN attributes, so there was no existing pattern to
          // follow). Idempotent with the JSX prop — same value either
          // writes.
          el.setAttribute('popover', 'manual');
          // `useVisibleTask$` (below) can't be the one to make this call:
          // its IntersectionObserver-based `qvisible` trigger never fires
          // for an element with no layout box in the first place — a
          // `popover="manual"` element is native-hidden (`display: none`)
          // until `.showPopover()` runs, so this element's own hidden state
          // would block the one task meant to un-hide it, a permanent
          // deadlock. This ref callback runs the moment the DOM node is
          // created, independent of its visibility, so it can resolve that
          // deadlock before it ever applies. (Confirmed live: manually
          // calling `.showPopover()` from devtools on a genuinely stuck
          // instance immediately un-blocks the pending visible task too —
          // this is the only missing piece, not a deeper bug in
          // `_onAttached`/the position strategy.)
          //
          // The ref callback itself fires at element-CREATION time, before
          // Qwik inserts the node into the live document (confirmed live:
          // calling `showPopover()` synchronously here throws
          // `InvalidStateError: Invalid on disconnected popover elements`).
          // Poll across animation frames for `isConnected` rather than
          // assuming any fixed number of frames — cheap (a handful of
          // frames at most) and doesn't depend on Qwik's internal batching
          // depth staying constant across versions.
          const tryShow = () => {
            if (!el.isConnected) {
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
        <Comp {...(entry.props as any)} />
      </div>
    </div>
  );
});
