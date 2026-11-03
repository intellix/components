qwik-material provides two sets of components designed to add collapsible side content (often
navigation, though it can be any content) alongside some primary content. These are the sidenav
and drawer components.

The sidenav components are designed to add side content to a fullscreen app. To set up a sidenav
we use three components: `<MatSidenavContainer>` which acts as a structural container for our
content and sidenav, `<MatSidenavContent>` which represents the main content, and `<MatSidenav>`
which represents the added side content.

<!-- example(sidenav-overview) -->

The drawer component is designed to add side content to a small section of your app. This is
accomplished using `<MatDrawerContainer>`, `<MatDrawerContent>`, and `<MatDrawer>`, which are
analogous to their sidenav equivalents. Rather than adding side content to the app as a whole,
these are designed to add side content to a small section of your app. They support almost all of
the same features, but do not support fixed positioning.

<!-- example(sidenav-drawer-overview) -->

### Specifying the main and side content

Both the main and side content should be placed inside of `<MatSidenavContainer>`; content that
you don't want to be affected by the sidenav, such as a header or footer, can be placed outside
of the container.

The side content should be wrapped in a `<MatSidenav>` element, passed via the container's
`start-drawer`/`end-drawer` q:slot (see [Angular → Qwik notes](#angular-qwik-notes) below). The
`position` prop can be used to specify which end of the main content to place the side content
on. `position` can be either `'start'` or `'end'`, which places the side content on the left or
right respectively in left-to-right languages. If `position` is not set, the default value of
`'start'` will be assumed. A `<MatSidenavContainer>` can have up to two `<MatSidenav>` elements
total (one per q:slot), but only one for any given side.

The main content should be wrapped in `<MatSidenavContent>`.

<!-- example(sidenav-position) -->

### Opening and closing a sidenav

A `<MatSidenav>`'s opened state is owned by the consumer — pass `opened` and read changes back
via `onOpenedChange$` (see [Angular → Qwik notes](#angular-qwik-notes)).

`<MatSidenav>` also supports callback props for just open and just close events: `onOpened$` and
`onClosed$` respectively, plus `onOpenedStart$`/`onClosedStart$` for when a transition begins.

<!-- example(sidenav-open-close) -->

All of these props work on `<MatDrawer>` as well.

#### Opening/closing imperatively

If you need to open/close/toggle a drawer from code that isn't rendering the `opened` prop
itself (a toolbar button elsewhere in the page, a layout service), call `useMatDrawerRef()` and
wire its `opened`/`onOpenedChange$` onto your `<MatDrawer>`/`<MatSidenav>` the same way you would
your own signal. The returned handle's `open$()`/`close$()`/`toggle$(isOpen?)` mirror upstream's
`MatDrawer.open()`/`close()`/`toggle()`, each resolving a `Promise<'open' | 'close'>` once the
transition has settled (see [Angular → Qwik notes](#angular-qwik-notes)).

### Changing the sidenav's behavior

`<MatSidenav>` can render in one of three different ways based on the `mode` prop.

| Mode   | Description                                                                             |
|--------|-------------------------------------------------------------------------------------------|
| `'over'` | Sidenav floats over the primary content, which is covered by a backdrop                 |
| `'push'` | Sidenav pushes the primary content out of its way, also covering it with a backdrop     |
| `'side'` | Sidenav appears side-by-side with the main content, shrinking the main content's width to make space for the sidenav. |

If no `mode` is specified, `'over'` is used by default.

<!-- example(sidenav-mode) -->

The `'over'` and `'push'` sidenav modes show a backdrop by default, while `'side'` does not. This
can be customized by setting the `hasBackdrop` prop on `<MatSidenavContainer>`. Explicitly
setting `hasBackdrop` to `true` or `false` will override the default backdrop visibility setting
for all sidenavs regardless of mode. Leaving the prop unset uses the default backdrop visibility
for each mode.

<!-- example(sidenav-backdrop) -->

`<MatDrawer>` also supports all of these same modes and options.

### Disabling automatic close

Clicking on the backdrop or pressing the Esc key will normally close an open sidenav. However,
this automatic closing behavior can be disabled by setting the `disableClose` prop on the
`<MatSidenav>` or `<MatDrawer>` that you want to disable the behavior for.

Custom handling for backdrop clicks can be done via the `onBackdropClick$` prop on
`<MatSidenavContainer>`.

<!-- example(sidenav-disable-close) -->

### Resizing an open sidenav

This port always keeps drawer widths live via a `ResizeObserver` (see [Angular → Qwik
notes](#angular-qwik-notes)) — the `autosize` prop is accepted for API parity but has no
additional behavioral effect here.

<!-- example(sidenav-autosize) -->

### Setting the sidenav's size

`<MatSidenav>` and `<MatDrawer>` will, by default, fit the size of its content. The width can be
explicitly set via the `width` prop (e.g. `width="200px"`) or CSS.

### Fixed position sidenavs

For `<MatSidenav>` only (not `<MatDrawer>`), fixed positioning is supported. It can be enabled by
setting the `fixedInViewport` prop. Additionally, top and bottom space can be set via the
`fixedTopGap` and `fixedBottomGap` props.

<!-- example(sidenav-fixed) -->

### Creating a responsive layout for mobile & desktop

A sidenav often needs to behave differently on a mobile vs a desktop display. The sidenav can be
styled with CSS to adjust to either type of device.

<!-- example(sidenav-responsive) -->

### Accessibility

`<MatSidenav>` and `<MatSidenavContent>` should each be given an appropriate `role` prop
depending on the context in which they are used.

For example, a `<MatSidenav>` that contains links to other pages might be marked
`role="navigation"`, whereas one that contains a table of contents might be marked
`role="directory"`. If there is no more specific role that describes your sidenav,
`role="region"` is recommended.

Similarly, `<MatSidenavContent>` should be given a role based on what it contains. If it
represents the primary content of the page, it may make sense to mark it `role="main"`. If no
more specific role makes sense, `role="region"` is again a good fallback.

#### Focus management

The sidenav has the ability to capture focus. This behavior is turned on for the `'push'` and
`'over'` modes and it is off for `'side'` mode.

## Angular → Qwik notes

- **A drawer is passed into its container via a named q:slot, not by being an immediate child.**
  Upstream's `<mat-sidenav-container>` queries its own projected `<mat-sidenav>` children by
  content-child selector, supporting up to one per `position`. Qwik can't inspect a `<Slot/>`'s
  projected children the same way, so `<MatSidenavContainer>` exposes `start-drawer`/`end-drawer`
  q:slots instead — pass your `<MatSidenav>`/`<MatDrawer>` with `q:slot="start-drawer"` (or
  `"end-drawer"`). Everything else (typically `<MatSidenavContent>`, or any other content) goes
  in as the container's plain default-slotted children.
- **`opened` is a consumer-owned prop; the imperative `open()`/`close()`/`toggle()` equivalent
  is an opt-in hook, not a component-instance handle.** Upstream's `<mat-sidenav>` exposes
  `open()`/`close()`/`toggle()` methods (each returning a `Promise<MatDrawerToggleResult>`) you'd
  call via a template reference or `@ViewChild`. Qwik has no component-instance handle to call
  methods on, so the default is still flipping your own `opened` signal directly
  (`opened.value = !opened.value`) and reading settled state back via `onOpenedChange$` — but
  `useMatDrawerRef()` gives you the same `Promise`-returning `open$()`/`close$()`/`toggle$()`
  shape as a plain hook result, wired onto `<MatDrawer>` the same way your own signal would be,
  and usable from anywhere the returned handle is held (not just from inside the drawer's own
  subtree).
- **`autosize` is accepted but has no additional effect.** This port always keeps drawer widths
  live via a `ResizeObserver`, unlike upstream's opt-in remeasurement (only on open/resize/mode
  change by default, to avoid layout thrashing) — kept as a prop for API parity only.
