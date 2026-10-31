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
