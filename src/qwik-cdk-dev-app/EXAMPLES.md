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

  **UPDATE (2026-10-31, directive-hooks remediation):** this did NOT generalize to a `use*` HOOK
  called fresh every render. `useMatBadge({hidden: hidden.value})` (`badge/use-mat-badge.tsx`,
  which replaced `badgeDecoration()` entirely) is confirmed live to react correctly — the exact
  "Hide" button scenario this bullet describes toggles `.mat-badge-hidden` on click, through the
  hook, every time. Whatever made `badgeDecoration()` specifically lose reactivity, it isn't a
  general "a function wraps a `.value` read" rule; see `badge/SYNC.md`'s directive-hook section.

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

**SUPERSEDED (2026-10-31, directive-hooks remediation).** `mat-menu/example` and
`mat-tooltip/example`'s hand-built buttons above are GONE, replaced by the general "directive
hooks" mechanism this pattern was a workaround for not having yet
(`docs/superpowers/specs/2026-10-31-qwik-material-directive-hooks-design.md`,
`qwik-material/README.md`'s "Composing directives"): `useMatMenuTrigger()`/`useMatTooltip()` now
return a `HostProps` bag spread directly onto `<MatButton>`, instead of each route hand-copying
`MatButton`'s markup and driving `openMenu`/`showTooltip` manually. Both routes are now a few
lines each — see `mat-menu/example/index.tsx` and `mat-tooltip/example/index.tsx`. `mat-dialog/
example`'s `PlainButton` is UNCHANGED and intentionally so: its composition (`matButton` +
`cdkFocusInitial`/`[mat-dialog-close]`) isn't one of the directives this design covers (no
`useMatDialogClose()`/`cdkFocusInitial` hook exists), so it's a different, still-open gap, not
silently dropped — see the design doc's "Out of scope" section. `mat-badge/example`'s
`trailingContent`-based badges (documented in "Resolved by a small qwik-material addition" below)
are ALSO superseded — see `badge/SYNC.md`'s directive-hook section.

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

## Batch C

Routes: `mat-datepicker/example` (datepicker-overview), `mat-timepicker/example`
(timepicker-overview), `mat-expansion/example` (expansion-overview),
`mat-paginator/example` (paginator-overview), `mat-sidenav/example`
(sidenav-overview), `mat-sort/example` (sort-overview), `mat-stepper/example`
(stepper-overview), `mat-table/example` (table-basic), `mat-tabs/example`
(tab-group-basic), `mat-tree/example` (tree-flat-child-accessor-overview).

All ten pass the structural + computed-style parity comparison 3x
(`--repeat-each=3`), including every added interaction step.

### Route-local CSS must be scoped by hand — a real cross-page leak, not just a risk

Each example's upstream `.css` file (`table-basic`, `sort-overview`,
`sidenav-overview`, `stepper-overview`) is copied next to its route and
applied via a plain `import './*.css'` per the batch brief ("apply it
unscoped... Qwik's `useStylesScoped$` would add extra DOM classes"). That
advice is correct for avoiding a scoped-class mismatch, but a plain Qwik CSS
import has **no scoping at all** — unlike Angular, whose `ViewEncapsulation`
appends an `[_ngcontent-*]` attribute to every selector at compile time (the
harness strips that one attribute for comparison, but it is still real,
functioning scoping in the browser: the rule only ever matches elements the
SAME component rendered). A literal, verbatim copy of the upstream CSS is
therefore a **global** stylesheet rule in the Qwik dev-app.

Confirmed live, this is not theoretical: `stepper-overview-example.css`'s own
unprefixed `.mat-mdc-form-field { margin-top: 16px; }` rule leaked into
*every* `mat-form-field` on *every route of the whole dev-app* once this
batch's routes were added to the build — including completely unrelated,
pre-existing, previously-passing specs (`specs/material-timepicker`'s
`basic-toggle`, several `specs/material-datepicker` `(calendar)` scenarios).
Those tests started failing on a 16px overlay-position offset that looked
exactly like a Qwik resumability timing race (chunk-loading order shifting
with the larger bundle) and cost significant time to trace — it was a plain
CSS selector-specificity leak the whole time. `table-basic-example.css`'s
bare `table { width: 100%; }` would have been even worse (matches literally
any `<table>` anywhere).

**Fix applied**: every copied `.css` file's selectors are prefixed with the
example's own host tag (`table-basic-example table { ... }`,
`stepper-overview-example .mat-mdc-form-field { ... }`, etc.) — the same
effective scope Angular's `ViewEncapsulation` gets, with zero DOM footprint
(a compound CSS selector, not a runtime class/attribute Qwik would add). See
each `.css` file's own header comment. **Any future docs-example port that
copies upstream CSS verbatim must do the same**, and should sanity-check
unrelated specs after adding the route, not just its own.

### `hidetoggle` static-attribute echo (`mat-expansion/example`)

`expansion-overview-example.html`'s first panel writes `<mat-expansion-panel
hideToggle>` — the bare, no-brackets form. Angular leaves `hidetoggle=""` as
a literal static attribute on the host element in addition to driving the
`@Input` (this project's own internal scenarios always use `[hideToggle]=
"true"` specifically to avoid this — see the parity README's existing
"static-attribute input echo" note). Rather than special-case this one
example, the harness's existing note was generalized: `material-parity.ts`
now has a `STATIC_INPUT_ECHO_ATTRS` list (currently `['hidetoggle']`) that's
ignored unconditionally — a no-op for any scenario binding the same input
via `[prop]`, since Angular never emits the static attribute there either.

### A bare `<table><tr>` needs an explicit, attribute-less `<tbody>` on the Qwik side (`mat-sort/example`)

`sort-overview-example.html` has no `<thead>`/`<tbody>` at all — bare `<tr>`s
directly inside `<table matSort>`. Already-documented in
`qwik-material/sort/SYNC.md` deviation #4: a browser's HTML parser inserts
an implicit, attribute-less `<tbody>` around bare `<tr>`s when building the
tree from SSR'd markup (a standard HTML5 rule), but Angular's CSR dev-app
(no SSR anywhere in this harness) never gets one. Two consequences, one
structural and one a real functional bug:

- **Structural**: `material-parity.ts`'s `snapshotParityRoot` now treats a
  `<table>`'s direct, attribute-less `<tbody>` child as transparent (splices
  its children in its place) — never touches a REAL Material `<tbody
  role="rowgroup" class="...">`, which always carries attributes.
- **Functional (the actual blocker)**: Qwik's resumability needs its
  serialized vnode tree to agree with the LIVE DOM it resumes into. Leaving
  the `<tr>`s bare in JSX means the SSR'd HTML gets the browser's implicit
  `<tbody>` that Qwik's own vnode tree doesn't know about — confirmed live,
  clicking a sort header to re-render the (now reordered) rows crashed with
  "Cannot set properties of undefined (setting '__virtual')" deep in Qwik's
  vnode diffing. The route writes the SAME `<tbody>` explicitly in its own
  JSX so Qwik's vnode tree and the parsed DOM agree from the start — fixes
  the crash, and the harness's own normalization above still treats it as
  equivalent to Angular's bare `<tr>`s.

### `matButton` + `matStepperNext`/`matStepperPrevious` on one element (`mat-stepper/example`)

`stepper-overview-example.html`'s Next/Back buttons are `<button matButton
matStepperNext>` — two upstream directives stacked on one native `<button>`.
`qwik-material/stepper`'s `MatStepperNext`/`MatStepperPrevious` gained a new
`matButton?: boolean | MatButtonAppearance` prop that composes the
`matButton` directive's own chrome (ripple/focus-indicator/touch-target/
ripple-loader markup, `APPEARANCE_CLASSES`) directly, reusing the same
`qwik-material/button/internal/*` pieces `<MatButton>` itself is built from
— the same "can't nest two host-rendering components on one element"
precedent `qwik-material/paginator`'s `PaginatorNavButton` already set for
`matIconButton` + `matTooltip`. Omitted (every pre-existing scenario): bare
button, unchanged. See `stepper-buttons.tsx`'s doc comment and
`qwik-material/stepper/SYNC.md`.

**SUPERSEDED (2026-10-31, directive-hooks remediation).** The `matButton` prop above is REMOVED.
`use-stepper-buttons.ts`'s `useMatStepperNext()`/`useMatStepperPrevious()` now return a
`HostProps` bag spread directly onto `<MatButton>` (the general mechanism this prop was a
workaround for not having yet — see `docs/superpowers/specs/2026-10-31-qwik-material-directive-
hooks-design.md`). `mat-stepper/example` was rewritten to call the hooks via two small local
components (`stepper-nav-buttons.tsx`) instead — see `qwik-material/stepper/SYNC.md`'s directive-
hook section for why that indirection is needed (`MAT_STEPPER_ACTIONS` context resolution).

### `MatTimepickerInput`'s `ng-*` classes needed a real `formBound` gate (`mat-timepicker/example`)

`timepicker-overview-example.html`'s input is plain `[matTimepicker]`, no
`ngModel`/`formControl` at all — Angular's `NgControlStatus` directive
(selector `[formControlName],[ngModel],[formControl]`) never activates, so
the real `<input>` carries none of `ng-untouched`/`ng-pristine`/`ng-valid`.
`qwik-material/timepicker`'s `MatTimepickerInput` always rendered these three
classes unconditionally — `formBound` was a declared prop every pre-existing
call site passed, but the component never actually read it. Fixed to gate
the three classes behind `formBound` (default `false`, matching `MatInput`'s
own convention); every pre-existing scenario/route already passes
`formBound` explicitly, so this is a no-op for all of them. See
`mat-timepicker-input.tsx`'s and `qwik-material/timepicker/SYNC.md`'s
updated doc comments.

### Font-mode `<MatIcon>` needs the dev-app's M3 default font-set (`mat-tree/example`)

The tree toggle's `<mat-icon class="mat-icon-rtl-mirror">` (ligature text
`chevron_right`/`expand_more`, no explicit `fontSet` input) resolves through
Angular's icon-registry default, which the Angular dev-app shell sets to
`material-symbols-outlined` by default (`DevAppLayout.toggleM3`,
`m3Enabled` defaults `true`) — confirmed live against `/qwik-parity/
mat-icon/basic`. `src/qwik-cdk-dev-app/src/routes/mat-icon/layout.tsx`
already reproduces this for every `/mat-icon/*` scenario via a scoped
`<QwikMaterialProvider matIconConfig={{fontSet: 'material-symbols-
outlined'}}>`. This route is the first OTHER route tree to render a
font-mode `<MatIcon>`, so it wraps just its own `<MatTree>` in the SAME
provider, inline (safe to nest anywhere — the provider renders a bare
`<Slot/>`, no wrapper DOM). Passing `fontSet` as an explicit PROP instead
would ALSO render a `data-mat-icon-namespace` attribute Angular's un-bound
`<mat-icon>` never has — not equivalent, see `qwik-material/icon/SYNC.md`'s
updated note.

Also composes `<MatIconButton>` (public API) directly with the tree's own
`CDK_TREE_TOGGLE_STATE` context (also public, from `@angular-community/
qwik-cdk/tree`) for the toggle button — upstream stacks `matIconButton` +
`matTreeNodeToggle` on one element, and `qwik-cdk/tree`'s own
`<CdkTreeNodeToggle>` deliberately renders a bare button with no icon-button
chrome (to stay decoupled from Material styling — every OTHER tree parity
scenario relies on exactly that decoupling). No qwik-material/qwik-cdk
change needed — pure consumer-level composition, same pattern as
`qwik-material/paginator`'s `PaginatorNavButton`.

### `page.clock` emulation confuses Angular's own real `FocusMonitor` timing (`mat-datepicker/example`)

Confirmed live: with `page.clock.setFixedTime()` active (needed for the deterministic "today"
below), Angular's real, unmodified `<mat-datepicker>` classifies its calendar's initial
auto-focus as `cdk-program-focused` instead of its normal `cdk-mouse-focused` for an ordinary
toggle click — reproduced identically with/without clock emulation, same click, same unmodified
Angular page. This is a Playwright-clock-emulation artifact on Angular's own timing-sensitive CDK
code, not a Qwik defect: `qwik-material/datepicker/mat-calendar.tsx` hardcodes `'mouse'` for every
click-driven auto-focus by design (see that file's own doc comment), so it can never follow
Angular's clock-confused drift. No sequencing avoids it — the calendar's displayed month is
computed fresh at OPEN time, so the clock must stay frozen through the click; resuming real time
first would just show the real current month again, defeating the whole point. The `mat-
datepicker/example` interaction is therefore scoped to the default root only (field/toggle,
unaffected — the toggle's own `focusVia(el, 'program')` is an explicit, non-timing-dependent
call), not also the `.cdk-overlay-container` root the calendar content attaches to.

### `aria-expanded` must stay unset when the node's own `isExpandable` input is never bound (`mat-tree/example`)

`tree-flat-child-accessor-overview-example.html`'s `<mat-tree-node *matTreeNodeDef="let node;
when: hasChild" matTreeNodePadding matTreeNodeToggle ...>` never binds `[isExpandable]` at all —
confirmed live, Angular's real `<mat-tree-node>` here carries NO `aria-expanded` attribute, even
though the node genuinely has children and a working toggle (already documented as intentional,
never-inferred behavior in `qwik-cdk/tree/flatten-tree.ts`'s own doc comment: "`isExpandable` ...
must be set explicitly; never inferred"). The route's `CdkTreeNodeInput` entries omit
`isExpandable` accordingly (do NOT set it to `true` just because the node has children/a
toggle), and set `nodeToggle: true` explicitly instead — `nodeToggle` would otherwise default to
`isExpandable`'s value (`false`), which would silently drop keyboard Enter/Space-toggles-the-row
behavior that upstream's `matTreeNodeToggle` directive on the `<mat-tree-node>` tag itself (not
just its inner button) provides.

### A scenario with more than one `<mat-form-field>` needs ALL of them to settle, not just the first (`mat-stepper/example`)

`stepper-overview-example` has two `<mat-form-field>`s, one per step — each one's own
~300ms-delayed `mat-form-field-animations-enabled` mount timer (see
`qwik-material/form-field/mat-form-field.tsx`) can land at a slightly different moment. The
shared harness's `waitForFormFieldAnimationsSettled()` previously checked only
`document.querySelector('.mat-mdc-form-field')` (the FIRST match) before every comparison; fixed
to `querySelectorAll(...).every(...)` (the same "every matching element" shape
`specs/material-expansion/angular-parity.spec.ts`'s own `settle` step already uses for
`.mat-expansion-panel-animations-enabled`) — this is a general harness fix, not scoped to
stepper, since any OTHER multi-form-field scenario could have hit the same race.

Also: `stepper-overview-example.html`'s `<input matInput formControlName="firstCtrl"
required>`/`formControlName="secondCtrl"` is the first scenario anywhere in this port to use
Angular's REAL reactive-forms directive (`[formControlName]`) rather than a local stand-in (every
other stepper scenario's `useRequiredControl()` is deliberately narrow, plain-`<input>`-only —
see `qwik-material/stepper/SYNC.md` deviation #1). `formControlName`'s value is entirely
consumer-chosen (the control's name in whatever `FormGroup` the consumer built) and has no Qwik
equivalent, so `material-parity.ts`'s `CONSUMER_SELECTOR_ATTRS` gained a `formcontrolname` entry
— the same "directive-selector attribute, not part of the component's DOM contract" category
`matsort`/`mat-sort-header`/etc. already use.

### Clock emulation for "today"-relative examples, and why the timepicker doesn't need it

Neither `datepicker-overview-example` nor `timepicker-overview-example` sets a `startAt`/initial
value, so opening either one shows CURRENT, "today"-relative state — non-deterministic
run-to-run without help. `material-parity.ts` gained a `ParityScenario.clockDate` option
(`page.clock.setFixedTime()`, real timers/animations unaffected — see its own side effect on
Angular's FocusMonitor noted above) used by the datepicker's "open calendar" interaction (see
that section above for why it's one entry, not two). The timepicker's own option list turned out
to be time-of-day-only (`generateOptions`), never "today"-relative, so its interaction needs no
clock emulation at all — see `specs/examples/angular-parity.spec.ts`'s header comment and the
parity README's "Clock emulation" section.

## Scenario visual cleanup

Hand-written parity scenarios (`src/dev-app/qwik-parity/<component>.ts` +
`src/qwik-cdk-dev-app/src/routes/<route>/<scenario>/`, distinct from each component's headline
`/example` route above) pin specific states/interactions for the DOM/computed-style parity gate.
Several used lazy placeholder content — solid-color divs stretched to fill their container,
meaningless filler text — that doesn't look like real usage when a developer opens the page to
eyeball the port. This section tracks visual-only cleanup passes: same fix applied identically to
the Angular mirror and the Qwik route, scenario intent unchanged, parity suite still green.

### mat-list — `avatar`, `icon-meta`

Both scenarios' leading swatches used inline `style="width: 100%; height: 100%; ..."` — an inline
style always wins over an external stylesheet rule on the SAME element regardless of selector
specificity, so it overrode the `.mdc-list-item--with-leading-avatar`/`--with-leading-icon`
`.mdc-list-item__start` rule that sizes the real element to a fixed 40px square/circle
(`src/material/list/list.scss` + `_list-inherited-structure.scss`). The swatch instead stretched
to fill its flex-row parent's full width — the reported "full-width horizontal bars of solid
colour" bug.

- `avatar`: dropped the width/height override (the component CSS already sizes + rounds it to a
  circle) and added initials text ("AS"/"BJ"/"CD", matching the 3 named contacts the scenario
  already uses) with a small inline flex-center style, so it reads as a real avatar swatch instead
  of a colored bar.
- `icon-meta`: replaced the colored `<div>` with a real `<mat-icon matListItemIcon>` (Qwik:
  `<MatIcon class="mat-mdc-list-item-icon mdc-list-item__start">`, mirroring the directive's host
  classes the way `MatIconPrefix`/`MatIconSuffix` already do elsewhere), using icon names
  ("inbox"/"send"/"drafts") matching each item's own label — same pattern as upstream's
  `list-sections-example.html` (`<mat-icon matListItemIcon>folder</mat-icon>`).

**Port-adjacent finding, not a qwik-material bug:** a bare `<mat-icon>` with no explicit `fontSet`
resolves to class `material-symbols-outlined` in this Angular **dev-app**, not upstream Material's
real default (`material-icons mat-ligature-font`, which `MAT_ICON_DEFAULT_FONT_SET_CLASS` in
`qwik-material/icon/icon-config.ts` correctly mirrors). The dev-app's root component always wraps
`<router-outlet>` in `<dev-app-layout>` (`src/dev-app/dev-app.ts`), whose constructor calls
`MatIconRegistry.setDefaultFontSetClass('material-symbols-outlined')` because `DevAppState`'s
`m3Enabled` field defaults to `true` (`src/dev-app/dev-app/dev-app-state.ts`) — this reaches every
route, including the bare `/qwik-parity/*` scenario routes. The `icon-meta` Qwik route now wraps
its content in `<QwikMaterialProvider matIconConfig={{fontSet: 'material-symbols-outlined'}}>` to
match — not a `fontSet` PROP directly on `<MatIcon>`, which would additionally emit a
`data-mat-icon-namespace` attribute that Angular's un-set registry default never adds (see
`MatIconProps.fontSet`'s doc comment vs. `MatIconConfig.fontSet`'s). Any future scenario that adds
a bare real `<mat-icon>`/`<MatIcon>` needs the same provider wrapper to stay in parity.
