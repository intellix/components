The qwik-material tooltip provides a text label that is displayed when the user hovers over or
longpresses an element.

<!-- example(tooltip-overview) -->

### Positioning

The tooltip will be displayed below the element by default, but this can be configured using the
`position` prop (`useMatTooltip({position: ...})` / `<MatTooltip position={...}>`).
The tooltip can be displayed above, below, left, or right of the element. If the tooltip should
switch left/right positions in an RTL layout direction, then the values `before` and `after`
should be used instead of `left` and `right`.

| Position  | Description                                                                          |
|-----------|----------------------------------------------------------------------------------------|
| `above`   | Always display above the element                                                     |
| `below`   | Always display beneath the element                                                   |
| `left`    | Always display to the left of the element                                            |
| `right`   | Always display to the right of the element                                           |
| `before`  | Display to the left in left-to-right layout and to the right in right-to-left layout |
| `after`   | Display to the right in left-to-right layout and to the left in right-to-left layout |

Based on the position in which the tooltip is shown, the `.mat-tooltip-panel` element will
receive a CSS class that can be used for style (e.g. to add an arrow). The possible classes are
`mat-tooltip-panel-above`, `mat-tooltip-panel-below`, `mat-tooltip-panel-left`,
`mat-tooltip-panel-right`.

<!-- example(tooltip-position) -->

To display the tooltip relative to the mouse or touch that triggered it, pass `positionAtOrigin`.
With this setting turned on, the tooltip will display relative to the origin of the trigger
rather than the host element. In cases where the tooltip is not triggered by a touch event or
mouse click, it will display the same as if this setting was turned off.

### Showing and hiding

By default, the tooltip will be immediately shown when the user's mouse hovers over the
tooltip's trigger element and immediately hides when the user's mouse leaves.

On mobile, the tooltip displays when the user longpresses the element and hides after a delay of
1500ms.

#### Show and hide delays

To add a delay before showing or hiding the tooltip, you can use `showDelay`/`hideDelay` to
provide a delay time in milliseconds.

The following example has a tooltip that waits one second to display after the user hovers over
the button, and waits two seconds to hide after the user moves the mouse away.

<!-- example(tooltip-delay) -->

#### Changing the default delay behavior

You can configure your app's tooltip default show/hide delays through
`useMatTooltipProvider({...})`.

<!-- example(tooltip-modified-defaults) -->

#### Manually showing and hiding the tooltip

There is currently no imperative `show()`/`hide()`/`toggle()` API on `useMatTooltip()` — see
[Angular → Qwik notes](#angular-qwik-notes) below.

<!-- example(tooltip-manual) -->

#### Disabling the tooltip from showing

To completely disable a tooltip, pass `disabled`. While disabled, a tooltip will never be shown.

### Accessibility

`useMatTooltip()`/`<MatTooltip>` adds an `aria-describedby` description that provides a
reference to a visually hidden element containing the tooltip's message. This provides
screen-readers the information needed to read out the tooltip's contents when the user focuses
on the tooltip's trigger. The element referenced by `aria-describedby` is not the tooltip
itself, but instead an invisible copy of the tooltip content.

Avoid interactions that exclusively show a tooltip with pointer events like click and
mouseenter. Always ensure that keyboard users can perform the same set of actions available to
mouse and touch users.

## Angular → Qwik notes

- **Directive (`[matTooltip]`) → component (`<MatTooltip as="...">`) or directive-hook
  (`useMatTooltip()`).** `<MatTooltip>` renders its own host element. To put a tooltip on an
  element that's already a qwik-material component (a button, say), call `useMatTooltip()`
  directly and spread its `hostProps` onto that component — see
  [Composing directives](/guide/composing-directives/) and the headline example above.
- **No imperative `show()`/`hide()`/`toggle()` API.** Upstream's template-ref handle
  (`#t="matTooltip"`) that lets other elements imperatively drive a tooltip has no equivalent —
  `MatTooltipHook` only exposes `hostProps` (hover/focus/touch-driven). The low-level
  `showTooltip`/`hideTooltip`/`repositionTooltip`/`finalizeHidden` primitives are exported from
  the package for a future caller that needs one, but nothing wraps them into a public,
  imperative hook yet.
- **No real `AriaDescriber`.** `aria-describedby` is rendered, but the shared hidden
  description-element machinery upstream's `AriaDescriber` manages isn't ported (same
  simplification as `MatBadge`).
- **A fresh overlay is created on every `show()`**, rather than reusing one `OverlayRef` across
  repeated shows of the same trigger — a performance nuance, not a DOM-visible one.
- **No scroll-container auto-close.** A parent scrollable clipping the tooltip won't close it.
- **Global defaults via a hook (`useMatTooltipProvider()`)**, not an `MAT_TOOLTIP_DEFAULT_OPTIONS` injection
  token.
- **Harness not ported.**
