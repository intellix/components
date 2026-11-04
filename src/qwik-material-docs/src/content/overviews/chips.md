Chips allow users to view information, make selections, filter content, and enter data.

### Static Chips

Chips are always used inside a container. To create chips, use `<MatChipSet>` with a `chips`
data array — see [Angular → Qwik notes](#angular-qwik-notes) below for why this is a data prop
rather than nested `<MatChip>` children.

<!-- example(chips-overview) -->

By default, `<MatChipSet>`'s chips render with Material Design styles applied.

#### Disabled appearance

Although a chip is not interactive, you can set the `disabled` field on its def to give it
disabled appearance.

```tsx
<MatChipSet chips={[{content: 'Orange', disabled: true}]} />
```

### Selection Chips

Use `<MatChipListbox>` for selecting one or many items from a list. Pass `multiple` if the user
may select more than one option. Each entry in the `options` array is a `MatChipOptionDef`.

#### Disabled option

Use the `disabled` field on a `MatChipOptionDef` to disable it. This gives the option a disabled
appearance and prevents the user from interacting with it.

```tsx
<MatChipListbox options={[{content: 'Orange', disabled: true}]} />
```

#### Keyboard Interactions

Users can move through the chips using the arrow keys and select/deselect them with space. Chips
also gain focus when clicked, ensuring keyboard navigation starts at the currently focused chip.

### Chips connected to an input field

Use `<MatChipGrid>` for assisting users with text entry. Pass the chip rows as `rows` and
register the connected `<input>` through the `input` field (see
[Angular → Qwik notes](#angular-qwik-notes) below for why the grid renders this input itself,
rather than a separately-authored element). `input.onTokenEnd$` fires when the user presses one
of `input.separatorKeys` (default `['Enter']`); set `input.addOnBlur: true` to ALSO fire it when
the input loses focus, even without pressing a separator key.

<!-- example(chips-input) -->

### Use with forms
There is no Angular Forms integration in this port — `<MatChipGrid>` is a controlled component,
same as every other interactive qwik-material component.

<!-- example(chips-template-form) -->
<!-- example(chips-reactive-form) -->

#### Disabled row

Use the `disabled` field on a `MatChipRowDef` to disable it. This gives the row a disabled
appearance and prevents the user from interacting with it.

```tsx
<MatChipGrid rows={[{content: 'Orange', disabled: true}]} ... />
```

#### Keyboard Interactions

Users can move through the chips using the arrow keys and select/deselect them with the space.
Chips also gain focus when clicked, ensuring keyboard navigation starts at the appropriate chip.

Users can press delete to remove a chip. Pressing delete triggers `onRemoved$` on the chip, so
be sure to implement it if you require that functionality.

#### Editable chips

Set `editable: true` on a `MatChipRowDef` to let the user edit its text inline — double-click
the chip, press Enter while it's focused, or click/press Enter on the optional `editIcon` button
(a pencil-style icon rendered as the chip's leading action). Editing replaces the chip's visible
content with an editable, focused text box seeded with the current text; pressing Enter commits
the edit and fires `onEdited$` with the new (untrimmed) text — implement it to update your own
data, same as `onRemoved$`:

```tsx
<MatChipGrid
  rows={[
    {
      content: fruit.name,
      editable: true,
      editIcon: {content: <MatIcon>edit</MatIcon>, 'aria-label': `edit ${fruit.name}`},
      onEdited$: $((value: string) => {
        const trimmed = value.trim();
        // update or remove the chip here, same as the docs example below
      }),
    },
  ]}
  ...
/>
```

<!-- example(chips-input) -->

#### Autocomplete

There is currently no way to combine `<MatChipGrid>` with `<MatAutocomplete>` for free-form chip
input with suggestions — see [Angular → Qwik notes](#angular-qwik-notes) below.

<!-- example(chips-autocomplete) -->

### Icons

You can add icons to chips to identify entities (like individuals) and provide additional
functionality.

#### Adding up to two icons

You can add two additional icons to an individual chip, via the `avatar` and `trailingIcon`
fields on its def. All variants of chips support them, including `<MatChipSet>`,
`<MatChipListbox>`, and `<MatChipGrid>`.

A chip has a front slot for adding an avatar image. Pass an `<img>` (or any `JSXOutput`) as the
`avatar` field.

<!-- example(chips-avatar) -->

You can add an additional icon to the back slot via the `trailingIcon` field, or a dedicated
remove button via `removeButton`.

#### Remove Button

Sometimes the end user would like the ability to remove a chip. You can provide that
functionality using the `removeButton` field, which renders to the back slot of a chip and
triggers `onRemoved$` when clicked.

```tsx
{
  content: 'Orange',
  removeButton: {content: <MatIcon>cancel</MatIcon>, 'aria-label': 'Remove orange'},
  onRemoved$: $(() => { /* ... */ }),
}
```

See the [accessibility](#accessibility) section for best practices on implementing `onRemoved$`
and creating accessible icons.

### Orientation

By default, chips are displayed horizontally. To stack chips vertically, apply the
`mat-mdc-chip-set-stacked` class to `<MatChipSet>`, `<MatChipListbox>` or `<MatChipGrid>` via its
`class` prop.

<!-- example(chips-stacked) -->

### Specifying global configuration defaults

Use `useMatChipsProvider({separatorKeys: ['Enter', ',']})` to specify default
options for chips.

### Interaction Patterns

The chips components support 3 user interaction patterns, each with its own container and chip
components:

#### Listbox

`<MatChipListbox>`: implements a listbox accessibility pattern. Use it to present a set of
user-selectable options.

```tsx
<MatChipListbox
  aria-label="select a shirt size"
  options={[{content: 'Small'}, {content: 'Medium'}, {content: 'Large'}]}
/>
```

#### Text Entry

`<MatChipGrid>`: implements a grid accessibility pattern. Use it as part of a free form input
that allows users to enter text to add chips.

```tsx
<MatFormField
  control={
    <MatChipGrid
      aria-label="enter sandwich fillings"
      rows={rowsSignal}
      input={{onTokenEnd$: $((value, clear) => { /* ... */ clear(); })}}
    />
  }
/>
```

#### Static Content

`<MatChipSet>`: present a list of items that are not interactive. This interaction pattern
mimics using `ul` and `li` elements.

```tsx
<MatChipSet chips={[{content: 'Sugar'}, {content: 'Spice'}, {content: 'Everything Nice'}]} />
```

### Accessibility

The [Interaction Patterns](#interaction-patterns) section describes the three variants of chips
available. Choose the chip variant that best matches your use case.

For both `<MatChipGrid>` and `<MatChipListbox>`, always apply an accessible label to the control
via `aria-label` or `aria-labelledby`.

Always apply a chip's remove button to a `<button>`-rendering element, never a plain icon.

When using `<MatChipListbox>`, never nest other interactive controls inside an option. Nesting
controls degrades the experience for assistive technology users.

By default, `<MatChipListbox>` displays a checkmark to identify selected items. While you can
hide the checkmark indicator for single-selection via `hideSingleSelectionIndicator`, this makes
the component less accessible by making it harder or impossible for users to visually identify
selected items.

## Angular → Qwik notes

- **`<mat-chip-set>`/`<mat-chip>` → `<MatChipSet>` with a `chips: MatChipDef[]` data array, not
  nested `<MatChip>` children.** Same reasoning as `<MatSelect>`'s `options` array — a Qwik
  component has no equivalent of Angular's `@ContentChildren(MatChip)` to introspect nested
  children generically.
- **`<mat-chip-listbox>`/`<mat-chip-option>` → `<MatChipListbox>` with an `options:
  MatChipOptionDef[]` array.** Selection is a controlled value derived from each option's
  `selected` field, computed once at mount — passing `selected: true` on more than one option in
  single-select mode only ever reflects one of them (unlike upstream, which allows every option
  to independently start selected; see the Orientation example's own caveat).
- **`<mat-chip-grid>`/`<mat-chip-row>` → `<MatChipGrid>` with a `rows: MatChipRowDef[] |
  Signal<MatChipRowDef[]>` array.** When nested inside `<MatFormField>`, pass a `Signal` (not a
  plain array) whenever rows can change after mount — a plain array value freezes after the
  first render (see `qwik-material/chips/SYNC.md`).
- **The grid owns and renders its connected `<input>` directly** (the `input` data prop), rather
  than a separately-authored `<input matChipInputFor>` element — this is also why there is
  currently no way to compose a `<MatAutocomplete>` trigger onto that same input (no ref/hook
  escape hatch exposed for a second behavior to attach to it).
- **Inline editing** (`editable`/`matChipEdit`/`onEdited$`) is implemented — see "Editable
  chips" above. Not reproduced: a single click on an already-focused chip ALSO starting editing
  (double-click and Enter cover the same outcome), and projecting your own custom edit-input
  element instead of the built-in default one.
- **No Angular Forms integration.** `[(ngModel)]`/`[formControl]` have no equivalent —
  `<MatChipGrid>` is a controlled component, same as every other interactive component in this
  port. `MatChipGridProps` also has no `touched`/`dirty`/`invalid`/`formBound` fields (unlike
  `MatInput`/`MatSelect`), so the `ng-pristine`/`ng-untouched`/`ng-valid` classes Angular's real
  `NgControlStatus` would add can't be replicated yet.
- **`EventEmitter`s (`removed`, selection changes) → `onRemoved$`/`onChange$` QRL props.**
- **Global defaults via a hook (`useMatChipsProvider()`)**, not an `MAT_CHIPS_DEFAULT_OPTIONS` injection
  token.
- **Harness not ported.**
