`<MatButtonToggle>`s are on/off toggles with the appearance of a button. These toggles can be
configured to behave as either radio-buttons or checkboxes. While they can be standalone, they
are typically part of a `<MatButtonToggleGroup>`.

<!-- example(button-toggle-overview) -->

### Exclusive selection vs. multiple selection
By default, `<MatButtonToggleGroup>` acts like a radio-button group — only one item can be
selected. In this mode, the `value` prop of the group reflects the value of the selected button,
fed back through `onChange$`.

Passing the `multiple` prop allows multiple items to be selected (checkbox behavior). In this
mode the group takes `values`/`onValuesChange$` instead of `value`/`onChange$`.

<!-- example(button-toggle-mode) -->

### Appearance
This port only implements the modern (M3) appearance — there is no `appearance` prop and no
"legacy" variant; see [Angular → Qwik notes](#angular-qwik-notes) below.

<!-- example(button-toggle-appearance) -->

### Use with forms
There is no Angular Forms integration in this port — `<MatButtonToggleGroup>` is a controlled
component, same as `<MatRadioGroup>`.

### Orientation
There is no `vertical` prop in this port — see [Angular → Qwik notes](#angular-qwik-notes).

### Hiding the selection indicator

By default, every grouped toggle (single- or multiple-selection) renders a checkmark indicator.
`<MatButtonToggleGroup hideSingleSelectionIndicator>` hides it for single-selection groups;
`hideMultipleSelectionIndicator` hides it for multiple-selection groups — each only affects the
mode it names (a single-selection group ignores `hideMultipleSelectionIndicator`, and vice
versa), matching upstream exactly. Both are also configurable app-wide via
`<QwikMaterialProvider matButtonToggleConfig={{hideSingleSelectionIndicator: true}}>`.

```tsx
<MatButtonToggleGroup hideSingleSelectionIndicator value={style.value} onChange$={...}>
  <MatButtonToggle value="bold">Bold</MatButtonToggle>
  <MatButtonToggle value="italic">Italic</MatButtonToggle>
</MatButtonToggleGroup>
```

### Accessibility
`<MatButtonToggle>` internally uses native `<button>` elements with `aria-pressed` to convey
toggle state. If a toggle contains only an icon, you should specify a meaningful label via the
`aria-label` or `aria-labelledby` prop.

```tsx
<MatButtonToggle aria-label={alertsEnabled.value ? 'Disable alerts' : 'Enable alerts'}>
  <MatIcon>notifications</MatIcon>
</MatButtonToggle>
```

`<MatButtonToggleGroup>` surrounding the individual buttons applies `role="group"` (or
`role="radiogroup"` in single-select mode) to convey the association between the individual
toggles. Each `<MatButtonToggleGroup>` should be given a label with `aria-label` or
`aria-labelledby` that communicates the collective meaning of all toggles. For example, if you
have toggles for "Bold", "Italic", and "Underline", you might label the parent group "Font
styles".

## Angular → Qwik notes

- **No Angular Forms integration.** `ControlValueAccessor`/`NG_VALUE_ACCESSOR` have no Qwik
  equivalent — replaced by the controlled-component pattern (the group takes `value`/`values` +
  `onChange$`/`onValuesChange$` QRLs; no `.emit()` `EventEmitter` API, no `SelectionModel`).
- **No `appearance` prop — the deprecated "legacy" visual variant isn't ported.** Every group/
  toggle renders the modern (M3) "standard" appearance only.
- **No `vertical` prop.** The synced SCSS's `.mat-button-toggle-vertical` rules are unreachable
  dead code in this port's output.
- **`hideSingleSelectionIndicator` / `hideMultipleSelectionIndicator` are ported** — see "Hiding
  the selection indicator" above.
- **No `disabledInteractive` prop.** A disabled toggle's inner `<button>` always gets the native
  `disabled` attribute; there's no focusable-but-inert variant.
- **No RTL support.** Arrow-key navigation is LTR-only.
- **Global defaults via `QwikMaterialProvider`**, not an `MAT_BUTTON_TOGGLE_DEFAULT_OPTIONS`
  injection token.
- **Harness not ported.**

**Known parity gap:** `button-toggle-appearance`'s "Legacy appearance" section can only render
with the standard appearance (there's no legacy template to render instead), so its DOM can never
match upstream's distinctly-styled legacy group — tracked as an expected parity-suite failure,
not a bug.
