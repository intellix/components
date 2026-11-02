/**
 * MatButtonToggle scenario port from src/material/button-toggle/button-toggle.spec.ts.
 *
 * Upstream has ~60+ `it()` blocks — heavy on SelectionModel internals,
 * EventEmitter.emit() assertions, and Angular Forms (CVA) integration.
 * `createDOM()` hangs this package's vitest worker (see mat-button's own
 * scenario-port comment for the same finding), so no DOM-render tests are
 * attempted here either way. Restructured:
 *
 *   - Live sanity tests (7): typeof + context ids + DEFAULTS shape +
 *     no-op onToggle safety + mode union + props shapes.
 *   - describe.skip DOM-rendered (7): group + child roles, single-mode
 *     toggle + roving tabindex, multi-mode toggle, group-level disabled,
 *     individual disabled, keyboard arrow-key nav, name/form participation,
 *     FocusMonitor classes, pseudo-checkbox + ripple + focus-overlay spans.
 *     Deferred to the Playwright specs below (2026-10-27 DOM-parity
 *     remediation re-port — these are now IMPLEMENTED, just verified via a
 *     real browser instead of vitest).
 *   - describe.skip Angular-only (2): CVA, SelectionModel. Deferred forever
 *     — Qwik has no forms system / RxJS collections equivalent (spec §5
 *     deviations #1, #2 in SYNC.md's "earlier deviations" history).
 *
 * Real DOM + behavior assertions live in
 * src/qwik-cdk-parity-tests/specs/material-button-toggle/*.spec.ts
 * (Qwik-only DOM specs) and angular-parity.spec.ts (Angular-vs-Qwik DOM
 * diffing — the authoritative parity gate).
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

  it('MAT_BUTTON_TOGGLE_GROUP_STATE carries expected id + DEFAULTS has all 9 fields', () => {
    expect(MAT_BUTTON_TOGGLE_GROUP_STATE.id).toBe('qwik-material/button-toggle-group-state');
    expect(MAT_BUTTON_TOGGLE_GROUP_STATE_DEFAULTS).toEqual({
      mode: 'single',
      value: undefined,
      values: [],
      disabled: false,
      disableRipple: false,
      name: '',
      onToggle: MAT_BUTTON_TOGGLE_GROUP_STATE_DEFAULTS.onToggle,
      standalone: true,
      fallbackTabIndexClaimed: {value: true},
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
      class: 'my-toggle',
    };
    expect(groupProps.values).toEqual(['read', 'write']);
    expect(toggleProps.value).toBe('bold');
  });
});

describe.skip('MatButtonToggle DOM-rendered scenarios — verified via Playwright', () => {
  it('MatButtonToggleGroup renders <mat-button-toggle-group> with role="radiogroup" + mat-button-toggle-group-appearance-standard in single mode, role="group" in multi mode (no "-multiple" class — not an upstream class)', () => {});
  it('MatButtonToggle in single-mode group renders role="radio" + aria-checked; in multi mode AND standalone renders role="button" + aria-pressed (upstream: role is radio|button only, never checkbox)', () => {});
  it('Single-select roving tabindex: selected toggle (or first enabled, if none selected) gets tabindex=0, every other single-select sibling gets tabindex=-1; multi-select and standalone toggles stay tabindex=0', () => {});
  it('Clicking a MatButtonToggle in single mode fires onChange$(value); re-clicking the already-selected toggle is a no-op (radio semantics — never deselects)', () => {});
  it('Clicking a MatButtonToggle in multi mode adds/removes from values array via onValuesChange$', () => {});
  it('Arrow-key navigation (single-select group only): Left/Up and Right/Down move the roving tabindex + selection to the next non-disabled toggle, wrapping around; Space/Enter activate the focused toggle', () => {});
  it('Group-level disabled: every child gets the native `disabled` attribute on its inner <button> (no aria-disabled on the outer host — disabledInteractive not ported)', () => {});
  it("Individual-button disabled: only that toggle's inner <button> gets `disabled`; group and siblings unaffected", () => {});
  it("name on group: single-select mode mirrors group.name (auto-generated via the id generator when omitted) onto every inner <button>'s `name` attribute; multi-select/standalone use the toggle's own `name` prop or omit it. No hidden <input> is ever rendered — upstream has none", () => {});
  it('FocusMonitor: focusing a toggle via Tab sets cdk-focused + cdk-keyboard-focused on the outer host; mouse-driven focus sets cdk-mouse-focused instead; blur clears all of them', () => {});
  it('Grouped toggles (single AND multi mode) render a .mat-button-toggle-checkbox-wrapper > <mat-pseudo-checkbox appearance="minimal" state="checked"> (state is always "checked" — visibility is CSS-driven by the ancestor .mat-button-toggle-checked, not the pseudo-checkbox\'s own state); standalone toggles render neither', () => {});
  it('Every toggle renders a .mat-button-toggle-focus-overlay span and a matripple .mat-ripple.mat-button-toggle-ripple span as the last two host children', () => {});
});

describe.skip('MatButtonToggle — Angular-only tests (deferred forever)', () => {
  it('should implement ControlValueAccessor (writeValue / registerOnChange / setDisabledState)', () => {
    // Omitted — Qwik has no forms system (earlier spec §5 deviation #1).
  });
  it('should manage selection via SelectionModel + .selected / .deselect / .toggle API', () => {
    // Replaced by plain arrays + context (earlier spec §5 deviation #2).
  });
});
