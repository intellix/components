import {component$} from '@qwik.dev/core';
import {MatFormField, MatHint, MatLabel} from '@angular-community/qwik-material/form-field';
import {MatInput} from '@angular-community/qwik-material/input';

export default component$(() => (
  <>
    <div data-parity-root>
      <MatFormField
        subscriptSizing="dynamic"
        style="width: 300px"
        label={<MatLabel>Nickname</MatLabel>}
        control={<MatInput placeholder="Ex. Nougat" />}
        hintStart={<MatHint>Shown only while there&apos;s room</MatHint>}
      />
    </div>
    <main data-scenario-ready>ready</main>
  </>
));
