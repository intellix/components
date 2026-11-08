import {component$, type Signal} from '@qwik.dev/core';

/**
 * The `<span class="mat-ripple mat-mdc-button-ripple">` upstream's `MatRippleLoader._createRipple`
 * appends as the host's last child once `useRippleLoader()`'s signal flips. Its own component so
 * that reading the signal re-renders only this span, never the button host: a host re-render
 * rewrites the host's whole `class` attribute, undoing classes another script toggled on it,
 * which upstream (a plain `appendChild`) never touches. See `useFocusOrigin({hostClasses})`.
 */
export const LazyRipple = component$<{initialized: Signal<boolean>}>(props =>
  props.initialized.value ? <span class="mat-ripple mat-mdc-button-ripple" /> : null,
);
