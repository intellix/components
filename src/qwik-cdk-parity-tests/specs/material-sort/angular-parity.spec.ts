import {test, type Page} from '@playwright/test';
import {expectMaterialParity, type ParityStep} from '../../lib/material-parity.js';

/**
 * mat-sort (matSort directive + mat-sort-header) — Angular DOM parity.
 *
 * Source of truth for every scenario: src/dev-app/qwik-parity/sort.ts (exports
 * `SORT_SCENARIOS`, served at http://localhost:4200/qwik-parity/mat-sort/<scenario>). The Qwik
 * side must render the same markup at http://localhost:4173/mat-sort/<scenario>/ inside its own
 * `[data-parity-root]`. Every scenario is a plain `<table matSort>` with two `<th
 * mat-sort-header="...">` columns in one `<tr>` (no `<tbody>`, no mat-table/cdk-table — matSort
 * does not depend on either), followed by a `<p>Sort: {{ active }} {{ direction }}</p>` fed by
 * `(matSortChange)`.
 *
 * Shared skeleton every scenario renders (see src/material/sort/sort.ts host bindings and
 * src/material/sort/sort-header.html/.ts) — only the parts a given scenario's inputs change are
 * called out per-scenario below:
 *
 *   <table matsort="" class="mat-sort">
 *     <tr>
 *       <th mat-sort-header="<id>" class="mat-sort-header [mat-sort-header-disabled]"
 *           aria-sort="none|ascending|descending">
 *         <div class="mat-sort-header-container mat-focus-indicator
 *                     [mat-sort-header-position-before] [mat-sort-header-sorted]
 *                     [mat-sort-header-ascending] [mat-sort-header-descending]
 *                     [mat-sort-header-recently-cleared-ascending|-descending]"
 *              aria-describedby="cdk-describedby-message-#" cdk-describedby-host="#"
 *              [tabindex="0" role="button"]>            (absent entirely when disabled)
 *           <div class="mat-sort-header-content">...ng-content...</div>
 *           <div class="mat-sort-header-arrow">          (omitted — see _renderArrow below)
 *             <svg viewBox="0 -960 960 960" focusable="false" aria-hidden="true"><path d="…"/></svg>
 *           </div>
 *         </div>
 *       </th>
 *       ...second <th>...
 *     </tr>
 *   </table>
 *   <p>Sort: {{ active }} {{ direction }}</p>
 *
 * Note: `<table matSort>` and `<th mat-sort-header="name">` are written in sort.ts the way real
 * consumers write them — as plain, static, consumer-chosen attributes (matching
 * sort-overview-example.html / table-demo.html upstream), NOT `[matSort]`/`[mat-sort-header]`
 * bindings — because `mat-sort-header`'s value doubles as the column id and there is no other
 * ergonomic way to set it. Angular lowercases the bare directive-selector attribute in the
 * rendered DOM: it is `matsort=""`, not `matSort=""`. Both `matsort` and `mat-sort-header` are
 * therefore consumer-written selector attributes in the same category as `matFab`/`mat-badge`
 * etc., but neither is currently in the harness's `CONSUMER_SELECTOR_ATTRS` list
 * (lib/material-parity.ts) — ADD THEM THERE (not done by this change; see report) or every
 * scenario's comparison will fail on these two attributes alone. All other inputs below
 * (`matSortActive`, `disabled`, `arrowPosition`, etc.) are bound with `[prop]="…"` and leave no
 * attribute residue, confirmed live (no `matsortactive`/`matsortdirection`/… attribute ever
 * appears on `<table>`).
 *
 * Key, easy-to-miss behaviors — each verified against the live Angular dev-app, not just read
 * from source:
 *
 * 1. **Default `aria-describedby` on every header.** `sortActionDescription` defaults to
 *    `'Sort'` and is applied via `AriaDescriber` unconditionally in `ngOnInit` — so EVERY
 *    `mat-sort-header`, in every scenario, always carries an `aria-describedby` on its
 *    `.mat-sort-header-container` pointing at a `cdk-describedby-message-<APP_ID>-<n>` id,
 *    plus the ignored `cdk-describedby-host` bookkeeping attribute. The actual message text
 *    node AriaDescriber injects lives in `<body>`, outside `[data-parity-root]` — only the
 *    `aria-describedby` attribute itself is in the compared subtree, and the harness already
 *    normalizes any `cdk-describedby-message-*` token to the bare prefix (see
 *    `material-parity.ts`). Two headers with the SAME description text share the exact same
 *    message id (confirmed live: both default-text headers in `basic` read
 *    `aria-describedby="cdk-describedby-message-ng-1-14"`); different text gets a different id.
 *    Either way the normalized value is indistinguishable, so `sort-action-description` below
 *    is a demonstration that the attribute is present and well-formed, not a structural proof
 *    that the text differs.
 * 2. **The direction classes are shared, not per-header.** `mat-sort-header-ascending` /
 *    `-descending` on `.mat-sort-header-container` are bound to `_sort.direction === 'asc'/
 *    'desc'` — the containing `MatSort`'s CURRENT direction — not to whether THIS header is the
 *    active one. Confirmed live: sorting header A to `asc` also puts
 *    `mat-sort-header-ascending` on header B's container even though B's `aria-sort` stays
 *    `"none"` and B never gets `mat-sort-header-sorted`. Only `mat-sort-header-sorted` (and
 *    `aria-sort`) are actually scoped to the active header (`_isSorted()` checks `active == id`
 *    AND direction).
 * 3. **`mat-sort-header-recently-cleared-ascending`/`-descending` is sticky, not time-based.**
 *    When a click/keypress moves the ACTIVE header from sorted (asc or desc) straight to
 *    cleared (`''`), `_toggleOnInteraction` sets this class (named after the direction that was
 *    just cleared) on the container. Unlike checkbox's `mdc-checkbox--anim-*` (removed by a
 *    fixed 1s `setTimeout`), there is NO timer here — confirmed live, the class is still
 *    present after a 2-second wait with no further interaction. It only clears when
 *    `FocusMonitor` reports a focus-origin change on the header (tabbing/clicking away — even
 *    to a DIFFERENT header — blurs it) OR the host's `(mouseleave)` fires. Practical
 *    consequence: no `waitForFunction`-style polling is needed in this spec (contrast
 *    checkbox's `waitForTransitionClassToClear`) — the class is deterministic given a fixed
 *    step sequence, so steps below simply include the next interaction that clears it.
 * 4. **`FocusMonitor` on the `<th>` host behaves like every other monitored Material
 *    component** — adds `cdk-focused` + one of `cdk-mouse-focused`/`cdk-keyboard-focused`/
 *    `cdk-program-focused` — BUT only fires when something inside the header is actually
 *    focused. A DISABLED header's `.mat-sort-header-container` has NO `tabindex` at all
 *    (`[attr.tabindex]="_isDisabled() ? null : 0"` — `null` removes the attribute, it is not
 *    `-1`), so nothing inside it is focusable and a forced click never produces a focus event —
 *    confirmed live: no `cdk-focused` class ever appears on a disabled header, in contrast to
 *    `mat-expansion-panel-header`, which keeps `tabindex="-1"` while disabled and so DOES still
 *    pick up focus classes (see the expansion parity spec). A Tab traversal skips a disabled
 *    header entirely and lands on the next focusable one (confirmed live).
 * 5. **`_renderArrow()` is `!disabled || isSorted`.** A disabled header that is NOT the active
 *    sorted column renders no `.mat-sort-header-arrow` element at all (not just hidden via
 *    CSS — the node is absent). A disabled header that IS the active sorted column still
 *    renders its arrow (`isSorted` wins) — see `disabled-sort`.
 * 6. **Two independent disable switches** drive the exact same `_isDisabled()` logic (`this.
 *    _sort.disabled || this.disabled`): the per-header `[disabled]` input (`disabled-header`)
 *    and the sort-wide `[matSortDisabled]` input (`disabled-sort`), which disables every header
 *    at once.
 * 7. **No `id` attribute reflection.** Unlike `mat-mdc-checkbox` etc., `MatSortHeader` never
 *    writes an `id` onto its host or container — the `mat-sort-header="<id>"` VALUE is only
 *    used internally to register with `MatSort`/key the active-column comparison, never
 *    reflected as a DOM `id`.
 * 8. **Animations.** `MatSortHeader` reads `_animationsDisabled()` and would add
 *    `mat-sort-header-animations-disabled` to the container when animations are off — none of
 *    these scenarios opt out (dev-app default is animations-enabled, same as checkbox/
 *    expansion), so that class never appears below; the Qwik port must still implement the
 *    check rather than hard-coding it absent.
 *
 * Per-scenario render contract (ids always `"name"` / `"population"`, labels always "Name" /
 * "Population" unless noted):
 *
 * - **basic**: `<table matSort (matSortChange)="sort = $event">`, no active/direction bound —
 *   both headers start `aria-sort="none"`, neither container has any direction/sorted class.
 *   `<p>Sort:  </p>` (both interpolations empty, two spaces). Steps: Tab from a sentinel placed
 *   just before the root into header 0 (container has no competing earlier tabbable, so Tab
 *   lands directly on it) → `cdk-focused cdk-keyboard-focused` on header 0, no sort change yet;
 *   press Enter → header 0 sorts `asc` (`mat-sort-header-sorted mat-sort-header-ascending`,
 *   `aria-sort="ascending"`, header 1's container also gains `mat-sort-header-ascending` per
 *   behavior #2, "Sort: name asc"); press Enter → `desc`; press Enter → cleared (`aria-sort`
 *   back to `"none"`, container now `mat-sort-header-recently-cleared-descending`, "Sort: name
 *   ") — the keyboard-focused classes on header 0 are unaffected by this, confirming the
 *   "cleared" class is NOT removed merely by the state changing; click header 1 with the mouse
 *   (force) → header 0 loses BOTH its `cdk-focused cdk-keyboard-focused` classes AND its
 *   `recently-cleared-descending` class (FocusMonitor fires because focus actually moves to
 *   header 1), header 1 gains `cdk-focused cdk-mouse-focused mat-sort-header-sorted
 *   mat-sort-header-ascending`, "Sort: population asc"; press Space (header 1 still focused) →
 *   header 1 cycles to `desc`, "Sort: population desc" (Space uses the same keydown handler as
 *   Enter and does not change the recorded focus origin, so `cdk-mouse-focused` stays, not
 *   `cdk-keyboard-focused`).
 * - **initial-active-direction**: `[matSortActive]="'population'" [matSortDirection]="'desc'"`.
 *   Initial: header "population" `aria-sort="descending"`, its container
 *   `mat-sort-header-sorted mat-sort-header-descending`; header "name"'s container ALSO has
 *   `mat-sort-header-descending` (behavior #2) despite `aria-sort="none"`. "Sort: population
 *   desc". Steps: click header "population" (force) → because nothing has an explicit `start`
 *   override, the cycle is `['asc','desc','']` and current direction `desc` is index 1, so the
 *   NEXT click goes straight to `''` (NOT through `asc`) — cleared,
 *   `mat-sort-header-recently-cleared-descending`, "Sort: population "; click "population"
 *   again → cleared wraps back to index 0 → `asc`, "Sort: population asc" (recently-cleared
 *   class gone, replaced by `mat-sort-header-sorted mat-sort-header-ascending`).
 * - **start-desc**: `[matSortStart]="'desc'"` on the table, nothing sorted initially (plain
 *   `aria-sort="none"` both headers, "Sort:  "). Steps: click header "name" (force) → first
 *   sort on this column picks up the table's `start` → `desc` directly (never `asc` first),
 *   "Sort: name desc"; click again → cycle for `start='desc'` is `['desc','asc','']`, so next is
 *   `asc`, "Sort: name asc"; click again → cleared →
 *   `mat-sort-header-recently-cleared-ascending` (the OTHER keyframe/class vs. the two scenarios
 *   above, since this time it was `asc` that got cleared), "Sort: name ".
 * - **disable-clear**: `[matSortDisableClear]="true"`. Steps: click header "name" (force) three
 *   times → `asc`, `desc`, `asc` — the cycle never includes `''`, so
 *   `mat-sort-header-recently-cleared-*` never appears and `aria-sort` never returns to
 *   `"none"` once first sorted.
 * - **disabled-header**: header "name" has `[disabled]="true"`; header "population" is a plain
 *   enabled header. Initial: "name" has class `mat-sort-header-disabled`, its container has
 *   NO `tabindex`, NO `role`, and NO `.mat-sort-header-arrow` child at all (behavior #5 — it is
 *   neither disabled-but-sorted nor enabled); "population" renders normally (arrow present,
 *   `tabindex="0"`, `role="button"`). Both start `aria-sort="none"`, "Sort:  ". Steps:
 *   force-click header "name" → completely no-op — no DOM change at all, confirmed NO
 *   `cdk-focused` class appears (behavior #4, contrast with expansion's disabled header); Tab
 *   from a sentinel before the root → skips "name" entirely, lands keyboard-focus directly on
 *   "population" (`cdk-focused cdk-keyboard-focused`); press Enter → "population" sorts `asc`,
 *   "Sort: population asc" ("name" still fully inert throughout, never gains direction classes
 *   since it's never the active header in this scenario).
 * - **disabled-sort**: `[matSortDisabled]="true"` on the table, PLUS
 *   `[matSortActive]="'name'" [matSortDirection]="'asc'"` so one column starts pre-sorted while
 *   everything is disabled. Initial: BOTH headers get `mat-sort-header-disabled` and neither
 *   container has `tabindex`/`role`. "name" (the pre-sorted, disabled column) still renders its
 *   arrow and keeps `aria-sort="ascending"` / `mat-sort-header-sorted mat-sort-header-ascending`
 *   (behavior #5 — `isSorted` overrides `disabled` for arrow rendering); "population" (disabled,
 *   unsorted) renders NO arrow, `aria-sort="none"`, its container only gets the shared
 *   `mat-sort-header-ascending` class (behavior #2). "Sort: name asc". Steps: force-click "name"
 *   (the sorted+disabled header) → no-op, no DOM change, no focus classes; force-click
 *   "population" (the unsorted+disabled header) → likewise no-op — proves `matSortDisabled`
 *   blocks `_toggleOnInteraction` regardless of a column's own `disabled`/sorted state.
 * - **arrow-position-before**: header "name" has `[arrowPosition]="'before'"`; header
 *   "population" uses the default (`'after'`, no extra class). Initial: "name"'s container has
 *   `mat-sort-header-position-before` (pure CSS flex-reversal — the arrow `<div>` itself is
 *   still rendered, same DOM node, same position in markup) in addition to the normal
 *   unsorted/no-class state elsewhere; "Sort:  ". Steps: click "name" (force) → sorts `asc`,
 *   `mat-sort-header-position-before` persists alongside the new `mat-sort-header-sorted
 *   mat-sort-header-ascending` classes (confirmed live they coexist without conflict), "Sort:
 *   name asc"; click again → `desc`, position-before class still present, "Sort: name desc".
 * - **sort-action-description**: header "name" has `[sortActionDescription]="'Sort by name'"`;
 *   header "population" keeps the library default (`'Sort'`). Both still carry an
 *   `aria-describedby` (behavior #1) — "name"'s points at its own, differently-texted message
 *   (confirmed live: a DIFFERENT raw id than "population"'s, though both normalize to the same
 *   bare `cdk-describedby-message` token, so this is not a structural assertion of the text
 *   itself). "Sort:  " initially. Steps: click "name" (force) → sorts `asc`,
 *   `aria-describedby` unchanged, "Sort: name asc"; click "population" (force) → "population"
 *   sorts `asc` too (becomes the new active header; "name" reverts to just the shared
 *   `mat-sort-header-ascending` class per behavior #2, loses `mat-sort-header-sorted`), "Sort:
 *   population asc" — both headers' `aria-describedby` values are completely unaffected by
 *   sorting either way.
 */

const route = 'mat-sort';

/** Scopes to this scenario's headers so dev-app chrome elsewhere is never hit. */
const header = (page: Page, index: number) =>
  page.locator('[data-parity-root] th[mat-sort-header]').nth(index);

const clickHeader = (index: number): ParityStep => ({
  name: `click header ${index}`,
  run: async (page: Page) => {
    await header(page, index).click({force: true});
  },
});

const pressKey = (key: string): ParityStep => ({
  name: `press ${key}`,
  run: async (page: Page) => {
    await page.keyboard.press(key);
  },
});

/** Tabs into the first focusable header from a sentinel placed just before the parity root (the
 * dev-app chrome differs between the two apps, so natural Tab order from the top differs). */
const tabIntoRoot: ParityStep = {
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

test.describe('mat-sort — Angular DOM parity', () => {
  test('basic', ({browser}) =>
    expectMaterialParity(browser, {
      route,
      scenario: 'basic',
      steps: [
        tabIntoRoot,
        pressKey('Enter'),
        pressKey('Enter'),
        pressKey('Enter'),
        clickHeader(1),
        pressKey('Space'),
      ],
    }));

  test('initial-active-direction', ({browser}) =>
    expectMaterialParity(browser, {
      route,
      scenario: 'initial-active-direction',
      steps: [clickHeader(1), clickHeader(1)],
    }));

  test('start-desc', ({browser}) =>
    expectMaterialParity(browser, {
      route,
      scenario: 'start-desc',
      steps: [clickHeader(0), clickHeader(0), clickHeader(0)],
    }));

  test('disable-clear', ({browser}) =>
    expectMaterialParity(browser, {
      route,
      scenario: 'disable-clear',
      steps: [clickHeader(0), clickHeader(0), clickHeader(0)],
    }));

  test('disabled-header', ({browser}) =>
    expectMaterialParity(browser, {
      route,
      scenario: 'disabled-header',
      steps: [clickHeader(0), tabIntoRoot, pressKey('Enter')],
    }));

  test('disabled-sort', ({browser}) =>
    expectMaterialParity(browser, {
      route,
      scenario: 'disabled-sort',
      steps: [clickHeader(0), clickHeader(1)],
    }));

  test('arrow-position-before', ({browser}) =>
    expectMaterialParity(browser, {
      route,
      scenario: 'arrow-position-before',
      steps: [clickHeader(0), clickHeader(0)],
    }));

  test('sort-action-description', ({browser}) =>
    expectMaterialParity(browser, {
      route,
      scenario: 'sort-action-description',
      steps: [clickHeader(0), clickHeader(1)],
    }));
});
