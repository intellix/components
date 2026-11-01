import {component$} from '@qwik.dev/core';
import {MatFormField, MatLabel} from '@angular-community/qwik-material/form-field';
import {MatInput} from '@angular-community/qwik-material/input';

export default component$(() => (
  <>
    <div data-parity-root>
      <MatFormField
        style="width: 300px"
        label={<MatLabel>Default (primary)</MatLabel>}
        control={<MatInput placeholder="Default" />}
      />
      <MatFormField
        color="accent"
        style="width: 300px"
        label={<MatLabel>Accent</MatLabel>}
        control={<MatInput placeholder="Accent" />}
      />
      <MatFormField
        color="warn"
        style="width: 300px"
        label={<MatLabel>Warn</MatLabel>}
        control={<MatInput placeholder="Warn" />}
      />
    </div>
    <main data-scenario-ready>ready</main>
  </>
));
