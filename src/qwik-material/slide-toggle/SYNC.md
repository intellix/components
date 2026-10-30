# qwik-material/slide-toggle sync log

Tracks the sync state between this port and `src/material/slide-toggle/`
upstream. Every deviation from a verbatim copy is recorded here. Companion to
`src/qwik-material/dialog/SYNC.md`, `src/qwik-material/button/SYNC.md`,
`src/qwik-material/card/SYNC.md`, `src/qwik-material/toolbar/SYNC.md`,
`src/qwik-material/badge/SYNC.md`, `src/qwik-material/icon/SYNC.md`,
`src/qwik-material/progress-bar/SYNC.md`,
`src/qwik-material/progress-spinner/SYNC.md`,
`src/qwik-material/divider/SYNC.md`, `src/qwik-material/grid-list/SYNC.md`,
`src/qwik-material/list/SYNC.md`, `src/qwik-material/button-toggle/SYNC.md`,
and `src/qwik-material/core/SYNC.md`.

## 2026-10-27/28 initial port

New entry point, gated from the start by
`specs/material-slide-toggle/angular-parity.spec.ts` per
`docs/superpowers/specs/2026-10-27-qwik-material-remaining-components-roadmap.md`
(wave 1). 11/11 Angular-mirror scenarios + the "keyboard focus" case pass,
run 3 times.

Reuses two shared `qwik-material/core` pieces rather than re-implementing
them: `MatInternalFormField` (the `div[mat-internal-form-field].mdc-form-field`
wrapper around the button+label, exactly as upstream's own template) and the
`useAnimationsDisabled()` / `useFocusOrigin()` / `useIdGenerator()` hooks
already established by button-toggle.

## Upstream sync state

| File | Upstream path | Sync state | Notes |
| --- | --- | --- | --- |
| `slide-toggle/mat-slide-toggle.tsx` | `src/material/slide-toggle/slide-toggle.ts` (MatSlideToggle class) + `slide-toggle.html` (63 LOC template inlined) | ported | Controlled-component surface: consumer owns `checked` via a signal, fed through `checked` prop + `onChange$` QRL (flattened from `MatSlideToggleChange {source, checked}` to the raw boolean, same simplification as `MatButtonToggleGroup.onChange$`). `toggleChange` output ported as `onToggleChange$` QRL (fires every click, independent of whether the value actually flips). No hidden `<input>` — upstream has none; the real interactive element is the inner `<button class="mdc-switch" role="switch">`. Renders `MatInternalFormField` (shared with button-toggle/checkbox/radio) wrapping the button + `<label>`. `id`/`buttonId`/`labelId` generation mirrors upstream's constructor exactly, including the subtlety that `labelId` is fixed from the *auto-generated* id forever, never re-derived from a later explicit `id` prop (upstream: `_labelId = this._uniqueId + '-label'`, set once in the constructor from `_uniqueId`, not from the mutable `id` field). `color` defaults to `'accent'` (config, then hardcoded fallback) exactly matching upstream's constructor (`this.color = defaults.color \|\| 'accent'`) — every scenario except `color-primary` carries `mat-accent`. `_getAriaLabelledBy()` ported verbatim (explicit `aria-labelledby` wins; else a set `aria-label` suppresses it entirely; else it points at the label). `useFocusOrigin()` (qwik-cdk/a11y) replaces `FocusMonitor.monitor(this._elementRef, true)` — drives both the component-specific `mat-mdc-slide-toggle-focused` class (true only for keyboard/program origin, matching upstream's own `_focused` field) AND the generic `cdk-focused`/`cdk-touch-focused`/`cdk-keyboard-focused`/`cdk-mouse-focused`/`cdk-program-focused` classes FocusMonitor itself applies to the monitored element for any origin (`_setClasses`) — both class families are independently necessary and were verified against the real Angular DOM via the "keyboard focus" parity test. No lifecycle, no `useVisibleTask$`/`useStore`/`useTask$` |
| `slide-toggle/slide-toggle-config.ts` | `src/material/slide-toggle/slide-toggle-config.ts` (MatSlideToggleDefaultOptions interface + MAT_SLIDE_TOGGLE_DEFAULT_OPTIONS InjectionToken) | ported | `MatSlideToggleConfig` carries all 4 upstream fields (`disableToggleValue`, `color`, `hideIcon`, `disabledInteractive`); folded into `QwikMaterialProvider.matSlideToggleConfig` for family-shape parity with every other `MAT_*_CONFIG`. `disableToggleValue` has no per-instance prop on `MatSlideToggleProps`, matching upstream exactly (no `@Input()` for it either — provider-only) |
| `scss/slide-toggle/slide-toggle.scss` | `src/material/slide-toggle/slide-toggle.scss` (595 LOC) | synced | Byte-for-byte copy with the one allowed edit: `@use '@angular/cdk';` → `@use '../cdk-stub' as cdk;` (line 5), same stubbing precedent as button-toggle/dialog/badge/progress-bar/progress-spinner/toolbar |
| `scss/slide-toggle/_m2-slide-toggle.scss` | `src/material/slide-toggle/_m2-slide-toggle.scss` | synced | byte-identical copy |
| `scss/slide-toggle/_m3-slide-toggle.scss` | `src/material/slide-toggle/_m3-slide-toggle.scss` | synced | byte-identical copy; this is the token function `slide-toggle.scss` actually calls for its `$fallbacks` (`m3-slide-toggle.get-tokens()`, default args) |
| `scss/slide-toggle/_slide-toggle-theme.scss` | `src/material/slide-toggle/_slide-toggle-theme.scss` | synced | byte-identical copy; theme mixins inert on our end but kept for `diff -q` parity, same as every other component's theme partial |
| `scss/slide-toggle/slide-toggle-prebuilt.scss` | (qwik-material-specific) | new | `@use` slide-toggle.scss only — no `:root` token defaults (removed 2026-10-30, see core/SYNC.md "Default theme"): ~80 `--mat-slide-toggle-*` tokens already resolve through a `token-utils.slot(..., var(--mat-sys-*))` fallback chain baked in at Sass-compile time, same as upstream. 5 tokens (`slide-toggle-handle-width`/`-handle-height`/`-handle-surface-color`/`-handle-elevation-shadow`/`-disabled-handle-elevation-shadow`) are still deliberately left undefined — the M3 token function itself sets them to `null`, `slot()` emits a bare `var(--mat-…)` with no fallback for them (grep-confirmed on the compiled output), and the one generic rule each feeds is always overridden by a more specific selector that supplies its own real value (e.g. `.mdc-switch--selected &` sets `width`/`height` directly) — matching upstream's own M3 output, which leaves the same 5 unresolved. The one default theme now ships from `core/default-theme.scss` via `core-prebuilt.css` |

## Removed upstream files

- `slide-toggle-module.ts` — Qwik has no module concept
- `testing/` (MatSlideToggleHarness) — Angular test harness surface; no equivalent needed
- Upstream `public-api.ts`/`index.ts` — replaced with our own re-export shape
- `slide-toggle.spec.ts` (937 LOC) — ported to `mat-slide-toggle-scenarios.spec.tsx` (sanity + `describe.skip` DOM/Angular-only documentation blocks) per the project's smoke-only vitest constraint (`createDOM()` hangs this package's vitest worker — see button's own scenario-port comment). Real DOM/behavior coverage lives in `specs/material-slide-toggle/*.spec.ts` (Playwright)
- `slide-toggle.html` (63 LOC) — inlined into JSX
- `MatSlideToggleChange` class — event shape unneeded (the `onChange$` QRL receives the raw boolean, not a `{source, checked}` object)
- `ControlValueAccessor`/`Validator` interfaces + `NG_VALUE_ACCESSOR`/`NG_VALIDATORS` providers — Qwik has no forms system (deviation #1)

## Deviations from upstream

1. **`ControlValueAccessor`/`Validator`/`NG_VALUE_ACCESSOR`/`NG_VALIDATORS` removed entirely.** Qwik has no forms system equivalent. Replaced by the controlled-component pattern (consumer owns `checked` via a signal; `onChange$` QRL feeds changes back). `required` only drives `aria-required` on the inner button in this port — there is no native-form-validation integration (no CVA/Validator, and the interactive element is a `<button>`, not an `<input>`, so there is no browser-native form-participation gap beyond the forms-API itself either, same reasoning as button-toggle's deviation #1).
2. **`EventEmitter` `change`/`toggleChange` removed.** Replaced by prop QRLs (`onChange$`/`onToggleChange$`) — no `.emit()` API surface.
3. **`FocusMonitor` ported as `useFocusOrigin()`** (qwik-cdk/a11y), not a 1:1 port of the CDK service — see the sync table above and `qwik-cdk/a11y/focus-origin/focus-origin.ts`'s own doc comment for the lazy `useOn()`-based rationale (no per-instance `useVisibleTask$`, design doc rule 7).
4. **Deprecated/legacy options not ported** (no parity scenario exercises any of them):
   - `color` as a real `ThemePalette` type — kept as a plain `string` (matches `MatButtonToggleGroupProps`'s existing looseness and upstream's own comment that the typed version "has no effect in M3 themes" anyway).
   - `Directionality`/RTL — the synced SCSS's `[dir='rtl']` rules are simply unreachable dead code in this port's output, same as button-toggle.
   - Imperative `focus()` method and `toggle()` method on the component instance — Qwik has no exported component-instance handle equivalent; not exercised by any parity scenario (all interaction goes through real clicks/Tab/Space).
5. **`_CdkPrivateStyleLoader`/`_StructuralStylesLoader` lazy style injection removed.** This port's CSS is always-loaded prebuilt CSS, not Angular's per-app lazy stylesheet injection — N/A, same as every other qwik-material component.
6. **`HostAttributeToken('tabindex')` constructor read removed.** No scenario sets a native `tabindex` attribute directly on the host tag (and the host never renders one regardless — see note below); `tabIndex` prop defaults to `0` like upstream's own fallback (`tabIndex == null ? 0 : parseInt(tabIndex) || 0`).
7. **Angular-specific removals:** `@Input()` decorators + `booleanAttribute`/`numberAttribute` transforms + `HostAttributeToken` → TypeScript prop types + plain prop passthrough; `AfterContentInit`/`OnChanges`/`OnDestroy` lifecycle → no lifecycle (one-time id assignment replicated via a lazily-initialized `useSignal(() => …)`, same pattern as button-toggle); `providers: [NG_VALUE_ACCESSOR, NG_VALIDATORS]` → N/A; `exportAs: 'matSlideToggle'` → N/A; `ViewEncapsulation.None` + host bindings → plain JSX attribute passthrough (the host's `[attr.tabindex]`/`[attr.aria-label]`/`[attr.name]`/`[attr.aria-labelledby]` → `null` bindings, which exist upstream purely to strip whatever a consumer wrote directly on the `<mat-slide-toggle>` tag, are replicated by this port simply never rendering those 4 attributes on the outer host at all, regardless of input — equivalent net DOM, no need for an explicit "null out" step).

## A real bug found and fixed during this port (stale QRL capture)

The click handler's FIRST implementation captured `checked`/`disabled` as
plain outer-scope `const`s (`const checked = props.checked ?? false;`) and
referenced them inside the `$()`-wrapped `onButtonClick$` closure. This is
WRONG and was caught only by a Playwright run (not vitest, not a manual
single-click SSR check): `$()` captures outer-scope primitives **by value**
at the render that created the closure, frozen into that render's serialized
QRL. Once qwikloader resumes and binds this exact closure client-side, a
later render that recomputes `checked` from new props does not get a chance
to refresh an *already-resolved* closure's captured primitives. Empirically:
the first click correctly flipped `checked` `false → true` (the closure's
captured `checked` was still accurate for that first invocation), but every
click after that kept recomputing `!checked` against the frozen `checked =
false` from the component's very first render — so the switch would turn on
once and then never turn off again, no matter how many more times it was
clicked. The `basic` parity scenario (the only one with two sequential click
steps) caught this; every other scenario has exactly one click and could not
have revealed it.

Fixed by reading `props.checked`/`props.disabled` **live** inside the
closure instead — `props` is the component's actual reactive props store, so
property reads inside a QRL closure always reflect the current value, unlike
a plain-value capture. This is the exact same root cause and fix already
documented for `MatButtonToggleGroup`'s click handler (see
`mat-button-toggle.tsx`'s "re-read live state inside the closure" comment
and `button-toggle-group-state.ts`) — now cross-referenced from here too.
`disableToggleValue` was left as an outer-scope capture from `config`: unlike
`checked`/`disabled`, no scenario or expected usage ever changes
`matSlideToggleConfig` on a live provider, so a frozen snapshot is harmless
in practice; a future consumer that *does* need it reactive would need the
same live-read treatment.

## Class count

`grep -rnE "^export class" src/qwik-material/slide-toggle/ 2>/dev/null`
→ 0 (no exported classes on the consumer surface).

## Pipeline

`pnpm test:qwik-material` at the repo root runs `build && vitest &&
lint:no-ssr-leaks && typecheck` for the whole qwik-material package,
covering dialog + button + card + toolbar + badge + icon + progress-bar +
progress-spinner + divider + grid-list + list + button-toggle + slide-toggle
+ core.

## Qwik-only Playwright specs (no Angular mirror)

`MAT_SLIDE_TOGGLE_DEFAULT_OPTIONS` equivalents have no Angular-side parity
scenario (the dev-app's `qwik-parity` routes don't exercise provider
defaults on the Angular side either), so these are Qwik-only, gated by
upstream unit-test precedent instead:

- `config-disable-toggle-value.spec.ts` — upstream "should not change value
  on click when click action is noop when using custom a action
  configuration".
- `config-default-color.spec.ts` — upstream "should be able to change the
  default color".
