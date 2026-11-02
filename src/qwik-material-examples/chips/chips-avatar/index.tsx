import {component$} from '@qwik.dev/core';
import {MatChipSet} from '@angular-community/qwik-material/chips';

/**
 * Port of material.angular.dev's `chips-avatar` docs example
 * (src/components-examples/material/chips/chips-avatar/). Each chip's `avatar` field
 * (`MatChipDef.avatar`) renders as `<MatChip>`'s avatar slot — mirrors upstream's
 * `<img matChipAvatar>`, same `avatar` field `mat-chips/avatar-trailing-icon`'s existing parity
 * scenario already exercises (with plain text there instead of an `<img>`).
 */
export default component$(() => (
  <chips-avatar-example>
    <MatChipSet
      aria-label="Dog selection"
      chips={[
        {
          key: 'one',
          content: 'Dog one',
          avatar: (
            <img
              src="https://material.angular.dev/assets/img/examples/shiba1.jpg"
              alt="Photo of a Shiba Inu"
            />
          ),
        },
        {
          key: 'two',
          content: 'Dog two',
          avatar: (
            <img
              src="https://material.angular.dev/assets/img/examples/shiba1.jpg"
              alt="Photo of a Shiba Inu"
            />
          ),
        },
        {
          key: 'three',
          content: 'Dog three',
          avatar: (
            <img
              src="https://material.angular.dev/assets/img/examples/shiba1.jpg"
              alt="Photo of a Shiba Inu"
            />
          ),
        },
      ]}
    />
  </chips-avatar-example>
));
