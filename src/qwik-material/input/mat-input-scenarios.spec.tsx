/**
 * MatInput scenario port from src/material/input/input.spec.ts (2418
 * lines, ~100 `it()` blocks across "MatInput without forms", "MatInput with
 * forms" (error messages / custom error behavior), and "MatFormField
 * default options"/"MatFormField without label" — most of the latter two
 * exercise `MatFormField` AS MUCH AS `MatInput`, since upstream tests them
 * together; see `form-field/mat-form-field-scenarios.spec.tsx` for that
 * half). This package's vitest `createDOM()` hangs (see mat-button's own
 * scenario-port comment for the same finding), so no DOM-render tests are
 * attempted here either way. Restructured:
 *
 *   - Live sanity tests: typeof + context id + CONFIG_DEFAULTS shape + props
 *     shape.
 *   - describe.skip DOM-rendered: every behavior upstream exercises that's
 *     ALSO implemented here, verified via a real browser instead of vitest
 *     (angular-parity.spec.ts is the authoritative gate for all 16
 *     scenarios; a few behaviors it doesn't reach get dedicated Qwik-only
 *     Playwright specs instead).
 *   - describe.skip Angular-only: CVA/`NgControl`/native-`<select>`/iOS-
 *     keyup-jiggle integration. Deferred forever — Qwik has no forms system
 *     and no parity scenario uses a native select or needs the iOS caret
 *     workaround.
 *
 * Real DOM + behavior assertions live in
 * src/qwik-cdk-parity-tests/specs/material-form-field/*.spec.ts (Qwik-only
 * DOM specs) and angular-parity.spec.ts (Angular-vs-Qwik DOM diffing — the
 * authoritative parity gate).
 */
import {describe, expect, it} from 'vitest';
import {
  MAT_INPUT_CONFIG,
  MAT_INPUT_CONFIG_DEFAULTS,
  MatInput,
  type MatInputProps,
} from './public-api';

describe('MatInput surface — sanity', () => {
  it('MatInput is exported and function-shaped', () => {
    expect(typeof MatInput).toBe('function');
  });

  it('MAT_INPUT_CONFIG carries the expected context id', () => {
    expect(MAT_INPUT_CONFIG.id).toBe('qwik-material/input-config');
  });

  it("MAT_INPUT_CONFIG_DEFAULTS mirrors upstream's implicit `_config?.disabledInteractive || false`", () => {
    expect(MAT_INPUT_CONFIG_DEFAULTS).toEqual({disabledInteractive: false});
  });

  it('MatInputProps accepts the full surface, including the inherited MatFormFieldControlProps contract fields', () => {
    const props: MatInputProps = {
      as: 'textarea',
      type: 'password',
      name: 'subscribe',
      rows: 3,
      maxLength: 10,
      disabledInteractive: true,
      class: 'my-class',
      // MatFormFieldControlProps (inherited):
      value: 'hi',
      disabled: false,
      required: true,
      readOnly: false,
      placeholder: 'placeholder',
      id: 'my-input',
      controlType: 'mat-input',
      'aria-describedby': 'hint-1',
      formBound: true,
      touched: true,
      dirty: true,
      invalid: false,
      onInput$: undefined,
      onFocus$: undefined,
      onBlur$: undefined,
    };
    expect(props.as).toBe('textarea');
    expect(props.formBound).toBe(true);
  });
});

describe.skip('MatInput DOM-rendered scenarios — verified via Playwright', () => {
  it('renders <input matInput class="mat-mdc-input-element mat-mdc-form-field-input-control mdc-text-field__input cdk-text-field-autofill-monitored"> (as="textarea" additionally adds mat-mdc-form-field-textarea-control and renders a real <textarea>…</textarea>, not self-closing)', () => {});
  it("`value` paints correctly at first render for a STATIC literal (e.g. disabled/readonly scenarios) and never leaves a stale `value` attribute behind for a CONTROLLED/reactive value (e.g. a bound useMatFormControl()) — see mat-input.tsx's own writeup for why this needed a one-time-snapshot JSX prop + an imperative ref-based useTask$ instead of a plain reactive value={...} prop", () => {});
  it('`disabled` (and not disabledInteractive) omits the native `disabled` attribute reflection rule: disabled && !disabledInteractive renders `disabled`; disabled && disabledInteractive instead adds mat-mdc-input-disabled-interactive + aria-disabled="true", keeping the control focusable/clickable', () => {});
  it('`readOnly` (or disabled+disabledInteractive) renders the literal STRING attribute readonly="true" — never bare readonly or "false"', () => {});
  it('`required` renders a bare `required` attribute (reflected boolean) + aria-required="true"; aria-invalid is OMITTED while empty+required, otherwise "true"/"false" from the computed errorState', () => {});
  it('formBound + touched + dirty + invalid render the ng-untouched/ng-touched, ng-pristine/ng-dirty, ng-valid/ng-invalid class trio on the input itself (mirrors NgControlStatus) — absent entirely (not merely false) when formBound is unset', () => {});
  it('focusing the control (when not disabled) sets the shared MAT_FORM_FIELD_CONTROL_STATE.focused + .shouldLabelFloat to true via a lazy onFocus$ handler (never a mount task); blurring recomputes .empty from the LIVE DOM value (via a ref, not a copied signal) and sets .shouldLabelFloat accordingly', () => {});
  it('a fallback id (mat-input-N) is generated only when no `id` prop is present — in practice always already injected by an owning MatFormField', () => {});
  it('`aria-describedby` forwards exactly what the prop carries — MatFormField is responsible for merging in its own hint/error ids before passing it down', () => {});
  it('MAT_INPUT_CONFIG (via QwikMaterialProvider matInputConfig) supplies disabledInteractive; an explicit prop always wins', () => {});
});

describe.skip('MatInput — Angular-only / out-of-scope (deferred forever)', () => {
  it("ControlValueAccessor / NgControl integration, AutofillMonitor's real animationstart-based autofill detection", () => {
    // Omitted — Qwik has no forms system; `formBound`/`touched`/`dirty`/
    // `invalid` are plain booleans the consumer computes via
    // core/mat-form-control.ts and passes in directly. The static
    // `cdk-text-field-autofill-monitored` marker class is always present
    // (see mat-input.tsx's own comment); no scenario exercises real
    // browser autofill.
  });
  it('native <select>/matNativeControl support (mat-mdc-native-select-inline, selectedIndex-driven floating)', () => {
    // Omitted — no parity scenario uses a native select.
  });
  it('iOS caret-jiggle workaround (_iOSKeyupListener)', () => {
    // Omitted — platform-specific workaround with no DOM-visible effect
    // any parity scenario could exercise.
  });
  it('focus()/updateErrorState() imperative methods', () => {
    // Omitted — no component-instance handle in Qwik; a consumer needing
    // this uses a ref to the rendered <input>/<textarea> directly.
  });
});
