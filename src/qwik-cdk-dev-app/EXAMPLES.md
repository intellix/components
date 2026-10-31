# material.angular.dev docs examples — porting notes

Tracks gaps the Qwik port genuinely has, found while porting each component's headline
material.angular.dev example (`src/qwik-cdk-dev-app/src/routes/<component>/example/`) against
its real upstream source (`src/components-examples/material/<component>/<example-id>/`). See
`src/qwik-cdk-parity-tests/specs/examples/angular-parity.spec.ts` for the parity gate and
`src/dev-app/qwik-parity/examples.ts` for the Angular reference side.

## Qwik pitfalls found while porting (not previously documented)

- **A `.map()`-generated list of components, each with a `checked`/similar prop computed from
  `signal.value[i]`, can silently stop reacting to later signal writes** — even though the prop
  expression reads `.value` directly (no helper-function indirection) and the enclosing
  component visibly re-renders with the fresh value. Found in `checkbox-overview`'s 3 subtask
  checkboxes: clicking the parent checkbox (which sets `task.value = nextTask(...)`, flipping
  all 3 subtasks to `completed: true`) correctly re-ran the render function and read the new
  `task.value` — confirmed via the live `.checked` DOM property staying `false` while the signal
  and the render output were already `true`. Replacing the
  `task.value.subtasks.map((subtask, i) => <MatCheckbox checked={task.value.subtasks[i]
  .completed} .../>)` loop with 3 separately-written `<MatCheckbox checked={task.value
  .subtasks[0].completed} .../>` (etc.) calls — a reasonable port choice regardless, since
  upstream's own subtask array is a fixed 3 items — fixed it. Not root-caused further
  (plausibly a keyed-list child-prop-update gap); flagging here since it could bite a FUTURE
  port that has an actually-dynamic list of controlled form components.
- **Adding a 3rd optional/conditional JSX child around a component's `<Slot/>` can corrupt the
  Slot's OWN projection bookkeeping across a click-triggered re-render.** Found while giving
  `MatButton` a leading `icon?: JSXOutput` prop (button/SYNC.md item 16) alongside its existing
  `trailingContent` prop and the ripple span (`{rippleInitialized.value && <span .../>}`, absent
  until first interaction): rendering `{props.icon}` (always `undefined` for `badge-overview`'s
  "Hide" button, which uses no icon) immediately before `<span class="mdc-button__label">
  <Slot/></span>` was otherwise inert on the FIRST render — but after clicking "Hide" (flips a
  signal that both toggles a CSS class AND, via the SAME click, lazily initializes the ripple
  span), the label's projected "Hide" text vanished from the live DOM: `<!--qv --><!--/qv-->`
  with no `q:s`/`q:sref` slot reference at all, where a correct re-render has `<!--qv q:s
  q:sref=… q:key=-->Hide<!--/qv-->`. Reverting JUST the `{props.icon}` insertion (keeping
  `trailingContent` and everything else) fixed it immediately, reproduced 5/5 with the
  insertion, 0/5 without. Not root-caused (suspects: Qwik's vnode diff miscounting/misassigning
  comment-marker slots when THREE conditionally-present children straddle one `<Slot/>` across
  a render that both changes a class AND lazily mounts a previously-absent sibling); flagging
  as a trap for any future component with a `<Slot/>` flanked by more than one
  optional/conditional child. `MatButton` itself has no scenario needing a leading icon, so the
  prop was simply dropped there — `MatFabButton`/`MatMiniFabButton` kept it (see below); neither
  has a `trailingContent` prop, so they never hit this combination.

## Resolved by a small qwik-material addition

These were small enough to fix directly in qwik-material (see each component's own SYNC.md
for the full writeup) rather than leave as a gap:

- **`MatButton`'s `<a>` host forwarded no native anchor attribute beyond `href`.**
  `button-overview` has `<a matButton href target="_blank">` several times. Added
  `target?: string` (button/SYNC.md item 14). Other anchor attributes (`rel`, `download`, …)
  remain unsupported — no current scenario needs them.
- **`MatFabButton`/`MatMiniFabButton` always wrapped `<Slot/>` (icon included) in
  `.mdc-button__label`.** Upstream's real `button.html` (shared with `MatButton`) projects a
  leading `mat-icon`/`.material-icons`/`[matButtonIcon]` child via a SEPARATE `<ng-content>`
  ahead of the label — by TYPE, not by source position — so an icon written inside the button's
  content lands OUTSIDE `.mdc-button__label` in the real DOM, not inside it. `button-overview`'s
  plain FAB, Mini FAB, and Extended FAB buttons (icon-only or icon+text) exposed this: previously
  no `/mat-button/*` scenario put a real `<MatIcon>` inside one of these three components (the
  existing `fab`/`mini-fab` routes use plain text/emoji). Added an `icon?: JSXOutput` prop to
  `MatFabButton`/`MatMiniFabButton` (button/SYNC.md item 16) — rendered as a direct child before
  the label, same "named prop instead of slotted children" pattern `MatListItem`/`MatCardHeader`
  already use for analogous by-type projection. `MatButton` deliberately did NOT get this prop
  — see the Qwik pitfall above. `iconPositionEnd` (icon AFTER the label) isn't exposed on either
  component — no current scenario needs it.

## Open gaps (ported around, not fixed)

- **`MatCardAvatar` only renders an `<img>`; `card-overview`'s avatar is a plain
  `<div mat-card-avatar>` (a CSS `background-image` div, no `<img>` at all).** Already a known,
  documented deviation (card/SYNC.md item 1: "Image and avatar are components that render
  `<img>`, not directives applied to a consumer-supplied element.") — not something this batch
  should fix, since the real one-off here isn't "the port's `<img>` is wrong" but "this
  particular example doesn't use an `<img>` at all." Ported by writing the `<div>` directly in
  the route with the same `mat-mdc-card-avatar` class the `[mat-card-avatar]` directive's host
  binding would add (the `mat-card-avatar` selector attribute itself is a
  `CONSUMER_SELECTOR_ATTRS` entry the parity harness ignores either way, so it's omitted).
  Fixing this properly — a `<MatCardAvatar>`/`<MatCardImage>` variant that renders a plain host
  Slot instead of a hardcoded `<img>` — is a real but separate card-port task, not scoped to
  this batch.
