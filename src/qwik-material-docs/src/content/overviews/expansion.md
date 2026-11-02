`MatExpansionPanel` provides an expandable details-summary view.

<!-- example(expansion-overview) -->

### Expansion-panel content

#### Header

`<MatExpansionPanelHeader>` (passed via `MatExpansionPanel`'s `header` q:slot, see
[Angular → Qwik notes](#angular-qwik-notes) below) shows a summary of the panel content and acts
as the control for expanding and collapsing. This header may optionally contain a
`<MatPanelTitle>` and a `<MatPanelDescription>` (both passed as their own named q:slots), which
format the content of the header to align with Material Design specifications.

By default, the expansion-panel header includes a toggle icon at the end of the header to
indicate the expansion state. This icon can be hidden via the `hideToggle` prop.

#### Action bar

Actions may optionally be included at the bottom of the panel, visible only when the expansion
is in its expanded state — pass a `<MatActionRow>` as a regular child of `<MatExpansionPanel>`.

#### Disabling a panel

Expansion panels can be disabled using the `disabled` prop. A disabled expansion panel can't be
toggled by the user, but can still be manipulated programmatically (set `expanded` directly).

### Accordion

Multiple expansion panels can be combined into an accordion by nesting `<MatExpansionPanel>`s
inside `<MatAccordion>`. The `multi` prop allows the expansion state to be set independently of
each other. When `multi` is unset (default `false`) just one panel can be expanded at a given
time.

### Lazy rendering

By default, the expansion panel content will be initialized even when the panel is closed. To
instead defer initialization until the panel is open, wrap the content in
`<MatExpansionPanelContent>`:

```tsx
<MatExpansionPanel header={<MatExpansionPanelHeader>This is the expansion title</MatExpansionPanelHeader>}>
  <MatExpansionPanelContent>Some deferred content</MatExpansionPanelContent>
</MatExpansionPanel>
```

### Accessibility

`MatExpansionPanel` imitates the experience of the native `<details>` and `<summary>` elements.
The expansion panel header applies `role="button"` and the `aria-controls` attribute with the
content element's ID.

Because expansion panel headers are buttons, avoid adding interactive controls as children of
`<MatExpansionPanelHeader>`, including buttons and anchors.

## Angular → Qwik notes

- **Header/title/description are passed as named q:slot content, not `<ng-content>`-projected
  children by selector.** Upstream's `<mat-expansion-panel-header>`/`<mat-panel-title>`/
  `<mat-panel-description>` are content-projected by element selector anywhere inside
  `<mat-expansion-panel>`'s template. `MatExpansionPanel` instead renders
  `<MatExpansionPanelHeader q:slot="header">` (itself containing `<MatPanelTitle q:slot="title">`/
  `<MatPanelDescription q:slot="description">`) as named-slot content — the rest of the panel's
  children are its plain default-slotted body/action-row content, matching source order.
- **Lazy content is a plain conditional render, not a `TemplatePortal`/`CdkPortalOutlet`.**
  `<MatExpansionPanelContent>` gates on a `hasEverOpened` signal and returns `null` until the
  panel has opened once — Qwik has no portal primitive for this and doesn't need one (the
  content is already physically present as a regular child, just not rendered until the gate
  flips). Functionally identical DOM outcome.
- **No RTL keyboard-navigation support yet.** Upstream's `MatAccordion` threads `Directionality`
  through its arrow-key handler for `[dir='rtl']` layouts; no scenario in this port's contract
  exercises RTL, so this hasn't been wired up.
- **No imperative `openAll()`/`closeAll()` handle exposed to consumers yet.** The underlying
  `qwik-cdk/accordion` headless layer (`useCdkAccordion()`) computes `openAll$`/`closeAll$`
  internally for `MatAccordion`'s own use, but `MatAccordion` doesn't expose them back to a
  consumer (e.g. via a ref or callback prop) the way upstream's `@ViewChild(MatAccordion)` lets a
  component call `accordion.openAll()`/`closeAll()` directly. The ["Accordion with expand/collapse
  all toggles"](https://material.angular.dev/components/expansion/overview#expansion-expand-collapse-all)
  example isn't ported yet for this reason — Phase 2 adds this rest; see also the next point for a
  second, unrelated gap the same example depends on.
- **`MatDatepickerInput` has no public "open the calendar programmatically" trigger.** Upstream's
  `picker.open()` (called from a bare `readonly` input's `(focus)` handler, as the ["Expansion
  panel as accordion"](https://material.angular.dev/components/expansion/overview#expansion-steps)
  example does for its date field) has no equivalent exposed from
  `@angular-community/qwik-material/datepicker`'s public API yet — only `<MatDatepickerToggle>`'s
  click handler can open it. That example isn't ported yet for this reason.
