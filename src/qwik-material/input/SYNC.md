# qwik-material/input sync log

Tracks the sync state between this port and `src/material/input/` upstream.
Companion to `src/qwik-material/form-field/SYNC.md` (read that first — the
control contract and the SSR-ordering constraint this port is built around
are documented there) and every other `src/qwik-material/*/SYNC.md`.

Ported 2026-10-28, gated from the start by
`specs/material-form-field/angular-parity.spec.ts` (`MatInput` is the
control every one of the 16 form-field scenarios renders).

## Upstream sync state

| File | Upstream path | Sync state | Notes |
| --- | --- | --- | --- |
| `input/mat-input.tsx` | `src/material/input/input.ts` (`MatInput` directive, 618 LOC) | ported | Polymorphic host (`as="input"\|"textarea"`, default `'input'`) — the pattern design doc rule 4 establishes for a directive applied to a consumer-written native element (`matInput`/`matNativeControl` selector matches `input[matInput], textarea[matInput], ...`). Implements `MatFormFieldControlProps` (see `core/mat-form-field-control.ts`) directly on its own props interface, so `<MatFormField control={<MatInput .../>}>` can introspect it. `disabled`/`disabledInteractive`/`required`/`readOnly` reflected exactly as upstream's host bindings specify (see deviations below for the one that needed special handling — `value`). `touched`/`dirty`/`invalid` are read from the `MAT_FORM_FIELD_CONTROL_STATE` context store when nested in a `<MatFormField>` (falling back to the plain props for standalone usage) — NOT from `props.touched`/`.dirty`/`.invalid` directly; `empty` (for `aria-invalid`) is a locally-owned signal updated from the live DOM element in `handleInput$`/`handleBlur$`, not from `props.value`. See deviation #6 and `form-field/SYNC.md`'s dedicated section for why |
| `input/input-config.ts` | `src/material/input/input.ts` (`MatInputConfig` interface + `MAT_INPUT_CONFIG` InjectionToken, lines 50-57) | new | `MatInputConfig = {disabledInteractive?}`; `MAT_INPUT_CONFIG_DEFAULTS = {disabledInteractive: false}` (upstream's implicit `_config?.disabledInteractive \|\| false`); folded into `QwikMaterialProvider.matInputConfig` |
| (no separate stylesheet) | `matInput`'s classes (`.mat-mdc-input-element`, `.mdc-text-field__input`, etc.) live inside `src/material/form-field/_mdc-text-field-structure.scss` upstream — `MatInput` has no CSS file of its own (only `_input-theme.scss`, a typography-mixin-only theme partial with no structural rules at all) | synced (via form-field) | See `form-field/SYNC.md`'s sync table — `form-field-prebuilt.scss` covers `MatInput`'s classes too. `scss/input/_input-theme.scss` is synced byte-for-byte for `diff -q` parity only (never `@use`d by any prebuilt file, same precedent as every other component's inert `_*-theme.scss`) |

## Removed upstream files

- `input-module.ts` — Qwik has no module concept
- `input-value-accessor.ts` (`MAT_INPUT_VALUE_ACCESSOR` InjectionToken) — exists upstream so e.g. `MatDatepickerInput` can delegate value get/set to itself instead of the native element; no Qwik equivalent need yet (no consumer of this port delegates value access)
- `input-errors.ts` (`getMatInputUnsupportedTypeError`) — dev-mode-gated throw for invalid `type` values (`button`/`checkbox`/`file`/`hidden`/`image`/`radio`/`range`/`reset`/`submit`); not ported, same "no dev-mode throws" deviation as `form-field/SYNC.md`'s #1
- `testing/` (`MatInputHarness`, `MatNativeOptionHarness`, `MatNativeSelectHarness`) — Angular test harness surface; no equivalent needed
- Upstream `public-api.ts`/`index.ts` — replaced with this port's own re-export shape
- `ControlValueAccessor`/`NgControl`/`_ErrorStateTracker`/`ErrorStateMatcher` injection — no Qwik forms system; see deviation #1
- Native `<select>`/`matNativeControl` support (`_isNativeSelect`, `_isInlineSelect`, `mat-mdc-native-select-inline`, selectedIndex-driven floating) — not ported; no parity scenario uses a native select, and this port's `as` prop only offers `'input'`/`'textarea'`
- `AutofillMonitor`/`CdkAutofill` (the `animationstart`-CSS-trick-based real autofill DETECTION) — not ported; see deviation #3
- iOS caret-jiggle workaround (`_iOSKeyupListener`, `Platform.IOS`-gated) — platform-specific, no DOM-visible effect any scenario could exercise

## Deviations from upstream

1. **`ControlValueAccessor`/`NgControl`/`_ErrorStateTracker`/`ErrorStateMatcher`
   removed entirely.** Qwik has no forms system. Replaced by
   `core/mat-form-control.ts`'s `useMatFormControl()` + pure validator
   functions, which the CONSUMER calls directly and feeds into `MatInput` as
   plain `formBound`/`touched`/`dirty`/`invalid`/`required` boolean props —
   see that module's own doc comment for the full reasoning (in short:
   validators/`FormControl` objects with methods are never safe to pass as
   a prop across a Qwik component boundary the way a `useStore()`'s plain
   data fields and QRL methods are, so the computation that NEEDS the
   validator functions happens once, in the consumer's own render, and only
   the RESULT — plain data — crosses into `MatInput`/`MatFormField`). This
   port hardcodes the DEFAULT `ErrorStateMatcher`'s formula
   (`invalid && touched`) directly in both `MatInput` and `MatFormField`
   (each computes its own independent copy, since each renders its own
   classes/attributes off it); no scenario needs a custom matcher.

2. **`value` is deliberately NOT a plain reactive JSX prop.** The parity
   harness's own comment (`src/qwik-cdk-parity-tests/lib/material-parity.ts`)
   groups `value` with `checked` as a "non-reflected IDL property" (once set
   via the live DOM property, it diverges from its content attribute for
   good) — exactly the problem `qwik-material/checkbox` found and fixed for
   `checked`/`indeterminate`. But unlike `checked`/`.../radio`, the harness
   has **no** live-property substitution for a text input's `value` (it
   only special-cases `el.type === 'checkbox' || 'radio'`), so a stale/
   leaked `value` attribute here would be a REAL, DETECTED diff, not a
   harmless one. Two scenarios have genuinely conflicting needs: `disabled`/
   `readonly` pass a literal, STATIC `value="…"` that must appear as a real,
   permanent attribute (Angular's own side has it as a plain unbound HTML
   attribute); `error-state` passes a LIVE, typed-into value (via
   `useMatFormControl()`) that must NEVER leave a `value="…"` attribute
   behind at any point (Angular's `[formControl]` binding is a PROPERTY
   binding, which never touches the attribute, at any value). Resolved by
   rendering the attribute from a ONE-TIME SNAPSHOT (`useSignal(() =>
   props.value)`, captured once and never reassigned, with `''` normalized
   to `undefined`) and handling every LIVE update — including the
   `error-state` scenario's typed value — via an imperative `useTask$` that
   sets the DOM PROPERTY directly through a ref, exactly mirroring
   `qwik-material/checkbox`'s proven `checked`/`indeterminate` fix (the
   task's effect on the SSR pass's mock element has zero effect on the
   serialized HTML; on the client it reruns only when `props.value` itself
   changes, with no JSX-prop-diffing path involved at all). Verified: the
   `disabled`/`readonly` scenarios' static value stays a real, stable
   attribute forever (nothing ever reassigns the frozen snapshot); the
   `error-state` scenario's typed value reaches the live DOM property
   (confirmed by Angular-parity structural + the harness's generic
   attribute walk never seeing a `value` attribute on either side).

3. **`AutofillMonitor`'s real `animationstart`-CSS-trick-based autofill
   DETECTION is not ported — only its static `cdk-text-field-autofill-
   monitored` marker class, always present.** Upstream adds this class
   unconditionally (browser-only) the moment `ngAfterViewInit` first calls
   `monitor()`; no parity scenario exercises real browser autofill, and the
   class itself needs no live detection logic behind it to render
   correctly, so it's simply always included — matches the remediation
   design doc's rule 6 ("static containers, not the lazy JS behind them")
   applied to this instead of a ripple.

4. **Native `<select>`/`matNativeControl` support not ported** — `as` only
   offers `'input'`/`'textarea'`. No parity scenario uses a native select.

5. **Angular-specific removals:** `@Directive` decorator, `@Input()`
   decorators + `booleanAttribute`/`coerceBooleanProperty`/`BooleanInput`
   transforms, `inject()` DI, `effect()`/`isSignal()`, `AfterViewInit`/
   `OnChanges`/`OnDestroy`/`DoCheck` lifecycle → plain props + Qwik hooks/
   refs/tasks (one-time id assignment via a lazily-initialized
   `useSignal(() => ...)`, same pattern as every other ported control).
   `exportAs: 'matInput'` → N/A. `focus()`/`updateErrorState()` imperative
   methods → N/A, no component-instance handle in Qwik; a consumer needing
   this uses a ref to the rendered `<input>`/`<textarea>` directly.

6. **`touched`/`dirty`/`invalid`/`empty` are NOT read from their
   like-named props directly, despite `MatInputProps` declaring them.**
   Found via `error-state` debugging (full write-up in
   `form-field/SYNC.md`'s dedicated section — read that first): when
   `<MatInput>` is nested inside `<MatFormField control={<MatInput
   touched={fc.touched} .../>}>`, this whole JSX descriptor is constructed
   ONCE, when the expression is first evaluated, and never reconstructed —
   Qwik's fine-grained per-prop reactivity does not reach a value nested
   that way (one level inside the VALUE of another component's prop),
   even though it reliably reaches a prop sitting directly on an element
   returned from a component's own JSX (confirmed via isolated
   reproductions). So `touched`/`dirty`/`invalid` are instead read from
   the `MAT_FORM_FIELD_CONTROL_STATE` context store (written by the owning
   `MatFormField` from ITS OWN top-level props — a shape that IS reliably
   live) whenever nested in a form field, falling back to the plain props
   only for standalone usage (where no such forwarding-through-another-
   component's-prop problem exists in the first place). `empty` doesn't
   need the context-store round trip — `handleInput$`/`handleBlur$`
   already hold a ref to the live DOM element, so they update a local
   `emptySignal` directly. The `MatInputProps` fields themselves are
   unchanged (still declared, still read for the SSR-correct-at-first-
   paint snapshot and for standalone usage) — only which value wins, when
   nested in a form field, changed.

## Class count

`grep -rnE "^export class" src/qwik-material/input/ 2>/dev/null` → 0 (no
exported classes on the consumer surface).

## Pipeline

`pnpm test:qwik-material` at the repo root runs `build && vitest &&
lint:no-ssr-leaks && typecheck` for the whole qwik-material package,
covering dialog + button + card + toolbar + badge + icon + progress-bar +
progress-spinner + divider + grid-list + list + button-toggle + slide-toggle
+ expansion + radio + checkbox + form-field + input + core.

## `ref` prop — composed with the internal `inputRef` (2026-11-02)

`MatInputProps.ref` (new): an external ref, merged via `core/host-props.ts`'s `composeRef()` with
this component's own `inputRef` signal (still needed internally for `handleFocus$`/`handleBlur$`/
`handleInput$`/the value-sync `useTask$`). Closes the gap found porting Formisch integration (see
`qwik-material/README.md`'s "Using with Formisch"): Formisch's `field.props.ref` needs the live
native element to register it for `focus()`/programmatic access, and `MatInput` previously had no
way to hand that out at all. Zero effect on any existing consumer — `props.ref` is `undefined`
unless explicitly passed, and `composeRef()` with one defined ref returns that ref unchanged.

## `value` live-resync for an external reassignment, and the "named attribute, never spread" constraint (2026-11-02)

The value-sync `useTask$` (`track(() => props.value)`, already existed for a typed keystroke
round-tripped back through a consumer's own reactive state — see the `error-state` scenario) now
ALSO re-derives `empty`/`shouldLabelFloat` (previously only updated by `handleInput$`/
`handleBlur$`, i.e. only for a REAL user interaction) — needed so a form library's `reset()`/
`setInput()` (first real consumer: Formisch, see `qwik-material/README.md`'s "Using with
Formisch") visually updates the floated label too, not just the DOM `.value` property. Confirmed
live (a Formisch "Fill example data" button + Playwright, before/after): without this, the input
showed the new value but the label stayed un-floated, overlapping the text.

Confirming this fix works surfaced a SEPARATE, more general finding, worth documenting here since
it applies to any consumer wiring a value into `<MatInput value={...}>` (nested inside
`<MatFormField control={<MatInput .../>}>`, which freezes its OWN `control` prop's value on
first render — see `core/mat-form-field-control.ts`'s doc comment): an externally-reassigned
value is picked up live ONLY when `value={...}`'s expression is a DIRECT signal `.value` read,
written inline — `value={field.input.value}`. Neither a spread (`{...{value: field.input.value,
...}}`) nor a value returned from a helper FUNCTION (`value={getValue(field)}`, the function
reading the signal internally) works — both leave the input frozen at whatever value was present
at first mount. Qwik's optimizer gives a literal `attr={signal.value}` JSX expression its own
live binding at the attribute level (independent of the enclosing, frozen vnode's identity), but
can only do that for an expression shape it recognizes at compile time — it can't see "through" a
spread or a function call to know the value came from a signal. See
`src/qwik-cdk-dev-app/src/routes/formisch/account/formisch-bindings.ts`'s module doc comment for
the full write-up (three confirmed attempts) and `qwik-material/README.md`'s "Using with
Formisch" gotchas list.

## Fixed: standalone `useContext` crash for the optional form-field contexts (2026-11-02)

This component's `useContext(MAT_FORM_FIELD_CONTROL_STATE, undefined)`/`useContext(
MAT_FORM_FIELD_CONNECTED_ORIGIN, undefined)` calls were switched to `core/mat-form-field-
control.ts`'s new `useOptionalFormFieldControlState()`/`useOptionalFormFieldConnectedOrigin()`
— see that file's own SYNC.md entry for the full write-up (a real, previously-latent Qwik
`Code(Q8)` crash whenever this component is used with no `<MatFormField>` ancestor at all, found
porting `qwik-material/autocomplete`'s `autocomplete-plain-input` docs example). Zero behavior
change for every existing (always form-field-nested) scenario.
