# qwik-material/radio sync log

Tracks the sync state between this port and `src/material/radio/` upstream.
Every deviation from a verbatim copy is recorded here. Companion to
`src/qwik-material/dialog/SYNC.md`, `src/qwik-material/button/SYNC.md`,
`src/qwik-material/card/SYNC.md`, `src/qwik-material/toolbar/SYNC.md`,
`src/qwik-material/badge/SYNC.md`, `src/qwik-material/icon/SYNC.md`,
`src/qwik-material/progress-bar/SYNC.md`,
`src/qwik-material/progress-spinner/SYNC.md`,
`src/qwik-material/divider/SYNC.md`, `src/qwik-material/grid-list/SYNC.md`,
`src/qwik-material/list/SYNC.md`, `src/qwik-material/button-toggle/SYNC.md`,
and `src/qwik-material/core/SYNC.md`.

Ported 2026-10-28 against upstream, following
`docs/superpowers/specs/2026-10-27-qwik-material-dom-parity-remediation-design.md`
and `docs/superpowers/specs/2026-10-27-qwik-material-remaining-components-roadmap.md`
(wave 1: slide-toggle, checkbox, radio, expansion). Gated from the start by
`specs/material-radio/angular-parity.spec.ts` (11/11 scenarios passing).

## Upstream sync state

| File | Upstream path | Sync state | Notes |
| --- | --- | --- | --- |
| `radio/mat-radio-group.tsx` | `src/material/radio/radio.ts` (`MatRadioGroup` directive, lines 103-373) | ported | Controlled-component surface: `value` + `onChange$` (no two-way binding — upstream's `change` is a plain `EventEmitter`, no `valueChange` counterpart). Drops `ControlValueAccessor`/`EventEmitter`/`@ContentChildren`. Publishes a per-instance `MAT_RADIO_GROUP_STATE` context carrying `value`/`name`/`disabled`/`required`/`disabledInteractive`/`labelPosition`/`color` and a change-routing QRL. `name` defaults via `useIdGenerator()` (lazily, once) when the consumer omits it, matching upstream's `_name = inject(_IdGenerator).getId('mat-radio-group-')` field initializer. Upstream is a `@Directive` attached to a consumer-written `<mat-radio-group>` host element (no own template); this port renders that host element itself, same approach as `MatButtonToggleGroup` for the analogous upstream `@Directive` — a plain `aria-label`/`aria-labelledby`/`aria-describedby` on it is NOT a declared `@Input`, just a pass-through prop (confirmed by the parity spec header). No lifecycle, no `useVisibleTask$`/`useStore`/`useTask$`. No own keydown handler — native same-`name` radio-input grouping handles ArrowUp/ArrowDown/Left/Right for free (unlike button-toggle, which has no native grouping and reimplements roving-tabindex keydown itself) |
| `radio/mat-radio-button.tsx` | `src/material/radio/radio.ts` (`MatRadioButton` component, lines 403-796) + `radio.html` (43 LOC template inlined) | ported | Reads `MAT_RADIO_GROUP_STATE` (DEFAULTS fallback, `standalone: true`) and `MAT_RADIO_CONFIG` (DEFAULTS fallback). `checked` derived from `state.value === props.value` when grouped; a local `useSignal` seeded once from the `checked` prop when standalone (see "Deviations" #1 below for why no `UniqueSelectionDispatcher` port was needed). `color`/`disabledInteractive`/`required`/`disabled`/`labelPosition` each resolve own-prop → group → config → upstream's hardcoded final fallback, mirroring the getter chains in `radio.ts`. Roving tabindex is upstream's actual `_updateTabIndex()` condition (disabled, or no group, or nothing selected in the group yet → own `tabIndex`; else 0 if selected, else -1) rendered declaratively as a plain `tabIndex` JSX prop — no imperative DOM write needed, because Qwik's runtime forces `tabIndex` through `setAttribute` on every property-diff pass regardless (see "Deviations" #2 for why `checked` can't use the same reasoning). `FocusMonitor`-equivalent classes via `useFocusOrigin()` (qwik-cdk/a11y) on the host, matching button-toggle's precedent. Renders upstream's `radio.html` inline: touch target, native `<input type="radio">`, `.mdc-radio__background` circles, and the `.mat-ripple.mat-radio-ripple.mat-focus-indicator > .mat-ripple-element.mat-radio-persistent-ripple` ripple container (real click-driven `.mat-ripple-element` spans launch into it — see "Deviations" #6). `preventdefault:click` (declarative, evaluated by qwikloader before any handler resolves) replaces upstream's `_onInputClick` Renderer2 listener for the disabled-interactive click-guard — see "Deviations" #2 |
| `radio/radio-config.ts` | `src/material/radio/radio.ts` (`MatRadioDefaultOptions` interface + `MAT_RADIO_DEFAULT_OPTIONS` InjectionToken, lines 78-101) | new | `MatRadioConfig = {color?, disabledInteractive?}` + `MAT_RADIO_CONFIG` context id, `MAT_RADIO_CONFIG_DEFAULTS = {color: 'accent', disabledInteractive: false}` (upstream's factory values, verbatim); folded into `QwikMaterialProvider.matRadioConfig` |
| `radio/radio-group-state.ts` | (partial — `src/material/radio/radio.ts` `MAT_RADIO_GROUP` InjectionToken + internal group state) | new | Externalizes upstream's group-internal state into a per-instance context, Signal-wrapped (not a plain object) for the same reason documented in `button-toggle-group-state.ts`: a freshly-built plain object passed to `useContextProvider()` does not notify existing consumers on a later render. No `fallbackTabIndexClaimed`-style claim mechanism needed (unlike button-toggle) — upstream's actual radio tabindex rule needs no `QueryList`-driven "pick the first enabled one" fallback; `value` IS the single source of truth |
| `radio/radio-color.ts` | `src/material/radio/radio.ts`'s `color: ThemePalette` field, narrowed | new | `MatRadioColor = 'primary' \| 'accent' \| 'warn'`, same narrowing pattern as `MatIconColor`/`MatProgressBarColor` |
| `scss/radio/radio.scss` | `src/material/radio/radio.scss` (116 LOC) | synced | byte-identical copy, zero `@angular/cdk` references (confirmed by grep) |
| `scss/radio/_radio-common.scss` | `src/material/radio/_radio-common.scss` | synced | Byte-for-byte copy with the one allowed edit: `@use '@angular/cdk';` → `@use '../cdk-stub' as cdk;` (line 1), for the `cdk.high-contrast` mixin used by `.mdc-radio__inner-circle`'s forced-colors override — same stubbing rationale as dialog/button-toggle (see their SYNC.md) |
| `scss/radio/_radio-theme.scss` | `src/material/radio/_radio-theme.scss` | synced | byte-identical copy; theme mixins inert on our end (no runtime theming system) but kept for `diff -q` parity. Never actually `@use`d by `radio-prebuilt.scss` — same as `_m2-radio.scss` below, present for parity only |
| `scss/radio/_m2-radio.scss` | `src/material/radio/_m2-radio.scss` | synced | byte-identical copy |
| `scss/radio/_m3-radio.scss` | `src/material/radio/_m3-radio.scss` | synced | byte-identical copy; actually compiled (transitively `@use`d by `radio.scss` for `$fallbacks: m3-radio.get-tokens();`), unlike `_m2-radio.scss`/`_radio-theme.scss` |
| `scss/radio/radio-prebuilt.scss` | (qwik-material-specific) | new | `@use` radio.scss only — no `:root` token defaults (removed 2026-10-30, see `core/SYNC.md` "Default theme"): every `--mat-radio-*` variable already carries a real M3 fallback to `--mat-sys-*` baked in via `token-utils.slot()`, matching upstream's default `get-tokens()` with no color-variant override |

## Removed upstream files

- `radio-module.ts` — Qwik has no module concept
- `testing/` (`MatRadioHarness`) — Angular test harness surface; no equivalent needed
- Upstream `public-api.ts` — replaced with our own re-export shape
- `radio.spec.ts` (~1050 LOC) — ported to `mat-radio-scenarios.spec.tsx` (sanity tests) + real DOM/behavior coverage in `specs/material-radio/*.spec.ts` (Playwright) per the project's smoke-only vitest constraint
- `radio.html` (43 LOC) — inlined into JSX
- `MatRadioChange` class — event shape unneeded (QRLs receive raw values, not `{source, value}` objects)
- `MAT_RADIO_GROUP_CONTROL_VALUE_ACCESSOR` / `ControlValueAccessor` / `NG_VALUE_ACCESSOR` — Qwik has no forms system
- `UniqueSelectionDispatcher` (`@angular/cdk/collections`) — see "Deviations" #1
- `FocusMonitor` (`@angular/cdk/a11y`) direct injection — replaced by the lazy, `useOn()`-based `useFocusOrigin()` hook (qwik-cdk/a11y), already shared with button-toggle

## Deviations from upstream

1. **`UniqueSelectionDispatcher` removed — replaced by a `useOnDocument('change', …)` listener for the one case it's actually needed.** Upstream needs this cross-component bus because "native radio change events are only fired on the item currently being selected" (its own doc comment), so something has to explicitly flip `checked = false` on every *other* same-`name` `MatRadioButton` instance to keep Angular's internal field in sync. A *grouped* button never needs this: its `checked` is recomputed from the shared group context's `value` on **every** render of **every** child, so unchecking the previously-selected one is just normal reactivity. A *standalone* button (no group — the `standalone` scenario) has no shared reactive ancestor with its same-`name` sibling, so the browser's own native unchecking of its `<input>` is never fought by a stale re-render *of that input* — but the button's own *rendered host class* (`mat-mdc-radio-checked`) is derived from a local signal, not the live DOM, and nothing would ever tell that signal to flip without some cross-component notice. `MatRadioButton` therefore keeps one `useOnDocument('change', …)` listener (lazy, `useOn`-based, not `useVisibleTask$` — see `qwik-cdk/a11y/focus-origin/focus-origin.ts`'s doc comment for why that distinction matters): native `change` events already bubble to `document` for free, so every standalone button can watch for a *different* same-`name` input becoming checked and reset its own local signal in response — the Qwik-native shape of `UniqueSelectionDispatcher.listen()`, with the document's own event bubbling standing in for the registry. Each button's own native `change` listener still updates only its *own* local signal and fires only its *own* `onChange$` — exactly mirroring upstream's *per-button* `change: EventEmitter`.

   Both the per-button `change` handler and the document-wide listener additionally guard against staleness by re-checking the live `.checked` property of the `<input>` the event actually fired on, not just trusting that the event happened: clicks fired back-to-back on different same-`name` radios, before their `onChange$`/handler chunks have loaded, can have their *handler invocations* resume out of order even though the browser already settled the native DOM synchronously on the *last* click. If a handler's own target input is no longer actually checked (grouped or standalone) by the time it finally runs, a later click already superseded it, so it bails out instead of forcing stale state back onto a DOM a more recent click already corrected. `MatRadioGroup`'s `lastChangedAt` event-timestamp guard (see "Rapid clicks" below) adds a second layer of the same protection on the group's `value` itself.

2. **`checked` is a live DOM *property*, not an attribute — this shaped both the component and the shared Playwright harness.** Browsers never auto-reflect `checked`/`value`/`selected` to their content attribute (unlike `disabled`/`required`, which do) — once the live property changes, the attribute (if any) is permanently stale. Qwik's SSR must still bake a literal `checked` attribute for a control that starts checked (there is no other way to represent that boolean in static HTML before any JS runs), so a radio that starts checked and later becomes unchecked keeps a stale `checked=""` attribute forever (Qwik's runtime only ever *sets the property* on updates, by design — `checked` is explicitly `forceProperty`'d, never attribute-patched, in `@builder.io/qwik/core.mjs`'s `PROP_HANDLER_MAP`). Angular Material's own dev-app is pure CSR (`bootstrapApplication`, no SSR), so its rendered `<input>` *never* shows a `checked` attribute at all, checked or not. Fixed in the shared harness, not with a per-component hack: `src/qwik-cdk-parity-tests/lib/material-parity.ts`'s `snapshotParityRoot()` now reads the live `.checked` **property** instead of the attribute for any `<input type="checkbox"|"radio">`, on both sides — this is a reason that "applies to every component" per the remediation design's rule 1 (checkbox and slide-toggle, still to be ported, hit the exact same SSR-vs-CSR architecture gap). The *click-time* half of the same property/attribute distinction also ruled out an `onClick$`-handler-based `preventDefault()` for the disabled-interactive guard (upstream's `_onInputClick`, attached via `Renderer2.listen` as a true synchronous native listener): Qwik's event dispatch always resolves a QRL handler through a (micro)task-deferred `import()`, even when the chunk is already cached, so by the time a handler body could call `event.preventDefault()` the browser's synchronous native click → checked-toggle default action has already completed. Used the declarative `preventdefault:click` JSX prop instead (evaluated by qwikloader's dispatcher *before* it resolves any handler) — known statically at render time, since `disabled && disabledInteractive` doesn't depend on the click itself.

3. **`EventEmitter` `change` removed from both the group and the button.** Replaced by `onChange$` QRL props on each — no `.emit()` API surface, no `MatRadioChange` event object.

4. **`ControlValueAccessor` / `NG_VALUE_ACCESSOR` / `ngModel` / `FormControl` removed entirely.** Qwik has no equivalent forms system. Replaced by the controlled-component pattern (consumer owns `value` via a signal).

5. **Angular-specific removals:** `@Input()` decorators + `booleanAttribute`/`numberAttribute` transforms + `HostAttributeToken` → TypeScript types + prop passthrough. `@ContentChildren(MatRadioButton)` `QueryList` → per-instance context; no `QueryList`-driven fallback logic was needed (unlike button-toggle — see `radio-group-state.ts`'s doc comment). `AfterContentInit`/`AfterViewInit`/`DoCheck`/`OnInit`/`OnDestroy` lifecycle → no lifecycle; one-time `ngOnInit`-style id/name assignment replicated via lazily-initialized `useSignal(() => …)` (runs its initializer exactly once). `providers: [{provide: MAT_RADIO_GROUP, useExisting: MatRadioGroup}]` → per-instance `MAT_RADIO_GROUP_STATE` context. `exportAs` → N/A. Host bindings → plain JSX attribute passthrough (the host's `[attr.tabindex]/[attr.aria-label]/[attr.aria-labelledby]/[attr.aria-describedby]: null` stripping is achieved for free by simply never putting those on the host element). The host's `(focus)` listener (forwards a `.focus()` call made directly on `<mat-radio-button>` to the inner input) is not ported — no parity scenario calls `.focus()` on the custom element directly (same omission precedent as button-toggle's analogous host `(focus)` listener).

6. **Ripple animation now ported (2026-10-30, `core/ripple/` remediation), superseding the original note below.** The static `<div mat-ripple class="mat-ripple mat-radio-ripple mat-focus-indicator">` container (with its always-present, template-literal `.mat-ripple-element.mat-radio-persistent-ripple` child — NOT a transient animated ripple, purely CSS-driven by ancestor checked state) now ALSO receives real, transient `.mat-ripple-element` spans on pointer events — `core/ripple/ripple-dom.ts`'s `handleRippleEvent()` wired to `onMouseDown$`/`onMouseUp$`/`onMouseLeave$`/`onTouchStart$`/`onTouchEnd$`/`onTouchCancel$` on `<MatInternalFormField>` (the SAME element upstream's `[matRippleTrigger]="_rippleTrigger.nativeElement"` points at — `_rippleTrigger` is `@ViewChild('formField', …)`, i.e. the whole form field, not just the `.mdc-radio` control; clicking the label also launches a ripple, confirmed by upstream's own template). `MatInternalFormField` gained matching `onMouseDown$`/etc. prop passthroughs for this (`core/mat-internal-form-field.tsx`) — no other current caller needs them. `centered: true` matches `[matRippleCentered]="true"`; `disableRipple || disabled` matches `_isRippleDisabled()`'s core (global-options OR'd term omitted — no global-options system in this port).

## Class count

`grep -rnE "^export class" src/qwik-material/radio/ 2>/dev/null` → 0 (no exported classes on the consumer surface).

## Pipeline

`pnpm test:qwik-material` at the repo root runs `build && vitest && lint:no-ssr-leaks && typecheck` for the whole qwik-material package, covering dialog + button + card + toolbar + badge + icon + progress-bar + progress-spinner + divider + grid-list + list + button-toggle + core + radio.

## Rapid clicks while handlers load (2026-10-28)

Same race as button-toggle's (see its SYNC.md section of the same name), but
with an extra wrinkle specific to a *native* form control: clicks fired
back-to-back on different same-`name` radios, right after load while handler
chunks are still loading, always settle the native DOM correctly and
synchronously (the browser does this regardless of JS) — but the *handler
invocations* for those clicks' `change` events can still resume out of order.
A late-resuming handler for a click that has since been superseded would
otherwise force stale state back over a DOM a more recent click already
corrected: `MatRadioGroup`'s `value` could get set back to an earlier click's
value (grouped case), or a standalone button could re-flip its own
`localChecked` to `true` — or flip a sibling's back to `false` via the
`useOnDocument` listener (see "Deviations" #1) — using data from an event that
no longer reflects reality.

Fixed with two guards, one per layer:
- Every `change` handler (the per-input one, and the document-wide
  standalone listener) first checks whether the DOM element the event
  actually fired on is **still** live-`checked`. If not, a later click
  already superseded this one, and the handler does nothing — this alone
  fixes the standalone case, since each button's own state is independent.
- `MatRadioGroup` additionally keeps a `lastChangedAt` event-timestamp
  guard — it resolves the consumer callback before applying a change and
  ignores any change older (by `event.timeStamp`) than the one already
  applied — so the group's `value` (and therefore every child's derived
  `checked`) always ends up matching the *last* click even if two *distinct,
  still-valid* change events happened to resolve out of order.

Covered by `qwik-cdk-parity-tests/specs/material-radio/rapid-clicks.spec.ts`
(single-select group and standalone-sharing-a-name cases, 5 fresh loads each
since the race only shows up some of the time).

## Qwik v2 regression: a real click silently dropped (2026-11-01)

Upgrading to `@qwik.dev/core@2.0.0-rc.4` broke every click-driven parity
scenario (`basic`, `preselected`, `color`, `label-position`,
`disabled-individual`, `required`, `named-group`, `aria-attrs` — 9 of
`material-radio`'s parity specs): clicking a radio did nothing at all, with
no console error. Root cause had nothing to do with the rapid-clicks race
above — it reproduced on the FIRST, only click of a fresh page, and only via
a *trusted* pointer click (`page.mouse.click()` / Playwright's
`locator.click()`, mousedown→mouseup with no delay); neither a scripted
`element.click()` nor a same-process synthetic `dispatchEvent()` sequence
triggered it, and inserting just a ~5ms delay between mousedown and mouseup
made it disappear too.

`checked` used to be a plain per-render expression (`standalone ?
localChecked.value : state.value === props.value`) read directly by the
native `<input>`'s JSX `checked` prop. That prop has no reactivity of its
own under v2 — it's only re-applied to the DOM when the *component itself*
re-renders. `useFocusOrigin()`'s `pointerdown`/`focusin` listeners (every
real click focuses the element right after pressing it) each deferred a
re-render — and Qwik v2 resolves every event handler via a
microtask-deferred `import()`, even an already-cached one, so handler
*invocations* don't preserve DOM-event order. When the focus-driven
re-render landed before `onNativeChange$` (the input's own `change`
handler) got a turn, it recomputed `checked` from the (not-yet-updated)
group `value` — still `false` — and reasserted that onto the native
`<input>`, overwriting the real click's native toggle. By the time
`onNativeChange$` finally ran, its own (otherwise legitimate — see "Rapid
clicks" above) `if (!target.checked) return` staleness guard read that
stomped-back `false` and silently discarded the click.

Fixed by giving `checked` the same treatment
`qwik-material/checkbox/mat-checkbox.tsx` already uses for the identical
hazard: a dedicated `Signal` (`checkedSig`) written imperatively from a
`useTask$` that tracks only `stateSignal.value`/`localChecked.value` — i.e.
only re-fires when the actual selection state changes, never merely because
`focusOrigin` did. `tabIndexValue` needed no equivalent fix: nothing reads
the native input's *live* `tabindex` attribute to gate a decision the way
`onNativeChange$` reads `target.checked`, so a stale value an unrelated
render might still momentarily write is cosmetic — it self-corrects the
moment the real selection-change render lands (recomputed from the same
`checked`/`state.value` in that same pass).
