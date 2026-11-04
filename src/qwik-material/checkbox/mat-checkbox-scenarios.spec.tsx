/**
 * MatCheckbox scenario port from src/material/checkbox/checkbox.spec.ts.
 *
 * Upstream has ~90 `it()` blocks across "basic behaviors", "aria handling",
 * "with multiple checkboxes", "with ngModel", "with name attribute", "with
 * form control", "without label", and "MatCheckboxDefaultOptions" describe
 * blocks — heavy on Angular change detection, `ComponentFixture`, and Forms
 * (`ControlValueAccessor`/`Validator`/`ngModel`) integration. This package's
 * vitest `createDOM()` hangs (see mat-button's own scenario-port comment for
 * the same finding), so no DOM-render tests are attempted here either way.
 * Restructured:
 *
 *   - Live sanity tests: typeof + context ids + CONFIG_DEFAULTS shape + props
 *     shape.
 *   - describe.skip DOM-rendered: every behavior upstream's "basic behaviors"
 *     + "aria handling" describe blocks exercise, now IMPLEMENTED and
 *     verified via a real browser instead of vitest (angular-parity.spec.ts
 *     is the authoritative gate; a handful of behaviors it doesn't reach —
 *     label click, touch-target click, click-action variants, config
 *     defaults — get dedicated Qwik-only Playwright specs instead).
 *   - describe.skip Angular-only: CVA / Validator / ngModel / form control
 *     integration. Deferred forever — Qwik has no forms system.
 *
 * Real DOM + behavior assertions live in
 * src/qwik-cdk-parity-tests/specs/material-checkbox/*.spec.ts (Qwik-only DOM
 * specs) and angular-parity.spec.ts (Angular-vs-Qwik DOM diffing — the
 * authoritative parity gate).
 */
import {describe, it, expect} from 'vitest';
import {
  MAT_CHECKBOX_CONFIG,
  MAT_CHECKBOX_CONFIG_DEFAULTS,
  MatCheckbox,
  type MatCheckboxChangeEvent,
  type MatCheckboxConfig,
  type MatCheckboxProps,
} from './public-api';

describe('MatCheckbox surface — sanity', () => {
  it('MatCheckbox is exported and function-shaped', () => {
    expect(typeof MatCheckbox).toBe('function');
  });

  it('MAT_CHECKBOX_CONFIG carries the expected context id', () => {
    expect(MAT_CHECKBOX_CONFIG.id).toBe('qwik-material/checkbox-config');
  });

  it('MAT_CHECKBOX_CONFIG_DEFAULTS mirrors upstream checkboxDefaults', () => {
    expect(MAT_CHECKBOX_CONFIG_DEFAULTS).toEqual({
      color: 'accent',
      clickAction: 'check-indeterminate',
      disabledInteractive: false,
    });
  });

  it('MatCheckboxConfig accepts a partial override', () => {
    const cfg: MatCheckboxConfig = {color: 'primary'};
    expect(cfg.clickAction).toBeUndefined();
  });

  it('MatCheckboxProps accepts the full surface', () => {
    const props: MatCheckboxProps = {
      checked: true,
      indeterminate: false,
      disabled: false,
      disabledInteractive: false,
      required: true,
      labelPosition: 'before',
      name: 'subscribe',
      value: 'yes',
      color: 'primary',
      disableRipple: false,
      id: 'my-checkbox',
      tabIndex: 0,
      'aria-label': 'Subscribe',
      'aria-labelledby': 'ext-label',
      'aria-describedby': 'details-1',
      'aria-expanded': true,
      'aria-controls': 'details-1',
      'aria-owns': 'details-1',
      onChange$: undefined,
      onIndeterminateChange$: undefined,
      class: 'my-class',
      formBound: true,
      touched: true,
      dirty: true,
      invalid: false,
      onTouched$: undefined,
    };
    expect(props.checked).toBe(true);
    expect(props.labelPosition).toBe('before');
    expect(props.formBound).toBe(true);
  });

  it('MatCheckboxChangeEvent carries a `checked` boolean (no `source` — no class instance to hand back)', () => {
    const event: MatCheckboxChangeEvent = {checked: true};
    expect(event.checked).toBe(true);
  });
});

describe.skip('MatCheckbox DOM-rendered scenarios — verified via Playwright', () => {
  it('renders <mat-checkbox class="mat-mdc-checkbox mat-{color}" id="mat-mdc-checkbox-N"> wrapping a div[mat-internal-form-field] > .mdc-checkbox > input.mdc-checkbox__native-control', () => {});
  it('adds/removes mdc-checkbox--selected on the input and mat-mdc-checkbox-checked on the host as `checked` changes; `checked`/`indeterminate` are plain DOM properties, never reflected as attributes', () => {});
  it('indeterminate=true renders aria-checked="mixed" on the input and omits mat-mdc-checkbox-checked on the host; clicking clears indeterminate (and emits onIndeterminateChange$(false)) before toggling checked', () => {});
  it('disabled=true adds mdc-checkbox--disabled + mat-mdc-checkbox-disabled on the host and the `disabled` attribute + tabindex="-1" on the input; a disabled native input never dispatches click, so nothing toggles', () => {});
  it('disabled=true + disabledInteractive=true adds mat-mdc-checkbox-disabled-interactive (host keeps mdc-checkbox--disabled too) but OMITS the native `disabled` attribute, adds aria-disabled="true", keeps tabindex="0"; clicking resets the native checked/indeterminate properties back to the model instead of toggling', () => {});
  it('labelPosition="before" adds mdc-form-field--align-end to the div[mat-internal-form-field]', () => {});
  it('color defaults to "accent" (host class mat-accent) when unset; explicit "primary"/"warn" render mat-primary/mat-warn', () => {});
  it('required=true adds the `required` attribute to the input (no validation — Qwik has no forms system)', () => {});
  it('name/value render as plain `name`/`value` attributes on the input when provided, omitted otherwise', () => {});
  it('aria-label/-labelledby/-describedby/-expanded/-controls/-owns all forward onto the INPUT (never the host, which upstream always nulls out) — aria-label falls back to omitted when empty', () => {});
  it('clicking (or Space on a focused input) toggles `checked`, calls onChange$({checked}), and — for the one transition where it applies — adds `mdc-checkbox--anim-<from>-<to>` to the input, removed again after ~1s; the very first transition on an instance that starts checked and targets unchecked adds no class (the "Init-state quirk")', () => {});
  it('animationsDisabled (via useMatAnimationsProvider) adds _mat-animation-noopable to the host and suppresses every mdc-checkbox--anim-* class', () => {});
  it('clicking the touch-target div toggles the checkbox exactly like clicking the input, then focuses the input (unless disabled)', () => {});
  it('clicking the projected <label> text toggles the checkbox exactly once (native for/id forwarding + stopPropagation on the form-field div prevents a double-fire)', () => {});
  it('MAT_CHECKBOX_CONFIG (via useMatCheckboxProvider) supplies color/clickAction/disabledInteractive defaults; an explicit prop always wins', () => {});
  it('clickAction "noop" never toggles checked/indeterminate on click; "check" toggles checked but never clears indeterminate', () => {});
});

describe.skip('MatCheckbox — Angular-only tests (deferred forever)', () => {
  it('should implement ControlValueAccessor (writeValue / registerOnChange / registerOnTouched / setDisabledState)', () => {
    // Omitted — Qwik has no forms system (matches every other ported form-ish control).
  });
  it('should implement Validator (required validation via NG_VALIDATORS)', () => {
    // Omitted — no Angular Forms integration; `required` is reflected as a plain attribute only.
  });
  it('should participate in ngModel / reactive FormControl (pristine/touched/dirty, validity, blur-marks-touched)', () => {
    // Omitted — no forms system.
  });
  it('focus() imperative method / FocusableOption', () => {
    // Omitted — no component-instance handle in Qwik; a consumer who needs
    // this uses a ref to the rendered <input> directly.
  });
});
