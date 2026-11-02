`MatList` is a container component that wraps and formats a series of `MatListItem`s. As the base
list component, it provides Material Design styling, but no behavior of its own.

<!-- example(list-overview) -->

List items can be constructed in two ways depending on the content they need to show:

### Simple lists

If a list item needs to show a single line of textual information, the text can be inserted
directly into `<MatListItem>`'s content.

```tsx
<MatList>
  <MatListItem>Pepper</MatListItem>
  <MatListItem>Salt</MatListItem>
  <MatListItem>Paprika</MatListItem>
</MatList>
```

### Multi-line lists

List items that have more than one line of text pass a `<MatListItemTitle>` element via the
`title` prop to indicate their title text for accessibility purposes, plus one or more
`<MatListItemLine>` elements via `lineContent` for each subsequent line of text.

```tsx
<MatList>
  <MatListItem title={<MatListItemTitle>Pepper</MatListItemTitle>}
               lineContent={<MatListItemLine>Produced by a plant</MatListItemLine>} />
  <MatListItem title={<MatListItemTitle>Salt</MatListItemTitle>}
               lineContent={<MatListItemLine>Extracted from sea water</MatListItemLine>} />
  <MatListItem title={<MatListItemTitle>Paprika</MatListItemTitle>}
               lineContent={<MatListItemLine>Produced by dried and ground red peppers</MatListItemLine>} />
</MatList>
```

`MatListItem` infers how many lines of text it has from `lineContent`'s length — pass an array
of `<MatListItemLine>` elements for more than one line.

The following props/elements can be used to style the content of a list item:

| Prop | Description |
|---|---|
| `title` | Pass a `<MatListItemTitle>`. Required for multi-line list items. |
| `lineContent` | Pass one or more `<MatListItemLine>`. Wraps a line of text within a list item. |
| `icon` | Pass a `<MatListItemIcon>`. Icon typically placed at the beginning of a list item. |
| `avatar` | Pass a `<MatListItemAvatar>`. Image typically placed at the beginning of a list item. |
| `meta` | Pass a `<MatListItemMeta>`. Inserts content in the meta section at the end of a list item. |

### Navigation lists

Use `<MatNavList>` for navigation lists (i.e. lists that have anchor tags).

Simple navigation lists use `as="a"` on `<MatListItem>` directly:

```tsx
<MatNavList>
  {links.map(link => (
    <MatListItem key={link} as="a" href="..." activated={link.isActive}>{link}</MatListItem>
  ))}
</MatNavList>
```

For more complex navigation lists (e.g. with more than one target per item), pass the anchor as
the item's `title`:

```tsx
<MatNavList>
  {links.map(link => (
    <MatListItem
      key={link}
      activated={link.isActive}
      title={<MatListItemTitle as="a" href="...">{link}</MatListItemTitle>}
      meta={
        <MatListItemMeta>
          <MatIconButton onClick$={() => showInfo(link)}>
            <MatIcon>info</MatIcon>
          </MatIconButton>
        </MatListItemMeta>
      }
    />
  ))}
</MatNavList>
```

### Action lists

Use `<MatActionList>` when each item in the list performs some _action_. Each item in an action
list renders as a `<button>` — pass `as="button"` on `<MatListItem>`.

Simple action lists use `as="button"` directly:

```tsx
<MatActionList>
  <MatListItem as="button" onClick$={save}>Save</MatListItem>
  <MatListItem as="button" onClick$={undo}>Undo</MatListItem>
</MatActionList>
```

### Selection lists

A selection list provides an interface for selecting values, where each list item is an option.

<!-- example(list-selection) -->

The options within a selection list should not contain further interactive controls, such as
buttons and anchors.

### Multi-line lists

For lists that require multiple lines per item, pass a `<MatListItemLine>` per line via
`lineContent` (array form). Whichever host tag is appropriate for your DOM hierarchy should be
used (not necessarily `<h3>`/`<p>` as shown here) via `<MatListItemTitle as="h3">`/
`<MatListItemLine as="p">`.

```tsx
{/* two line list */}
<MatList>
  {messages.map(message => (
    <MatListItem
      key={message.id}
      title={<MatListItemTitle as="h3">{message.from}</MatListItemTitle>}
      lineContent={
        <MatListItemLine as="p">
          <span>{message.subject}</span>
          <span class="demo-2"> -- {message.content}</span>
        </MatListItemLine>
      }
    />
  ))}
</MatList>

{/* three line list */}
<MatList>
  {messages.map(message => (
    <MatListItem
      key={message.id}
      title={<MatListItemTitle as="h3">{message.from}</MatListItemTitle>}
      lineContent={[
        <MatListItemLine as="p">{message.subject}</MatListItemLine>,
        <MatListItemLine as="p" class="demo-2">{message.content}</MatListItemLine>,
      ]}
    />
  ))}
</MatList>
```

### Lists with icons

To add an icon to your list item, pass a `<MatListItemIcon>` via `icon`.

```tsx
<MatList>
  {messages.map(message => (
    <MatListItem
      key={message.id}
      icon={<MatListItemIcon><MatIcon>folder</MatIcon></MatListItemIcon>}
      title={<MatListItemTitle as="h3">{message.from}</MatListItemTitle>}
      lineContent={
        <MatListItemLine as="p">
          <span>{message.subject}</span>
          <span class="demo-2"> -- {message.content}</span>
        </MatListItemLine>
      }
    />
  ))}
</MatList>
```

### Lists with meta section icons

To add a meta icon to your list item, pass a `<MatListItemMeta>` via `meta`. This lets you
display an icon or any other content in the meta section of the list item.

```tsx
<MatList>
  {messages.map(message => (
    <MatListItem
      key={message.id}
      meta={<MatListItemMeta><MatIcon>folder</MatIcon></MatListItemMeta>}
      title={<MatListItemTitle as="h3">{message.from}</MatListItemTitle>}
      lineContent={
        <MatListItemLine as="p">
          <span>{message.subject}</span>
          <span class="demo-2"> -- {message.content}</span>
        </MatListItemLine>
      }
    />
  ))}
</MatList>
```

### Lists with avatars

To include an avatar image, pass a `<MatListItemAvatar>` (wrapping an `<img>`) via `avatar`.

```tsx
<MatList>
  {messages.map(message => (
    <MatListItem
      key={message.id}
      avatar={<MatListItemAvatar><img src="..." alt="..." /></MatListItemAvatar>}
      title={<MatListItemTitle as="h3">{message.from}</MatListItemTitle>}
      lineContent={
        <MatListItemLine as="p">
          <span>{message.subject}</span>
          <span class="demo-2"> -- {message.content}</span>
        </MatListItemLine>
      }
    />
  ))}
</MatList>
```

### Lists with multiple sections

Subheaders can be added to a list via `<MatSubheader>`. To add a divider, use `<MatDivider>`.

```tsx
<MatList>
  <MatSubheader as="h3">Folders</MatSubheader>
  {folders.map(folder => (
    <MatListItem
      key={folder.name}
      icon={<MatListItemIcon><MatIcon>folder</MatIcon></MatListItemIcon>}
      title={<MatListItemTitle as="h4">{folder.name}</MatListItemTitle>}
      lineContent={<MatListItemLine as="p" class="demo-2">{folder.updated}</MatListItemLine>}
    />
  ))}
  <MatDivider />
  <MatSubheader as="h3">Notes</MatSubheader>
  {notes.map(note => (
    <MatListItem
      key={note.name}
      icon={<MatListItemIcon><MatIcon>note</MatIcon></MatListItemIcon>}
      title={<MatListItemTitle as="h4">{note.name}</MatListItemTitle>}
      lineContent={<MatListItemLine as="p" class="demo-2">{note.updated}</MatListItemLine>}
    />
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

- **Content is data/props, not slotted children.** Upstream's `matListItemTitle`/
  `matListItemLine`/`matListItemIcon`/`matListItemAvatar`/`matListItemMeta` are content-projected
  by directive selector, placed anywhere in a `<mat-list-item>`'s template; Qwik can't inspect a
  `<Slot/>`'s projected children's shape to re-derive the same placement/class/line-count logic.
  `MatListItem` instead takes each section as an explicit prop (`title`, `lineContent`, `icon`,
  `avatar`, `meta`, `divider`) holding the matching section component
  (`<MatListItemTitle>`/`<MatListItemLine>`/etc.) — presence and `lineContent`'s array length
  drive the same `mdc-list-item--with-*` classes upstream derives from `@ContentChildren`.
- **One `MatListItem` component with an `as` prop, not a separate attribute directive per host
  element.** Upstream's `mat-list-item`/`[mat-list-item]` attaches to whatever element you write
  (`<mat-list-item>`, `<a mat-list-item>`, `<button mat-list-item>`); `MatListItem` renders its
  own host and picks the tag via `as: 'div' | 'a' | 'button'` (default `'div'`) — combine with
  `href` for `as="a"` or `onClick$` for `as="button"`.
- **No ripple on interactive items yet.** Upstream wires up `RippleRenderer` for `MatNavList`/
  `MatActionList` items. No current scenario exercises interaction-driven ripple DOM, so this
  port's `mat-mdc-list-item-interactive` class (added at construction, matching upstream) has no
  backing ripple elements yet.
- **`MatSelectionList`/`MatListOption` aren't ported.** They're a dedicated future port with a
  forms tier (checkbox/radio selection indicators, a selection model, keyboard navigation) —
  genuinely out of scope here, not a small addition. The [Selection lists](#selection-lists)
  example above stays as a "not yet ported" placeholder until that lands.

