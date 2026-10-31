# material.angular.dev docs examples — Qwik ports

Each component's headline `material.angular.dev` docs example, ported to
`src/qwik-cdk-dev-app/src/routes/<component>/example/`, compared against the
real, unmodified Angular example rendered at
`/qwik-parity/<component>/example` (`src/dev-app/qwik-parity/examples.ts`) by
`src/qwik-cdk-parity-tests/specs/examples/angular-parity.spec.ts`.

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
