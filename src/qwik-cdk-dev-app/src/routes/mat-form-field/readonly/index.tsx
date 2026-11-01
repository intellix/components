import {component$} from '@qwik.dev/core';
import {MatFormField, MatLabel} from '@angular-community/qwik-material/form-field';
import {MatInput} from '@angular-community/qwik-material/input';

export default component$(() => (
  <>
    <div data-parity-root>
      <MatFormField
        style="width: 300px"
        label={<MatLabel>Account ID</MatLabel>}
        control={<MatInput value="ACC-10294" readOnly />}
      />
    </div>
    <main data-scenario-ready>ready</main>
  </>
));
