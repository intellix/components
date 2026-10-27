/**
 * MatButtonToggle scenario port from src/material/button-toggle/button-toggle.spec.ts.
 *
 * Upstream has ~60+ `it()` blocks — heavy on SelectionModel internals,
 * EventEmitter.emit() assertions, FocusMonitor origin tracking, keyboard
 * arrow-key handlers, ripple, and Angular Forms (CVA) integration. All
 * of that is moot in the port (spec §5 deviations #1-#9). Restructured:
 *
 *   - Live sanity tests (7): typeof + context ids + DEFAULTS shape +
 *     no-op onToggle safety + mode union + props shapes.
 *   - describe.skip DOM-rendered (7): group + child roles, single-mode
 *     toggle + deselect, multi-mode toggle, group-level disabled,
 *     individual disabled, form-name hidden input. Deferred to
 *     Playwright Task 9 + verified live at Task 11.
 *   - describe.skip Angular-only (4): CVA, SelectionModel, FocusMonitor
 *     + arrow keys, ripple + PseudoCheckbox + IdGenerator + niche flags.
 *     Deferred forever per spec §5.
 *
 * Real DOM assertions live in
 * src/qwik-cdk-parity-tests/specs/material-button-toggle/*.spec.ts,
 * verified against a running Chromium preview in Task 11.
 */
import {describe, it, expect} from 'vitest';
import {
  MAT_BUTTON_TOGGLE_CONFIG,
  MAT_BUTTON_TOGGLE_GROUP_STATE,
  MAT_BUTTON_TOGGLE_GROUP_STATE_DEFAULTS,
  MatButtonToggleGroup,
  MatButtonToggle,
  type MatButtonToggleConfig,
  type MatButtonToggleGroupMode,
  type MatButtonToggleGroupProps,
  type MatButtonToggleProps,
} from './public-api';

describe('MatButtonToggle surface — sanity', () => {
  it('MatButtonToggleGroup and MatButtonToggle are exported and function-shaped', () => {
    expect(typeof MatButtonToggleGroup).toBe('function');
    expect(typeof MatButtonToggle).toBe('function');
  });

  it('MAT_BUTTON_TOGGLE_CONFIG carries the expected context id + empty config accepts {}', () => {
    expect(MAT_BUTTON_TOGGLE_CONFIG.id).toBe('qwik-material/button-toggle-config');
    const cfg: MatButtonToggleConfig = {};
    expect(cfg).toBeDefined();
  });

  it('MAT_BUTTON_TOGGLE_GROUP_STATE carries expected id + DEFAULTS has all 7 fields', () => {
    expect(MAT_BUTTON_TOGGLE_GROUP_STATE.id).toBe('qwik-material/button-toggle-group-state');
    expect(MAT_BUTTON_TOGGLE_GROUP_STATE_DEFAULTS).toEqual({
      mode: 'single',
      value: undefined,
      values: [],
      disabled: false,
      name: '',
      onToggle: MAT_BUTTON_TOGGLE_GROUP_STATE_DEFAULTS.onToggle,
      standalone: true,
    });
    expect(typeof MAT_BUTTON_TOGGLE_GROUP_STATE_DEFAULTS.onToggle).toBe('function');
  });

  it('DEFAULTS.onToggle is a no-op that does not throw when invoked', async () => {
    // The no-op QRL should be safely invokable by a standalone toggle's fallback path.
    await expect(
      MAT_BUTTON_TOGGLE_GROUP_STATE_DEFAULTS.onToggle('foo', true),
    ).resolves.toBeUndefined();
  });

  it('MatButtonToggleGroupMode union covers exactly "single" | "multi"', () => {
    const single: MatButtonToggleGroupMode = 'single';
    const multi: MatButtonToggleGroupMode = 'multi';
    expect(single).toBe('single');
    expect(multi).toBe('multi');
  });

  it('MatButtonToggleGroupProps accepts full single-mode surface', () => {
    const props: MatButtonToggleGroupProps = {
      multiple: false,
      value: 'bold',
      onChange$: MAT_BUTTON_TOGGLE_GROUP_STATE_DEFAULTS.onToggle as any,
      disabled: false,
      name: 'style',
      role: 'radiogroup',
      'aria-label': 'Text style',
      'aria-labelledby': 'style-heading',
      'aria-describedby': 'style-desc',
      class: 'my-group',
      id: 'style-group',
    };
    expect(props.value).toBe('bold');
    expect(props.multiple).toBe(false);
  });

  it('MatButtonToggleGroupProps accepts multi-mode surface + MatButtonToggleProps accepts full surface', () => {
    const groupProps: MatButtonToggleGroupProps = {
      multiple: true,
      values: ['read', 'write'],
      onValuesChange$: MAT_BUTTON_TOGGLE_GROUP_STATE_DEFAULTS.onToggle as any,
      disabled: true,
      name: 'perms',
    };
    const toggleProps: MatButtonToggleProps = {
      value: 'bold',
      disabled: false,
      id: 'bold-toggle',
      name: 'style-override',
      'aria-label': 'Bold',
      'aria-labelledby': 'bold-heading',
      'aria-describedby': 'bold-desc',
      class: 'my-toggle',
    };
    expect(groupProps.values).toEqual(['read', 'write']);
    expect(toggleProps.value).toBe('bold');
  });
});

describe.skip('MatButtonToggle DOM-rendered scenarios — deferred to Playwright Task 9', () => {
  it('MatButtonToggleGroup renders <mat-button-toggle-group> with role="radiogroup" in single mode + role="group" + mat-button-toggle-group-multiple class in multi mode', () => {});
  it('MatButtonToggle in single-mode group renders role="radio" + aria-checked; in multi mode renders role="checkbox" + aria-checked; standalone renders role="button" + aria-pressed', () => {});
  it('Clicking a MatButtonToggle in single mode fires onChange$(value); clicking currently-selected toggle fires onChange$(undefined)', () => {});
  it('Clicking a MatButtonToggle in multi mode adds/removes from values array via onValuesChange$', () => {});
  it('Group-level disabled cascades: all children reflect aria-disabled="true" and are non-interactive', () => {});
  it('Individual-button disabled reflects aria-disabled="true" on that button only; group and siblings unaffected', () => {});
  it('name prop on group: checked toggles emit <input name value>; unchecked do not', () => {});
});

describe.skip('MatButtonToggle — Angular-only tests', () => {
  it('should implement ControlValueAccessor (writeValue / registerOnChange / setDisabledState)', () => {
    // Omitted — Qwik has no forms system (spec §5 deviation #1).
  });
  it('should manage selection via SelectionModel + .selected / .deselect / .toggle API', () => {
    // Replaced by plain arrays + context (spec §5 deviation #2).
  });
  it('should use FocusMonitor + roving tabindex + arrow-key navigation', () => {
    // Native Tab per button; no arrow keys (spec §5 deviations #4, #5).
  });
  it('should integrate ripple + MatPseudoCheckbox + _IdGenerator + legacy appearance + vertical + hideIndicator + disabledInteractive', () => {
    // All out of scope (spec §5 deviations #6, #7, #8).
  });
});
