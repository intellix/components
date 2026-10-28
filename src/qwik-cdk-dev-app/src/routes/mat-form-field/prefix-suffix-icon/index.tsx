import {component$} from '@builder.io/qwik';
import {
  MatFormField,
  MatIconPrefix,
  MatIconSuffix,
  MatLabel,
} from '@angular-community/qwik-material/form-field';
import {MatInput} from '@angular-community/qwik-material/input';

export default component$(() => (
  <>
    <div data-parity-root>
      <MatFormField
        style="width: 300px"
        label={<MatLabel>Password</MatLabel>}
        iconPrefix={<MatIconPrefix>#</MatIconPrefix>}
        control={<MatInput type="password" placeholder="Password" />}
        iconSuffix={<MatIconSuffix>@</MatIconSuffix>}
      />
    </div>
    <main data-scenario-ready>ready</main>
  </>
));
