`MatList` is a container component that wraps and formats a series of `MatListItem`s. As the base
list component, it provides Material Design styling, but no behavior of its own.

<!-- example(list-overview) -->

List items can be constructed in two ways depending on the content they need to show:

### Simple lists

If a list item needs to show a single line of textual information, the text can be inserted
directly into `<MatListItem>`'s content (declared with `content`).

```tsx
<MatList>
  <MatListItem content>Pepper</MatListItem>
  <MatListItem content>Salt</MatListItem>
  <MatListItem content>Paprika</MatListItem>
</MatList>
```

### Multi-line lists

List items that have more than one line of text place a `<MatListItemTitle q:slot="title">` to
indicate their title text for accessibility purposes, plus a `<MatListItemLine q:slot="line">`
for each subsequent line of text. The item can't see what it projects, so it's told: `title`
says there's a title, `lineCount` how many lines.

```tsx
<MatList>
  <MatListItem title lineCount={1}>
    <MatListItemTitle q:slot="title">Pepper</MatListItemTitle>
    <MatListItemLine q:slot="line">Produced by a plant</MatListItemLine>
  </MatListItem>
  <MatListItem title lineCount={1}>
    <MatListItemTitle q:slot="title">Salt</MatListItemTitle>
    <MatListItemLine q:slot="line">Extracted from sea water</MatListItemLine>
  </MatListItem>
  <MatListItem title lineCount={1}>
    <MatListItemTitle q:slot="title">Paprika</MatListItemTitle>
    <MatListItemLine q:slot="line">Produced by dried and ground red peppers</MatListItemLine>
  </MatListItem>
</MatList>
```

The following slots can be used to style the content of a list item, each declared by the
matching prop:

| Slot | Prop | Description |
|---|---|---|
| `title` | `title` | A `<MatListItemTitle>`. Required for multi-line list items. |
| `line` | `lineCount={n}` | One or more `<MatListItemLine>`. Wraps a line of text within a list item. |
| `icon` | `leading="icon"` | A `<MatListItemIcon>`. Icon typically placed at the beginning of a list item. |
| `avatar` | `leading="avatar"` | A `<MatListItemAvatar>`. Image typically placed at the beginning of a list item. |
| `meta` | `meta` | A `<MatListItemMeta>`. Inserts content in the meta section at the end of a list item. |
| (none) | `content` | Unscoped content — plain children outside the slots above. |

### Navigation lists

Use `<MatNavList>` for navigation lists (i.e. lists that have anchor tags).

Simple navigation lists use `as="a"` on `<MatListItem>` directly:

```tsx
<MatNavList>
  {links.map(link => (
    <MatListItem key={link} as="a" href="..." activated={link.isActive} content>
      {link}
    </MatListItem>
  ))}
</MatNavList>
```

For more complex navigation lists (e.g. with more than one target per item), project the anchor
as the item's title:

```tsx
<MatNavList>
  {links.map(link => (
    <MatListItem key={link} activated={link.isActive} title meta>
      <MatListItemTitle q:slot="title" as="a" href="...">{link}</MatListItemTitle>
      <MatListItemMeta q:slot="meta">
        <MatIconButton onClick$={() => showInfo(link)}>
          <MatIcon>info</MatIcon>
        </MatIconButton>
      </MatListItemMeta>
    </MatListItem>
  ))}
</MatNavList>
```

### Action lists

Use `<MatActionList>` when each item in the list performs some _action_. Each item in an action
list renders as a `<button>` — pass `as="button"` on `<MatListItem>`.

Simple action lists use `as="button"` directly:

```tsx
<MatActionList>
  <MatListItem as="button" onClick$={save} content>Save</MatListItem>
  <MatListItem as="button" onClick$={undo} content>Undo</MatListItem>
</MatActionList>
```

### Selection lists

A selection list provides an interface for selecting values, where each list item is an option.

<!-- example(list-selection) -->

The options within a selection list should not contain further interactive controls, such as
buttons and anchors.

### Multi-line lists

For lists that require multiple lines per item, project a `<MatListItemLine q:slot="line">` per
line and set `lineCount` to match. Whichever host tag is appropriate for your DOM hierarchy should be
used (not necessarily `<h3>`/`<p>` as shown here) via `<MatListItemTitle as="h3">`/
`<MatListItemLine as="p">`.

```tsx
{/* two line list */}
<MatList>
  {messages.map(message => (
    <MatListItem key={message.id} title lineCount={1}>
      <MatListItemTitle q:slot="title" as="h3">{message.from}</MatListItemTitle>
      <MatListItemLine q:slot="line" as="p">
        <span>{message.subject}</span>
        <span class="demo-2"> -- {message.content}</span>
      </MatListItemLine>
    </MatListItem>
  ))}
</MatList>

{/* three line list */}
<MatList>
  {messages.map(message => (
    <MatListItem key={message.id} title lineCount={2}>
      <MatListItemTitle q:slot="title" as="h3">{message.from}</MatListItemTitle>
      <MatListItemLine q:slot="line" as="p">{message.subject}</MatListItemLine>
      <MatListItemLine q:slot="line" as="p" class="demo-2">{message.content}</MatListItemLine>
    </MatListItem>
  ))}
</MatList>
```

### Lists with icons

To add an icon to your list item, project a `<MatListItemIcon q:slot="icon">` and set
`leading="icon"`.

```tsx
<MatList>
  {messages.map(message => (
    <MatListItem key={message.id} leading="icon" title lineCount={1}>
      <MatListItemIcon q:slot="icon"><MatIcon>folder</MatIcon></MatListItemIcon>
      <MatListItemTitle q:slot="title" as="h3">{message.from}</MatListItemTitle>
      <MatListItemLine q:slot="line" as="p">
        <span>{message.subject}</span>
        <span class="demo-2"> -- {message.content}</span>
      </MatListItemLine>
    </MatListItem>
  ))}
</MatList>
```

### Lists with meta section icons

To add a meta icon to your list item, project a `<MatListItemMeta q:slot="meta">` and set
`meta`. This lets you
display an icon or any other content in the meta section of the list item.

```tsx
<MatList>
  {messages.map(message => (
    <MatListItem key={message.id} title lineCount={1} meta>
      <MatListItemMeta q:slot="meta"><MatIcon>folder</MatIcon></MatListItemMeta>
      <MatListItemTitle q:slot="title" as="h3">{message.from}</MatListItemTitle>
      <MatListItemLine q:slot="line" as="p">
        <span>{message.subject}</span>
        <span class="demo-2"> -- {message.content}</span>
      </MatListItemLine>
    </MatListItem>
  ))}
</MatList>
```

### Lists with avatars

To include an avatar image, project a `<MatListItemAvatar q:slot="avatar">` (wrapping an
`<img>`) and set `leading="avatar"`.

```tsx
<MatList>
  {messages.map(message => (
    <MatListItem key={message.id} leading="avatar" title lineCount={1}>
      <MatListItemAvatar q:slot="avatar"><img src="..." alt="..." /></MatListItemAvatar>
      <MatListItemTitle q:slot="title" as="h3">{message.from}</MatListItemTitle>
      <MatListItemLine q:slot="line" as="p">
        <span>{message.subject}</span>
        <span class="demo-2"> -- {message.content}</span>
      </MatListItemLine>
    </MatListItem>
  ))}
</MatList>
```

### Lists with multiple sections

Subheaders can be added to a list via `<MatSubheader>`. To add a divider, use `<MatDivider>`.

```tsx
<MatList>
  <MatSubheader as="h3">Folders</MatSubheader>
  {folders.map(folder => (
    <MatListItem key={folder.name} leading="icon" title lineCount={1}>
      <MatListItemIcon q:slot="icon"><MatIcon>folder</MatIcon></MatListItemIcon>
      <MatListItemTitle q:slot="title" as="h4">{folder.name}</MatListItemTitle>
      <MatListItemLine q:slot="line" as="p" class="demo-2">{folder.updated}</MatListItemLine>
    </MatListItem>
  ))}
  <MatDivider />
  <MatSubheader as="h3">Notes</MatSubheader>
  {notes.map(note => (
    <MatListItem key={note.name} leading="icon" title lineCount={1}>
      <MatListItemIcon q:slot="icon"><MatIcon>note</MatIcon></MatListItemIcon>
      <MatListItemTitle q:slot="title" as="h4">{note.name}</MatListItemTitle>
      <MatListItemLine q:slot="line" as="p" class="demo-2">{note.updated}</MatListItemLine>
    </MatListItem>
  ))}
</MatList>
```

### Accessibility

qwik-material offers multiple varieties of list so that you can choose the type that best applies
to your use-case.

#### Navigation

You should use `MatNavList` when every item in the list is an anchor that navigates to another
URL. The rendered `<mat-nav-list>` element sets `role="navigation"` and should contain only
anchor-style items (`as="a"`). You should not nest any interactive elements inside these anchors,
including buttons and checkboxes.

Always provide an accessible label for `MatNavList` via `aria-label` or `aria-labelledby`.

#### Action

To provide the best screen reader experience for a list, wrap each button item with a `<li>` or
`<div role="listitem">` element and add `role="group"` semantics — `MatActionList` already sets
this for you.

#### Selection

Upstream provides `MatSelectionList`/`MatListOption` for lists that allow the user to select one
or more values (a `role="listbox"` interaction pattern with keyboard input and focus management
handled for you) — see [Angular → Qwik notes](#angular-qwik-notes) below for why these aren't
ported yet.

#### Custom scenarios

By default, the list assumes that it will be used in a purely decorative fashion and thus it sets
no roles, ARIA attributes, or keyboard shortcuts. This is equivalent to having a sequence of
`<div>` elements on the page. Any interactive content within the list should be given an
appropriate accessibility treatment based on the specific workflow of your application.

If the list is used to present a list of non-interactive content items, then pass `role="list"`
to `<MatList>` and give each list item an appropriate `role`.

## Angular → Qwik notes

- **Sections are named slots, and the item is told what it projects.** Upstream's
  `matListItemTitle`/`matListItemLine`/`matListItemIcon`/`matListItemAvatar`/`matListItemMeta`
  are content-projected by directive selector (`<ng-content select="...">`); here each section
  carries the matching `q:slot` (`title`, `line`, `icon`, `avatar`, `meta`, `divider`) and lands
  in the same place. Qwik can't inspect a `<Slot/>`'s projected children, though, so the
  `mdc-list-item--with-*` classes upstream derives from `@ContentChildren` come from props you
  set to match: `leading="avatar" | "icon"`, `title`, `lineCount`, `meta`, and `content` for
  unscoped children.
- **One `MatListItem` component with an `as` prop, not a separate attribute directive per host
  element.** Upstream's `mat-list-item`/`[mat-list-item]` attaches to whatever element you write
  (`<mat-list-item>`, `<a mat-list-item>`, `<button mat-list-item>`); `MatListItem` renders its
  own host and picks the tag via `as: 'div' | 'a' | 'button'` (default `'div'`) — combine with
  `href` for `as="a"` or `onClick$` for `as="button"`.
- **Ripple on interactive items.** Upstream wires up `RippleRenderer` for `MatNavList`/
  `MatActionList` items (and any `<mat-list-item>` rendered inside one); `MatListItem` does the
  same, launching real `.mat-ripple-element` spans directly into its own host element on
  `mousedown`/`touchstart` (the item itself is the ripple container, matching upstream — no
  separate wrapper `<div>`). `disableRipple` is available on `<MatList>`/`<MatNavList>`/
  `<MatActionList>` AND on `<MatListItem>` itself, animations-disabled fully suppresses it
  (matching upstream's own list-specific `disableRipple` getter), and
  `useMatRippleProvider({...})` applies too. A plain, non-interactive
  `<mat-list>`'s items never get one, matching upstream's `mat-mdc-list-item-interactive` class
  (added at construction) having no interaction behavior behind it in that case either.
- **`MatSelectionList`/`MatListOption` aren't ported.** They're a dedicated future port with a
  forms tier (checkbox/radio selection indicators, a selection model, keyboard navigation) —
  genuinely out of scope here, not a small addition. The [Selection lists](#selection-lists)
  example above stays as a "not yet ported" placeholder until that lands.

