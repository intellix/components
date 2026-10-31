# Ported material.angular.dev docs examples

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
