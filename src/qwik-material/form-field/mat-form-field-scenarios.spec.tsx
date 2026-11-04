/**
 * MatFormField scenario port. Upstream has NO dedicated `form-field.spec.ts`
 * in this checkout (only `testing/form-field-harness.spec.ts`, the harness's
 * own test) — `MatFormField`'s real behavior is tested TOGETHER with
 * `MatInput` in `src/material/input/input.spec.ts` (2418 lines; most of its
 * `describe('MatFormField default options', ...)`/
 * `describe('MatFormField without label', ...)` blocks, plus every
 * `MatInput`-driven form-field class/attribute assertion, directly exercise
 * `MatFormField`). This package's vitest `createDOM()` hangs (see
 * mat-button's own scenario-port comment for the same finding), so no
 * DOM-render tests are attempted here either way. Restructured:
 *
 *   - Live sanity tests: typeof + context id + CONFIG_DEFAULTS shape + props
 *     shape + the control-contract helper functions (`readControlProps`).
 *   - describe.skip DOM-rendered: every behavior upstream's
 *     `input.spec.ts`/`MatFormField` surface exercises that's ALSO
 *     implemented here, verified via a real browser instead of vitest
 *     (angular-parity.spec.ts is the authoritative gate for all 16
 *     scenarios; a few behaviors it doesn't reach get dedicated Qwik-only
 *     Playwright specs instead — see `specs/material-form-field/*.spec.ts`).
 *   - describe.skip Angular-only: things with no Qwik equivalent at all
 *     (native `<select>` support, `ErrorStateMatcher` injection,
 *     `OnPush`/`markForCheck` interactions, ng-container prefix/suffix).
 *
 * Real DOM + behavior assertions live in
 * src/qwik-cdk-parity-tests/specs/material-form-field/*.spec.ts (Qwik-only
 * DOM specs) and angular-parity.spec.ts (Angular-vs-Qwik DOM diffing — the
 * authoritative parity gate).
 */
import {describe, expect, it} from 'vitest';
import {
  MAT_FORM_FIELD_CONFIG,
  MAT_FORM_FIELD_CONFIG_DEFAULTS,
  MatError,
  MatFormField,
  MatHint,
  MatIconPrefix,
  MatIconSuffix,
  MatLabel,
  MatTextPrefix,
  MatTextSuffix,
  type MatFormFieldConfig,
  type MatFormFieldProps,
} from './public-api';
import {
  MAT_FORM_FIELD_CONTROL_STATE,
  readControlProps,
  type MatFormFieldControlProps,
} from '../core/mat-form-field-control';

describe('MatFormField surface — sanity', () => {
  it('MatFormField and every content component are exported and function-shaped', () => {
    expect(typeof MatFormField).toBe('function');
    expect(typeof MatLabel).toBe('function');
    expect(typeof MatHint).toBe('function');
    expect(typeof MatError).toBe('function');
    expect(typeof MatIconPrefix).toBe('function');
    expect(typeof MatTextPrefix).toBe('function');
    expect(typeof MatIconSuffix).toBe('function');
    expect(typeof MatTextSuffix).toBe('function');
  });

  it('MAT_FORM_FIELD_CONFIG carries the expected context id', () => {
    expect(MAT_FORM_FIELD_CONFIG.id).toBe('qwik-material/form-field-config');
  });

  it('MAT_FORM_FIELD_CONTROL_STATE carries the expected context id', () => {
    expect(MAT_FORM_FIELD_CONTROL_STATE.id).toBe('qwik-material/form-field-control-state');
  });

  it('MAT_FORM_FIELD_CONFIG_DEFAULTS mirrors upstream DEFAULT_APPEARANCE/DEFAULT_FLOAT_LABEL/DEFAULT_SUBSCRIPT_SIZING + MatFormField.color', () => {
    expect(MAT_FORM_FIELD_CONFIG_DEFAULTS).toEqual({
      appearance: 'fill',
      color: 'primary',
      hideRequiredMarker: false,
      floatLabel: 'auto',
      subscriptSizing: 'fixed',
    });
  });

  it('MatFormFieldConfig accepts a partial override', () => {
    const cfg: MatFormFieldConfig = {appearance: 'outline'};
    expect(cfg.color).toBeUndefined();
  });

  it('MatFormFieldProps accepts the full named-content-prop surface', () => {
    const props: MatFormFieldProps = {
      appearance: 'outline',
      floatLabel: 'always',
      hideRequiredMarker: true,
      subscriptSizing: 'dynamic',
      color: 'accent',
      hintLabel: 'Max 10',
      label: null,
      iconPrefix: null,
      textPrefix: null,
      iconSuffix: null,
      textSuffix: null,
      hintStart: null,
      hintEnd: null,
      errors: null,
      control: null,
      class: 'my-class',
      style: 'width: 300px',
      id: 'my-field',
    };
    expect(props.appearance).toBe('outline');
    expect(props.subscriptSizing).toBe('dynamic');
  });
});

describe('readControlProps — the static half of the control contract', () => {
  it('returns undefined for non-element values', () => {
    expect(readControlProps(undefined)).toBeUndefined();
    expect(readControlProps(null)).toBeUndefined();
    expect(readControlProps('text')).toBeUndefined();
    expect(readControlProps(42)).toBeUndefined();
    expect(readControlProps([])).toBeUndefined();
  });

  it('reads .props off a JSX element descriptor without executing it', () => {
    // A plain object shaped like a JSXNode — deliberately not importing a
    // real component, since the whole point is this never RENDERS anything.
    const fakeNode = {
      type: () => null,
      props: {value: 'hi', disabled: true},
      key: null,
      children: null,
    };
    const props = readControlProps(fakeNode) as MatFormFieldControlProps;
    expect(props.value).toBe('hi');
    expect(props.disabled).toBe(true);
  });
});

describe.skip('MatFormField DOM-rendered scenarios — verified via Playwright', () => {
  it('renders <mat-form-field class="mat-mdc-form-field mat-mdc-form-field-type-mat-input mat-form-field-appearance-{fill,outline} mat-{primary,accent,warn}"> wrapping .mat-mdc-text-field-wrapper.mdc-text-field', () => {});
  it('appearance="outline" renders the notched-outline wrapper (leading/notch/trailing pieces) with the floating label inside the notch instead of the infix, and omits the focus-overlay + line-ripple divs entirely', () => {});
  it('a <MatLabel> child drives _hasFloatingLabel(): renders the <label matFormFieldFloatingLabel> wrapper with for=<control id>, id=mat-mdc-form-field-label-N; absent entirely when no `label` prop is passed', () => {});
  it('floatLabel="always" adds mat-mdc-form-field-label-always-float on the host and floats the label from first paint, independent of focus/empty', () => {});
  it('focusing the control activates the line-ripple (fill) / notches the outline + measures the label scrollWidth for the notch width formula (outline); blurring deactivates the ripple after its transitionend, and a never-focused field stays permanently mdc-line-ripple--deactivating (the pristine quirk)', () => {});
  it("`required` (explicit prop OR derived from the control passing formBound+validators through) renders the mdc-floating-label--required marker span, suppressed by `hideRequiredMarker` without touching the control's own required attribute/aria-required", () => {});
  it('`disabled` (read off the control prop) adds mat-form-field-disabled + mdc-text-field--disabled and removes the .mat-mdc-form-field-focus-overlay div entirely (fill only; outline never renders it)', () => {});
  it('hintStart/hintEnd/hintLabel render inside .mat-mdc-form-field-hint-wrapper either side of the always-present .mat-mdc-form-field-hint-spacer, each with a generated mat-mdc-hint-N id (or the explicit id the consumer set) feeding aria-describedby in order', () => {});
  it('`errors` only actually renders (swapping the hint wrapper for .mat-mdc-form-field-error-wrapper) when the control reports formBound+touched+invalid; otherwise the hint wrapper (even with zero hints) still renders', () => {});
  it('iconPrefix/textPrefix/iconSuffix/textSuffix each render inside their own .mat-mdc-form-field-{icon,text}-{prefix,suffix} container; only icon variants add mat-mdc-form-field-has-icon-{prefix,suffix} to the host', () => {});
  it('subscriptSizing="dynamic" adds mat-mdc-form-field-subscript-dynamic-size to the subscript wrapper; "fixed" (default) adds nothing', () => {});
  it('mat-form-field-animations-enabled is added to the host ~300ms after mount, once, regardless of interaction (unless MAT_ANIMATIONS_DISABLED)', () => {});
  it('MAT_FORM_FIELD_CONFIG (via useMatFormFieldProvider) supplies appearance/color/hideRequiredMarker/floatLabel/subscriptSizing defaults; an explicit prop always wins', () => {});
});

describe.skip('MatFormField — Angular-only / out-of-scope (deferred forever)', () => {
  it('native <select>/matNativeControl support (mat-mdc-native-select-inline, floating logic keyed off selectedIndex/option label)', () => {
    // Omitted — no parity scenario uses a native select; MatInput only
    // ports the input/textarea half of upstream's directive selector.
  });
  it('ng-container as prefix/suffix (structural-directive content projection)', () => {
    // Omitted — Qwik has no structural-directive/ng-container equivalent;
    // every prefix/suffix scenario here uses a plain element.
  });
  it('custom ErrorStateMatcher injection / ShowOnDirtyErrorStateMatcher', () => {
    // Omitted — this port hardcodes the DEFAULT matcher's formula
    // (invalid && touched) directly; no scenario needs a custom one.
  });
  it('OnPush change detection interactions (markForCheck timing)', () => {
    // Omitted — no change-detection system in Qwik; signal/prop reactivity
    // is its own trigger.
  });
});
