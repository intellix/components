import {component$} from '@qwik.dev/core';
import {MatFormField, MatHint, MatLabel} from '@angular-community/qwik-material/form-field';
import {MatInput} from '@angular-community/qwik-material/input';

export default component$(() => (
  <>
    <div data-parity-root>
      <MatFormField
        style="width: 300px"
        label={<MatLabel>Username</MatLabel>}
        control={<MatInput placeholder="jdoe" />}
        hintStart={<MatHint>Letters and numbers only</MatHint>}
        hintEnd={<MatHint align="end">Max 20</MatHint>}
      />
    </div>
    <main data-scenario-ready>ready</main>
  </>
));
