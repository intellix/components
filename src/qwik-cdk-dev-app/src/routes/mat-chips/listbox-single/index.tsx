import {component$, useSignal} from '@qwik.dev/core';
import {MatChipListbox} from '@angular-community/qwik-material/chips';

export default component$(() => {
  const size = useSignal<string | undefined>(undefined);

  return (
    <>
      <div data-parity-root>
        <MatChipListbox
          aria-label="Shirt size"
          onChange$={event => (size.value = event.value as string | undefined)}
          options={[
            {key: 'xs', value: 'xs', content: 'Extra Small', selected: size.value === 'xs'},
            {key: 's', value: 's', content: 'Small', selected: size.value === 's'},
            {
              key: 'm',
              value: 'm',
              content: 'Medium',
              disabled: true,
              selected: size.value === 'm',
            },
            {key: 'l', value: 'l', content: 'Large', selected: size.value === 'l'},
          ]}
        />
        <p>Selected: {size.value ?? '(none)'}</p>
      </div>
      <main data-scenario-ready>ready</main>
    </>
  );
});
