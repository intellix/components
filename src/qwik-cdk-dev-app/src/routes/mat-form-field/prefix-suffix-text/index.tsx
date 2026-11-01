import {component$} from '@qwik.dev/core';
import {
  MatFormField,
  MatLabel,
  MatTextPrefix,
  MatTextSuffix,
} from '@angular-community/qwik-material/form-field';
import {MatInput} from '@angular-community/qwik-material/input';

export default component$(() => (
  <>
    <div data-parity-root>
      <MatFormField
        floatLabel="always"
        style="width: 300px"
        label={<MatLabel>Amount</MatLabel>}
        textPrefix={<MatTextPrefix>{'$ '}</MatTextPrefix>}
        control={<MatInput type="number" placeholder="0" />}
        textSuffix={<MatTextSuffix>.00</MatTextSuffix>}
      />
    </div>
    <main data-scenario-ready>ready</main>
  </>
));
