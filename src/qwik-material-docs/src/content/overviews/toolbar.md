`MatToolbar` is a container for headers, titles, or actions.

<!-- example(toolbar-overview) -->

### Single row

In the simplest case, a toolbar may be placed at the top of your application and have a single
row that includes the title of your application.

<!-- example(toolbar-simple) -->

### Multiple rows

The Material Design spec used to describe toolbars with multiple rows. This can be done by
placing `<MatToolbarRow>` elements inside a `<MatToolbar>` and passing `multipleRows` (see
[Angular → Qwik notes](#angular-qwik-notes) below for why this is an explicit prop).

<!-- example(toolbar-multirow) -->

**Note**: Placing content outside a `<MatToolbarRow>` when multiple rows are specified is not
supported.

### Positioning toolbar content

The toolbar does not perform any positioning of its content. This gives the user full power to
position the content as it suits their application.

A common pattern is to position a title on the left with some actions on the right. This can be
easily accomplished with `display: flex`:

```tsx
<MatToolbarRow>
  <span>Second Line</span>
  <span class="example-spacer"></span>
  <MatIcon class="example-icon" aria-hidden={false} aria-label="Example user verified icon">
    verified_user
  </MatIcon>
</MatToolbarRow>
```

```css
.example-spacer {
  flex: 1 1 auto;
}
```

### Accessibility

By default, the toolbar assumes that it will be used in a purely decorative fashion and thus sets
no roles, ARIA attributes, or keyboard shortcuts. This is equivalent to having a sequence of
`<div>` elements on the page.

Generally, the toolbar is used as a header where `role="heading"` would be appropriate.

Only if the use-case of the toolbar matches that of `role="toolbar"`, the user should add the role
and an appropriate label via `aria-label` or `aria-labelledby`.

## Angular → Qwik notes

- **`multipleRows` is an explicit prop, not runtime `@ContentChildren` detection.** Upstream's
  `MatToolbar` queries its own projected `MatToolbarRow` children at runtime to decide between
  `mat-toolbar-single-row`/`mat-toolbar-multiple-rows`. Qwik has no equivalent reflection at
  render time, so pass `multipleRows` explicitly whenever you nest `<MatToolbarRow>` elements.
- **No dev-mode "mixed modes" error.** Upstream throws in dev mode when a consumer mixes free
  content and `<mat-toolbar-row>` children on the same toolbar. Not ported — deferred to a future
  qwik-material dev-mode subsystem.
- **No `MAT_TOOLBAR_CONFIG` token.** Upstream has none either — the per-instance `color` prop is
  the only consumer knob, same as upstream.
