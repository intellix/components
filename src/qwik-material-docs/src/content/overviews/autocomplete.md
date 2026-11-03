The autocomplete is a normal text input enhanced by a panel of suggested options.

### Simple autocomplete

`<MatAutocomplete>` renders both the native `<input>` and the (always-empty, overlay-attached)
`<mat-autocomplete>` placeholder as a single component — pass it as a `<MatFormField>`'s
`control`, same as `<MatInput>`/`<MatSelect>`. Options are plain data, passed via the `options`
prop — but, unlike `<MatSelect>`, `options` **must be a `Signal`** (`options={filteredFruits}`,
never `options={filteredFruits.value}`), because the option list genuinely needs to change after
mount (re-filtered on every keystroke) while `<MatFormField>` only ever reads its `control` prop
once — see [Angular → Qwik notes](#angular-qwik-notes).

```tsx
const value = useSignal('');
const filteredFruits = useSignal<MatAutocompleteOptionDef[]>(filterFruits(''));

<MatFormField
  label={<MatLabel>Fruit</MatLabel>}
  control={
    <MatAutocomplete
      value={value.value}
      onValueChange$={(v) => (value.value = v as string)}
      options={filteredFruits}
      onInput$={(_, el) => (filteredFruits.value = filterFruits(el.value))}
      onFocus$={(_, el) => (filteredFruits.value = filterFruits(el.value))}
    />
  }
/>;
```

<!-- example(autocomplete-simple) -->

### Adding a custom filter

Filter the options however you like based on the input's current text. `onInput$` fires on every
native `input` event with the live element — re-run your filter and write the result into the
`options` signal, as shown above.

<!-- example(autocomplete-filter) -->

### Setting separate control and display values

If the option's value (what's stored) should differ from its display text (what's shown in the
input), pass `displayWith$` — a `QRL` mapping the current value to the string to display.

<!-- example(autocomplete-display) -->

### Require an option to be selected

Pass `requireSelection` to ensure only an actual option — never arbitrary typed text — ends up as
the committed value:
1. If the user opens the panel, types something, but doesn't select anything, the value resets to
   `undefined` once the panel closes.
2. If the user opens and closes the panel without changing the value, the old value is preserved.

This can be configured app-wide via `<QwikMaterialProvider matAutocompleteConfig={{requireSelection: true}}>`.

<!-- example(autocomplete-require-selection) -->

### Automatically highlighting the first option

Pass `autoActiveFirstOption` to highlight the first option whenever the panel opens. Also
configurable app-wide via `<QwikMaterialProvider matAutocompleteConfig={{autoActiveFirstOption: true}}>`.

<!-- example(autocomplete-auto-active-first-option) -->

### Autocomplete on a custom input element

`<MatAutocomplete>` doesn't need a `<MatFormField>` at all — pass it directly wherever you'd
otherwise write a plain `<input>`; it still renders (and manages) its own native input.

<!-- example(autocomplete-plain-input) -->

### Attaching the autocomplete panel to a different element

Not ported — no `matAutocompleteOrigin`/`matAutocompleteConnectedTo` equivalent (no scenario in
this port needs the panel anchored anywhere but the input itself).

### Keyboard interaction

| Keyboard shortcut | Action |
|---|---|
| <kbd>Down Arrow</kbd> | Navigate to the next option. |
| <kbd>Up Arrow</kbd> | Navigate to the previous option. |
| <kbd>Enter</kbd> | Select the active option. |
| <kbd>Escape</kbd> | Close the autocomplete panel. |
| <kbd>Alt</kbd> + <kbd>Up Arrow</kbd> | Close the autocomplete panel. |
| <kbd>Alt</kbd> + <kbd>Down Arrow</kbd> | Open the autocomplete panel if there are any matching options. |

### Option groups

Give an `options` entry its own `options` array (instead of a `value`) to render it as a group —
same shape as [`<MatSelect>`'s option groups](/components/select/overview/#creating-groups-of-options).

<!-- example(autocomplete-optgroup) -->

### Accessibility

`MatAutocomplete` implements the ARIA combobox pattern: the input carries `role="combobox"`, the
panel `role="listbox"`. Don't put other interactive controls inside an option.

Always provide an accessible label — a `<MatLabel>` inside `<MatFormField>`, a native `<label>`,
or the `aria-label`/`aria-labelledby` prop.

By default, `MatAutocomplete` shows a checkmark to identify the selected item; `hideSingleSelectionIndicator`
hides it, at the cost of making selected items harder to identify visually.

## Angular → Qwik notes

- **Options are data, not projected content** — same deviation as
  [`<MatSelect>`](/components/select/overview/#angular-qwik-notes), via its own
  `MatAutocompleteOptionDef`/`MatAutocompleteGroupDef` shapes.
- **`options` must be the `Signal` itself, not `.value`.** Unlike `<MatSelect>`'s `options` (read
  once), this one has to stay reactive after mount — every example here refilters on every
  keystroke while the same panel session stays open. Passing `.value` instead silently freezes
  the list at whatever it was on first render.
- **`inputAriaLabel` is a new prop**, separate from `aria-label` (which targets the *panel*, not
  the input) — needed because a plain `<input aria-label="…">` has no directive of its own
  upstream to carry this through either.
- **Not ported:** `autoSelectActiveOption`, `matAutocompleteDisabled`/`matAutocompletePosition`/
  `matAutocompleteConnectedTo` (attaching the panel elsewhere), and the native-select-style
  `compareWith` (always strict `===` — see
  [Migrating from Angular Material](/guide/migrating-from-angular-material/)).
  `MatAutocompleteConfig.autoSelectActiveOption` exists on the config shape for API parity but has
  no effect.
- **No typeahead on the listbox itself.** Matches upstream: typed characters flow into the native
  input as filter text, never into the key manager's own typeahead buffer.
