`<MatSlider>` allows for the selection of a value from a range via mouse, touch, or keyboard,
similar to `<input type="range">`.

<!-- example(slider-overview) -->

### Selecting a value

By default the minimum value of the slider is `0`, the maximum value is `100`, and the thumb
moves in increments of `1`. These values can be changed by setting the `min`, `max`, and `step`
props respectively. The initial value is set to the minimum value unless otherwise specified.

```tsx
<MatSlider min={1} max={5} step={0.5} value={1.5} onValueChange$={v => (value.value = v)} />
```

### Selecting a range
A `<MatSlider>` can be converted into a range slider by passing `startValue`/`endValue` instead
of `value` — see [Angular → Qwik notes](#angular-qwik-notes) below for why this is one component
in two modes, rather than two separate thumb elements. Each thumb has its own value, but both
are still constrained by the slider's `min` and `max` values. `startValue` cannot be greater than
`endValue` and `endValue` cannot be less than `startValue`, though they both may have the same
value.

```tsx
<MatSlider
  startValue={startValue.value}
  endValue={endValue.value}
  onStartValueChange$={v => (startValue.value = v)}
  onEndValueChange$={v => (endValue.value = v)}
/>
```

<!-- example(slider-range) -->

### Thumb label
By default, the exact selected value of a slider is not visible to the user. However, this value
can be added to the thumb by passing the `discrete` prop.

```tsx
<MatSlider discrete value={value.value} onValueChange$={v => (value.value = v)} />
```

### Formatting the thumb label
By default, the value in the slider's thumb label will be the same as the model value, however
this may end up being too large to fit into the label. If you want to control the value that is
being displayed, you can do so using the `displayWith` prop — a `QRL`, not a plain function (see
[Angular → Qwik notes](#angular-qwik-notes)).

<!-- example(slider-formatting) -->

### Tick marks
By default, sliders do not show tick marks along the thumb track. This can be enabled using the
`showTickMarks` prop.

```tsx
<MatSlider showTickMarks value={value.value} onValueChange$={v => (value.value = v)} />
```

### Keyboard interaction
The slider has the following keyboard bindings:

| Key         | Action                                                                             |
|-------------|--------------------------------------------------------------------------------------|
| Right arrow | Increment the slider value by one step (decrements in RTL).                        |
| Up arrow    | Increment the slider value by one step.                                            |
| Left arrow  | Decrement the slider value by one step (increments in RTL).                        |
| Down arrow  | Decrement the slider value by one step.                                            |
| Page up     | Increment the slider value by 10% (of the max value).                              |
| Page down   | Decrement the slider value by 10% (of the max value).                              |
| End         | Set the value to the maximum possible.                                             |
| Home        | Set the value to the minimum possible.                                             |

### Accessibility

`<MatSlider>` uses an internal `<input type="range">` to provide an accessible experience. The
input receives focus and it can be labelled using the `aria-label` or `aria-labelledby` prop.

Make sure the colors of the active and inactive track of `<MatSlider>` meet at least a 3:1
contrast ratio with the background. This can be achieved through changing the active or inactive
track colors or showing tick marks on the track that have at least a 3:1 color contrast ratio
with the background.

## Angular → Qwik notes

- **One component, not three directives.** Upstream's `<mat-slider>` host + separately-projected
  `matSliderThumb`/`matSliderStartThumb`/`matSliderEndThumb` directives become a single
  `<MatSlider>`: pass `value`/`onValueChange$` for a single thumb, or `startValue`/`endValue` +
  their `onChange$`s to switch into range mode.
- **`displayWith` must be a `QRL`, not a plain function.** Qwik's SSR serializer can't serialize a
  raw function reference into the stream — wrap it with `$()`.
- **No Angular Forms integration.** `ControlValueAccessor` has no Qwik equivalent — the
  controlled-component pattern above replaces it.
- **No `dragStart`/`dragEnd` events.**
- **No live resize handling.** Track dimensions are measured once at mount and again on every
  `pointerdown`, matching upstream's own re-measure timing, but never on a window resize.
- **No RTL support.** Arrow-key handling is LTR-only.
- **`disableRipple` has no effect yet** — present on `MatSliderProps` for API-shape completeness.
- **Harness not ported.**
