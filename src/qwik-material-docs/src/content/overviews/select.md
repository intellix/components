`<MatSelect>` is a form control for selecting a value from a set of options, similar to the native
`<select>` element. You can read more about selects in the
[Material Design spec](https://material.io/design/components/menus.html). It's designed to work
inside of a [`<MatFormField>`](/components/form-field/overview/) element.

Options are passed as plain data via the `options` prop — an array of `{value, label, ...}`
entries — rather than as nested child elements:

```tsx
<MatFormField
  label={<MatLabel>Favorite food</MatLabel>}
  control={
    <MatSelect
      controlType="mat-select"
      options={[
        {value: 'steak', label: 'Steak'},
        {value: 'pizza', label: 'Pizza'},
        {value: 'tacos', label: 'Tacos'},
      ]}
    />
  }
/>
```

`MatSelect` renders `<MatOption>` internally for each entry; `content` (instead of `label`) lets
one option render richer JSX (e.g. with a leading icon) while `label` still supplies the plain-text
value used for the trigger and keyboard typeahead.

<!-- example(select-overview) -->

### Getting and setting the select value

`MatSelect` supports 2-way binding via the `value` prop + `onValueChange$`. Note that `value` is
read only ONCE, at first render, to set the *initial* selection — pass new values through
`onValueChange$`'s own round trip (store the current value in your own signal and reflect it back)
rather than expecting a later change to the `value` prop itself to move the selection.

<!-- example(select-value-binding) -->

`<MatSelect>` has no bundled form-library integration (no `FormControl`/`NgModel` equivalent) —
drive it from your own state, or see [Using with Formisch](/guide/using-with-formisch/) for a
`field.onInput(value)`-based wiring pattern (`MatSelect` is a "custom control" in that guide's
terms, since it has no native element of its own to register).

<!-- example(select-form) -->

### Form field features

A number of `<MatFormField>` features work with `<MatSelect>` — error messages, hint text, prefix
& suffix, and theming. See the [form field documentation](/components/form-field/overview/) for
these.

<!-- example(select-hint-error) -->

### Setting a static placeholder

The placeholder is text shown when the `<MatFormField>` label is floating but the select is empty.
Set it via the `placeholder` prop.

### Disabling the select or individual options

Pass `disabled` on `<MatSelect>` to disable the whole control, or set `disabled: true` on an
individual entry in `options` to disable just that option (or a whole group, via the group entry's
own `disabled`).

<!-- example(select-disabled) -->

### Resetting the select value

To let one option reset the selection, give it `value: undefined`.

<!-- example(select-reset) -->

### Creating groups of options

Give an `options` entry an `options` array of its own (instead of a `value`) to render it as a
group — `MatOptgroup`, with the entry's `label` as the group subheading:

```tsx
options={[
  {label: 'Fruit', options: [{value: 'apple', label: 'Apple'}, {value: 'pear', label: 'Pear'}]},
  {label: 'Vegetables', options: [{value: 'carrot', label: 'Carrot'}]},
]}
```

<!-- example(select-optgroup) -->

### Multiple selection

Pass the `multiple` prop to allow selecting more than one value at once — `value`/
`onValueChange$` then deal in arrays instead of a single value. Unlike upstream, this port doesn't
guard against changing `multiple` dynamically after the first render (no current scenario relies
on that), so avoid toggling it on a live instance.

<!-- example(select-multiple) -->

### Customizing the trigger label

Pass `customTrigger` (a `JSXOutput`) to render custom content inside the trigger instead of the
default "joined option labels" text.

<!-- example(select-custom-trigger) -->

### Adding custom styles to the dropdown panel

`panelClass` adds extra CSS classes to the dropdown panel's listbox element
(`.mat-mdc-select-panel`). For the surrounding overlay pane instead, set `overlayPanelClass` via
`<QwikMaterialProvider matSelectConfig={{overlayPanelClass: '...'}}>`.

<!-- example(select-panel-class) -->

### Keyboard interaction

| Keyboard shortcut | Action |
|---|---|
| <kbd>Down Arrow</kbd> | Navigate to the next option. |
| <kbd>Up Arrow</kbd> | Navigate to the previous option. |
| <kbd>Enter</kbd> | If closed, open the select panel. If open, selects the active option. |
| <kbd>Escape</kbd> | Close the select panel. |
| <kbd>Alt</kbd> + <kbd>Up Arrow</kbd> | Close the select panel. |
| <kbd>Alt</kbd> + <kbd>Down Arrow</kbd> | Open the select panel if there are any matching options. |

### Accessibility

When possible, prefer a native `<select>` element over `MatSelect` — it provides the most
accessible experience across the widest range of platforms.

`MatSelect` implements the combobox pattern from the ARIA 1.2 specification: the trigger controls
a `role="listbox"` element opened in a pop-up. Because the pop-up uses the listbox pattern, don't
put other interactive controls (buttons, checkboxes) inside an option — this interferes with most
assistive technology.

Always provide an accessible label: a `<MatLabel>` inside `<MatFormField>`, or the `aria-label` /
`aria-labelledby` prop directly on `<MatSelect>`.

By default, `MatSelect` shows a checkmark to identify selected items. `hideSingleSelectionIndicator`
hides it for single-selection mode, at the cost of making selected items harder to identify
visually — use with care.

## Angular → Qwik notes

- **Options are data, not projected content.** Angular projects `<mat-option>` elements as children
  of `<mat-select>`; qwik-material instead takes a plain `options: MatSelectEntryDef[]` prop
  (`{value, label, content?, disabled?}`, or `{label, options: [...]}` for a group) —
  `MatOption`/`MatOptgroup` still exist as components but `MatSelect` renders them internally from
  this data rather than you nesting them by hand.
- **`value` is read once, not live.** Unlike most qwik-material props, writing a new value into
  the `value` prop after first render does *not* move the selection — drive changes through
  `onValueChange$`'s own round trip instead.
- **Not ported:** `compareWith` (custom value-equality function), `disableRipple`, and
  `errorStateMatcher` (no bundled form-library validity model to match against — see
  [Migrating from Angular Material](/guide/migrating-from-angular-material/)'s `FormControl` row).
- **`canSelectNullableOptions` and `disableOptionCentering`** exist on `MatSelectConfig` for API
  shape parity but currently have no effect — no scenario in this port exercises either.
- **No native `<select matNativeControl>` support.** `<MatInput>` doesn't implement a native-select
  mode; a form field with a native `<select>` needs its own small control component implementing
  the same `MatFormFieldControlProps` contract `MatInput`/`MatSelect` do (see
  [Form Field → Custom form field controls](/components/form-field/overview/#custom-form-field-controls)).
