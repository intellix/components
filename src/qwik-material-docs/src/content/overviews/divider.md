`<MatDivider>` is a component that allows for Material styling of a line separator with various
orientation options.

<!-- example(divider-overview) -->

### Simple divider

A `<MatDivider>` element can be used on its own to create a horizontal or vertical line styled
with a Material theme.

```tsx
<MatDivider />
```

### Inset divider

Pass the `inset` prop to set whether or not the divider is an inset divider.

```tsx
<MatDivider inset />
```

### Vertical divider

Pass the `vertical` prop to set whether or not the divider is vertically-oriented.

```tsx
<MatDivider vertical />
```

### Lists with inset dividers

Dividers can be added to lists as a means of separating content into distinct sections. Inset
dividers can also be added to provide the appearance of distinct elements in a list without
cluttering content like avatar images or icons. Make sure to avoid adding an inset divider to
the last element in a list, because it will overlap with the section divider.

```tsx
<MatList>
  <MatSubheader>Folders</MatSubheader>
  {folders.value.map((folder, i) => (
    <MatListItem
      key={folder.name}
      icon={<MatListItemIcon><MatIcon>folder</MatIcon></MatListItemIcon>}
      title={<MatListItemTitle as="h4">{folder.name}</MatListItemTitle>}
      content={<p>{folder.updated}</p>}
    />
  ))}
  {folders.value.map((_, i) =>
    i < folders.value.length - 1 ? <MatDivider key={i} inset /> : null,
  )}
  <MatDivider />
  <MatSubheader>Notes</MatSubheader>
  {notes.value.map(note => (
    <MatListItem
      key={note.name}
      icon={<MatListItemIcon><MatIcon>note</MatIcon></MatListItemIcon>}
      title={<MatListItemTitle as="h4">{note.name}</MatListItemTitle>}
      content={<p>{note.updated}</p>}
    />
  ))}
</MatList>
```

### Accessibility

`MatDivider` applies the ARIA `role="separator"` attribute, exclusively implementing the
non-focusable style of separator that distinguishes sections of content.

## Angular → Qwik notes

- **`<mat-divider>` custom-element tag preserved**, same as upstream — it's typed as
  `QwikIntrinsicElements['hr']` (the closest semantic HTML element).
- **`BooleanInput`/`coerceBooleanProperty` coercion omitted.** Qwik JSX passes booleans directly
  (`<MatDivider vertical={true}>` or just `vertical` — no string-attribute coercion needed).
- **Global defaults via `QwikMaterialProvider`**, not a `MAT_DIVIDER_CONFIG` injection token
  (currently has no fields; kept for family-shape parity).
- **Explicit `aria-label` / `aria-labelledby` / `aria-describedby` props** forward straight to
  the host; the decorative default (`role="separator"` + `aria-orientation`) is preserved.
- **Harness not ported.**
