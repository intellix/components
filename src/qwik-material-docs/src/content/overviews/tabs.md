qwik-material tabs organize content into separate views where only one view can be visible at a
time. Each tab's label is shown in the tab header and the active tab's label is designated with
the animated ink bar. When the list of tab labels exceeds the width of the header, pagination
controls appear to let the user scroll left and right across the labels.

The active tab may be set using the `selectedIndex` prop or when the user selects one of the tab
labels in the header.

<!-- example(tab-group-basic) -->

### Events

The `onSelectedIndexChange$` callback fires when the active tab changes (the two-way-binding half
of `selectedIndex`).

The `onFocusChange$` callback fires when the user puts focus on any of the tab labels in the
header, usually through keyboard navigation.

### Labels

If a tab's label is only text then the simple `label` prop can be used.

<!-- example(tab-group-basic) -->

For more complex labels, pass a `labelTemplate` (a `JSXOutput`) instead.

<!-- example(tab-group-custom-label) -->

### Dynamic Height

By default, the tab group will not change its height to the height of the currently active tab.
To change this, pass `dynamicHeight`. The tab body will animate its height according to the
height of the active tab.

<!-- example(tab-group-dynamic-height) -->

### Tabs and navigation

While `<MatTabGroup>` is used to switch between views within a single route, `<MatTabNav>`
provides a tab-like UI for navigating between routes.

<!-- example(tab-nav-bar-basic) -->

`<MatTabNav>` is not tied to any particular router; it works with normal `<a>`-style links (via
`<MatTabLink>`) and uses the `active` prop to determine which tab is currently active. The
corresponding content must be wrapped in a `<MatTabNavPanel>`, wired to its `<MatTabNav>` via a
shared id (see [Angular → Qwik notes](#angular-qwik-notes) below) and should typically be placed
relatively close to the `<MatTabNav>` (see [Accessibility](#accessibility)).

### Lazy Loading

Tab contents are always lazily initialized in qwik-material — see [Angular → Qwik
notes](#angular-qwik-notes).

<!-- example(tab-group-lazy-loaded) -->

### Label alignment

If you want to align the tab labels in the center or towards the end of the container, pass
`alignTabs` (and typically `stretchTabs={false}`, so the labels don't stretch to fill the header).

<!-- example(tab-group-align) -->

### Controlling the tab animation

You can control the duration of the tabs' animation using the `animationDuration` prop. If you
want to disable the animation completely, you can do so by setting it to `'0ms'`.

<!-- example(tab-group-animations) -->

### Keeping the tab content inside the DOM while it's off-screen

By default `<MatTabGroup>` will remove the content of off-screen tabs from the DOM until they
come into view. This is optimal for most cases since it keeps the DOM size smaller, but it isn't
great for others, like when a tab has an `<audio>` or `<video>` element, because the content will
be re-initialized whenever the user navigates to the tab. If you want to keep the content of
off-screen tabs in the DOM, pass `preserveContent`.

<!-- example(tab-group-preserve-content) -->

### Sortable tabs

Upstream integrates `<mat-tab-group>` with `@angular/cdk/drag-drop` for reorderable tabs — not
yet ported (qwik-cdk has no drag-drop entry point yet).

<!-- example(tab-group-drag-drop) -->

### Accessibility

`MatTabGroup` and `MatTabNav` both implement the [ARIA Tabs design
pattern](https://www.w3.org/WAI/ARIA/apg/patterns/tabs/). Both compose `tablist`, `tab`, and
`tabpanel` elements with handling for keyboard inputs and focus management.

When using `MatTabNav`, you should place the `<MatTabNavPanel>` relatively close to if not
immediately adjacent to the `<MatTabNav>` so that it's easy for screen reader users to identify
the association.

#### Labels

Always provide an accessible label via `ariaLabel` or `ariaLabelledby` for tabs without
descriptive text content.

#### Keyboard interaction

`MatTabGroup` and `MatTabNav` both implement the following keyboard interactions:

| Shortcut             | Action                     |
|----------------------|----------------------------|
| Left Arrow            | Move focus to previous tab |
| Right Arrow           | Move focus to next tab     |
| Home                  | Move focus to first tab    |
| End                   | Move focus to last tab     |
| Space or Enter        | Switch to focused tab      |

## Angular → Qwik notes

- **Tabs are a data array (`tabs: MatTabDef[]`), not `<MatTab>` children.** Upstream's
  `<mat-tab>`/`<ng-template mat-tab-label>` are content-projected and queried via
  `@ContentChildren`; Qwik can't inspect a `<Slot/>`'s projected children's shape the same way.
  `<MatTabGroup tabs={[{label, labelTemplate, content, disabled, ...}]}>` carries the same
  per-tab data as a plain array instead — see `MatTabDef`'s own fields for the full set (mirrors
  `MatTab`'s inputs 1:1).
- **No separate "lazy content" prop/directive.** Upstream's `<ng-template matTabContent>` opts a
  tab INTO lazy initialization (plain content is eager by default); in this port, EVERY tab's
  `content` is already lazy — only rendered once that tab first centers (and detached again on
  leaving, unless `preserveContent`) — observably identical to upstream's own lazy behavior, so
  there's no separate mechanism to opt into.
- **`MatTabNav` ↔ `MatTabNavPanel` wiring is a plain id you thread through yourself**, not an
  automatic template-variable (`[tabPanel]="tabPanel"`) reference. Pass the same id as
  `<MatTabNav tabPanelId={id}>` and `<MatTabNavPanel id={id}>`; `<MatTabNavPanel
  activeTabId={...}>` likewise needs the active link's id supplied explicitly (there's no
  instance back-reference for `MatTabNav` to mutate on its own, as upstream's does internally).
- **Sortable tabs (drag-drop reordering) aren't ported.** No `@angular/cdk/drag-drop` entry point
  exists in qwik-cdk yet.
