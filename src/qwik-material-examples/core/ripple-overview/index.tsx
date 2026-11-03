import {component$, useSignal, useStyles$} from '@qwik.dev/core';
import {MatCheckbox} from '@angular-community/qwik-material/checkbox';
import {MatFormField, MatLabel, useMatFormControl} from '@angular-community/qwik-material/form-field';
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
 * The two `<input matInput>` fields DO replicate upstream's `NgControlStatus`
 * host classes (`ng-pristine`/`ng-untouched`/`ng-valid`) via
 * `useMatFormControl()` + `formBound` — same pattern as `tooltip-delay`'s own
 * two number inputs. The three `[(ngModel)]`-bound `<mat-checkbox>`s do NOT:
 * `MatCheckboxProps` has no `touched`/`dirty`/`formBound`-style fields at all
 * (confirmed against `mat-checkbox.tsx`) to reproduce that same NgControlStatus
 * triad on a checkbox host — a real, pre-existing gap, not something ripple
 * work should fix; see this file's parity spec entry
 * (`specs/examples-misc/angular-parity.spec.ts`), same category as the
 * existing `chips-reactive-form`/`chips-template-form` entries there.
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
        onChange$={event => (centered.value = event.checked)}
      >
        Centered
      </MatCheckbox>
      <MatCheckbox
        class="example-ripple-checkbox"
        checked={disabled.value}
        onChange$={event => (disabled.value = event.checked)}
      >
        Disabled
      </MatCheckbox>
      <MatCheckbox
        class="example-ripple-checkbox"
        checked={unbounded.value}
        onChange$={event => (unbounded.value = event.checked)}
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
