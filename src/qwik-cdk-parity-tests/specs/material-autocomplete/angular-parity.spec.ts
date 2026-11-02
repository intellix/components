import {test, type Page} from '@playwright/test';
import {expectMaterialParity, type ParityStep} from '../../lib/material-parity.js';

/**
 * mat-autocomplete (+ matAutocomplete trigger on a matInput inside mat-form-field, mat-option,
 * mat-optgroup) — Angular DOM parity.
 *
 * Source of truth for every scenario: src/dev-app/qwik-parity/autocomplete.ts (exports
 * `AUTOCOMPLETE_SCENARIOS`, served at http://localhost:4200/qwik-parity/mat-autocomplete/
 * <scenario>). The Qwik side must render the same markup at
 * http://localhost:4173/mat-autocomplete/<scenario>/ inside its own `[data-parity-root]`. Every
 * fact below was captured live against the real Angular dev-app (not just read from source) —
 * see autocomplete.ts's own header for the structural/id/aria/filtering-mechanism notes (read it
 * first); this file's header focuses on interaction mechanics, timing, and the single-root
 * decision.
 *
 * ============================ ONE ROOT ONLY — VERIFIED LIVE ============================
 * Exactly like `mat-select` (see specs/material-select's header, which this reuses): the panel
 * never renders into `.cdk-overlay-container`. `MatAutocompleteTrigger` calls
 * `.withPopoverLocation('inline')` on its `FlexibleConnectedPositionStrategy`, so the overlay's
 * bounding-box host lands as a plain DOM sibling of `.mat-mdc-text-field-wrapper` — an extra
 * child of `<mat-form-field>` itself, fully inside `[data-parity-root]`. `.cdk-overlay-container`
 * is still created (the same cross-component Safari-measurement-workaround side effect select's
 * header documents) but stays permanently childless. See autocomplete.ts's header for the full
 * writeup, including the ONE genuine difference from select: autocomplete has NO first-open-vs-
 * later-open quirk (verified by opening/closing the same field 3+ times — the popover lands
 * inside `<mat-form-field>` from the very first open, every time, because the connected element
 * is resolved by a plain synchronous method call, not a template binding that lags a CD cycle
 * behind). Every scenario below therefore has exactly ONE `test()`, against the default
 * `[data-parity-root]` root.
 *
 * ============================ NO EXIT ANIMATION — VERIFIED LIVE ============================
 * Unlike `mat-select` (`mat-select-panel-exit`, 200ms) and `mat-menu`
 * (`mat-menu-panel-animating`), `MatAutocompleteTrigger.closePanel()` (autocomplete-trigger.ts)
 * calls `this._overlayRef.detach()` SYNCHRONOUSLY, with no `animationend`/fallback-timer wait and
 * no transient "closing" class — confirmed live, every close below (Enter, Escape, Tab, an
 * option click, an outside click) removes the panel from the DOM immediately. There is
 * consequently no panel-count-polling helper in this file (contrast with select's/menu's specs);
 * the harness's own two-animation-frame `settle()` after every step is enough.
 *
 * ============================ FORM-FIELD TIMING, REUSED VERBATIM ============================
 * Every `<mat-form-field>` below runs with Angular's default animations (the dev-app's default),
 * so it gains `mat-form-field-animations-enabled` on its host ~300ms after `ngAfterViewInit` —
 * see material-form-field's spec header for the full writeup (`ANIMATIONS-ENABLED`/`LINE-RIPPLE`
 * sections). This file reuses that spec's exact `settle` step (wait for the class on every field
 * before doing anything else) and `waitForLineRippleSettled` helper (wait out the fill
 * appearance's ~180ms line-ripple deactivation transition after a step that blurs the input —
 * Tab, or an outside click) verbatim, so a step that blurs the field never races a transition
 * that has nothing to do with autocomplete's own contract.
 *
 * ============ LABEL FLOAT AFTER CLOSE — SEE autocomplete.ts's LABEL-FLOATING NOTE ============
 * `_floatLabel()`/`_resetLabel()` force-then-release the form field's `floatLabel` override
 * across an open/close cycle, but the label's actual floated state after release still follows
 * the ordinary "focused or non-empty" rule. Closing via Enter/Escape/an-option-click never blurs
 * the input (confirmed live — clicking a `<mat-option>`, which carries no `tabindex`, never
 * steals focus from it in the first place, so `MatAutocompleteTrigger`'s explicit
 * `this._element.nativeElement.focus()` call after a selection is a no-op in practice here), so
 * the label stays floated through those closes whenever the value is non-empty. Only Tab and the
 * outside-click close (both genuinely move focus to `<body>`/elsewhere) can visibly unfloat it,
 * and only when the value is ALSO empty at that point — see `require-selection`'s last step.
 *
 * Per-scenario render contract (see autocomplete.ts for the full structural/id/aria detail):
 *
 * - `basic-filter`: fill appearance, label "Fruit", 4 plain-string options (Apple/Banana/Cherry/
 *   Date) filtered synchronously (`includes`, case-insensitive) from a component-level array —
 *   deliberately the same 4-item fruit list select.ts's `fill-basic` uses. The single most
 *   thorough scenario: click opens with the full unfiltered list; typing "a" filters live to
 *   Apple/Banana/Date (Cherry has no "a") — CONFIRMED LIVE option ids stay stable across the
 *   refilter (Apple=`mat-option-0`, Banana=`mat-option-1`, Date=`mat-option-3`, Cherry's
 *   `mat-option-2` simply absent) because `@for (… track fruit)` reuses the same `MatOption`
 *   instance for a string that survives the filter; ArrowDown×2 moves the active item
 *   Apple→Banana (confirmed via `mat-mdc-option-active` + `aria-activedescendant`); Enter selects
 *   Banana, writes it to the input, and closes (no exit animation, see file header); clicking the
 *   input again reopens, refiltering on the now-current value "Banana" — CONFIRMED LIVE this
 *   leaves exactly one option, carrying `mdc-list-item--selected`, `aria-selected="true"`, AND a
 *   trailing minimal `<mat-pseudo-checkbox>` (selected + single-selection + default
 *   `hideSingleSelectionIndicator=false` — contrast with the dedicated scenario below); Escape
 *   closes, leaving the value and focus untouched.
 * - `optgroups`: fill, label "Produce", two `<mat-optgroup>`s — "Fruits" (Apple, Banana) and
 *   "Vegetables" (Carrot, Celery), deliberately chosen so NEITHER Fruits item contains "c" while
 *   BOTH Vegetables items do. Steps: click opens with both groups intact (`role="group"
 *   aria-disabled="false" aria-labelledby="mat-optgroup-label-N"` on each, confirmed live —
 *   `inertGroups` is Safari-only and this harness runs Chromium, so the groups are never put in
 *   the VoiceOver-workaround inert mode select.ts also never exercises); typing "c" — CONFIRMED
 *   LIVE — removes the ENTIRE "Fruits" `<mat-optgroup>` from the DOM (not just its options; the
 *   component's own filter method drops any group whose filtered item list is empty, same
 *   pattern as upstream's `autocomplete-demo.ts filterStateGroups`), leaving only "Vegetables"
 *   with both Carrot and Celery; clicking "Carrot" selects it and closes; clicking the input
 *   again reopens (refilters on "Carrot" → just Vegetables/Carrot); Tab closes — CONFIRMED LIVE
 *   this blurs the input (`document.activeElement` becomes `<body>`), exercising the
 *   line-ripple-settle wait (see file header) even though the value stays non-empty so the label
 *   itself stays floated.
 * - `auto-active-first-option`: fill, label "Number", `[autoActiveFirstOption]="true"`, 3 plain
 *   options (One/Two/Three) — same list upstream's own `autocomplete-auto-active-first-option-
 *   example` uses. CONFIRMED LIVE: clicking the input opens with the FULL list and the FIRST
 *   option ("One") already carrying `mat-mdc-option-active`/`aria-activedescendant` from the very
 *   first render, with no ArrowDown needed (contrast with `basic-filter`, which starts with no
 *   active option at all); typing "t" filters to Two/Three and re-activates the new first match
 *   ("Two") the same way; Enter immediately selects the active option ("Two") without any arrow
 *   key ever being pressed, closing the panel.
 * - `require-selection`: fill, label "Number", `[requireSelection]="true"`, 5 plain options (One
 *   .. Five, upstream's own `autocomplete-require-selection-example` list) filtered from a raw
 *   `(input)` handler, NOT `(ngModelChange)` — see autocomplete.ts's CRITICAL GOTCHA note for
 *   why. Steps: click opens with the full list; typing "tw" filters to just "Two" (the only
 *   option whose lowercase form starts with "tw"); clicking "Two" selects it and closes; clicking
 *   the input again reopens, refiltering on "Two" (one option, selected+highlighted exactly like
 *   `basic-filter`'s reopen); replacing the text with "zzz" (`.fill`, matching material-form-
 *   field's own `typeInto` convention for whole-value replacement) — CONFIRMED LIVE this filters
 *   to ZERO options, and the panel element stays in the DOM (still attached) but loses
 *   `mat-mdc-autocomplete-visible` and gains `mat-mdc-autocomplete-hidden` (`showPanel` tracks
 *   `!!options.length`, only a CSS-level hide, not a detach) and `aria-expanded` on the input
 *   flips back to `"false"`; clicking the "Value:" `<p>` below the field (a neutral element,
 *   outside the form field and the panel) is a genuine outside click — CONFIRMED LIVE this is the
 *   `requireSelection` reset path firing (`value ("zzz") !== valueOnAttach ("Two")`): the input is
 *   cleared back to `""`, the now-fully-empty+hidden panel is detached (removed from the DOM —
 *   confirmed `panelExists` goes from `true` to `false` across this one step), and — because the
 *   click also genuinely blurred the input (`document.activeElement` → `<body>`) while the value
 *   is now empty — the label visibly unfloats (see file header's LABEL FLOAT note; this is the
 *   one step across every scenario here where that actually happens).
 * - `display-with`: fill, label "Assignee", `[displayWith]="displayFn"`, 3 `{name: string}`
 *   object-valued options (Mary/Shelley/Igor — upstream's own `autocomplete-display-example`
 *   list; only Mary contains "m"). No `<p>Value: …}` paragraph below the field (interpolating an
 *   object value directly would print `[object Object]`, not useful here and not needed since no
 *   step clicks outside this scenario). Steps: click opens with the full list of names (option
 *   text comes from `{{ user.name }}`, the SAME string `displayFn` would also produce); typing
 *   "m" filters to just "Mary" (filtering reads `val.name` when the current value is already an
 *   object, `val` itself when it's still a plain string — mirrors upstream's own
 *   `AutocompleteDisplayExample._filter`); ArrowDown then Enter selects it — CONFIRMED LIVE the
 *   input's `.value` becomes the plain string `"Mary"` (via `displayFn`), even though the
 *   underlying model value `MatOption.value` is the ORIGINAL object `{name: 'Mary'}`, not a
 *   string — the Qwik port must likewise keep the input's native `.value` as the *display*
 *   string while whatever it tracks internally as "the value" stays the richer object.
 * - `disabled-option`: fill, label "Fruit", 4 plain options (Apple/Banana[disabled]/Cherry/Date),
 *   no filtering at all (static list, isolates just the disabled-option mechanics — same
 *   "isolate one concern" approach as checkbox.ts's dedicated scenarios). CONFIRMED LIVE, a real
 *   difference from `mat-select`'s closed-vs-open skip-predicate asymmetry (see select.ts's
 *   DISABLED OPTIONS note): `MatAutocomplete`'s `_skipPredicate` is unconditionally `false`, so
 *   ArrowDown×2 from a fresh open moves straight through Apple onto the disabled Banana
 *   (`mat-mdc-option-active` + `aria-activedescendant` both land on it, confirmed), with no
 *   "closed" state making it any less reachable. Clicking the now-active, disabled Banana option
 *   directly (`{force: true}` — Playwright's own actionability check refuses a plain `.click()`
 *   on an element carrying `aria-disabled="true"`, same accepted exception select.ts's `disabled`
 *   scenario documents) is confirmed to be a genuine no-op: `MatOption._selectViaInteraction()`
 *   guards on `!this.disabled` and returns before emitting anything, so the input's value stays
 *   empty and the panel stays fully open (the click landed inside the panel, so it isn't an
 *   "outside click" closing it either); Escape then closes normally.
 * - `panel-width`: fill, label "Fruit", `[panelWidth]="'500px'"` against the usual 300px-wide
 *   field, same 4-item fruit list as `basic-filter`, filtered the same way (typing is not
 *   exercised here, only the geometry). Step: click opens — CONFIRMED LIVE `.cdk-overlay-pane`
 *   measures exactly `width: 500px` (not 300px, the field's own width, which is what every OTHER
 *   scenario's pane matches since none of them set `panelWidth`); Escape closes.
 * - `hide-single-selection-indicator`: fill, label "Fruit", `[hideSingleSelectionIndicator]=
 *   "true"`, same 4-item fruit list/filter as `basic-filter` — deliberately the closest possible
 *   pairing with that scenario so the ONE difference is isolated. Steps: click opens with the
 *   full list; typing "a" filters to Apple/Banana/Date; clicking "Apple" selects it and closes;
 *   clicking the input again reopens, refiltering on "Apple" down to one option — CONFIRMED LIVE
 *   it still carries `mdc-list-item--selected`/`aria-selected="true"`, but — unlike
 *   `basic-filter`'s otherwise-identical reopen step — carries NO `<mat-pseudo-checkbox>` at all
 *   (the trailing minimal checkmark is specifically what `hideSingleSelectionIndicator` suppresses;
 *   there is no LEADING pseudo-checkbox to suppress instead, since `mat-autocomplete` has no
 *   multiple-selection mode — see autocomplete.ts's NO MULTIPLE-SELECTION MODE note); Escape
 *   closes.
 */

const route = 'mat-autocomplete';

/** Every scenario has exactly one `matAutocomplete` input inside `[data-parity-root]`. */
const input = (page: Page) => page.locator('[data-parity-root] input').first();

/**
 * Waits for the one-time, time-delayed `.mat-form-field-animations-enabled` class (see the file
 * header's FORM-FIELD TIMING section) on the field, so the first comparison isn't racing that
 * timer — reused verbatim from material-form-field's spec.
 */
const settle: ParityStep = {
  name: 'settle (post-init animation class)',
  run: async (page: Page) => {
    await page.waitForFunction(
      () =>
        document
          .querySelector('[data-parity-root] .mat-mdc-form-field')
          ?.classList.contains('mat-form-field-animations-enabled') ?? false,
      undefined,
      {timeout: 3000},
    );
  },
};

/**
 * Waits out the fill appearance's line-ripple deactivation transition (~180ms, only runs once
 * the field has been focused-then-blurred) — reused verbatim from material-form-field's spec.
 * Only matters for the steps below that genuinely move focus away (Tab, outside click); a no-op
 * otherwise.
 */
const waitForLineRippleSettled = (page: Page) =>
  page.waitForFunction(
    () =>
      !document.querySelector(
        '[data-parity-root] .mdc-line-ripple--active.mdc-line-ripple--deactivating',
      ),
    undefined,
    {timeout: 2000},
  );

/** Clicks the input, opening the panel (focusin opens it whenever the field can open). */
const open: ParityStep = {
  name: 'click input (open)',
  run: async (page: Page) => {
    await input(page).click();
    await page.waitForTimeout(150);
  },
};

/** Replaces the input's value wholesale (matches material-form-field's own `typeInto`
 * convention for whole-value replacement) and lets the synchronous component-level filter run. */
const typeInto = (text: string): ParityStep => ({
  name: `type "${text}"`,
  run: async (page: Page) => {
    await input(page).fill(text);
    await page.waitForTimeout(150);
  },
});

/** A navigation key (ArrowDown/Up) that only moves the active option — synchronous, no panel
 * attach/detach, no debounce. */
const nav = (key: string): ParityStep => ({
  name: `press ${key} (nav)`,
  run: (page: Page) => page.keyboard.press(key),
});

/** Enter/Escape — both close synchronously (see file header's NO EXIT ANIMATION section) without
 * blurring the input, so no extra wait beyond the harness's own settle is needed. */
const keyTo = (key: string): ParityStep => ({
  name: `press ${key}`,
  run: async (page: Page) => {
    await page.keyboard.press(key);
    await page.waitForTimeout(150);
  },
});

/** Tab away: closes AND genuinely blurs the input, so the line-ripple transition must be waited
 * out (see file header). */
const tabClose: ParityStep = {
  name: 'press Tab',
  run: async (page: Page) => {
    await page.keyboard.press('Tab');
    await waitForLineRippleSettled(page);
    await page.waitForTimeout(150);
  },
};

/** Clicks an open option by its accessible name. `force` is needed for a disabled option only
 * (Playwright's actionability check refuses a plain click on `aria-disabled="true"`). */
const clickOption = (name: string, force = false): ParityStep => ({
  name: `click option "${name}"`,
  run: async (page: Page) => {
    await page.getByRole('option', {name, exact: true}).click({force});
    await page.waitForTimeout(150);
  },
});

/** Clicks the "Value: …" paragraph below the field — a neutral element outside the form field
 * and the panel, and (for `require-selection`) a genuine blur. */
const clickOutside: ParityStep = {
  name: 'click outside (the Value paragraph)',
  run: async (page: Page) => {
    await page.locator('[data-parity-root] p').click();
    await waitForLineRippleSettled(page);
    await page.waitForTimeout(200);
  },
};

test.describe('mat-autocomplete — Angular DOM parity', () => {
  test('basic-filter', ({browser}) =>
    expectMaterialParity(browser, {
      pinRoot: true,
      route,
      scenario: 'basic-filter',
      steps: [
        settle,
        open,
        typeInto('a'),
        nav('ArrowDown'),
        nav('ArrowDown'),
        keyTo('Enter'), // selects Banana, closes
        open, // reopen: refilters on "Banana"
        keyTo('Escape'),
      ],
    }));

  test('optgroups', ({browser}) =>
    expectMaterialParity(browser, {
      pinRoot: true,
      route,
      scenario: 'optgroups',
      steps: [
        settle,
        open,
        typeInto('c'), // "Fruits" group vanishes entirely
        clickOption('Carrot'), // selects, closes
        open, // reopen: refilters on "Carrot"
        tabClose,
      ],
    }));

  test('auto-active-first-option', ({browser}) =>
    expectMaterialParity(browser, {
      pinRoot: true,
      route,
      scenario: 'auto-active-first-option',
      steps: [
        settle,
        open, // "One" auto-active, no ArrowDown needed
        typeInto('t'), // filtered to Two/Three, "Two" auto-active
        keyTo('Enter'), // selects "Two" directly
      ],
    }));

  test('require-selection', ({browser}) =>
    expectMaterialParity(browser, {
      pinRoot: true,
      route,
      scenario: 'require-selection',
      steps: [
        settle,
        open,
        typeInto('tw'), // filters to just "Two"
        clickOption('Two'), // selects, closes
        open, // reopen: refilters on "Two"
        typeInto('zzz'), // no match: panel stays attached, hidden via CSS class
        clickOutside, // requireSelection reset: value -> "", panel detaches, label unfloats
      ],
    }));

  test('display-with', ({browser}) =>
    expectMaterialParity(browser, {
      pinRoot: true,
      route,
      scenario: 'display-with',
      steps: [
        settle,
        open,
        typeInto('m'), // filters to just "Mary"
        nav('ArrowDown'),
        keyTo('Enter'), // selects the Mary object; input shows "Mary" via displayWith
      ],
    }));

  test('disabled-option', ({browser}) =>
    expectMaterialParity(browser, {
      pinRoot: true,
      route,
      scenario: 'disabled-option',
      steps: [
        settle,
        open,
        nav('ArrowDown'), // -> Apple
        nav('ArrowDown'), // -> Banana (disabled, still reachable — no skip predicate at all)
        clickOption('Banana', true), // force-click: guarded no-op, panel stays open
        keyTo('Escape'),
      ],
    }));

  test('panel-width', ({browser}) =>
    expectMaterialParity(browser, {
      pinRoot: true,
      route,
      scenario: 'panel-width',
      steps: [settle, open, keyTo('Escape')],
    }));

  test('hide-single-selection-indicator', ({browser}) =>
    expectMaterialParity(browser, {
      pinRoot: true,
      route,
      scenario: 'hide-single-selection-indicator',
      steps: [
        settle,
        open,
        typeInto('a'),
        clickOption('Apple'), // selects, closes
        open, // reopen: refilters on "Apple" -- no trailing pseudo-checkbox this time
        keyTo('Escape'),
      ],
    }));
});
