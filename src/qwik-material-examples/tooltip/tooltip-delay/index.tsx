import {component$, useSignal, useStyles$} from '@qwik.dev/core';
import {MatFormField, MatLabel, useMatFormControl} from '@angular-community/qwik-material/form-field';
import {MatInput} from '@angular-community/qwik-material/input';
import {MatButton} from '@angular-community/qwik-material/button';
import {useMatTooltip} from '@angular-community/qwik-material/tooltip';
import styles from './example.css?inline';

/**
 * Port of material.angular.dev's `tooltip-delay` docs example
 * (src/components-examples/material/tooltip/tooltip-delay/). Upstream binds two reactive-forms
 * `FormControl`s to number inputs, which is why each `<mat-form-field>`/`<input>` carries
 * `NgControlStatus`'s `ng-pristine ng-untouched ng-valid` classes from the very first render —
 * reproduced with the established `useMatFormControl()` + `formBound` pattern (see
 * `dialog/example/index.tsx`), NOT Angular Forms integration (this port has none — see
 * tooltip/SYNC.md). The action button composes `useMatTooltip()` onto `<MatButton>`.
 */
export default component$(() => {
  useStyles$(styles);
  const showDelay = useSignal(1000);
  const hideDelay = useSignal(2000);
  const showFc = useMatFormControl();
  const hideFc = useMatFormControl();
  const tip = useMatTooltip({
    message: 'Info about the action',
    showDelay: showDelay.value,
    hideDelay: hideDelay.value,
  });

  return (
    <tooltip-delay-example>
      <MatFormField
        class="example-user-input"
        label={<MatLabel>Show delay</MatLabel>}
        hintLabel="milliseconds"
        touched={showFc.touched}
        dirty={showFc.dirty}
        invalid={false}
        control={
          <MatInput
            type="number"
            formBound
            touched={showFc.touched}
            dirty={showFc.dirty}
            invalid={false}
            value={showDelay.value}
            aria-label="Adds a delay between hovering over the button and displaying the tooltip"
            onInput$={(_, el) => {
              showFc.markAsDirty$();
              showDelay.value = Number(el.value);
            }}
            onBlur$={showFc.markAsTouched$}
          />
        }
      />

      <MatFormField
        class="example-user-input"
        label={<MatLabel>Hide delay</MatLabel>}
        hintLabel="milliseconds"
        touched={hideFc.touched}
        dirty={hideFc.dirty}
        invalid={false}
        control={
          <MatInput
            type="number"
            formBound
            touched={hideFc.touched}
            dirty={hideFc.dirty}
            invalid={false}
            value={hideDelay.value}
            aria-label="Adds a delay between hovering away from the button and hiding the tooltip"
            onInput$={(_, el) => {
              hideFc.markAsDirty$();
              hideDelay.value = Number(el.value);
            }}
            onBlur$={hideFc.markAsTouched$}
          />
        }
      />

      <MatButton
        appearance="elevated"
        {...tip.hostProps}
        ariaLabel="Button that displays a tooltip with a customized delay in showing and hiding"
      >
        Action
      </MatButton>
    </tooltip-delay-example>
  );
});
