/**
 * MatRadioButton / MatRadioGroup scenario port from
 * src/material/radio/radio.spec.ts.
 *
 * Upstream has ~65 `it()` blocks — heavy on `TestBed`/`ComponentFixture` DOM
 * assertions, Angular Forms (`ngModel`/`FormControl`) integration, and
 * `fakeAsync`. `createDOM()` hangs this package's vitest worker (see
 * mat-button's own scenario-port comment for the same finding), so no
 * DOM-render tests are attempted here either way. Restructured:
 *
 *   - Live sanity tests: typeof + context ids + DEFAULTS shape + no-op
 *     onChange$ safety + props shapes.
 *   - describe.skip DOM-rendered: group/button roles, roving tabindex,
 *     color inheritance + precedence, disabled/disabledInteractive
 *     cascading, required, standalone same-`name` native grouping, aria-*
 *     passthrough, FocusMonitor classes, ripple/touch-target DOM. Deferred
 *     to the Playwright specs — real DOM/behavior assertions live in
 *     src/qwik-cdk-parity-tests/specs/material-radio/*.spec.ts (Qwik-only)
 *     and angular-parity.spec.ts (Angular-vs-Qwik DOM diffing — the
 *     authoritative parity gate).
 *   - describe.skip Angular-only: ngModel/FormControl/CVA. Deferred forever
 *     — Qwik has no forms system equivalent.
 */
import {describe, it, expect} from 'vitest';
import {
  MAT_RADIO_CONFIG,
  MAT_RADIO_CONFIG_DEFAULTS,
  MAT_RADIO_GROUP_STATE,
  MAT_RADIO_GROUP_STATE_DEFAULTS,
  MatRadioGroup,
  MatRadioButton,
  type MatRadioConfig,
  type MatRadioGroupProps,
  type MatRadioButtonProps,
} from './public-api';

describe('MatRadio surface — sanity', () => {
  it('MatRadioGroup and MatRadioButton are exported and function-shaped', () => {
    expect(typeof MatRadioGroup).toBe('function');
    expect(typeof MatRadioButton).toBe('function');
  });

  it('MAT_RADIO_CONFIG carries the expected context id + DEFAULTS mirror upstream factory', () => {
    expect(MAT_RADIO_CONFIG.id).toBe('qwik-material/radio-config');
    expect(MAT_RADIO_CONFIG_DEFAULTS).toEqual({color: 'accent', disabledInteractive: false});
    const cfg: MatRadioConfig = {};
    expect(cfg).toBeDefined();
  });

  it('MAT_RADIO_GROUP_STATE carries expected id + DEFAULTS has all 9 fields', () => {
    expect(MAT_RADIO_GROUP_STATE.id).toBe('qwik-material/radio-group-state');
    expect(MAT_RADIO_GROUP_STATE_DEFAULTS).toEqual({
      value: undefined,
      name: '',
      disabled: false,
      required: false,
      disabledInteractive: false,
      labelPosition: 'after',
      color: undefined,
      onChange$: MAT_RADIO_GROUP_STATE_DEFAULTS.onChange$,
      standalone: true,
    });
    expect(typeof MAT_RADIO_GROUP_STATE_DEFAULTS.onChange$).toBe('function');
  });

  it('DEFAULTS.onChange$ is a no-op that does not throw when invoked', async () => {
    await expect(MAT_RADIO_GROUP_STATE_DEFAULTS.onChange$('foo', 1)).resolves.toBeUndefined();
  });

  it('MatRadioGroupProps accepts the full surface', () => {
    const props: MatRadioGroupProps = {
      value: 'a',
      onChange$:
        MAT_RADIO_GROUP_STATE_DEFAULTS.onChange$ as unknown as MatRadioGroupProps['onChange$'],
      name: 'season',
      labelPosition: 'before',
      disabled: false,
      required: true,
      disabledInteractive: false,
      color: 'primary',
      'aria-label': 'Favorite season',
      'aria-labelledby': 'heading',
      'aria-describedby': 'desc',
      class: 'my-group',
      id: 'season-group',
    };
    expect(props.value).toBe('a');
    expect(props.color).toBe('primary');
  });

  it('MatRadioButtonProps accepts the full surface', () => {
    const props: MatRadioButtonProps = {
      value: 'a',
      checked: true,
      id: 'a-radio',
      name: 'flavor',
      'aria-label': 'Vanilla',
      'aria-labelledby': 'heading',
      'aria-describedby': 'desc',
      disabled: false,
      disabledInteractive: false,
      required: true,
      tabIndex: 0,
      labelPosition: 'before',
      color: 'warn',
      onChange$:
        MAT_RADIO_GROUP_STATE_DEFAULTS.onChange$ as unknown as MatRadioButtonProps['onChange$'],
      class: 'my-radio',
    };
    expect(props.value).toBe('a');
    expect(props.color).toBe('warn');
  });
});

describe.skip('MatRadio DOM-rendered scenarios — verified via Playwright', () => {
  it('MatRadioGroup renders <mat-radio-group role="radiogroup" class="mat-mdc-radio-group">; a plain aria-label passed through is NOT a declared Input, matching the upstream @Directive host (no aria-* host bindings at all)', () => {});
  it('MatRadioButton renders <mat-radio-button> > div[mat-internal-form-field].mdc-form-field.mat-internal-form-field > div.mdc-radio > (touch-target, input[type=radio], mdc-radio__background, mat-ripple) + label.mdc-label', () => {});
  it('Grouped buttons: clicking an unchecked radio checks it and unchecks the previously-checked one via the shared group value (upstream _updateSelectedRadioFromValue); re-clicking the already-checked radio is a native no-op (no "change" event fires)', () => {});
  it('Roving tabindex: nothing selected in the group yet → every (non-disabled) radio keeps its own tabIndex (default 0, native browser tab order); once something is selected, only the selected radio is tabindex=0, every sibling is -1; a DISABLED radio always keeps its own tabIndex (upstream checks `this.disabled` before `group.selected`)', () => {});
  it('Native ArrowUp/ArrowDown/ArrowLeft/ArrowRight move focus AND checked state to the next/previous same-`name` radio — pure browser behavior, no Qwik keydown handler needed (unlike button-toggle, which reimplements its own roving-tabindex keydown)', () => {});
  it('color: own `color` > group `color` > MAT_RADIO_CONFIG.color > "accent"; drives mat-primary/mat-accent/mat-warn host classes on each button independently of which one is checked', () => {});
  it("disabled/required/disabledInteractive cascade: group-level OR'd with the button's own; disabled sets the native input's `disabled` attribute unless disabledInteractive, in which case `aria-disabled=\"true\"` is set instead and a click handler on the input calls preventDefault to block selection", () => {});
  it('Standalone buttons (no MatRadioGroup ancestor) sharing a `name` rely on native same-name radio-input grouping to uncheck each other — no cross-component dispatcher; each button\'s own native "change" listener updates its local checked signal and fires its own onChange$', () => {});
  it("aria-label/aria-labelledby/aria-describedby are consumed-only Inputs rendered on the inner <input>, never the host — matches upstream's `[attr.aria-label]: null` etc. host bindings that explicitly strip them from <mat-radio-button>", () => {});
  it('FocusMonitor-equivalent: focusing a button (Tab, or clicking the touch target) sets cdk-focused + cdk-keyboard-focused/cdk-mouse-focused/cdk-touch-focused/cdk-program-focused on the <mat-radio-button> host; blur clears them', () => {});
  it('disable-ripple UX is DOM-static only: every button renders div[mat-ripple].mat-ripple.mat-radio-ripple.mat-focus-indicator > div.mat-ripple-element.mat-radio-persistent-ripple regardless of checked/disabled state (ripple click-animation itself out of scope)', () => {});
});

describe.skip('MatRadio — Angular-only tests (deferred forever)', () => {
  it('should write to the radio button based on ngModel / update the ngModel value when selecting a radio button', () => {
    // Omitted — Qwik has no forms system (ControlValueAccessor equivalent).
  });
  it('group with FormControl: should toggle the disabled state / have a selected button when one matches the initial value', () => {
    // Omitted — no Angular Forms equivalent in this port.
  });
});
