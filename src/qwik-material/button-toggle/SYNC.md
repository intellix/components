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
`appearance: 'legacy'`, `vertical`, `hideSingleSelectionIndicator`/
`hideMultipleSelectionIndicator`, `disabledInteractive`, RTL (`Directionality`).
See deviations below.

## Upstream sync state

| File | Upstream path | Sync state | Notes |
| --- | --- | --- | --- |
| `button-toggle/mat-button-toggle-group.tsx` | `src/material/button-toggle/button-toggle.ts` (MatButtonToggleGroup class, lines 124-547) | ported | Controlled-component surface. Drops SelectionModel/CVA/EventEmitter/@ContentChildren; replaces `change`/`valueChange` EventEmitters with `onChange$`/`onValuesChange$` QRLs; publishes per-instance MAT_BUTTON_TOGGLE_GROUP_STATE with the single `onToggle` QRL routed by mode. Reads MAT_BUTTON_TOGGLE_CONFIG with DEFAULTS fallback (SSR-safe). `name` defaults via `useIdGenerator()` (lazily, once) when the consumer omits it, matching upstream's `_name = inject(_IdGenerator).getId(...)` field initializer. Implements upstream `_keydown()` (roving-tabindex arrow-key nav, single-select only) via an `onKeyDown$` handler that queries its own rendered DOM (no `@ContentChildren` equivalent exists in Qwik) and `.click()`s the target button — re-entering the same `onClick$` a real pointer click would. No lifecycle, no `useVisibleTask$`/`useStore`/`useTask$` |
| `button-toggle/mat-button-toggle.tsx` | `src/material/button-toggle/button-toggle.ts` (MatButtonToggle class, lines 548-793) + `button-toggle.html` (36 LOC template inlined) | ported | Reads MAT_BUTTON_TOGGLE_GROUP_STATE with DEFAULTS fallback; `standalone` boolean field (not identity check) detects standalone usage → `useSignal(false)` local checked state. `role`/`aria-checked`-vs-`aria-pressed` computed by `isSingleSelector()` (radio+aria-checked only for single-select grouped; role="button"+aria-pressed for multi-select AND standalone). `id` defaults via `useIdGenerator()` (lazily, once) when omitted, matching upstream's `ngOnInit` id assignment; inner button id is `${id}-button`. Single-select roving tabindex: selected (or, with nothing selected, the first non-disabled) toggle gets `tabindex=0`, all siblings `-1`; the "first non-disabled" bootstrap is a per-group-render claim flag (see `button-toggle-group-state.ts`) since Qwik has no `@ContentChildren`/`QueryList` to pick it from directly. Renders the `.mat-button-toggle-checkbox-wrapper > <MatPseudoCheckbox>` (grouped toggles only, both modes — matches upstream's actual `@if` condition once the never-set `hideSingle/MultipleSelectionIndicator` flags are accounted for), the `.mat-button-toggle-focus-overlay` span, and the `matripple` `.mat-ripple.mat-button-toggle-ripple` span (static container only — no ripple-click animation; out of scope per design doc rule 6). Focus-origin classes (`cdk-focused`/`cdk-keyboard-focused`/`cdk-mouse-focused`/`cdk-touch-focused`/`cdk-program-focused`) come from `useFocusOrigin()` (qwik-cdk/a11y) — a lazy `useOn()`-based hook, not `useVisibleTask$` (see qwik-cdk/a11y/SYNC.md and `focus-origin.ts`'s own doc comment for why: Qwik's `class` prop replaces `className` wholesale every render, so the origin has to be a real signal feeding this component's own class array, not a side-channel `classList` mutation). No hidden `<input>` — upstream has none; `name` sits directly on the inner `<button>` |
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

No longer removed (2026-10-27): `MatRipple` element (static `.mat-ripple
.mat-button-toggle-ripple` span now rendered; the directive's click-driven
animation itself is not ported) and `MatPseudoCheckbox` (now a real
`qwik-material/core` component, rendered exactly where upstream renders it).

## Deviations from upstream

1. **`ControlValueAccessor` + `NG_VALUE_ACCESSOR` removed entirely.** Qwik has no equivalent forms system. Replaced by controlled-component pattern: consumer owns state via signals; group takes `value`/`values` + `onChange$`/`onValuesChange$` QRLs. (Upstream itself has no native-HTML-form-submission story for button-toggle either — the inner `<button name>` doesn't participate in form submission the way `<input type="radio">` does — so there's no DOM/behavior gap here beyond the forms-API itself.)

2. **`SelectionModel` (from `@angular/cdk/collections`, RxJS-based) removed.** Replaced by plain arrays derived from `props.values` each render. No `.selected` / `.select()` / `.deselect()` / `.toggle()` API surface — consumers manipulate their own signal via the QRL callback.

3. **`EventEmitter` `change` / `valueChange` removed.** Replaced by prop QRLs — no `.emit()` API surface.

4. ~~`FocusMonitor` + focus origin tracking removed.~~ **Fixed 2026-10-27** — see `useFocusOrigin()` note in the sync table above.

5. ~~Keyboard arrow-key navigation removed.~~ **Fixed 2026-10-27** — roving-tabindex LEFT/RIGHT/UP/DOWN + SPACE/ENTER implemented in `MatButtonToggleGroup`'s `onKeyDown$`; ported as `specs/material-button-toggle/keyboard-nav.spec.ts`.

6. **Deprecated appearance variants + niche flags still unported** (no parity scenario exercises any of them — distinct from a deliberate scope cut):
   - `appearance: 'legacy'` — deprecated upstream; port ships `'standard'` only.
   - `vertical` prop — dropped; the synced SCSS's `.mat-button-toggle-vertical` rules are simply unreachable dead code in this port's output.
   - `hideSingleSelectionIndicator` / `hideMultipleSelectionIndicator` — both always false (upstream default), so the pseudo-checkbox is unconditionally rendered on every grouped toggle, matching upstream's actual default-configuration behavior.
   - `disabledInteractive` — dropped; always false, so the inner button's native `disabled` attribute is the only disabled signal (upstream's `aria-disabled` path only fires when `disabledInteractive` is true).

7. ~~Ripple system + `MatRipple` element removed.~~ **Partially fixed 2026-10-27** — the static `<span matripple class="mat-ripple mat-button-toggle-ripple">` container is now rendered (DOM parity achieved). The `MatRipple` directive's actual click-driven ripple animation is still not ported — out of scope per design doc rule 6 ("ripple element animation itself is out of scope; the static ripple containers/attributes are not").

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
