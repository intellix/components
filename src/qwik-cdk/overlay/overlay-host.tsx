import {component$, useSignal, useVisibleTask$} from '@builder.io/qwik';
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
    applyPopoverInsertionPoint(
      hostRef.value,
      resolvePopoverInsertionPoint(entry.usePopover, entry.config.positionStrategy),
    );

    cleanup(() => ref._onDetached());
  });

  const Comp = entry.Component;
  return (
    <div
      ref={hostRef}
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
