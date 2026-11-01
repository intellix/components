import {component$} from '@qwik.dev/core';
import {MatFormField, MatLabel} from '@angular-community/qwik-material/form-field';
import {MatInput} from '@angular-community/qwik-material/input';

export default component$(() => (
  <>
    <div data-parity-root>
      <MatFormField
        style="width: 300px"
        label={<MatLabel>City</MatLabel>}
        control={<MatInput value="Mountain View" disabled />}
      />
    </div>
    <main data-scenario-ready>ready</main>
  </>
));
