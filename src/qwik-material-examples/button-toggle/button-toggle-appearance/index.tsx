import {component$, useStyles$} from '@qwik.dev/core';
import {
  MatButtonToggleGroup,
  MatButtonToggle,
} from '@angular-community/qwik-material/button-toggle';
import styles from './example.css?inline';

/**
 * Port of material.angular.dev's `button-toggle-appearance` docs example
 * (src/components-examples/material/button-toggle/button-toggle-appearance/).
 *
 * UNPORTED FEATURE (large, not a small fixable bug — see qwik-material/button-toggle/SYNC.md's
 * "Deviations from upstream" §6): this port's `MatButtonToggleGroup`/`MatButtonToggle` have no
 * `appearance` prop at all — only the modern "standard" appearance is implemented;
 * `appearance="legacy"` (a distinct internal template: no `mat-pseudo-checkbox`, different
 * ripple-trigger wiring, a whole separate CSS class ladder) doesn't exist in this port. Both
 * sections below render with the only available (standard) appearance — the second section
 * keeps upstream's "Legacy appearance" label for documentation purposes, but its DOM can never
 * match upstream's real legacy-styled group. Tracked as an expected parity failure
 * (`specs/examples-misc/angular-parity.spec.ts`), not something to silently paper over.
 */
export default component$(() => {
  useStyles$(styles);

  return (
    <button-toggle-appearance-example>
      <p>
        Default appearance:
        <MatButtonToggleGroup name="fontStyle" aria-label="Font Style">
          <MatButtonToggle value="bold">Bold</MatButtonToggle>
          <MatButtonToggle value="italic">Italic</MatButtonToggle>
          <MatButtonToggle value="underline">Underline</MatButtonToggle>
        </MatButtonToggleGroup>
      </p>

      <p>
        Legacy appearance:
        <MatButtonToggleGroup name="fontStyle" aria-label="Font Style">
          <MatButtonToggle value="bold">Bold</MatButtonToggle>
          <MatButtonToggle value="italic">Italic</MatButtonToggle>
          <MatButtonToggle value="underline">Underline</MatButtonToggle>
        </MatButtonToggleGroup>
      </p>
    </button-toggle-appearance-example>
  );
});
