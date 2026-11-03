import {component$, useSignal, useStyles$} from '@qwik.dev/core';
import {MatCheckbox} from '@angular-community/qwik-material/checkbox';
import {
  MatFormField,
  MatLabel,
  useMatFormControl,
} from '@angular-community/qwik-material/form-field';
import {MatInput} from '@angular-community/qwik-material/input';
import {mergeHostProps, useMatRipple} from '@angular-community/qwik-material/core';
import styles from './example.css?inline';

/**
 * Port of `src/components-examples/material/core/ripple-overview`
 * (ripple-overview-example.html/.ts/.css) — material.angular.dev's "MatRipple
 * basic usage" example. Upstream binds every control via `[(ngModel)]`
 * (`FormsModule`); this port has no Angular-Forms integration, so each
 * control is a plain signal + `onChange$`/`onInput$` pair instead — same
 * convention `tooltip-delay`/`checkbox-overview` already establish for a
 * "real, unmodified upstream example" with no forms module to port.
 *
 * All five `[(ngModel)]`-bound controls replicate upstream's `NgControlStatus` host classes
 * (`ng-pristine`/`ng-untouched`/`ng-valid`, flipping to `ng-dirty`/`ng-touched` on interaction —
 * never `ng-invalid`, no validators anywhere in this example) via `formBound` +
 * `touched`/`dirty`/`invalid`: the two `<input matInput>` fields via `useMatFormControl()` (same
 * pattern `tooltip-delay`'s own two number inputs establish), the three `<mat-checkbox>`s via a
 * plain local `touched`/`dirty` signal pair each (no `value`/validators to track — `MatCheckbox`
 * itself already owns `checked`, so there's nothing for a `useMatFormControl()` round-trip to
 * add here). `MatCheckbox`'s own `onTouched$` (fired on the native input's blur) marks `touched`;
 * `onChange$` marks `dirty` the same way Angular's own `NgModel` directive does automatically
 * whenever the bound value changes via the UI.
 *
 * `useMatRipple()` itself is this example's whole point: `ripple.hostProps`
 * spread directly onto the plain `<div>` upstream's `matRipple` directive
 * sits on, reading every one of `matRippleCentered`/`matRippleDisabled`/
 * `matRippleUnbounded`/`matRippleRadius`/`matRippleColor` from this
 * component's own live signals.
 */
export default component$(() => {
  useStyles$(styles);
  const centered = useSignal(false);
  const disabled = useSignal(false);
  const unbounded = useSignal(false);
  const radius = useSignal<number | undefined>(undefined);
  const color = useSignal<string | undefined>(undefined);

  // Mirrors `NgModel`'s own touched/dirty tracking for each checkbox — see this file's module
  // doc comment. No `value`/validators to track (`MatCheckbox` already owns `checked`), so a
  // bare signal pair is enough; `useMatFormControl()` is reserved for the two text inputs below,
  // which actually have a string `value`.
  const centeredTouched = useSignal(false);
  const centeredDirty = useSignal(false);
  const disabledTouched = useSignal(false);
  const disabledDirty = useSignal(false);
  const unboundedTouched = useSignal(false);
  const unboundedDirty = useSignal(false);

  const radiusFc = useMatFormControl();
  const colorFc = useMatFormControl();

  const ripple = useMatRipple({
    centered: centered.value,
    disabled: disabled.value,
    unbounded: unbounded.value,
    radius: radius.value,
    color: color.value,
  });

  return (
    <ripple-overview-example>
      <MatCheckbox
        class="example-ripple-checkbox"
        checked={centered.value}
        formBound
        touched={centeredTouched.value}
        dirty={centeredDirty.value}
        invalid={false}
        onChange$={event => {
          centeredDirty.value = true;
          centered.value = event.checked;
        }}
        onTouched$={() => (centeredTouched.value = true)}
      >
        Centered
      </MatCheckbox>
      <MatCheckbox
        class="example-ripple-checkbox"
        checked={disabled.value}
        formBound
        touched={disabledTouched.value}
        dirty={disabledDirty.value}
        invalid={false}
        onChange$={event => {
          disabledDirty.value = true;
          disabled.value = event.checked;
        }}
        onTouched$={() => (disabledTouched.value = true)}
      >
        Disabled
      </MatCheckbox>
      <MatCheckbox
        class="example-ripple-checkbox"
        checked={unbounded.value}
        formBound
        touched={unboundedTouched.value}
        dirty={unboundedDirty.value}
        invalid={false}
        onChange$={event => {
          unboundedDirty.value = true;
          unbounded.value = event.checked;
        }}
        onTouched$={() => (unboundedTouched.value = true)}
      >
        Unbounded
      </MatCheckbox>

      <MatFormField
        class="example-ripple-form-field"
        label={<MatLabel>Radius</MatLabel>}
        touched={radiusFc.touched}
        dirty={radiusFc.dirty}
        invalid={false}
        control={
          <MatInput
            type="number"
            formBound
            touched={radiusFc.touched}
            dirty={radiusFc.dirty}
            invalid={false}
            value={radius.value == null ? '' : String(radius.value)}
            onInput$={(_, el) => {
              radiusFc.markAsDirty$();
              radius.value = el.value === '' ? undefined : Number(el.value);
            }}
            onBlur$={radiusFc.markAsTouched$}
          />
        }
      />
      <MatFormField
        class="example-ripple-form-field"
        label={<MatLabel>Color</MatLabel>}
        touched={colorFc.touched}
        dirty={colorFc.dirty}
        invalid={false}
        control={
          <MatInput
            type="text"
            formBound
            touched={colorFc.touched}
            dirty={colorFc.dirty}
            invalid={false}
            value={color.value ?? ''}
            onInput$={(_, el) => {
              colorFc.markAsDirty$();
              color.value = el.value === '' ? undefined : el.value;
            }}
            onBlur$={colorFc.markAsTouched$}
          />
        }
      />

      <div
        {...mergeHostProps(ripple.hostProps, {
          class: ['example-ripple-container', 'mat-elevation-z4'],
        })}
      >
        Click me
      </div>
    </ripple-overview-example>
  );
});
