qwik-material buttons are native `<button>` or `<a>` elements enhanced with Material Design
styling, rendered by one of four components: `MatButton`, `MatIconButton`, `MatFabButton`, and
`MatMiniFabButton` — see [Angular → Qwik notes](#angular-qwik-notes) below for why there are four
components instead of one.

<!-- example(button-overview) -->

Native `<button>` and `<a>` elements are always used in order to provide the most straightforward
and accessible experience for users. A `<button>` element should be used whenever some _action_
is performed. An `<a>` element should be used whenever the user will _navigate_ to another view —
pass an `href` prop and `MatButton` renders an `<a>` instead of a `<button>`.

`MatButton` covers the rectangular, text/filled/tonal/outlined/elevated button. The other three
components cover the remaining shapes:

| Component | Renders | Description |
|---|---|---|
| `MatButton` | `<button>` / `<a href>` | Rectangular button that can contain text and icons |
| `MatIconButton` | `<button>` / `<a href>` | Smaller, circular button, meant to contain an icon and no text |
| `MatFabButton` | `<button>` / `<a href>` | Rectangular button w/ elevation and rounded corners, meant to contain an icon. Pass `extended` to widen it into a rectangle that also fits a label |
| `MatMiniFabButton` | `<button>` / `<a href>` | Smaller variant of `MatFabButton` |

`MatButton` additionally takes an `appearance` prop:

| Appearance | Description |
|---|---|
| `text` (default) | Text buttons are used for the lowest priority actions, especially when presenting multiple options. |
| `filled` | High-emphasis buttons used for final or unblocking actions in a flow, such as saving or confirming. |
| `tonal` | Medium-emphasis buttons often used for final or unblocking actions in a flow, but with less visual emphasis than a filled button. |
| `outlined` | Medium-emphasis buttons often used for actions that need attention but aren't the primary action. |
| `elevated` | Medium-emphasis buttons often used when a button requires visual separation from a patterned background. |

### Extended FAB buttons

Pass the `extended` prop to `MatFabButton` to widen it into a rounded rectangle with space for a
text label in addition to the icon. `MatMiniFabButton` doesn't support `extended`.

```tsx
<MatFabButton extended icon={<MatIcon>home</MatIcon>}>
  Home
</MatFabButton>
```

### Icon positioning

`MatFabButton` and `MatMiniFabButton` accept an `icon` prop (a `JSXOutput`) for a leading icon,
rendered before the label — this mirrors Angular's by-element-type content projection, which Qwik
components can't replicate for arbitrary slotted children. `MatButton` doesn't have this prop; put
the icon directly in its content instead:

```tsx
<MatButton>
  <MatIcon>favorite</MatIcon>
  Like
</MatButton>
```

Placing an icon *after* the label (upstream's `iconPositionEnd`) isn't supported on any of the
four components yet — no current scenario in this port needs it.

### Interactive disabled buttons

Native disabled `<button>` elements cannot receive focus and do not dispatch any events. This can
be problematic in some cases because it can prevent the app from telling the user why the button
is disabled. Pass the `disabledInteractive` prop to style the button as disabled but allow it to
receive focus and dispatch events. The button will have `aria-disabled="true"` for assistive
technology.

**Note:** Using `disabledInteractive` can result in buttons that previously prevented actions to
no longer do so, for example a submit button in a form. When using this prop, guard against such
cases in your own code.

<!-- example(button-disabled-interactive) -->

### Accessibility

qwik-material uses native `<button>` and `<a>` elements to ensure an accessible experience by
default. A `<button>` element should be used for any interaction that _performs an action on the
current page_. An `<a>` element should be used for any interaction that _navigates to another
URL_. All standard accessibility best practices for buttons and anchors apply.

#### Capitalization

Using ALL CAPS in the button text itself causes issues for screen readers, which read the text
character by character. We recommend not changing the default capitalization for button text.

#### Buttons with icons

Buttons or links containing only icons (such as `MatFabButton`, `MatMiniFabButton`, and
`MatIconButton`) should be given a meaningful label via an `ariaLabel` prop. See the
[Icon component page](/components/icon/overview/) for more on using icons in buttons.
Additionally, to be fully accessible the icon should have a minimum touch target of 48x48 to
ensure it's easily clickable, particularly on mobile devices and small screens.

#### Toggle buttons

See the [Button Toggle component page](/components/button-toggle/overview/) for information on
stateful toggle buttons.

## Angular → Qwik notes

- **One component per shape, not one directive with attribute variants.** Angular's `matButton` /
  `matIconButton` / `matFab` / `matMiniFab` directives (all applied to your own `<button>`/`<a>`)
  become four separate components that render their own host element: `MatButton`,
  `MatIconButton`, `MatFabButton`, `MatMiniFabButton`.
- **`color` still works but is the deprecated, M2-era axis.** `appearance` (`text` / `filled` /
  `tonal` / `outlined` / `elevated`) is the primary M3 styling prop, same as upstream.
- **No `showProgress` / progress-indicator slot.** Not yet ported.
- **Composing with another directive-shaped feature** (a menu trigger, a tooltip, a badge) —
  Angular lets you stack `matButton` with `[matMenuTriggerFor]`/`matTooltip`/`matBadge` on one
  element; qwik-material's equivalent is the hooks pattern (`useMatMenuTrigger()`,
  `useMatTooltip()`, `useMatBadge()`), spread onto `MatButton` via `hostProps` — see
  [Composing directives](/guide/composing-directives/).
- **`target` is a small added prop** (not in upstream's directive API) since `MatButton` renders
  its own `<a>` host and needs an explicit prop for every native anchor attribute beyond `href`.
  Other anchor attributes (`rel`, `download`, …) aren't exposed yet.
