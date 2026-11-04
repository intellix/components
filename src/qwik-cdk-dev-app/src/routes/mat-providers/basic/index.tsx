import {component$} from '@qwik.dev/core';
import {MatFormField, MatLabel} from '@angular-community/qwik-material/form-field';
import {MatInput} from '@angular-community/qwik-material/input';
import {MatTooltip} from '@angular-community/qwik-material/tooltip';

/**
 * Neither the form field nor the tooltip below set an `appearance`/`showDelay` prop of their
 * own — both must pick up `mat-providers/layout.tsx`'s root-level `useMatProviders()` config.
 */
export default component$(() => (
  <>
    <div data-parity-root>
      <MatFormField
        style="width: 300px"
        label={<MatLabel>Fruit</MatLabel>}
        control={<MatInput placeholder="test" />}
      />
      <MatTooltip
        as="button"
        class="tooltip-trigger"
        style="position: fixed; top: 120px; left: 120px; width: 160px; height: 48px;"
        message="Info about the action"
        aria-label="Button that displays a tooltip using the root provider's delay"
      >
        Action
      </MatTooltip>
    </div>
    <main data-scenario-ready>ready</main>
  </>
));
