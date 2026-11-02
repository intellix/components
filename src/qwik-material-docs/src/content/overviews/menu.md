`MatMenu` is a floating panel containing a list of options.

<!-- example(menu-overview) -->

By itself, `<MatMenu>` does not render anything. The menu is created with `createMatMenu()` and
attached to a trigger via `useMatMenuTrigger()` (see [Angular → Qwik
notes](#angular-qwik-notes) below for why this is a hooks pattern rather than a single
`matMenuTriggerFor`-style directive).

### Toggling the menu programmatically

The menu's handle (returned by `createMatMenu()`) exposes an API to open/close programmatically.
Please note that in this case, a trigger is still necessary to attach the menu to an element in
the DOM.

```tsx
const menu = createMatMenu({content$: $(() => <MatMenuItem>Item</MatMenuItem>)});
const trigger = useMatMenuTrigger({menu});
// trigger.openMenu$() / trigger.closeMenu$()
```

### Icons

Menus support displaying `<MatIcon>` elements before the menu item text.

<!-- example(menu-icons) -->

### Customizing menu position

By default, the menu will display below (y-axis), after (x-axis), without overlapping its
trigger. The position can be changed using `createMatMenu()`'s `xPosition` (`'before' |
'after'`) and `yPosition` (`'above' | 'below'`) options. The menu can be forced to overlap the
trigger using the `overlapTrigger` option.

<!-- example(menu-position) -->

### Nested menu

qwik-material supports the ability for a `<MatMenuItem>` to open a sub-menu — pass the sub-menu's
handle via the `menu` prop on the item that should trigger it.

<!-- example(menu-nested) -->

### Context menu

A context menu is a menu that is triggered by right-clicking in a specific area, rather than
clicking on a trigger element — not yet ported (see [Angular → Qwik
notes](#angular-qwik-notes)).

<!-- example(context-menu) -->

### Lazy rendering

By default, the menu content will be initialized even when the panel is closed. To defer
initialization until the menu is open, wrap the content in `<MatMenuContent>`:

```tsx
const menu = createMatMenu({
  content$: $(() => (
    <MatMenuContent>
      <MatMenuItem>Settings</MatMenuItem>
      <MatMenuItem>Help</MatMenuItem>
    </MatMenuContent>
  )),
});
```

### Keyboard interaction

| Keyboard shortcut      | Action                                      |
|-------------------------|----------------------------------------------|
| Down Arrow              | Focus the next menu item.                    |
| Up Arrow                | Focus the previous menu item.                |
| Left Arrow              | Close the current menu if it is a sub-menu.  |
| Right Arrow             | Opens the current menu item's sub-menu.      |
| Enter                   | Activate the focused menu item.              |
| Escape                  | Close all open menus.                        |

### Accessibility

qwik-material's menu component consists of two connected parts: the trigger and the pop-up menu.

The menu trigger is a standard button element augmented with `aria-haspopup`, `aria-expanded`,
and `aria-controls` to create the relationship to the pop-up panel — all part of
`useMatMenuTrigger()`'s returned `hostProps`.

The pop-up menu implements the `role="menu"` pattern, handling keyboard interaction and focus
management. Upon opening, the trigger will focus the first focusable menu item. Upon close, the
menu will return focus to its trigger.

qwik-material does not support the `menuitemcheckbox` or `menuitemradio` roles.

Always provide an accessible label via `ariaLabel`/`ariaLabelledBy` for any menu triggers or
menu items without descriptive text content.

A menu should not contain any interactive controls aside from `<MatMenuItem>`.

## Angular → Qwik notes

- **The trigger is a hooks pattern, not a single stackable directive.** Upstream's
  `matMenuTriggerFor` is a directive that attaches to ANY existing element/component
  (`<button matButton [matMenuTriggerFor]="menu">`). Qwik has no equivalent "attach to an
  existing component from outside" mechanism, so `useMatMenuTrigger({menu})` returns exactly
  what the directive would contribute to its host (classes, `aria-haspopup`/`aria-expanded`/
  `aria-controls`, a `ref`, and the open/close click/keydown handlers) as a plain `hostProps`
  object, spread directly onto whatever component you're using as the trigger (`<MatButton
  {...trigger.hostProps}>`, `<MatIconButton {...trigger.hostProps}>`, …) — see [Composing
  directives](/guide/composing-directives/). `<MatMenuTrigger as="button">` is also available
  when the trigger itself doesn't need to be any OTHER qwik-material component.
- **`<MatMenu>` is a true empty placeholder, matching upstream's own `<mat-menu>` host element —
  one per `createMatMenu()` call, in the same position your markup would declare `<mat-menu
  #foo="matMenu">`.** All of a menu's real configuration (`xPosition`/`yPosition`/
  `overlapTrigger`/`hasBackdrop`/panel content) lives on `createMatMenu()`'s config object
  instead of on the placeholder itself.
- **`matContextMenuTriggerFor` (right-click-opens-menu) isn't ported.** No `useMatContextMenuTrigger`
  hook or equivalent exists yet — the [Context menu](#context-menu) example above stays as a "not
  yet ported" placeholder.
