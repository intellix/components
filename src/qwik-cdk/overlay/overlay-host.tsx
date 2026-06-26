import {component$, useSignal, useVisibleTask$} from '@builder.io/qwik';
import type {OverlayEntry} from './overlay-registry';

export const OverlayHost = component$<{entry: OverlayEntry}>(({entry}) => {
  const hostRef = useSignal<HTMLElement>();
  const paneRef = useSignal<HTMLElement>();

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
    ref._onAttached(hostRef.value, paneRef.value);
    cleanup(() => ref._onDetached());
  });

  const Comp = entry.Component;
  return (
    <div ref={hostRef} class="cdk-overlay-host" data-overlay-id={entry.id}>
      {entry.config.hasBackdrop && (
        <div
          class={[
            'cdk-overlay-backdrop',
            ...(entry.state.backdropShowing.value ? ['cdk-overlay-backdrop-showing'] : []),
            ...(Array.isArray(entry.config.backdropClass)
              ? entry.config.backdropClass
              : entry.config.backdropClass
                ? [entry.config.backdropClass]
                : []),
          ].join(' ')}
        />
      )}
      <div
        ref={paneRef}
        class={['cdk-overlay-pane', ...entry.state.panelClasses.value].join(' ')}
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
