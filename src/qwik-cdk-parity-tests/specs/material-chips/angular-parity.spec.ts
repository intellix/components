import {test, type Page} from '@playwright/test';
import {expectMaterialParity, type ParityStep} from '../../lib/material-parity.js';

/**
 * mat-chips — Angular DOM parity.
 *
 * Source of truth for every scenario: src/dev-app/qwik-parity/chips.ts (exports
 * `CHIPS_SCENARIOS`, served at http://localhost:4200/qwik-parity/mat-chips/<scenario>). The
 * Qwik side must render the same markup at http://localhost:4173/mat-chips/<scenario>/ inside
 * its own `[data-parity-root]`.
 *
 * Icon-like content (avatars, trailing icons, remove glyphs) is written as plain text/spans in
 * every scenario, never `<mat-icon>` — qwik-material's icon component is out of scope for this
 * port. Only the chip's own DOM contract (the classes/attributes/`ng-content` slots a real
 * `<mat-icon>` would plug into) matters here.
 *
 * ============================= SHARED STRUCTURAL CONTRACT =============================
 *
 * Every chip gets an auto-generated `id="mat-mdc-chip-#"` (`_IdGenerator`, app-global counter
 * — normalized by the harness's digit squash). `mat-chip-grid`'s own id defaults to
 * `mat-chip-grid-#`, but once an `<input matChipInputFor>` registers with it, `MatChipGrid.id`
 * delegates to the INPUT's id instead (`mat-mdc-chip-list-input-#`) — the grid's own
 * `mat-chip-grid-#` id is never rendered as an attribute at all in that case (`[id]` is bound
 * on `MatFormFieldControl`, not reflected onto the chip-grid's own host element).
 *
 * Role split (this is the single most important thing to get right):
 *   - `mat-chip-set`/`mat-chip-listbox`/`mat-chip-grid` (the container): role is
 *     `presentation`/`listbox`/`grid` respectively, but ONLY `role="presentation"` has a
 *     `_defaultRole` that can also be `null` — the container's `role` getter returns
 *     `empty ? null : _defaultRole`, so the role ATTRIBUTE ITSELF DISAPPEARS when the
 *     container has zero chips (verified live: see `removable`'s final step). Listbox/grid
 *     additionally drop to `role="listbox"`/`"grid"` → still present when empty is NOT the
 *     rule for them — re-read: `MatChipSet`'s own base getter applies uniformly to all three
 *     (listbox/grid override `_defaultRole`, not the getter), so listbox/grid ALSO lose their
 *     `role` attribute (and `aria-required`, since that binding is `role ? required : null`)
 *     once empty. Only the chip-grid/listbox scenarios below keep chips throughout, so this
 *     empty-role-removal is only actually exercised by `removable`.
 *   - A plain `<mat-chip>` (base, used in `mat-chip-set`): `role` input defaults to `null` —
 *     NO `role` attribute on the chip itself unless a consumer sets `[role]`. None of this
 *     port's scenarios set it, so plain chips never carry a `role`.
 *   - `<mat-chip-option>` (used in `mat-chip-listbox`): `ngOnInit` unconditionally sets
 *     `this.role = 'presentation'` — the OUTER `<mat-chip-option>` host always has
 *     `role="presentation"`. The actual `role="option"` lives on the INNER
 *     `<button matChipAction role="option">` (the primary action).
 *   - `<mat-chip-row>` (used in `mat-chip-grid`): constructor sets `this.role = 'row'` — the
 *     OUTER `<mat-chip-row>` host always has `role="row"`. Each cell span gets `role="gridcell"`
 *     explicitly in the template, including the primary cell
 *     (`<span role="gridcell" matChipAction>`, NOT a `<button>` — the chip-row's primary action
 *     is a `<span>`, unlike chip-option's `<button>`).
 *
 * Action classes — every actionable element inside a chip (`matChipContent` on the
 * non-interactive primary cell of a plain chip, `matChipAction` on chip-option/chip-row's
 * primary cell, `matChipAvatar`/`matChipTrailingIcon`/`matChipRemove`) all share the base class
 * string `mat-mdc-chip-action mdc-evolution-chip__action` plus exactly one of
 * `mdc-evolution-chip__action--primary` (the primary cell) or `--secondary`/`--trailing` (the
 * remove/trailing-icon cell — both appear together on `matChipRemove`/`matChipTrailingIcon`,
 * only `--primary` alone for leading edit icons). A disabled action additionally gets
 * `[attr.disabled]=""` (buttons) and always gets `aria-disabled="<bool>"`.
 *
 * Ripple-loader contract (identical mechanism to qwik-material/button — see its SYNC.md and
 * `internal/ripple-loader.ts` for the Qwik-side pattern to reuse): every chip host
 * (`mat-chip`/`mat-chip-option`/`mat-chip-row`) gets, at construction:
 *   - `mat-ripple-loader-uninitialized=""` — removed the first time a `focus`, `mousedown`,
 *     `mouseenter` or `touchstart` event reaches ANY descendant of that host (document-level
 *     capture listener, `closest('[mat-ripple-loader-uninitialized]')`).
 *   - `mat-ripple-loader-class-name="mat-mdc-chip-ripple"` — always present, never removed.
 *   - `mat-ripple-loader-disabled=""` — present from construction iff
 *     `disabled || disableRipple || animationsDisabled || isBasicChip || !hasInteractiveActions
 *     || globalRippleOptions.disabled`. A plain `<mat-chip>` with NO remove/edit icon has NO
 *     interactive actions at all (its only action is the non-interactive `matChipContent`), so
 *     it is ALWAYS ripple-disabled (verified live: every chip in `basic`/`colors` carries this
 *     attribute permanently). A chip-option is NEVER ripple-disabled this way (its primary
 *     action is always an interactive `<button>`).
 *   On the first qualifying event, a `<span class="mat-ripple mat-mdc-chip-ripple"></span>` is
 *   appended as the chip's LAST child (after the trailing-icon cell, if any) and
 *   `mat-ripple-loader-uninitialized` is removed — PERMANENTLY, even on a ripple-disabled chip
 *   (the container span is still created; only the visible wave animation inside it is skipped).
 *   The container span itself persists forever once created; only the transient
 *   `.mat-ripple-element` wave `<div>` inside it (added per-click, removed after its
 *   animation) is waited out by the harness's `snapshotParityRoot` before every comparison —
 *   the container span is NOT transient and must be reproduced exactly.
 *   QUIRK (verified live, `removable`'s first step): removing a chip reflows the following
 *   chips leftward. If that reflow leaves a FOLLOWING chip's DOM sitting under the
 *   now-stationary mouse pointer, the browser fires a native `mouseenter` on it even though
 *   the pointer never moved — initializing THAT chip's ripple-loader too, incidentally, as a
 *   side effect of the SAME click. This is ordinary browser behavior common to both apps (not
 *   something to special-case); don't be surprised to see a second chip's ripple container
 *   appear after a single remove-click.
 *
 * FocusMonitor contract: `MatChip`'s constructor calls `_focusMonitor.monitor(elementRef,
 * true)` (checkChildren=true) — ONLY on the individual chip host (`mat-chip`/`mat-chip-option`/
 * `mat-chip-row`), never on the `mat-chip-set`/`listbox`/`grid` container. Whenever ANY
 * descendant of a chip gains/loses DOM focus, that chip's host gains/loses `cdk-focused` plus
 * exactly one origin class: `cdk-mouse-focused` (a `.click()`), `cdk-keyboard-focused` (focus
 * that lands via a keypress — Tab, or a key-driven `.focus()` call such as arrow-key
 * navigation or the Backspace-focuses-last-chip redirect), or `cdk-program-focused` (a bare
 * scripted `.focus()` call with no recent keyboard/mouse event — verified live via Playwright's
 * `locator.focus()`). Losing focus is deferred by one `setTimeout`, so classes clear a tick
 * after blur, not synchronously.
 *
 * Focus-after-removal: a chip's own `focus()` calls `this.primaryAction.focus()` — but a PLAIN
 * `<mat-chip>` (base, in a plain `mat-chip-set`) has NO `primaryAction` at all (its template
 * uses non-interactive `matChipContent`, never `matChipAction`, for the primary cell), so
 * `focus()` is a no-op, and the base `MatChipSet.focus()` itself is also a literal no-op
 * (`focus() {}`, see chip-set.ts). CONFIRMED LIVE: in `removable`, removing a focused chip's
 * remove button does NOT move DOM focus anywhere — it is simply dropped (back to
 * `document.body`), and no sibling chip gains `cdk-focused`. By contrast, `mat-chip-row`
 * (inside `mat-chip-grid`) and `mat-chip-option` (inside `mat-chip-listbox`) both have a real
 * focusable `primaryAction`, and `MatChipGrid`/`MatChipListbox` track
 * `_lastDestroyedFocusedChipIndex` to redirect focus to the chip now occupying that index (or
 * the new last chip, clamped) — CONFIRMED LIVE in `grid-input`'s last step: removing the
 * focused-via-click first chip-row moves `cdk-focused cdk-mouse-focused` onto the chip-row that
 * slides into its place, and the owning `mat-form-field` KEEPS its `mat-focused`/
 * `mdc-text-field--focused` classes throughout (its `focused` getter also checks
 * `_hasFocusedChip()`, not just the input).
 *
 * Ripple-wave `.mat-ripple-element` divs (the actual click animation, inside the permanent
 * `.mat-ripple` container span above) are waited out automatically by the harness before every
 * comparison — no scenario-specific handling needed for those.
 *
 * ================================ PER-SCENARIO CONTRACT ================================
 *
 * - `basic`: `<mat-chip-set>` with 3 plain `<mat-chip>` — "Apple" (plain), "Banana"
 *   (`[highlighted]="true"` → host class `mat-mdc-chip-highlighted`), "Cherry"
 *   (`[disabled]="true"` → host classes `mdc-evolution-chip--disabled mat-mdc-chip-disabled`,
 *   inner `matChipContent` cell gets `disabled=""` + `aria-disabled="true"`). All three default
 *   to host class `mat-primary` (color's fallback literal is `'primary'`, NOT `'accent'` like
 *   checkbox/radio — confirmed live and cross-checked against `colors` below). No chip has a
 *   `role` attribute (plain `MatChip.role` defaults to `null`). Set host:
 *   `role="presentation"` (non-empty). No steps.
 *
 * - `avatar-trailing-icon`: `<mat-chip-set>` with 2 chips. Chip 0 "Kara": leading
 *   `<span matChipAvatar>K</span>` (renders inside a `<span class="mdc-evolution-chip__graphic
 *   mat-mdc-chip-graphic">` wrapper the chip itself adds; the avatar span's own classes are
 *   `mat-mdc-chip-avatar mdc-evolution-chip__icon mdc-evolution-chip__icon--primary` +
 *   `role="img"`) plus a trailing `<button matChipRemove aria-label="Remove Kara">×</button>`
 *   (classes: `mat-mdc-chip-remove mat-mdc-chip-trailing-icon mat-focus-indicator
 *   mdc-evolution-chip__icon mdc-evolution-chip__icon--trailing mat-mdc-chip-action
 *   mdc-evolution-chip__action mdc-evolution-chip__action--secondary
 *   mdc-evolution-chip__action--trailing`, `type="button"`, `tabindex="-1"`, `role="button"`).
 *   Host gets `mdc-evolution-chip--with-primary-graphic mdc-evolution-chip--with-primary-icon
 *   mdc-evolution-chip--with-avatar mat-mdc-chip-with-avatar` (leading-icon classes) AND
 *   `mdc-evolution-chip--with-trailing-action mat-mdc-chip-with-trailing-icon` (trailing-icon
 *   classes). Chip 1 "Jeremy": trailing `<span matChipTrailingIcon>★</span>` only (classes:
 *   `mat-mdc-chip-trailing-icon mdc-evolution-chip__icon mdc-evolution-chip__icon--trailing
 *   mat-mdc-chip-action mdc-evolution-chip__action mdc-evolution-chip__action--presentational
 *   mdc-evolution-chip__action--secondary mdc-evolution-chip__action--trailing`,
 *   `aria-hidden="true"` — it is non-interactive, no `matChipAction`/tabindex/role); host gets
 *   only the trailing-icon classes (no leading-icon ones). No steps.
 *
 * - `removable`: `<mat-chip-set>`, 3 plain removable `<mat-chip>` ("One"/"Two"/"Three"), each
 *   with a `<button matChipRemove [attr.aria-label]="'Remove ' + fruit">×</button>`; `<p>Chips:
 *   One, Two, Three</p>` below, updated by `(removed)` splicing a `fruits` array. Steps:
 *   (1) click remove(0) → "One" removed, DOM renumbers ("Two"/"Three" keep their OWN ids,
 *   `mat-mdc-chip-1`/`-2` — ids are per-chip, not re-assigned on reflow), "Chips: Two, Three".
 *   The reflow-under-pointer ripple quirk above applies: "Two" (now first) picks up a ripple
 *   container from the stray `mouseenter`, "Three" does not. (2) focus remove(0) (now "Two"'s
 *   button, via `.focus()`) then press `Delete` → "Two" removed (`_handleKeydown`'s DELETE
 *   branch — no `repeat` guard needed for DELETE, only BACKSPACE), "Chips: Three". (3) focus
 *   remove(0) (now "Three"'s button) then press `Backspace` (not held/repeat) → "Three"
 *   removed, "Chips: (none)". Set now has 0 chips → `role` attribute DISAPPEARS entirely from
 *   `<mat-chip-set>` (see shared contract above) — this is the only scenario that exercises
 *   the empty-chip-set role removal. No `cdk-focused` class ever appears on a surviving chip
 *   (plain `mat-chip-set`/`mat-chip` have no focus-redirect-on-removal — see shared contract).
 *
 * - `listbox-single`: `<mat-chip-listbox aria-label="Shirt size">` (single-select, default),
 *   4 `<mat-chip-option>`: "Extra Small"(`xs`), "Small"(`s`), "Medium"(`m`,
 *   `[disabled]="true"`), "Large"(`l`); `<p>Selected: (none)</p>` updated via `(change)`. Host:
 *   `role="listbox" tabindex="0" aria-required="false" aria-disabled="false"
 *   aria-multiselectable="false" aria-orientation="horizontal"`. Every option has a leading
 *   checkmark graphic (`_hasLeadingGraphic()` true: no `hideSingleSelectionIndicator`), inner
 *   `<button matChipAction role="option" aria-selected="false" tabindex="-1">`. Steps:
 *   (1) click option(0) → selects "Extra Small" (host-level `mat-mdc-chip-selected
 *   mdc-evolution-chip--selected` + inner `aria-selected="true"`, plus `cdk-focused
 *   cdk-mouse-focused` on that chip), "Selected: xs". (2) click option(3) → selects "Large",
 *   deselects "Extra Small" (single-select — only one chip selected at a time; its
 *   `cdk-focused` also clears since focus moved away), "Selected: l". (3) Tab into root from a
 *   sentinel (see `tabIn` below) → listbox's own `(focus)` handler immediately redirects real
 *   DOM focus to the first SELECTED chip ("Large")'s button — `cdk-focused
 *   cdk-keyboard-focused` on "Large", "Selected: l" unchanged. (4) `ArrowLeft` → FocusKeyManager
 *   moves focus to "Medium" — DISABLED chip options are NOT skipped
 *   (`MatChipListbox._skipPredicate` always returns `false`, by design, per WAI-ARIA listbox
 *   guidance — see its doc comment), so "Medium" DOES receive `cdk-focused cdk-keyboard-focused`
 *   even though `aria-disabled="true"` on its button; no selection change. (5) `Space` on the
 *   now-focused, disabled "Medium" → NO-OP (`MatChipAction._handleKeydown` requires
 *   `!this.disabled`) — DOM identical to after step 4, "Selected: l" unchanged. (6)
 *   `ArrowLeft` again → focus moves to "Small" (`cdk-focused cdk-keyboard-focused`, "Medium"
 *   loses it). (7) `Space` on "Small" → selects it, deselects "Large" — "Selected: s".
 *
 * - `listbox-multiple`: `<mat-chip-listbox [multiple]="true" aria-label="Amenities">`, 4
 *   options: "Wifi"(`wifi`, `[selected]="true"`), "Parking"(`parking`), "Pool"(`pool`,
 *   `[selected]="true"`), "Gym"(`gym`); `<p>Selected: wifi, pool</p>` initially (mirrors the
 *   two `[selected]` bindings), updated via `(change)`. Host: `aria-multiselectable="true"`.
 *   Every selected option additionally gets host class `mat-mdc-chip-multiple` is on EVERY
 *   option regardless of selection (multi-mode marker); `mdc-evolution-chip--selecting` is
 *   ABSENT when multi-select is in play for an unselected-but-then-selected option at steady
 *   state (present only transiently per MDC's selection-animation gate — not asserted
 *   directly, same caveat as checkbox's transition classes). Selected-value order in `<p>`
 *   follows DOM order, not selection order (`this._chips.toArray().map(...)`). Steps: (1) click
 *   Parking(1) → adds "parking" → "Selected: wifi, parking, pool" (DOM order: wifi, parking,
 *   pool), `cdk-focused cdk-mouse-focused` + ripple on Parking. (2) `.focus()` Pool(2)
 *   programmatically then `Space` → deselects Pool (multi-select: toggling an already-selected
 *   chip just removes it, no other chip is affected) → "Selected: wifi, parking";
 *   `cdk-program-focused` (NOT `cdk-keyboard-focused` — a bare scripted `.focus()` with no
 *   preceding key/mouse event resolves to `program` origin; confirmed live). (3) click Wifi(0)
 *   → deselects Wifi → "Selected: parking".
 *
 * - `listbox-hide-indicator`: `<mat-chip-listbox [hideSingleSelectionIndicator]="true"
 *   aria-label="Accent color">`, 3 options "None"/"Primary"/"Accent" (single-select);
 *   `<p>Selected: (none)</p>`. Because `hideSingleSelectionIndicator` is true AND `multiple` is
 *   false, `_hasLeadingGraphic()` is false for every option: NO `<span
 *   class="mdc-evolution-chip__graphic...">` wrapper is rendered at all (not just visually
 *   hidden — the element is absent), and the host lacks
 *   `mdc-evolution-chip--with-primary-graphic`/`-icon`/`-avatar` classes, even once selected.
 *   Step: click Accent(2) → selects it (`mat-mdc-chip-selected`/`aria-selected="true"` still
 *   apply — only the GRAPHIC is suppressed, not selection semantics), "Selected: accent";
 *   `cdk-focused cdk-mouse-focused` + ripple on Accent.
 *
 * - `listbox-not-selectable`: `<mat-chip-listbox [selectable]="false" aria-label="Read-only
 *   tags">`, 2 options "Tag A"/"Tag B". `selectable=false` propagates to every chip
 *   (`chip.selectable = this._selectable && this.chipListSelectable`), which makes
 *   `ariaSelected` return `null` — the inner button has NO `aria-selected` attribute AT ALL
 *   (confirmed live: absent, not `"false"`) on either chip, from the start. The leading
 *   checkmark graphic IS still rendered (`_hasLeadingGraphic()` doesn't depend on
 *   `selectable`). Step: click Tag A → genuinely a no-op for selection (no
 *   `mat-mdc-chip-selected` class, `aria-selected` stays absent — `_handlePrimaryActionInteraction`
 *   only calls `toggleSelected` `if (this.selectable)`) — but the chip STILL gets `cdk-focused
 *   cdk-mouse-focused` and a ripple container (focus/ripple are independent of selectability).
 *
 * - `colors`: `<mat-chip-set>`, 4 plain `<mat-chip>`: "Default" (no `[color]` binding) and
 *   "Primary" (`[color]="'primary'"`) BOTH render host class `mat-primary` — confirms the
 *   component's default literal IS `'primary'` (`"mat-" + (color || "primary")`), unlike
 *   checkbox/radio's `'accent'` default. "Accent" (`[color]="'accent'"`) → `mat-accent`.
 *   "Warn" (`[color]="'warn'"`) → `mat-warn`. All four are permanently ripple-disabled (no
 *   remove/edit icon → no interactive actions). No steps (static display only, like
 *   form-field's own `colors` scenario).
 *
 * - `grid-input`: `<mat-form-field [appearance]="'outline'" style="width: 300px">` (see
 *   form-field's own parity spec for the full form-field shell contract — notch width,
 *   `mat-form-field-animations-enabled` timing, etc. — unchanged here) wrapping `<mat-chip-grid
 *   #grid aria-label="Enter fruits">` with 2 `<mat-chip-row>` ("Lemon"/"Lime", each with a
 *   `<button matChipRemove>×</button>`) followed by `<input matChipInputFor="grid"
 *   [matChipInputSeparatorKeyCodes]="[ENTER, COMMA]" (matChipInputTokenEnd)="add($event)"
 *   placeholder="New fruit...">`; `<p>Chips: Lemon, Lime</p>` outside the field. Grid host:
 *   `role="grid" tabindex="0" aria-disabled="false" aria-invalid="false"`. Each chip-row's
 *   primary cell is a `<span role="gridcell" matChipAction>` (NOT a button — see shared
 *   role-split note). The input carries classes `mat-mdc-chip-input mat-mdc-input-element
 *   mdc-text-field__input mat-input-element mat-mdc-form-field-input-control` and `[id]`
 *   matching the grid's own delegated id (`mat-mdc-chip-list-input-#` — see shared id note).
 *   Steps: (1) click the input, type "Mango", press `Enter` → `matChipInputTokenEnd` fires →
 *   `add()` pushes "Mango" and clears the input → new `<mat-chip-row>` "Mango" appended,
 *   "Chips: Lemon, Lime, Mango"; the typed `Enter` also focuses the field
 *   (`mat-form-field` gains `mat-focused`, text-field wrapper gains `mdc-text-field--focused` —
 *   ordinary form-field-input-focus behavior, unchanged from form-field's own contract). (2)
 *   with the input now empty, press `Backspace` (not held) → `MatChipInput._keydown`'s
 *   empty+BACKSPACE branch calls `_chipGrid._focusLastChip()` and preventDefaults — NO chip is
 *   removed, only focus moves: "Mango" (the last chip-row) gains `cdk-focused
 *   cdk-keyboard-focused` (a key-driven `.focus()` call resolves to keyboard origin) plus its
 *   ripple container initializes; "Chips:" text unchanged. (3) click remove on the FIRST
 *   chip-row ("Lemon") → it is destroyed; `MatChipGrid` redirects focus to the chip-row now
 *   occupying that slot ("Lime") — CONFIRMED LIVE: "Lime" gains `cdk-focused
 *   cdk-mouse-focused` automatically (no explicit `.focus()` call needed — contrast with
 *   `removable`'s plain-chip-set, where this redirect does NOT happen), and the owning
 *   `mat-form-field` KEEPS `mat-focused`/`mdc-text-field--focused` throughout (its `focused`
 *   getter also checks `_hasFocusedChip()`). "Chips: Lime, Mango" (Mango's earlier
 *   `cdk-keyboard-focused` state is superseded/cleared by this new focus elsewhere).
 *
 * - `grid-disabled`: same outline form-field + 2 chip-rows ("Lemon"/"Lime") shape as
 *   `grid-input`, but `<mat-chip-grid [disabled]="true">` and no `(matChipInputTokenEnd)`
 *   handler needed. Grid host: `aria-disabled="true"`, class `mat-mdc-chip-list-disabled`,
 *   `tabindex="-1"` (disabled grids are not tab-reachable, unlike enabled ones). Both
 *   chip-rows get `mat-mdc-chip-disabled mdc-evolution-chip--disabled`; their primary gridcell
 *   span gets `disabled="" aria-disabled="true"` and (unlike enabled rows) NO `tabindex`
 *   attribute at all (`[attr.tabindex]="disabled ? null : -1"` — `null`, not `-1`, once
 *   disabled); their remove buttons get `disabled="" aria-disabled="true"`. The input gets
 *   `disabled=""` too (`disabled && !disabledInteractive` → `""`). `mat-form-field` host gains
 *   `mat-form-field-disabled`, text-field wrapper gains `mdc-text-field--disabled`. Step:
 *   force-click remove(0) → genuinely a no-op (disabled native `<button>` never dispatches a
 *   real `click`) — DOM identical to initial (no ripple, no focus classes — confirmed live:
 *   the wait resolves instantly, nothing changes).
 *
 * - `listbox-vertical`: `<mat-chip-listbox aria-label="Priority" [aria-orientation]="'vertical'">`,
 *   3 options "Low"/"Medium"/"High" (`[selected]="true"` on "High"). Host:
 *   `aria-orientation="vertical"` — THIS IS PURELY AN ARIA ATTRIBUTE; the underlying
 *   `FocusKeyManager` always has BOTH `withVerticalOrientation()` AND
 *   `withHorizontalOrientation(dir)` configured regardless of `ariaOrientation` (see
 *   chip-set.ts `_setUpFocusManagement`), so `ArrowUp`/`ArrowDown` (and `ArrowLeft`/`ArrowRight`,
 *   untested here) both navigate regardless of this input — it changes assistive-tech
 *   semantics only, never actual keyboard behavior. Steps: (1) Tab into root from a sentinel →
 *   listbox's `(focus)` redirects to the first selected chip, "High" → `cdk-focused
 *   cdk-keyboard-focused` + ripple. (2) `ArrowUp` → focus moves to "Medium" (`cdk-focused
 *   cdk-keyboard-focused`; "High" loses `cdk-focused`, keeps `mat-mdc-chip-selected`/
 *   `aria-selected="true"` — selection and focus are independent state).
 */

const route = 'mat-chips';

/** Scopes to this scenario's chip-remove buttons so dev-app chrome elsewhere is never hit. */
const removeButton = (page: Page, index = 0) =>
  page.locator('[data-parity-root] button.mat-mdc-chip-remove').nth(index);

/** Scopes to this scenario's chip-option primary action buttons (role="option"). */
const optionButton = (page: Page, index = 0) =>
  page.locator('[data-parity-root] button[role="option"]').nth(index);

/** Tabs into the parity root from a sentinel placed just before it (the dev-app chrome differs). */
const tabIn: ParityStep = {
  name: 'Tab into root',
  run: async (page: Page) => {
    await page.locator('[data-parity-root]').evaluate(root => {
      const sentinel = document.createElement('button');
      root.before(sentinel);
      sentinel.focus();
    });
    await page.keyboard.press('Tab');
  },
};

const clickRemove = (index: number): ParityStep => ({
  name: `click remove(${index})`,
  run: (page: Page) => removeButton(page, index).click({force: true}),
});

const forceClickRemove = (index: number): ParityStep => ({
  name: `force-click remove(${index}) (disabled, expect no-op)`,
  run: (page: Page) => removeButton(page, index).click({force: true}),
});

/** Focuses a remove button programmatically, then presses the given key (Delete/Backspace). */
const keyOnRemove = (index: number, key: 'Delete' | 'Backspace'): ParityStep => ({
  name: `${key} on remove(${index}) [focused]`,
  run: async (page: Page) => {
    await removeButton(page, index).focus();
    await page.keyboard.press(key);
  },
});

const clickOption = (index: number): ParityStep => ({
  name: `click option(${index})`,
  run: (page: Page) => optionButton(page, index).click(),
});

const spaceOnOption = (index: number): ParityStep => ({
  name: `Space on option(${index}) [focused]`,
  run: async (page: Page) => {
    await optionButton(page, index).focus();
    await page.keyboard.press('Space');
  },
});

const arrow = (key: 'ArrowLeft' | 'ArrowRight' | 'ArrowUp' | 'ArrowDown'): ParityStep => ({
  name: key,
  run: (page: Page) => page.keyboard.press(key),
});

const space: ParityStep = {
  name: 'Space',
  run: (page: Page) => page.keyboard.press('Space'),
};

test.describe('mat-chips — Angular DOM parity', () => {
  test('basic', ({browser}) => expectMaterialParity(browser, {route, scenario: 'basic'}));

  test('avatar-trailing-icon', ({browser}) =>
    expectMaterialParity(browser, {route, scenario: 'avatar-trailing-icon'}));

  test('removable', ({browser}) =>
    expectMaterialParity(browser, {
      route,
      scenario: 'removable',
      steps: [clickRemove(0), keyOnRemove(0, 'Delete'), keyOnRemove(0, 'Backspace')],
    }));

  test('listbox-single', ({browser}) =>
    expectMaterialParity(browser, {
      route,
      scenario: 'listbox-single',
      steps: [
        clickOption(0),
        clickOption(3),
        tabIn,
        arrow('ArrowLeft'),
        space,
        arrow('ArrowLeft'),
        space,
      ],
    }));

  test('listbox-multiple', ({browser}) =>
    expectMaterialParity(browser, {
      route,
      scenario: 'listbox-multiple',
      steps: [clickOption(1), spaceOnOption(2), clickOption(0)],
    }));

  test('listbox-hide-indicator', ({browser}) =>
    expectMaterialParity(browser, {
      route,
      scenario: 'listbox-hide-indicator',
      steps: [clickOption(2)],
    }));

  test('listbox-not-selectable', ({browser}) =>
    expectMaterialParity(browser, {
      route,
      scenario: 'listbox-not-selectable',
      steps: [clickOption(0)],
    }));

  test('colors', ({browser}) => expectMaterialParity(browser, {route, scenario: 'colors'}));

  test('grid-input', ({browser}) =>
    expectMaterialParity(browser, {
      route,
      scenario: 'grid-input',
      steps: [
        {
          name: 'type Mango + Enter',
          run: async (page: Page) => {
            const input = page.locator('[data-parity-root] input.mat-mdc-chip-input');
            await input.click();
            await input.pressSequentially('Mango');
            await page.keyboard.press('Enter');
          },
        },
        {
          name: 'Backspace in empty input (focuses last chip)',
          run: (page: Page) => page.keyboard.press('Backspace'),
        },
        clickRemove(0),
      ],
    }));

  test('grid-disabled', ({browser}) =>
    expectMaterialParity(browser, {
      route,
      scenario: 'grid-disabled',
      steps: [forceClickRemove(0)],
    }));

  test('listbox-vertical', ({browser}) =>
    expectMaterialParity(browser, {
      route,
      scenario: 'listbox-vertical',
      steps: [tabIn, arrow('ArrowUp')],
    }));
});
