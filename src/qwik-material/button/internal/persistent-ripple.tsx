import {component$} from '@builder.io/qwik';

/**
 * The persistent ripple `<span>` that upstream MDC uses as the target for
 * its state-layer overlay (hover / focus-visible / active pseudo-elements).
 * Position is controlled entirely by CSS from button.scss / fab.scss.
 *
 * `isFab` toggles between `mdc-button__ripple` (standard button + icon-button)
 * and `mdc-fab__ripple` (FAB variants), matching upstream button.html line 2-4.
 */
export interface PersistentRippleProps {
  isFab: boolean;
}

export const PersistentRipple = component$<PersistentRippleProps>(({isFab}) => (
  <span
    class={['mat-mdc-button-persistent-ripple', isFab ? 'mdc-fab__ripple' : 'mdc-button__ripple']}
  />
));
