import {test, type Page} from '@playwright/test';
import {expectMaterialParity, type ParityStep} from '../../lib/material-parity.js';

const route = 'mat-form-field';

/**
 * mat-form-field (+ matInput) — Angular DOM parity.
 *
 * Source of truth for every scenario: src/dev-app/qwik-parity/form-field.ts (exports
 * `FORM_FIELD_SCENARIOS`, served at http://localhost:4200/qwik-parity/mat-form-field/<scenario>).
 * The Qwik side must render the same markup at http://localhost:4173/mat-form-field/<scenario>/
 * inside its own `[data-parity-root]`. Every number below was captured live against the real
 * Angular dev-app (not just read from source) — see the specific scenarios for exact values.
 *
 * Angular's `@if`/`@switch` control-flow anchors render as `<!--container-->` comment nodes
 * interleaved with real elements; the harness only walks Elements, so these never need to be
 * reproduced (same note as expansion.ts/its spec).
 *
 * ============================== SHARED SKELETON — FILL ==============================
 * From src/material/form-field/form-field.html + form-field.ts + input.ts host bindings.
 * `matInput` is a DIRECTIVE on the native `<input>`/`<textarea>` (not a component), so there is
 * no separate host element to "echo" a static attribute onto — unlike `<mat-checkbox checked>`,
 * writing a plain HTML attribute that happens to match one of `MatInput`'s `@Input()`s
 * (`required`, `disabled`, `readonly`, `placeholder`, `type`, `value`, `name`) produces exactly
 * the DOM you'd expect, nothing extra.
 *
 *   <mat-form-field class="mat-mdc-form-field mat-mdc-form-field-type-mat-input
 *       [mat-mdc-form-field-label-always-float] [mat-mdc-form-field-has-icon-prefix]
 *       [mat-mdc-form-field-has-icon-suffix] [mat-form-field-invalid] [mat-form-field-disabled]
 *       mat-form-field-appearance-fill [mat-form-field-hide-placeholder]
 *       mat-primary|mat-accent|mat-warn [ng-untouched|ng-touched] [ng-pristine|ng-dirty]
 *       [ng-valid|ng-invalid] mat-form-field-animations-enabled [mat-focused]"
 *       [style]="width:300px (every scenario below fixes this, see WIDTH note)">
 *     <div class="mat-mdc-text-field-wrapper mdc-text-field mdc-text-field--filled
 *                 [mdc-text-field--disabled] [mdc-text-field--focused] [mdc-text-field--invalid]">
 *       <div class="mat-mdc-form-field-focus-overlay"></div>  <!-- ABSENT when disabled, see below -->
 *       <div class="mat-mdc-form-field-flex">
 *         [<div class="mat-mdc-form-field-icon-prefix"><!--projected matIconPrefix/matPrefix--></div>]
 *         [<div class="mat-mdc-form-field-text-prefix"><!--projected matTextPrefix--></div>]
 *         <div class="mat-mdc-form-field-infix">
 *           <label matformfieldfloatinglabel class="mdc-floating-label mat-mdc-floating-label
 *                  [mdc-floating-label--float-above]" id="mat-mdc-form-field-label-N"
 *                  for="mat-input-N">
 *             <mat-label>…</mat-label>
 *             [<span aria-hidden="true" class="mat-mdc-form-field-required-marker
 *                    mdc-floating-label--required"></span>]
 *           </label>
 *           <input|textarea matinput ... class="mat-mdc-input-element
 *                  [mat-mdc-form-field-textarea-control (textarea only)]
 *                  mat-mdc-form-field-input-control mdc-text-field__input
 *                  [ng-untouched|ng-touched] [ng-pristine|ng-dirty] [ng-valid|ng-invalid]
 *                  cdk-text-field-autofill-monitored" id="mat-input-N"
 *                  [required] [disabled] [readonly="true"] [aria-describedby="…"]
 *                  [aria-invalid="false"|"true"] [aria-required="false"|"true"] />
 *         </div>
 *         [<div class="mat-mdc-form-field-text-suffix">…</div>]
 *         [<div class="mat-mdc-form-field-icon-suffix">…</div>]
 *       </div>
 *       <div matformfieldlineripple class="mdc-line-ripple [mdc-line-ripple--active]
 *            [mdc-line-ripple--deactivating]"></div>
 *     </div>
 *     <div aria-atomic="true" aria-live="polite" class="mat-mdc-form-field-subscript-wrapper
 *          mat-mdc-form-field-bottom-align [mat-mdc-form-field-subscript-dynamic-size]">
 *       <div class="mat-mdc-form-field-hint-wrapper">  <!-- OR -error-wrapper, mutually exclusive -->
 *         [<mat-hint id="mat-mdc-hint-N">…</mat-hint>]
 *         <div class="mat-mdc-form-field-hint-spacer"></div>
 *         [<mat-hint class="... mat-mdc-form-field-hint-end" id="mat-mdc-hint-N">…</mat-hint>]
 *       </div>
 *     </div>
 *   </mat-form-field>
 *
 * `matformfieldfloatinglabel`, `matformfieldlineripple`, `matformfieldnotchedoutline` are
 * attributes MATERIAL'S OWN form-field.html template puts on its internal elements (NOT
 * something a consumer writes) — they are compared and must be reproduced literally, same
 * category as `matripple` in the README, NOT the CONSUMER_SELECTOR_ATTRS category below.
 *
 * CONSUMER_SELECTOR_ATTRS candidates actually exercised below (a real consumer writes these in
 * their own template, so — like `matFab`/`mat-dialog-close` etc. — they should be ignored by
 * the harness, not compared): `matinput` (on the `<input>`/`<textarea>` itself),
 * `mattextprefix`, `mattextsuffix`, `maticonprefix`, `maticonsuffix`. The bare `matprefix`/
 * `matsuffix` spelling (same `MatPrefix`/`MatSuffix` directives, selector
 * `[matPrefix],[matIconPrefix],[matTextPrefix]`) isn't used by any scenario here but is the same
 * category and will show up once select/autocomplete/datepicker use form-field.
 *
 * IDs: `mat-input-N` (MatInput, `_IdGenerator` prefix `mat-input-`), `mat-mdc-form-field-label-N`
 * (the floating label), `mat-mdc-hint-N` (each `<mat-hint>`, AND `MatFormField`'s own
 * `hintLabel` — see 'hint-label-end'), `mat-mdc-error-N` (each `<mat-error>`). All share ONE
 * app-global counter (not per-prefix) — e.g. a hint-only scenario can start at `mat-mdc-hint-1`
 * because `mat-mdc-form-field-label-0` was allocated first for the same field. The harness
 * squashes digits to `#` so the absolute numbers never matter; only that the id a `for`/
 * `aria-describedby` points at and the element that owns that id squash to the SAME token.
 * Non-obvious: a `<mat-error>`/`<mat-hint>` behind an `@if` only allocates its id (and exists at
 * all, detached) once Angular actually instantiates it — see 'error-state' below, where typing
 * an invalid-but-non-empty value destroys one `<mat-error>` and creates a different one.
 *
 * WIDTH: every `<mat-form-field>` below has `style="width: 300px"`. This is not cosmetic — the
 * outline appearance measures real layout (`Element.scrollWidth` for the floating label's
 * notch width, `getBoundingClientRect().width` for prefix/suffix containers when computing the
 * outline label offset) to write an inline `style` on internal elements. A fixed field width
 * keeps everything upstream of that measurement (and surrounding dev-app chrome) from
 * influencing it, so the two apps measure the same thing. See 'outline-basic' for the exact
 * formula captured live, and note that NO scenario here combines outline + prefix/suffix (the
 * label-offset calc is `getBoundingClientRect().width`-based, i.e. sub-pixel-float-sensitive,
 * a needless cross-app flake risk the fill-only prefix/suffix scenarios avoid entirely — outline
 * + prefix/suffix is still a real, supported combination upstream, just not covered here).
 *
 * ANIMATIONS-ENABLED (300ms, universal): every field below runs with Angular's default
 * (animations enabled, the dev-app's default) and therefore gains class
 * `mat-form-field-animations-enabled` on the `<mat-form-field>` host ~300ms after
 * `ngAfterViewInit` (`MatFormField.ngAfterViewInit`) — once, never removed. Until that class
 * lands, the SCSS defining the line-ripple/floating-label/notch CSS *transitions* doesn't even
 * apply (`form-field.scss` gates `private-text-field-animations` on this class), so the `settle`
 * step below waits for it on every `.mat-mdc-form-field` before anything else, exactly like
 * expansion.ts's `settle`. The Qwik port must add the same class on the same ~300ms delay.
 *
 * LINE-RIPPLE (fill only; a genuinely surprising upstream quirk, confirmed live) — a FRESH,
 * never-focused fill field's `<div matformfieldlineripple>` carries class
 * `mdc-line-ripple--deactivating` FOREVER, not "no modifier class" as you'd expect:
 * `MatFormField.ngAfterViewInit` calls `_updateFocusState()` once; because `_isFocused` starts
 * `null` (not `false`), the "went inactive" branch runs even though nothing was ever active, and
 * calls `_lineRipple.deactivate()` — which only ADDS `mdc-line-ripple--deactivating` (never
 * touches `mdc-line-ripple--active`, which was never added either). Since no real opacity
 * transition ran, `transitionend` never fires, so nothing ever removes it. EVERY fill scenario's
 * steady state below that is never focused keeps this class — do not special-case the "obvious"
 * class-free reading. Lifecycle once real interaction happens (also confirmed live, see
 * 'fill-basic'): focus → `active` only (deactivating removed, instant, no transition to wait
 * for); blur → `active deactivating` together for ~180ms (`.mdc-line-ripple::after` transition,
 * only running once animations-enabled), then both removed by `transitionend` → neither class.
 * A SECOND focus/blur cycle behaves the same (active-only, then neither — the permanent-
 * deactivating state is ONLY the pristine, never-touched one). The parity spec's `blurField`
 * step waits out this transition (`waitForLineRippleSettled`) so the comparison never races it.
 *
 * ARIA DEFAULTS ON `<input>`/`<textarea>` (easy to get backwards, confirmed live) — `MatInput`
 * unconditionally binds `[attr.aria-required]="required"` and
 * `[attr.aria-invalid]="(empty && required) ? null : errorState"`. Angular's attribute binding
 * stringifies a boolean `false` to the literal attribute value `"false"` (only `null`/`undefined`
 * remove the attribute) — so a PLAIN, non-required field has BOTH `aria-invalid="false"` AND
 * `aria-required="false"` on it BY DEFAULT (confirmed on 'fill-basic' et al.). A required field
 * gets `aria-required="true"`, and — because `empty && required` is true until something is
 * typed — NO `aria-invalid` attribute AT ALL while still empty, even once touched-and-invalid
 * makes `mat-error` visible (see 'error-state' field 0: blurring an empty required field shows
 * `<mat-error>` but never adds `aria-invalid`). Only a required field that is ALSO non-empty and
 * invalid gets `aria-invalid="true"` (see 'error-state' field 1, typed 'abc' then blurred).
 * `errorState` itself only updates via `MatInput.ngDoCheck`'s `updateErrorState()` call, which
 * is gated on `this.ngControl` — a field with no `ngModel`/`[formControl]`/`formControlName`
 * never runs it, so `errorState` is permanently `false` (hence always `"false"`, never
 * `"true"`, when there's no bound control at all).
 *
 * `readonly`: unlike `disabled`/`required` (plain property bindings, browser-reflected as a bare
 * boolean attribute), `MatInput` binds `[attr.readonly]="_getReadonlyAttribute()"`, which
 * returns the STRING `'true'` (never bare `readonly` or `'false'`) when readonly (or
 * disabled-and-disabledInteractive). Confirmed live: `<input readonly="true">`, not
 * `<input readonly="">` or `<input readonly>` — the Qwik port must write the literal string.
 *
 * `ng-*` classes (`ng-untouched`/`ng-touched`/`ng-pristine`/`ng-dirty`/`ng-valid`/`ng-invalid`;
 * `ng-pending` never appears here, no async validators) appear in TWO independent places, and
 * ONLY when the input has `[formControl]`/`[(ngModel)]`/`formControlName` (i.e. an `NgControl`):
 * (1) directly on the `<input>`, via Angular forms' own `NgControlStatus` directive (selector
 * `[formControlName],[ngModel],[formControl]` — attaches to any element with one of those, not
 * Material-specific); (2) forwarded onto the `<mat-form-field>` HOST via
 * `MatFormField._shouldForward`, which reads `_control.ngControl` — also `null`/falsy without a
 * bound control, so the class is omitted entirely (not forced false) rather than merely "staying
 * off". None of the other 15 scenarios here use a bound control, so NONE of them have ANY
 * `ng-*` class anywhere — only 'error-state' does. Confirmed live.
 *
 * `required` CAN be true without ever writing a `required` attribute: `MatInput.required`'s
 * getter is `this._required ?? ngControl?.control?.hasValidator(Validators.required) ?? false` —
 * so a field bound to a `FormControl` created with `Validators.required` gets the native
 * `required=""` attribute, `aria-required="true"`, AND the label's required-marker `<span>`, all
 * for free, with no `required` attribute anywhere in the template. Confirmed on 'error-state'
 * (neither input has a literal `required` attribute in form-field.ts, both render one).
 *
 * `mat-form-field-hide-placeholder` (host class) = `_hasFloatingLabel() && !_shouldLabelFloat()`
 * — i.e. present exactly when there's a `<mat-label>` AND the label is resting (unfocused +
 * empty + not `floatLabel="always"`): the label sits where the placeholder would be, so the
 * placeholder's CSS opacity is zeroed to avoid double text. Toggles off (placeholder visible)
 * the instant the label floats — focus, a value, or `floatLabel="always"` all suffice.
 *
 * `disabled` + fill ALSO removes the whole `<div class="mat-mdc-form-field-focus-overlay">`
 * element (`@if (!_hasOutline() && !_control.disabled)`) — not just hidden via CSS, actually
 * absent from the DOM. Confirmed on 'disabled'. (Outline never renders this div regardless.)
 *
 * ============================= SHARED SKELETON — OUTLINE =============================
 * Differences from fill (confirmed live on 'outline-basic'): `mdc-text-field--outlined` instead
 * of `--filled`; NO focus-overlay div, ever; NO line-ripple div, ever (no `mdc-line-ripple`
 * anywhere in the outline tree). The `.mat-mdc-form-field-flex` gets a notched-outline wrapper
 * BEFORE the icon/text prefix containers, and the floating `<label>` lives INSIDE its notch
 * piece (not inside the infix):
 *   <div matformfieldnotchedoutline class="mdc-notched-outline mdc-notched-outline--upgraded
 *        [mdc-notched-outline--notched]">
 *     <div class="mat-mdc-notch-piece mdc-notched-outline__leading"></div>
 *     <div class="mat-mdc-notch-piece mdc-notched-outline__notch">
 *       <label matformfieldfloatinglabel ... style="">…</label>  <!-- see STYLE note -->
 *     </div>
 *     <div class="mat-mdc-notch-piece mdc-notched-outline__trailing"></div>
 *   </div>
 *   <div class="mat-mdc-form-field-infix"><input matinput .../></div>  <!-- label NOT here -->
 *
 * STYLE on the label (confirmed live): even on a FRESH, unfocused outline field with no
 * prefix/suffix, the label carries a literal `style=""` attribute (empty, not absent) —
 * `MatFormField._writeOutlinedLabelStyles` always runs `label.style.transform = ''` once on
 * init even when there's nothing to offset, and assigning `''` to a `CSSStyleDeclaration`
 * property that was never set still materializes an (empty) `style` attribute on the element.
 * This is harmless for parity: the harness's style comparison reads `element.style`'s actual
 * declarations, and an empty declaration list is simply omitted from the snapshot regardless of
 * whether the raw attribute string is `""` or absent — so the Qwik port doesn't need to
 * replicate the empty attribute specifically, just not produce a NON-empty transform fallback.
 *
 * NOTCH WIDTH (measured live, stable across repeated reloads — 3/3 identical runs): once the
 * label floats (focus, or any non-empty value, or `floatLabel="always"`), the notch piece gets
 * `notch.style.width = "calc(<labelScrollWidthPx>px * var(--mat-mdc-form-field-floating-label-
 * scale, 0.75) + 9px)"` (`_setNotchWidth`, `src/material/form-field/directives/notched-
 * outline.ts`; the `+9` is `NOTCH_ELEMENT_PADDING (8) + NOTCH_ELEMENT_BORDER (1)`).
 * `labelScrollWidthPx` is `Element.scrollWidth` of the `<label>` (an integer, not a sub-pixel
 * float — far more stable than `getBoundingClientRect` — see the WIDTH note above for why
 * outline+prefix/suffix, which DOES use the float-based measurement, is avoided here). For the
 * label text "Email" at this app's default theme/font, that measured 42px on every one of 3
 * fresh reloads. This number is a live-rendering fact (font/theme-dependent), not something to
 * hardcode blindly — if the Qwik port's rendered font metrics differ even slightly, the formula
 * shape must still match; only the `<N>` would legitimately differ, and it should be re-measured
 * against the real Qwik+Angular pair rather than assumed. This resize happens via a
 * `ResizeObserver` callback (fires once immediately on subscribe, giving the initial measurement)
 * plus a `setTimeout(0)` relay (`MatFormFieldFloatingLabel._handleResize`) whenever `floating`
 * changes — both comfortably finish within the spec's 250ms post-step wait.
 *
 * Scenarios (key → FORM_FIELD_SCENARIOS):
 *
 * - **fill-basic**: fill (default appearance, no `[appearance]` binding), `<mat-label>Email
 *   </mat-label>`, placeholder "pat@example.com", empty, unfocused → `mat-form-field-hide-
 *   placeholder` present, line-ripple `--deactivating` (pristine quirk above). `<p>Value: </p>`
 *   below, updated by a template-ref `(input)` handler (`#emailInput`, `value =
 *   emailInput.value` — chosen specifically to avoid `$event.target` under `strictDomEventTypes`).
 *   Steps: `settle`; focus field 0 → `mat-focused`+`mdc-text-field--focused` on host/wrapper,
 *   label gains `mdc-floating-label--float-above`, `hide-placeholder` removed, ripple → `active`
 *   only (confirmed, no wait needed — class add is instant, only removal transitions); type
 *   "pat@example.com" → `<p>` updates to "Value: pat@example.com" (typing itself touches NO
 *   attribute — `value` is a live DOM property, never reflected to the `value` ATTRIBUTE, so the
 *   structural snapshot — which only reads `element.attributes` — sees no difference from typing
 *   alone); blur field 0 → `mat-focused` removed, label STAYS floated (non-empty now), ripple
 *   transiently `active deactivating` together then (after the step's explicit wait) neither.
 * - **outline-basic**: same content as fill-basic but `[appearance]="'outline'"`. Steps:
 *   `settle`; focus → label floats, notch width becomes the `calc(42px * …)` formula above (see
 *   OUTLINE skeleton); type "pat@example.com" → `<p>` updates; blur → label stays floated (non-
 *   empty), notch width UNCHANGED (shouldLabelFloat was already true, no re-measure triggered).
 * - **float-always**: `[floatLabel]="'always'"`, same label/placeholder as fill-basic, fill
 *   appearance. Host gets `mat-mdc-form-field-label-always-float`; label starts WITH
 *   `mdc-floating-label--float-above` even empty+unfocused; `hide-placeholder` is ABSENT (since
 *   `_shouldLabelFloat()` is already true at rest — confirmed live, differs from fill-basic's
 *   initial state). `<p>Value: </p>`. Step: `settle`; type "pat@example.com" (via `.fill()`,
 *   which focuses implicitly) → `<p>` updates; no floating-related class changes (already
 *   floated) — this isolates "always" from focus/value-driven floating.
 * - **hint-start-end**: fill, label "Username", placeholder "jdoe", two `<mat-hint>`: default
 *   align (`start`) "Letters and numbers only", `align="end"` "Max 20". Confirmed ids/order live:
 *   `aria-describedby="mat-mdc-hint-1 mat-mdc-hint-2"` (start hint id first, end hint id second —
 *   `_syncDescribedByIds` pushes start then end), end hint additionally has class
 *   `mat-mdc-form-field-hint-end`; both hints render inside `.mat-mdc-form-field-hint-wrapper`
 *   either side of the (always-present) `.mat-mdc-form-field-hint-spacer` div. No `<p>`. Step:
 *   `settle` only — structural check, no interaction needed.
 * - **hint-label-end**: fill, `[hintLabel]="'Max 10 characters'"` on `<mat-form-field>` itself
 *   (NOT a `<mat-hint>` child), label "Nickname", `maxlength="10"`, placeholder "Ex. Nougat",
 *   plus an explicit `<mat-hint align="end">{{ value.length }}/10</mat-hint>` showing a live
 *   count via the same template-ref `(input)` pattern as fill-basic. Confirmed live:
 *   `hintLabel` renders as `<mat-hint id="mat-mdc-hint-0">Max 10 characters</mat-hint>` — id 0
 *   because `MatFormField._hintLabelId` is allocated in a field initializer at the form-field's
 *   OWN construction, before the end-hint child component is constructed — immediately followed
 *   by the spacer then the end hint (id 1). `aria-describedby="mat-mdc-hint-0 mat-mdc-hint-1"`.
 *   `<p>Value: </p>` below. Step: `settle`; type "Nougat" into field 0 → end hint text becomes
 *   "6/10", `<p>` becomes "Value: Nougat".
 * - **required-asterisk**: fill, label "Last name", placeholder "Doe", plain `required`
 *   attribute on the `<input>` (no bound control). Confirmed live: label gets the required-
 *   marker `<span aria-hidden="true" class="mat-mdc-form-field-required-marker mdc-floating-
 *   label--required"></span>` right after `<mat-label>`; input gets bare `required=""` (reflected
 *   boolean property, NOT the `readonly`-style string) and `aria-required="true"`; NO
 *   `aria-invalid` attribute at all (empty && required). No `ng-*` classes anywhere (no bound
 *   control) and NO visible error ever, regardless of touched state — `errorState` never updates
 *   without an `NgControl` (see ARIA DEFAULTS note). Steps: `settle`; focus field 0, blur field 0
 *   → confirms exactly that: no `mat-error`, no class changes beyond the usual focus/ripple ones,
 *   required-marker and `aria-required` unchanged throughout.
 * - **hide-required-marker**: identical to required-asterisk but `[hideRequiredMarker]="true"`
 *   on `<mat-form-field>`. Confirmed live: the required-marker `<span>` is GONE, but `required=""`
 *   and `aria-required="true"` on the input are UNCHANGED — hiding the marker is purely cosmetic
 *   on the label, independent of the underlying required state. Step: `settle` only.
 * - **disabled**: fill, label "City", `<input matInput value="Mountain View" disabled>` (static
 *   `value` attribute — safe here, see the directive-vs-component note at the top: no separate
 *   host to echo onto). Confirmed live: `mat-form-field-disabled` on host, `mdc-text-field--
 *   disabled` on the wrapper, the ENTIRE `.mat-mdc-form-field-focus-overlay` div is ABSENT (not
 *   just hidden), bare `disabled=""` on input (reflected boolean, same family as `required`),
 *   label already floats (`mdc-floating-label--float-above`, from the non-empty value — disabled
 *   doesn't block this, only focus-driven floating is gated by `!disabled`), line-ripple still
 *   gets the permanent pristine `--deactivating` class (the overlay removal is appearance/
 *   disabled-specific; the ripple div itself is unconditional for fill). No `<p>`, no steps
 *   beyond `settle` (a disabled native input cannot be focused by `.focus()`/click in a real
 *   browser, so there is nothing further to exercise structurally).
 * - **readonly**: fill, label "Account ID", `<input matInput value="ACC-10294" readonly>`.
 *   Confirmed live: `readonly="true"` (the string-valued attribute, see READONLY note above —
 *   NOT bare `readonly`), NO `disabled`/`mat-form-field-disabled`, focus-overlay div IS present
 *   (readonly ≠ disabled for that), label floats (non-empty value). Steps: `settle`; focus field
 *   0, blur field 0 — readonly fields ARE focusable (unlike disabled), so this exercises the
 *   normal `mat-focused`/ripple-active/ripple-settle lifecycle exactly like fill-basic's, proving
 *   readonly doesn't suppress focus-driven DOM changes, only edits.
 * - **prefix-suffix-text**: fill, `[floatLabel]="'always'"` (mirrors the upstream "Amount"
 *   example in components-examples/material/form-field), label "Amount", `<span matTextPrefix>
 *   $&nbsp;</span>`, `<input matInput type="number" placeholder="0">`, `<span matTextSuffix>
 *   .00</span>`. Confirmed live: prefix renders inside `<div class="mat-mdc-form-field-text-
 *   prefix">`, suffix inside `<div class="mat-mdc-form-field-text-suffix">`, both siblings of
 *   `.mat-mdc-form-field-infix` (prefix BEFORE it, suffix AFTER); the `<span>`s carry the literal
 *   `mattextprefix=""`/`mattextsuffix=""` attributes (CONSUMER_SELECTOR_ATTRS candidates, see top
 *   note) with no other classes. Host gets NEITHER `has-icon-prefix` NOR `has-icon-suffix` (text,
 *   not icon). No `has-icon-*`/no outline, so none of the sub-pixel label-offset machinery from
 *   the WIDTH note runs. Step: `settle` only.
 * - **prefix-suffix-icon**: fill (NOT always-float, deliberately, to also exercise `hide-
 *   placeholder` alongside icon containers), label "Password", `<span matIconPrefix>#</span>`,
 *   `<input matInput type="password" placeholder="Password">`, `<span matIconSuffix>@</span>`
 *   (plain glyphs, not `mat-icon`, to stay decoupled per the task). Confirmed live: host gains
 *   BOTH `mat-mdc-form-field-has-icon-prefix` and `-has-icon-suffix`; containers are `<div
 *   class="mat-mdc-form-field-icon-prefix">`/`-icon-suffix`; spans carry `maticonprefix=""`/
 *   `maticonsuffix=""`. `mat-form-field-hide-placeholder` present initially (empty+unfocused).
 *   Step: `settle` only.
 * - **textarea**: fill, label "Comments", `<textarea matInput rows="3" placeholder="Additional
 *   comments">` (empty, no default content), value read via the same template-ref `(input)`
 *   pattern (`#commentsInput`). Confirmed live: the element is a real `<textarea>…</textarea>`
 *   (not self-closing) with class `mat-mdc-form-field-textarea-control` ADDED (on top of the
 *   usual `mat-mdc-input-element mat-mdc-form-field-input-control mdc-text-field__input`) —
 *   `_isTextarea` is true because `MatInput` checks `nodeName.toLowerCase() === 'textarea'` in
 *   its constructor. `rows="3"` stays a plain attribute (not touched by Angular). `<p>Value: </p>`
 *   below. Step: `settle`; type "Looks good to me." into field 0 → `<p>` updates, label floats.
 * - **type-number-password**: fill, two independent fields: #0 label "Quantity",
 *   `<input matInput type="number" placeholder="0">`; #1 label "Password", `<input matInput
 *   type="password" placeholder="Password">`. `type` stays a plain, unbound attribute (consumer-
 *   written, same family as `placeholder`/`required`). `<p>Quantity: </p>` reflects field 0's
 *   value only (via template ref `#qtyInput`), field 1 has no readout. Neither type is in
 *   `_neverEmptyInputTypes` (`date`/`datetime`/`datetime-local`/`month`/`time`/`week` only), so
 *   `empty` behaves the same as a plain text input for both. ids increment across both fields
 *   (`mat-input-0`/`mat-mdc-form-field-label-0` then `mat-input-1`/`-label-1`). Step: `settle`;
 *   type "42" into field 0 → `<p>` becomes "Quantity: 42", field 0's label floats; field 1
 *   untouched throughout (still hide-placeholder, unfloated).
 * - **colors**: fill, three independent fields, no `<p>`: #0 "Default (primary)" — no `[color]`
 *   binding at all → host class `mat-primary` (MatFormField's OWN default, which is `'primary'`
 *   — DIFFERENT from `MatCheckbox`'s default `'accent'`, do not assume parity with checkbox.ts
 *   here); #1 `[color]="'accent'"` label "Accent" → `mat-accent`; #2 `[color]="'warn'"` label
 *   "Warn" → `mat-warn`. All three otherwise identical (fill, empty, unfocused, hide-placeholder
 *   present, ids increment 0/1/2 in order). Step: `settle` only.
 * - **subscript-dynamic**: fill, `[subscriptSizing]="'dynamic'"`, label "Nickname", placeholder
 *   "Ex. Nougat", one default-align `<mat-hint>Shown only while there's room</mat-hint>`.
 *   Confirmed live: the ONLY difference from a plain hint scenario is the subscript wrapper
 *   gaining class `mat-mdc-form-field-subscript-dynamic-size` (default `subscriptSizing` is
 *   `'fixed'`, which adds no class at all — absence of the class IS the fixed-sizing contract,
 *   not a separate class name). Step: `settle` only (this scenario isolates just the one class;
 *   it is not combined with error-state toggling, which is covered separately).
 * - **error-state**: fill, TWO fields using `ReactiveFormsModule`, each with its OWN
 *   `FormControl` (no `<form>` wrapper — a bare `[formControl]` doesn't need one): #0 label
 *   "Full name", `[formControl]="nameControl"` (`new FormControl('', Validators.required)`),
 *   placeholder "Jane Doe", one `@if (nameControl.invalid) { <mat-error>Name is required</mat-
 *   error> }`; #1 label "Email", `[formControl]="emailControl"` (`new FormControl('',
 *   [Validators.required, Validators.email])`), placeholder "pat@example.com", TWO conditional
 *   errors (`hasError('required')` → "Email is required", `hasError('email')` → "Enter a valid
 *   email"). Neither input has a literal `required` attribute, YET both end up with
 *   `required=""` + `aria-required="true"` + the label required-marker `<span>` — confirmed live,
 *   see the "required CAN be true without…" note above (derived from `Validators.required`).
 *   Both are `ng-untouched ng-pristine ng-invalid` from the very first render (confirmed live —
 *   invalid-and-required-and-empty is immediate; untouched/pristine only change on interaction),
 *   on BOTH the `<input>` (via `NgControlStatus`) and the `<mat-form-field>` host (via
 *   `_shouldForward`) — `mat-form-field-invalid`/`mdc-text-field--invalid`/visible `<mat-error>`
 *   are NOT yet present (those need `errorState`, which needs touched, see ARIA DEFAULTS note).
 *   No `aria-invalid` on either input yet (both empty+required). No `aria-describedby` yet (no
 *   hint, no rendered error). Steps: `settle`; focus field 0 → only `mat-focused`/ripple-active
 *   change, `ng-*` classes unchanged (focus isn't touch or dirty); blur field 0 → `ng-touched`
 *   replaces `ng-untouched`, `mdc-text-field--invalid` appears on the wrapper, subscript swaps
 *   from `.mat-mdc-form-field-hint-wrapper` to `.mat-mdc-form-field-error-wrapper` containing
 *   `<mat-error id="mat-mdc-error-N">Name is required</mat-error>`, `aria-describedby` now points
 *   at that error id — but STILL NO `aria-invalid` attribute (confirmed live: empty && required
 *   wins even with a visible error — do not assume "visible mat-error implies aria-invalid");
 *   focus field 1, type "abc" into field 1 (now non-empty, fails the email validator, passes
 *   required) → label floats (non-empty), `ng-pristine` replaced by `ng-dirty`; blur field 1 →
 *   `ng-touched` added, `aria-invalid="true"` APPEARS this time (non-empty now, so the `empty &&
 *   required` short-circuit no longer applies), the FIRST conditional `<mat-error>` ("Email is
 *   required", which existed since initial render because the control started invalid-for-
 *   required) is destroyed and a NEW one ("Enter a valid email") is created and projected,
 *   `aria-describedby` points at the NEW error's id (confirmed live: ids are allocated at
 *   component-construction time regardless of visibility, so the two `<mat-error>`s for field 1
 *   do NOT get consecutive ids across this transition — irrelevant for parity since the harness
 *   squashes digits, but real behavior worth knowing).
 */

const SETTLE_MS = 250;

/** Scopes to this scenario's own fields; dev-app chrome elsewhere is never hit. */
const fieldInput = (page: Page, index = 0) =>
  page.locator('[data-parity-root] input, [data-parity-root] textarea').nth(index);

/** Waits for the one-time, time-delayed `.mat-form-field-animations-enabled` class (see the big
 * comment above) on every field, so the first comparison isn't racing that timer — same pattern
 * as expansion.ts's `settle`. */
const settle: ParityStep = {
  name: 'settle (post-init animation class)',
  run: async (page: Page) => {
    await page.waitForFunction(
      () =>
        Array.from(document.querySelectorAll('[data-parity-root] .mat-mdc-form-field')).every(el =>
          el.classList.contains('mat-form-field-animations-enabled'),
        ),
      undefined,
      {timeout: 3000},
    );
  },
};

/** Waits out the fill appearance's line-ripple deactivation transition (~180ms, only runs once
 * `mat-form-field-animations-enabled` is present — see the big LINE-RIPPLE comment above) so a
 * blur step never leaves the DOM mid-transition for the structural diff to race. A no-op when
 * there's no line-ripple (outline) or nothing was actually transitioning. */
const waitForLineRippleSettled = (page: Page) =>
  page.waitForFunction(
    () =>
      !document.querySelector(
        '[data-parity-root] .mdc-line-ripple--active.mdc-line-ripple--deactivating',
      ),
    undefined,
    {timeout: 2000},
  );

const focusField = (index = 0): ParityStep => ({
  name: `focus field ${index}`,
  run: async (page: Page) => {
    await fieldInput(page, index).focus();
    await page.waitForTimeout(SETTLE_MS);
  },
});

const blurField = (index = 0): ParityStep => ({
  name: `blur field ${index}`,
  run: async (page: Page) => {
    await fieldInput(page, index).evaluate(el => (el as HTMLElement).blur());
    await waitForLineRippleSettled(page);
    await page.waitForTimeout(SETTLE_MS);
  },
});

const typeInto = (index: number, text: string): ParityStep => ({
  name: `type "${text}" into field ${index}`,
  run: async (page: Page) => {
    await fieldInput(page, index).fill(text);
    await page.waitForTimeout(SETTLE_MS);
  },
});

test.describe('mat-form-field — Angular DOM parity', () => {
  test('fill-basic', ({browser}) =>
    expectMaterialParity(browser, {
      route,
      scenario: 'fill-basic',
      skipInitialCompare: true,
      steps: [settle, focusField(0), typeInto(0, 'pat@example.com'), blurField(0)],
    }));

  test('outline-basic', ({browser}) =>
    expectMaterialParity(browser, {
      route,
      scenario: 'outline-basic',
      skipInitialCompare: true,
      steps: [settle, focusField(0), typeInto(0, 'pat@example.com'), blurField(0)],
    }));

  test('float-always', ({browser}) =>
    expectMaterialParity(browser, {
      route,
      scenario: 'float-always',
      skipInitialCompare: true,
      steps: [settle, typeInto(0, 'pat@example.com')],
    }));

  test('hint-start-end', ({browser}) =>
    expectMaterialParity(browser, {
      route,
      scenario: 'hint-start-end',
      skipInitialCompare: true,
      steps: [settle],
    }));

  test('hint-label-end', ({browser}) =>
    expectMaterialParity(browser, {
      route,
      scenario: 'hint-label-end',
      skipInitialCompare: true,
      steps: [settle, typeInto(0, 'Nougat')],
    }));

  test('required-asterisk', ({browser}) =>
    expectMaterialParity(browser, {
      route,
      scenario: 'required-asterisk',
      skipInitialCompare: true,
      steps: [settle, focusField(0), blurField(0)],
    }));

  test('hide-required-marker', ({browser}) =>
    expectMaterialParity(browser, {
      route,
      scenario: 'hide-required-marker',
      skipInitialCompare: true,
      steps: [settle],
    }));

  test('disabled', ({browser}) =>
    expectMaterialParity(browser, {
      route,
      scenario: 'disabled',
      skipInitialCompare: true,
      steps: [settle],
    }));

  test('readonly', ({browser}) =>
    expectMaterialParity(browser, {
      route,
      scenario: 'readonly',
      skipInitialCompare: true,
      steps: [settle, focusField(0), blurField(0)],
    }));

  test('prefix-suffix-text', ({browser}) =>
    expectMaterialParity(browser, {
      route,
      scenario: 'prefix-suffix-text',
      skipInitialCompare: true,
      steps: [settle],
    }));

  test('prefix-suffix-icon', ({browser}) =>
    expectMaterialParity(browser, {
      route,
      scenario: 'prefix-suffix-icon',
      skipInitialCompare: true,
      steps: [settle],
    }));

  test('textarea', ({browser}) =>
    expectMaterialParity(browser, {
      route,
      scenario: 'textarea',
      skipInitialCompare: true,
      steps: [settle, typeInto(0, 'Looks good to me.')],
    }));

  test('type-number-password', ({browser}) =>
    expectMaterialParity(browser, {
      route,
      scenario: 'type-number-password',
      skipInitialCompare: true,
      steps: [settle, typeInto(0, '42')],
    }));

  test('colors', ({browser}) =>
    expectMaterialParity(browser, {
      route,
      scenario: 'colors',
      skipInitialCompare: true,
      steps: [settle],
    }));

  test('subscript-dynamic', ({browser}) =>
    expectMaterialParity(browser, {
      route,
      scenario: 'subscript-dynamic',
      skipInitialCompare: true,
      steps: [settle],
    }));

  test('error-state', ({browser}) =>
    expectMaterialParity(browser, {
      route,
      scenario: 'error-state',
      skipInitialCompare: true,
      steps: [settle, focusField(0), blurField(0), focusField(1), typeInto(1, 'abc'), blurField(1)],
    }));
});
