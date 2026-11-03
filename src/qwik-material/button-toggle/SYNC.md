# qwik-material/button-toggle sync log

Tracks the sync state between this port and `src/material/button-toggle/`
upstream. Every deviation from a verbatim copy is recorded here. Companion to
`src/qwik-material/dialog/SYNC.md`, `src/qwik-material/button/SYNC.md`,
`src/qwik-material/card/SYNC.md`, `src/qwik-material/toolbar/SYNC.md`,
`src/qwik-material/badge/SYNC.md`, `src/qwik-material/icon/SYNC.md`,
`src/qwik-material/progress-bar/SYNC.md`,
`src/qwik-material/progress-spinner/SYNC.md`,
`src/qwik-material/divider/SYNC.md`,
`src/qwik-material/grid-list/SYNC.md`,
`src/qwik-material/list/SYNC.md`, and `src/qwik-material/core/SYNC.md` (new —
pseudo-checkbox, see below).

## 2026-10-27 DOM-parity remediation

Re-ported against upstream per
`docs/superpowers/specs/2026-10-27-qwik-material-dom-parity-remediation-design.md`.
That design's rule 1 overrides every "scope cut" below that affects rendered
DOM or interaction: pseudo-checkbox, ripple container, focus-overlay span,
roving-tabindex keyboard navigation, `FocusMonitor`-equivalent classes, and
id-generator-backed `id`/`name` defaults are **no longer dropped** — they are
now implemented and gated by
`specs/material-button-toggle/angular-parity.spec.ts` (8/8 scenarios passing,
including a "keyboard focus" Tab-into-root case). `button-toggle.scss` is now
byte-for-byte synced from upstream (cdk-stub import swap only), replacing the
~90-line rewrite from the original 2026-08-11 port.

Two upstream-DOM corrections found only by running the Angular-vs-Qwik diff
(both documented as deviations from the *original port*, not upstream):

- The original port rendered `role="checkbox"` for multi-select toggles.
  Upstream's actual template (`button-toggle.html`) is
  `[attr.role]="isSingleSelector() ? 'radio' : 'button'"` — multi-select
  AND standalone toggles both render `role="button"` + `aria-pressed`; only
  single-select grouped toggles render `role="radio"` + `aria-checked`.
  `role="checkbox"` never appears anywhere upstream.
- The original port deselected a single-select toggle by re-clicking it.
  Upstream `_onButtonClick()`: `newChecked = isSingleSelector() ? true : …` —
  clicking an already-selected single-select toggle is a no-op (radio
  semantics never self-deselect).

Still intentionally unported (no parity scenario exercises them, and they
are independent of DOM-parity concerns the rest of this remediation targets):
`appearance: 'legacy'`, `vertical`, `disabledInteractive`, RTL (`Directionality`).
See deviations below.

## `hideSingleSelectionIndicator` / `hideMultipleSelectionIndicator` (2026-11-03)

Implemented — previously always `false` (checkmark always shown), now wired end-to-end per
upstream's actual template condition (`button-toggle.html`):

```
@if (buttonToggleGroup && (
  !buttonToggleGroup.multiple && !buttonToggleGroup.hideSingleSelectionIndicator ||
  buttonToggleGroup.multiple && !buttonToggleGroup.hideMultipleSelectionIndicator)
) { <div class="mat-button-toggle-checkbox-wrapper">...</div> }
```

- `MatButtonToggleConfig` (`button-toggle-config.ts`) gained both fields, mirroring upstream's
  `MatButtonToggleDefaultOptions`/`MAT_BUTTON_TOGGLE_DEFAULT_OPTIONS` factory default (`{
  hideSingleSelectionIndicator: false, hideMultipleSelectionIndicator: false }`, exported as
  `MAT_BUTTON_TOGGLE_CONFIG_DEFAULTS`) — threaded through the existing
  `<QwikMaterialProvider matButtonToggleConfig={…}>` channel (upstream provides this via DI;
  this port already has the equivalent per-subtree config context).
- `MatButtonToggleGroupProps` gained both as per-group overrides (`props.x ?? config.x ??
  MAT_BUTTON_TOGGLE_CONFIG_DEFAULTS.x`, the established per-field-fallback convention), mirroring
  upstream's own `@Input()` pair on `MatButtonToggleGroup` (there is no per-TOGGLE override
  upstream either — both flags are GROUP-level only, read by each child via
  `buttonToggleGroup.hideSingleSelectionIndicator`/`.hideMultipleSelectionIndicator`).
- `MatButtonToggleGroupState` carries both resolved booleans; `MAT_BUTTON_TOGGLE_GROUP_STATE_DEFAULTS`
  sets both `false` (irrelevant for standalone toggles either way — see below).
- `mat-button-toggle.tsx`'s checkbox-wrapper render condition is now `!isStandalone &&
  (state.mode === 'single' ? !state.hideSingleSelectionIndicator :
  !state.hideMultipleSelectionIndicator)` — exactly upstream's `@if`, including the outer
  `buttonToggleGroup &&` guard (a standalone toggle, which has no group, NEVER renders the
  checkbox wrapper regardless of either flag — upstream's condition short-circuits on the same
  `buttonToggleGroup &&` before ever reaching either indicator check).

No parity scenario previously exercised a `true` value for either flag; `mat-button-toggle-
scenarios.spec.tsx` gained unit coverage, and `specs/material-button-toggle/
hide-selection-indicator.spec.ts` (Playwright, fresh `page.goto` — covers single-mode
`hideSingleSelectionIndicator`, multi-mode `hideMultipleSelectionIndicator`, and the cross-flag
case: a single-mode group with `hideMultipleSelectionIndicator` set but NOT
`hideSingleSelectionIndicator` still shows the checkbox, matching upstream's per-mode-only
condition) pins the new DOM shape against the real Angular app. Zero behavior change for every
pre-existing scenario (`props.hideSingleSelectionIndicator`/`.hideMultipleSelectionIndicator`
default `undefined`, resolving to upstream's own `false` default either way).

## Upstream sync state

| File | Upstream path | Sync state | Notes |
| --- | --- | --- | --- |
| `button-toggle/mat-button-toggle-group.tsx` | `src/material/button-toggle/button-toggle.ts` (MatButtonToggleGroup class, lines 124-547) | ported | Controlled-component surface. Drops SelectionModel/CVA/EventEmitter/@ContentChildren; replaces `change`/`valueChange` EventEmitters with `onChange$`/`onValuesChange$` QRLs; publishes per-instance MAT_BUTTON_TOGGLE_GROUP_STATE with the single `onToggle` QRL routed by mode. Reads MAT_BUTTON_TOGGLE_CONFIG with DEFAULTS fallback (SSR-safe). `name` defaults via `useIdGenerator()` (lazily, once) when the consumer omits it, matching upstream's `_name = inject(_IdGenerator).getId(...)` field initializer. Implements upstream `_keydown()` (roving-tabindex arrow-key nav, single-select only) via an `onKeyDown$` handler that queries its own rendered DOM (no `@ContentChildren` equivalent exists in Qwik) and `.click()`s the target button — re-entering the same `onClick$` a real pointer click would. No lifecycle, no `useVisibleTask$`/`useStore`/`useTask$` |
| `button-toggle/mat-button-toggle.tsx` | `src/material/button-toggle/button-toggle.ts` (MatButtonToggle class, lines 548-793) + `button-toggle.html` (36 LOC template inlined) | ported | Reads MAT_BUTTON_TOGGLE_GROUP_STATE with DEFAULTS fallback; `standalone` boolean field (not identity check) detects standalone usage → `useSignal(false)` local checked state. `role`/`aria-checked`-vs-`aria-pressed` computed by `isSingleSelector()` (radio+aria-checked only for single-select grouped; role="button"+aria-pressed for multi-select AND standalone). `id` defaults via `useIdGenerator()` (lazily, once) when omitted, matching upstream's `ngOnInit` id assignment; inner button id is `${id}-button`. Single-select roving tabindex: selected (or, with nothing selected, the first non-disabled) toggle gets `tabindex=0`, all siblings `-1`; the "first non-disabled" bootstrap is a per-group-render claim flag (see `button-toggle-group-state.ts`) since Qwik has no `@ContentChildren`/`QueryList` to pick it from directly. Renders the `.mat-button-toggle-checkbox-wrapper > <MatPseudoCheckbox>` (grouped toggles only, both modes — matches upstream's actual `@if` condition once the never-set `hideSingle/MultipleSelectionIndicator` flags are accounted for), the `.mat-button-toggle-focus-overlay` span, and the `matripple` `.mat-ripple.mat-button-toggle-ripple` span (real `.mat-ripple-element` spans now launch on pointer events — see "Deviations" #7). Focus-origin classes (`cdk-focused`/`cdk-keyboard-focused`/`cdk-mouse-focused`/`cdk-touch-focused`/`cdk-program-focused`) come from `useFocusOrigin()` (qwik-cdk/a11y) — a lazy `useOn()`-based hook, not `useVisibleTask$` (see qwik-cdk/a11y/SYNC.md and `focus-origin.ts`'s own doc comment for why: Qwik's `class` prop replaces `className` wholesale every render, so the origin has to be a real signal feeding this component's own class array, not a side-channel `classList` mutation). No hidden `<input>` — upstream has none; `name` sits directly on the inner `<button>` |
| `button-toggle/button-toggle-config.ts` | `src/material/button-toggle/button-toggle.ts` (MatButtonToggleDefaultOptions interface + MAT_BUTTON_TOGGLE_DEFAULT_OPTIONS InjectionToken, lines 62-90) | new | MatButtonToggleConfig = {} interface (empty today) + MAT_BUTTON_TOGGLE_CONFIG context id; folded into QwikMaterialProvider.matButtonToggleConfig for family shape parity. Upstream defaults (appearance/hideIndicator/disabledInteractive) all dropped per deviation #6 below — no parity scenario needs them |
| `button-toggle/button-toggle-group-state.ts` | (partial — `src/material/button-toggle/button-toggle.ts` MAT_BUTTON_TOGGLE_GROUP InjectionToken + internal group state) | new | Externalizes upstream's group-internal state (mode/value/values/disabled/name + a click handler) into a per-instance context so Qwik children can subscribe. Added `fallbackTabIndexClaimed` (2026-10-27): a plain mutable `{value: boolean}`, fresh every group render, that the first non-disabled single-select child claims during its own render to become the sole `tabindex=0` toggle when nothing is selected yet — the closest a synchronous, document-order Qwik render pass can get to upstream's `QueryList`-driven `_setSelectionByValue` fallback loop without actually having `@ContentChildren` |
| `scss/button-toggle/button-toggle.scss` | `src/material/button-toggle/button-toggle.scss` (381 LOC) | synced | Byte-for-byte copy with the one allowed edit: `@use '@angular/cdk';` → `@use '../cdk-stub' as cdk;` (line 1). Replaces the 2026-08-11 port's ~90-line standard-only rewrite |
| `scss/button-toggle/_button-toggle-theme.scss` | `src/material/button-toggle/_button-toggle-theme.scss` | synced | byte-identical copy; theme mixin inert on our end but kept for `diff -q` parity |
| `scss/button-toggle/_m2-button-toggle.scss` | `src/material/button-toggle/_m2-button-toggle.scss` | synced | byte-identical copy |
| `scss/button-toggle/_m3-button-toggle.scss` | `src/material/button-toggle/_m3-button-toggle.scss` | synced | byte-identical copy |
| `scss/button-toggle/button-toggle-prebuilt.scss` | (qwik-material-specific) | new | `@use` button-toggle.scss only — no `:root` token defaults (removed 2026-10-30, see core/SYNC.md "Default theme"): the standard-appearance tokens already resolve through `token-utils.slot(..., var(--mat-sys-*))` fallback chains baked in at Sass-compile time, and the legacy-appearance tokens have no fallback in upstream's own CSS either (they rely on a component theme mixin this port doesn't run — see the file's own header comment). The one default theme now ships from `core/default-theme.scss` via `core-prebuilt.css`. |

## Removed upstream files

- `button-toggle-module.ts` — Qwik has no module concept
- `testing/` (MatButtonToggleHarness) — Angular test harness surface; no equivalent needed
- Upstream `public-api.ts` — replaced with our own re-export shape (§3.6)
- `button-toggle.spec.ts` (1379 LOC) — ported to `mat-button-toggle-scenarios.spec.tsx` (sanity tests) + real DOM/behavior coverage in `specs/material-button-toggle/*.spec.ts` (Playwright) per the project's smoke-only vitest constraint (`createDOM()` hangs/errors in this package — see button's own scenario-port comment)
- `button-toggle.html` (36 LOC) — trivial template inlined into JSX
- `MatButtonToggleDefaultOptions` interface + `MAT_BUTTON_TOGGLE_DEFAULT_OPTIONS` InjectionToken — folded into MatButtonToggleConfig (empty today); defaults (appearance/hideIndicator/disabledInteractive) all dropped per deviation #6
- `MatButtonToggleChange` class — event shape unneeded (QRLs receive raw values, not `{source, value}` objects)
- `SelectionModel<MatButtonToggle>` (RxJS-based) — replaced by plain arrays derived from props each render (deviation #2)
- `ControlValueAccessor` interface + `NG_VALUE_ACCESSOR` provider — Qwik has no forms system (deviation #1)

No longer removed: `MatRipple` element (static `.mat-ripple
.mat-button-toggle-ripple` span rendered since 2026-10-27; real click-driven
ripple animation since 2026-10-30 — see "Deviations" #7) and
`MatPseudoCheckbox` (now a real `qwik-material/core` component, rendered
exactly where upstream renders it).

## Deviations from upstream

1. **`ControlValueAccessor` + `NG_VALUE_ACCESSOR` removed entirely.** Qwik has no equivalent forms system. Replaced by controlled-component pattern: consumer owns state via signals; group takes `value`/`values` + `onChange$`/`onValuesChange$` QRLs. (Upstream itself has no native-HTML-form-submission story for button-toggle either — the inner `<button name>` doesn't participate in form submission the way `<input type="radio">` does — so there's no DOM/behavior gap here beyond the forms-API itself.)

2. **`SelectionModel` (from `@angular/cdk/collections`, RxJS-based) removed.** Replaced by plain arrays derived from `props.values` each render. No `.selected` / `.select()` / `.deselect()` / `.toggle()` API surface — consumers manipulate their own signal via the QRL callback.

3. **`EventEmitter` `change` / `valueChange` removed.** Replaced by prop QRLs — no `.emit()` API surface.

4. ~~`FocusMonitor` + focus origin tracking removed.~~ **Fixed 2026-10-27** — see `useFocusOrigin()` note in the sync table above.

5. ~~Keyboard arrow-key navigation removed.~~ **Fixed 2026-10-27** — roving-tabindex LEFT/RIGHT/UP/DOWN + SPACE/ENTER implemented in `MatButtonToggleGroup`'s `onKeyDown$`; ported as `specs/material-button-toggle/keyboard-nav.spec.ts`.

6. **Deprecated appearance variants + niche flags still unported** (no parity scenario exercises any of them — distinct from a deliberate scope cut):
   - `appearance: 'legacy'` — deprecated upstream; port ships `'standard'` only.
   - `vertical` prop — dropped; the synced SCSS's `.mat-button-toggle-vertical` rules are simply unreachable dead code in this port's output.
   - `disabledInteractive` — dropped; always false, so the inner button's native `disabled` attribute is the only disabled signal (upstream's `aria-disabled` path only fires when `disabledInteractive` is true).

   ~~`hideSingleSelectionIndicator` / `hideMultipleSelectionIndicator` always false.~~ **Fixed
   2026-11-03** — see the dedicated section above.

7. ~~Ripple system + `MatRipple` element removed.~~ **Fixed 2026-10-27 (static container) / 2026-10-30 (animation, `core/ripple/` remediation)** — the static `<span matripple class="mat-ripple mat-button-toggle-ripple">` container is rendered, and now ALSO receives real `.mat-ripple-element` spans on pointer events: `core/ripple/ripple-dom.ts`'s `handleRippleEvent()` wired to `onMouseDown$`/`onMouseUp$`/`onMouseLeave$`/`onTouchStart$`/`onTouchEnd$`/`onTouchCancel$` on the inner `<button>` (upstream's `[matRippleTrigger]="button"` — the span is a SIBLING of the button, not an ancestor/descendant). `disableRipple` is a NEW prop (both per-instance on `MatButtonToggle` and group-level on `MatButtonToggleGroup`/`MatButtonToggleGroupState`) — upstream's `MatButtonToggle._isRippleDisabled()` is `this.disableRipple || this.buttonToggleGroup?.disableRipple`; neither had any Qwik-side representation before this pass since nothing needed it until real ripple-disabling did.

8. ~~`MatPseudoCheckbox` visual selection indicator removed.~~ **Fixed 2026-10-27** — see the new `qwik-material/core` entry point.

9. **`Directionality` (`@angular/cdk/bidi`) dependency removed.** Upstream reads `Directionality.value` to invert arrow-key handling in RTL. The newly-added arrow-key handler (deviation #5, now fixed) is LTR-only — no scenario exercises RTL button-toggle groups. A future RTL parity pass would need to thread `dir` through.

10. **Angular-specific removals:**
    - `@Input()` decorators + `booleanAttribute` transform + `HostAttributeToken` → TypeScript types + prop passthrough.
    - `@ContentChildren(MatButtonToggle)` QueryList → per-instance context; children self-detect; the one place upstream's `QueryList` iteration is genuinely load-bearing (roving-tabindex fallback-claim, arrow-key traversal) is replicated via direct DOM queries from the group's own ref instead (see sync table).
    - `AfterContentInit` / `AfterViewInit` / `OnDestroy` / `OnInit` lifecycle → no lifecycle; one-time `ngOnInit`-style id/name assignment replicated via a lazily-initialized `useSignal(() => …)` (runs its initializer exactly once, same as a constructor/ngOnInit field).
    - `providers: [{provide: MAT_BUTTON_TOGGLE_GROUP, useExisting: MatButtonToggleGroup}]` → per-instance MAT_BUTTON_TOGGLE_GROUP_STATE context.
    - `exportAs: 'matButtonToggle' / 'matButtonToggleGroup'` → N/A.
    - Host bindings → plain JSX attribute passthrough.
    - The outer host's `(focus)` listener (delegates `.focus()` calls made directly on `<mat-button-toggle>` to the inner `<button>`) is not ported — the outer host has no `tabindex` of its own either upstream or in this port, so this only matters for a consumer calling `.focus()` imperatively on the custom element, which no parity scenario does.

## Stub inventory delta

Now-synced `button-toggle.scss` (see Upstream sync state above) DOES
reference `@angular/cdk` (line 1, for the `cdk.high-contrast` mixin used by
3 `forced-colors: active` media-query blocks) — swapped to `../cdk-stub as
cdk`, matching the Dialog/Progress Bar/Toolbar/Badge/Button precedent (the
stub's existing `@mixin high-contrast` already covers this; see
`src/qwik-material/dialog/SYNC.md` for the stubbing rationale). This
supersedes the 2026-08-11 port's "zero cdk references" note, which was true
only of that rewrite, not of upstream's actual file.

The new `qwik-material/core` entry point's `pseudo-checkbox.scss` does NOT
reference `@angular/cdk` (grep-confirmed) — no stub additions needed there.

## Class count

`grep -rnE "^export class" src/qwik-material/button-toggle/ 2>/dev/null`
→ 0 (no exported classes on the consumer surface).

## Pipeline

`pnpm test:qwik-material` at the repo root runs `build && vitest && lint:no-ssr-leaks && typecheck` for the whole qwik-material package, covering dialog + button + card + toolbar + badge + icon + progress-bar + progress-spinner + divider + grid-list + list + button-toggle + core.

## Rapid clicks while handlers load (2026-10-27)

Upstream mutates its `SelectionModel` synchronously on click. In Qwik, clicks
fired before the handler chunks load can resume in any order, and a controlled
group only sees its new `values` after the consumer's callback round-trips. The
group therefore keeps the selection it last emitted (`pendingValues`, reset when
`values` changes), resolves the consumer callback before computing, and in
single-select mode ignores clicks older (by `event.timeStamp`) than the one that
produced the current selection. Covered by
`qwik-cdk-parity-tests/specs/material-button-toggle/rapid-clicks.spec.ts`.

### Qwik v2 regression: multi-select rapid clicks dropping one (2026-11-01)

Upgrading to `@qwik.dev/core@2.0.0-rc.4` reliably broke `rapid-clicks.spec.ts`'s multi-select
case (previously only "sometimes" — this exact race, "the race only shows up some of the time"
per this file's own original note). Two clicks on DIFFERENT toggles, fired back to back: Qwik
appears to process one event's handler to full completion — including every `await` inside it —
before starting the next QUEUED one (confirmed live via instrumentation: the second click's
`onToggle` body didn't even START running until the first one's ENTIRE handler, awaits included,
had finished). That's not the bug by itself; the bug was that the SECOND click's `onToggle`
closure — captured by `onClick$` reading `stateSignal.value` EARLY, before the first click's own
round trip landed — closed over a now-stale `propValues` local (`const propValues = props.values`,
destructured once per GROUP render). By the time this queued call finally ran (after the first
click fully resolved), `pendingValues` had, correctly, already been cleared (the first click's
round trip HAD landed by then) — so the fallback `?? propValues` kicked in, and THAT was the stale
snapshot, silently dropping the first click's selection.

Fixed two ways, both in `mat-button-toggle-group.tsx`'s `onToggle`:
- The read-compute-write of `pendingValues` now happens with NO `await` in between (previously
  `await onValuesChange$?.resolve()` ran FIRST) — not actually the root cause here (events turned
  out to be fully serialized, not interleaved), but a real hardening against the possibility
  either way, and emits via a fresh re-read of `pendingValues.value` rather than the
  locally-captured `next`.
- The fallback reads `props.values` directly (the live, same-object-across-every-render props
  proxy) instead of the per-render-destructured `propValues` local — this was the actual fix.
  `onToggle` is a `$()` closure that can run long after the render that created it, and `props`
  (unlike a destructured local) always reflects the CURRENT value regardless of which render's
  closure is running.
- The `pendingValues`-clearing task was ALSO loosened from "clear whenever `props.values` changes
  at all" to "clear only when it already matches `pendingValues.value` as a set" — belt-and-
  suspenders for a scenario where a newer click's write races ahead of an older round trip's
  feedback; did not end up being the actual fix for THIS bug (the real fix was the `props.values`
  read above), but is strictly safer than the unconditional version either way.
