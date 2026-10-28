import {component$, useSignal} from '@builder.io/qwik';
import {MatChipListbox} from '@angular-community/qwik-material/chips';

export default component$(() => {
  const amenities = useSignal<readonly string[]>(['wifi', 'pool']);

  return (
    <>
      <div data-parity-root>
        <MatChipListbox
          multiple
          aria-label="Amenities"
          onChange$={event => (amenities.value = event.value as readonly string[])}
          options={[
            {
              key: 'wifi',
              value: 'wifi',
              content: 'Wifi',
              selected: amenities.value.includes('wifi'),
            },
            {
              key: 'parking',
              value: 'parking',
              content: 'Parking',
              selected: amenities.value.includes('parking'),
            },
            {
              key: 'pool',
              value: 'pool',
              content: 'Pool',
              selected: amenities.value.includes('pool'),
            },
            {key: 'gym', value: 'gym', content: 'Gym', selected: amenities.value.includes('gym')},
          ]}
        />
        <p>Selected: {amenities.value.join(', ') || '(none)'}</p>
      </div>
      <main data-scenario-ready>ready</main>
    </>
  );
});
