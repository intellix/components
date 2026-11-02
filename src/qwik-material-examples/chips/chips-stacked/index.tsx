import {component$, useStyles$} from '@qwik.dev/core';
import {MatChipListbox} from '@angular-community/qwik-material/chips';
import styles from './example.css?inline';

const BEST_BOYS = ['Samoyed', 'Akita Inu', 'Alaskan Malamute', 'Siberian Husky'];

/**
 * Port of material.angular.dev's `chips-stacked` docs example
 * (src/components-examples/material/chips/chips-stacked/). Vertical stacking is a pure CSS
 * class (`mat-mdc-chip-set-stacked`) on the listbox host — `MatChipListboxProps.class` already
 * supports arbitrary extra classes. Every option starts `selected` (`[selected]` bare attribute
 * upstream — see the real markup).
 */
export default component$(() => {
  useStyles$(styles);

  return (
    <chips-stacked-example>
      <MatChipListbox
        class="mat-mdc-chip-set-stacked"
        aria-label="Cutest dog breeds"
        options={BEST_BOYS.map(dog => ({key: dog, content: dog, selected: true}))}
      />
    </chips-stacked-example>
  );
});
