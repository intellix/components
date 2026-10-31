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
- **Reading a signal's `.value` as a plain function PARAMETER, then using the function's return
  value in a JSX prop, silently drops reactivity** — even though the function visibly returns
  the fresh value on every re-render. Found while wiring `badge-overview`'s "Hide" button: a
  module-level `badgeDecoration({…, hidden: hidden.value})` helper's returned `class` array was
  passed to `<MatButton class={decoration.class}>`. Clicking "Hide" correctly flipped the
  `hidden` signal and re-ran the render function (confirmed via logging: the helper's return
  value visibly included `mat-badge-hidden` on the next render) — but the live DOM class never
  changed. Replacing it with the class array built INLINE in the JSX attribute, reading
  `hidden.value` directly in that same expression (`class={[...base, hidden.value &&
  'mat-badge-hidden'].filter(Boolean)}` on `<MatButton>` itself), fixed it immediately, with no
  other change. Qwik's optimizer appears to decide whether a JSX prop expression gets a reactive
  getter by statically scanning THAT expression's own syntax for a `.value` read — a `.value`
  read one level removed (inside a plain function the expression merely calls) doesn't count,
  even though nothing about calling conventions normally matters for correctness in plain JS.
  See `mat-badge/example/index.tsx`'s header comment and `badgeDecoration()`'s doc comment for
  the applied fix. Not root-caused inside Qwik's optimizer itself; flagging here as a trap for
  any future component that factors signal-derived JSX prop values into a helper function.

## Resolved by a small qwik-material addition

These were small enough to fix directly in qwik-material (see each component's own SYNC.md
for the full writeup) rather than leave as a gap:

- **`MatButton`/`MatIcon` couldn't be decorated by another host-attaching directive.**
  `badge-overview`'s `<button matButton matBadge>` and `<mat-icon matBadge>` attach `[matBadge]`
  directly onto an existing component's own host element and append `.mat-badge-content` as its
  last child — something no Qwik component's `as`-prop pattern (`<MatBadge as="…">`, closed to
  `span|div|button|a`) can do from the outside, since `<MatButton>`/`<MatIcon>` own their entire
  rendered subtree. Added a `trailingContent?: JSXOutput` prop to both (button/SYNC.md item 15,
  icon/SYNC.md item 15): extra content appended as the host's real last child, after everything
  the component itself renders — and specifically BEFORE the lazily-inserted ripple span on
  `MatButton` (upstream's directive creates its badge span eagerly, well before any interaction,
  while the ripple span only ever appears lazily on first interaction, so the badge span is
  always the earlier sibling once both exist in the real DOM). The route
  (`src/qwik-cdk-dev-app/src/routes/mat-badge/example/index.tsx`) computes `MatBadge`'s class
  ladder + content span manually for just the features this example uses (content, position,
  hidden) and passes them through `trailingContent` — not a general badge-on-anything API, just
  enough to reproduce this one example's exact DOM.
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
- **`mat-slide-toggle/example`: HTML5 parsing closes a `<p>` wrapping a `<div>`, however deeply
  nested, which Angular's pure-CSR dev-app never hits but Qwik's SSR+browser-parse pipeline
  always does.** `slide-toggle-overview-example.html` wraps each `<mat-slide-toggle>` in a
  `<p>`; `<MatSlideToggle>` renders a required `<div mat-internal-form-field>` inside it.
  Confirmed with a minimal repro (`page.setContent('<p><mat-slide-toggle><div>x</div>
  </mat-slide-toggle></p>')` → `<p><mat-slide-toggle></mat-slide-toggle></p><div>x</div><p>
  </p>` in a real browser) — not a qwik-material bug, a fundamental SSR-vs-CSR difference for
  this one HTML shape: Angular's dev-app is pure CSR, building this tree via `Renderer2`
  createElement/appendChild calls that never parse an HTML string, so it never hits the rule;
  Qwik SSRs real HTML text that the browser then parses, so it always does. No fix available
  short of never SSRing `<MatSlideToggle>`'s internals, which would risk every other passing
  `/mat-slide-toggle/*` scenario (46 tests, all currently passing). Left as a known,
  genuinely-failing test (see `specs/examples/angular-parity.spec.ts`'s header comment), same
  category as the pre-existing `mat-timepicker` `min-max` failure. The route itself still keeps
  the literal `<p>` wrapper matching upstream's source structure — the port's intent is correct,
  only the SSR'd runtime DOM diverges.

## Batch B overview

Each component's headline `material.angular.dev` example, ported verbatim against the Angular
side already rendering the real, unmodified upstream example (`src/dev-app/qwik-parity/
examples.ts`). Routes live at `src/qwik-cdk-dev-app/src/routes/<component>/<route>/`; the parity
gate is `src/qwik-cdk-parity-tests/specs/examples/angular-parity.spec.ts`. Other batches add their
own section below, under their own heading — this file is shared, so keep edits scoped to your
own section unless you're fixing something broken.

## Batch B

Routes: `mat-autocomplete/example` (autocomplete-simple), `mat-form-field/example` +
`example-input` (form-field-overview, input-overview), `mat-select/example` (select-overview),
`mat-chips/example` (chips-overview), `mat-slider/example` (slider-overview), `mat-menu/example`
(menu-overview), `mat-tooltip/example` (tooltip-overview), `mat-snack-bar/example`
(snack-bar-overview), `mat-bottom-sheet/example` (bottom-sheet-overview), `mat-dialog/example`
(dialog-overview). All 11 pass the parity gate, each 3x, including every interaction step added.

### Pattern: two Angular directives stacked on one native element

Three of the real upstream examples stack a directive-pattern component (`matButton`) with a
SECOND directive on the exact same native element — something no two of this port's own
"polymorphic `as` prop, renders its own host" components (`MatButton`, `MatMenuTrigger`,
`MatTooltip`) can currently do together, since each wants to own the whole host element itself
(design doc rule 4). Rather than widen `MatButton`'s prop surface (used by nearly every other
component in this port) just for this, each affected route owns the native element itself and
reproduces both directives' real, **verified-live** DOM/behavior from already-exported building
blocks — the same low-level runtime functions the sugared components call internally:

- `mat-menu/example` (`matButton` + `[matMenuTriggerFor]`) — drives `openMenu`/`closeMenu`
  (`qwik-material/menu`'s own exported runtime, the same functions `<MatMenuTrigger>` calls)
  directly from the button's `onClick$`.
- `mat-tooltip/example` (`matButton="elevated"` + `matTooltip`) — drives `showTooltip`/
  `hideTooltip` (`qwik-material/tooltip`'s own exported runtime) from `onMouseEnter$`/
  `onMouseLeave$`.
- `mat-dialog/example`'s dialog body (`matButton` + `[mat-dialog-close]`/`cdkFocusInitial`) — a
  small local `<PlainButton>` (`mat-dialog/example/plain-button.tsx`) that reproduces `MatButton`'s
  markup directly; its `[mat-dialog-close]` behavior is just a plain `dialogRef.close(value)`
  call, needing no directive at all.

`MatButton`'s own static markup (the four `<span>`s, the lazy `mat-ripple-loader-*` host attrs)
is copied verbatim into each composed button; `MatRippleLoader`'s lazy-init toggle is reproduced
with a local signal flipped from one of its real bootstrap events (confirmed live: `focus` /
`mousedown` / `mouseenter` all qualify) — whichever one the scenario's own interaction already
exercises.

**Scope limit, by design:** `MatButton`'s own `useFocusOrigin()`-driven `cdk-*-focused` classes
are reproduced only where the route's own interaction actually needs them (`mat-dialog/example`'s
`PlainButton` calls `useFocusOrigin()` directly, since — unlike the menu/tooltip case — it IS its
own component root, so this is exactly `MatButton`'s own arrangement). `mat-menu/example`'s and
`mat-tooltip/example`'s composed buttons do **not** track focus-origin at all: confirmed live,
neither scenario's own tested interaction (open-by-click, show-by-hover) ever leaves a
`cdk-*-focused` class on the real Angular trigger either (menu auto-focuses the first item,
blurring the trigger; hovering never moves focus) — so this is a deliberate, verified scope cut,
not an oversight. A future batch adding an escape/keyboard-driven interaction to either scenario
would need to add real focus-origin tracking first.

### qwik-material additions (small, additive, upstream-aligned)

- `qwik-material/autocomplete`: `MatAutocompleteProps.inputAriaLabel` — the trigger `<input>`'s
  own plain `aria-label` (the existing `'aria-label'` prop targets the *separate*
  `<mat-autocomplete>` panel's own `@Input aria-label`; `MatAutocompleteTrigger` has no
  `aria-label` input of its own at all, so a real `<input matInput [matAutocomplete]="auto"
  aria-label="…">` is a plain, untouched native attribute). See `autocomplete/SYNC.md`.
- `qwik-material/list`: `MatListItemTitle`/`MatListItemLine` gained `as?: 'div' | 'span'`
  (`MatListItemAvatar`/`MatListItemIcon` already had this). See `list/SYNC.md`.
- `qwik-cdk-parity-tests/lib/material-parity.ts`'s `CONSUMER_SELECTOR_ATTRS`: added `mattooltip`,
  `cdkfocusinitial`, `matnativecontrol`. All three are bare, unbound template attributes in the
  *real* upstream examples (every project-authored mirror scenario elsewhere always binds a
  value-carrying directive input with `[prop]="…"` specifically to avoid this echo — the verbatim
  docs examples don't have that luxury), and none has a corresponding host binding in its real
  upstream directive (confirmed against `tooltip.ts`, `@angular/cdk/a11y`'s focus-trap — which
  doesn't even have a `CdkFocusInitial` directive class, just a plain `querySelector` — and
  `input.ts`'s `MatInput` selector, which already matches `matInput` the same way).

### `select-overview`'s native `<select matNativeControl>` card

`qwik-material/input`'s `MatInput` deliberately never ported `matNativeControl`/native-`<select>`
support (`input/SYNC.md`: "no parity scenario uses a native select"). Rather than grow `MatInput`
with a whole second host-element kind for one docs example, `mat-select/example` implements this
card with a small, **route-local** `NativeSelectControl` (`mat-select/example/
native-select-control.tsx`) that implements the same `MatFormFieldControlProps` contract
`MatInput`/`MatSelect` already implement — `core/mat-form-field-control.ts`'s own doc comment
establishes this as a general "any component can be `<MatFormField>`'s control" contract, not
something hardcoded to the two the package ships. Passing a non-empty literal `value` prop is
enough for `MatFormField`'s existing, control-agnostic `shouldLabelFloat`/`hidePlaceholder`
formulas to produce the exactly-correct result for a native select whose first option is always
"selected" by plain HTML default (confirmed live) — **no native-select-specific logic was needed
in any shared file**. If a future batch needs a second native-select scenario (e.g. with
selection tracked, or a `multiple`/inline select), promoting this into `qwik-material/input` as a
real `as="select"` mode is the natural next step; today it's one file, used once.

### Other known, accepted differences (not fixed, same category as existing ones)

- `mat-chips/example`'s fourth chip (`<mat-chip disabled>`, a bare, unbound attribute in the real
  template) gets a literal `disabled=""` attribute echoed onto Angular's `<mat-chip>` host — the
  exact same static-attribute-echo category `README.md` already documents for `value` (confirmed
  against `chip.ts`: `MatChip`'s own host bindings for `disabled` are class-only, no
  `[attr.disabled]`). `MatChipSet`'s `chips` array has no host-attribute escape for this (and
  this one chip never changes), so it's reproduced with a one-time DOM write in the route itself
  rather than a new prop on a shared, widely-used component.
- `mat-slider/example`'s copied CSS needed its selector widened from `mat-slider` to
  `mat-slider.mat-mdc-slider` to keep the specificity Angular's emulated encapsulation gives the
  same rule (an unscoped copy otherwise loses to `MatSlider`'s own global `.mat-mdc-slider {
  width: auto; }`) — see that route's own CSS file for the full writeup. Worth checking for any
  OTHER ported example whose copied CSS sets a property Angular Material's own component styles
  also set at class-level specificity; `mat-form-field/example`'s `:host` rule needed a
  different, simpler fix (rewritten to the example's own custom-element tag name — no shadow DOM
  to target it unscoped otherwise).
