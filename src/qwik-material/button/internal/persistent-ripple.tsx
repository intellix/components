/**
 * The persistent ripple `<span>` that upstream MDC uses as the target for
 * its state-layer overlay (hover / focus-visible / active pseudo-elements).
 * Position is controlled entirely by CSS from button.scss / fab.scss.
 *
 * `isFab` toggles between `mdc-button__ripple` (standard button + icon-button)
 * and `mdc-fab__ripple` (FAB variants), matching upstream button.html line 2-4.
 *
 * A plain (inline) function component, not a `component$`: it has no state of its own, and a
 * `component$` boundary costs every button its own vnode data and serialized state (render QRL,
 * props, a render subscription) for a static span.
 */
export interface PersistentRippleProps {
  isFab: boolean;
}

export const PersistentRipple = ({isFab}: PersistentRippleProps) => (
  <span
    class={['mat-mdc-button-persistent-ripple', isFab ? 'mdc-fab__ripple' : 'mdc-button__ripple']}
  />
);
