`<MatRadioButton>` provides the same functionality as a native `<input type="radio">` enhanced
with Material Design styling and animations.

<!-- example(radio-overview) -->

All radio-buttons with the same `name` comprise a set from which only one may be selected at a
time.

### Radio-button label
The radio-button label is provided as the content to the `<MatRadioButton>` element. The label
can be positioned before or after the radio-button by setting the `labelPosition` prop to
`'before'` or `'after'`.

If you don't want the label to appear next to the radio-button, you can use
[`aria-label`](https://www.w3.org/TR/wai-aria/states_and_properties#aria-label) or
[`aria-labelledby`](https://www.w3.org/TR/wai-aria/states_and_properties#aria-labelledby) to
specify an appropriate label.

### Radio groups
Radio-buttons should typically be placed inside of a `<MatRadioGroup>` unless the DOM structure
would make that impossible (e.g., radio-buttons inside of table cells). The radio-group has a
`value` prop that reflects the currently selected radio-button inside of the group.

Individual radio-buttons inside of a radio-group will inherit the `name` of the group.

### Use with forms
There is no Angular Forms integration in this port — `<MatRadioGroup>` is a controlled component:
pass `value` as a prop and read changes back through `onChange$`.

```tsx
<MatRadioGroup value={selected.value} onChange$={e => (selected.value = e.value)}>
  <MatRadioButton value="1">Option 1</MatRadioButton>
  <MatRadioButton value="2">Option 2</MatRadioButton>
</MatRadioGroup>
```

### Accessibility

`<MatRadioButton>` uses an internal `<input type="radio">` to provide an accessible experience.
This internal radio button receives focus and is automatically labelled by the text content of
the `<MatRadioButton>` element. Avoid adding other interactive controls into the content of
`<MatRadioButton>`, as this degrades the experience for users of assistive technology.

Always provide an accessible label via the `aria-label`, `aria-labelledby`, or
`aria-describedby` prop for radio buttons without descriptive text content.

```tsx
<MatRadioButton aria-label={getMultipleChoiceAnswer()} />
```

Prefer placing all radio buttons inside of a `<MatRadioGroup>` rather than creating standalone
radio buttons because groups are easier to use exclusively with a keyboard.

You should provide an accessible label for all `<MatRadioGroup>` elements via `aria-label` or
`aria-labelledby`.

## Angular → Qwik notes

- **`UniqueSelectionDispatcher` removed.** A *grouped* button recomputes `checked` from the
  shared group context's `value` on every render, so unchecking a previously-selected sibling is
  just normal reactivity. A *standalone* button (no group) keeps one lazy `document` `change`
  listener instead, since native radio `change` events already bubble there for free — the
  Qwik-native shape of the same cross-component notice upstream's dispatcher provided.
- **No Angular Forms integration.** `ControlValueAccessor`/`NG_VALUE_ACCESSOR`/`ngModel`/
  `FormControl` have no Qwik equivalent — replaced by the controlled-component pattern above.
- **`EventEmitter` `change` removed from both the group and the button** — replaced by
  `onChange$` QRL props, no `MatRadioChange` event object (the payload is just the new value).
- **`checked` is a live DOM property, not an attribute** — same category of SSR-vs-CSR gap as
  checkbox; handled internally, transparent to consumers.
- **No imperative `.focus()` on the host element.** The host's `(focus)`-forwarding listener
  isn't ported — no scenario calls `.focus()` on the custom element directly.
- **Global defaults via `QwikMaterialProvider`**, not an `MAT_RADIO_DEFAULT_OPTIONS` injection
  token.
- **Harness not ported.**
