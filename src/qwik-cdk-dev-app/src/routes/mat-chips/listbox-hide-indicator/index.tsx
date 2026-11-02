import {component$, useSignal} from '@qwik.dev/core';
import {MatChipListbox} from '@angular-community/qwik-material/chips';

export default component$(() => {
  const color = useSignal<string | undefined>(undefined);

  return (
    <>
      <div data-parity-root>
        <MatChipListbox
          hideSingleSelectionIndicator
          aria-label="Accent color"
          onChange$={event => (color.value = event.value as string | undefined)}
          options={[
            {key: 'none', value: 'none', content: 'None', selected: color.value === 'none'},
            {
              key: 'primary',
              value: 'primary',
              content: 'Primary',
              selected: color.value === 'primary',
            },
            {
              key: 'accent',
              value: 'accent',
              content: 'Accent',
              selected: color.value === 'accent',
            },
          ]}
        />
        <p>Selected: {color.value ?? '(none)'}</p>
      </div>
      <main data-scenario-ready>ready</main>
    </>
  );
});
