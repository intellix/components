import {component$, useSignal, useVisibleTask$} from '@qwik.dev/core';
import {MatChipSet} from '@angular-community/qwik-material/chips';

/**
 * Port of material.angular.dev's `chips-overview` docs example
 * (src/components-examples/material/chips/chips-overview/). A static, non-interactive
 * `<mat-chip-set>` of plain (non-selectable) chips — compared as rendered.
 *
 * The upstream template writes the fourth chip's `disabled` input as a bare attribute
 * (`<mat-chip disabled>`, not `[disabled]="true"`), so — confirmed live at
 * http://localhost:4200/qwik-parity/mat-chips/example — Angular echoes it onto `<mat-chip>` as a
 * literal `disabled=""` attribute: a plain, unbound template attribute Angular preserves
 * verbatim, same category as the static `value="x"` echo `README.md` already documents as a
 * known, accepted difference (confirmed against upstream's `chip.ts`: `MatChip`'s own host
 * bindings for `disabled` are CSS-class-only — `[class.mdc-evolution-chip--disabled]`/
 * `[class.mat-mdc-chip-disabled]`, no `[attr.disabled]` — so this is purely the static echo, not
 * a real host binding `qwik-material/chips` is missing). `MatChipSet`'s `chips` array has no slot
 * for an arbitrary extra host attribute, and this one chip never changes, so it's reproduced with
 * a one-time DOM write instead of a prop a future, changing scenario could reuse.
 */
export default component$(() => {
  const rootRef = useSignal<Element>();
  useVisibleTask$(() => {
    rootRef.value?.querySelector('mat-chip.mat-mdc-chip-disabled')?.setAttribute('disabled', '');
  });

  return (
    <>
      <div data-parity-root>
        <chips-overview-example ref={rootRef}>
          <MatChipSet
            aria-label="Fish selection"
            chips={[
              {key: 'one', content: 'One fish'},
              {key: 'two', content: 'Two fish'},
              {key: 'three', content: 'Three fish'},
              {key: 'four', content: 'Four fish', disabled: true},
            ]}
          />
        </chips-overview-example>
      </div>
      <main data-scenario-ready>ready</main>
    </>
  );
});
