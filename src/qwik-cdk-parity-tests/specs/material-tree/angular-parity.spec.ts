import {test, type Page} from '@playwright/test';
import {expectMaterialParity, type ParityStep} from '../../lib/material-parity.js';

const route = 'mat-tree';

/**
 * mat-tree — Angular DOM parity.
 *
 * Source of truth for every scenario: src/dev-app/qwik-parity/tree.ts (exports
 * `TREE_SCENARIOS`, served at http://localhost:4200/qwik-parity/mat-tree/<scenario>). The Qwik
 * side must render the same markup at http://localhost:4173/mat-tree/<scenario>/ inside its own
 * `[data-parity-root]`. Read tree.ts's own header comment first — it has the full shared-DOM
 * skeleton and the live-verified, non-obvious behaviors referenced below by name; this file only
 * adds the Playwright step mechanics and the per-scenario expected end-states.
 *
 * All scenarios use the CURRENT, recommended `childrenAccessor` API (not the deprecated
 * `treeControl`). Toggle controls are plain `<button type="button">` elements with text content
 * (`[+]`/`[-]`), never `matIconButton`/`mat-icon` — this keeps the scenarios decoupled from the
 * button/icon components' own ripple/font-icon DOM.
 *
 * Shared skeleton, from src/material/tree/{tree,node,padding,toggle,outlet}.ts and
 * src/cdk/tree/{tree,node,nested-node,padding,toggle}.ts:
 *
 *   <mat-tree role="tree" class="mat-tree cdk-tree">
 *     <mat-tree-node role="treeitem" class="mat-tree-node cdk-tree-node"
 *         tabindex="0 on exactly one node (roving tabindex), -1 on the rest"
 *         aria-level="1-based depth" aria-posinset="1-based index among siblings"
 *         aria-setsize="sibling count" aria-expanded="omitted UNLESS isExpandable bound">
 *       <button mattreenodetoggle tabindex="-1">[+|-]</button>   (expandable nodes only)
 *       …
 *     </mat-tree-node>
 *     <!--ng-container-->  (anchor for matTreeNodeOutlet; harness ignores comments)
 *   </mat-tree>
 *
 * Non-obvious behaviors worth repeating here (see tree.ts for the full write-up and live
 * verification):
 *
 * - `isExpandable` must be explicitly bound (`[isExpandable]="true"`) for `aria-expanded` to
 *   appear at all — it is never inferred from `childrenAccessor` or from which `when` matched.
 * - Clicking (or Enter/Space-ing, see below) a `matTreeNodeToggle` element also calls
 *   `tree._keyManager.focusItem(node)` — moving the roving `tabindex="0"` to that node — even
 *   when the node is `isDisabled` (`_toggle()` never checks it).
 * - `isDisabled` adds NO visible attribute/class anywhere; it only (a) no-ops the node's own
 *   `(click)` handler, and (b) excludes it from keyboard-navigation and initial-focus search.
 * - Flat tree: a collapsed node's descendants are NOT in the DOM. Nested tree: the OPPOSITE — a
 *   `childrenAccessor` nested node's descendants are ALWAYS in the DOM, visibility is purely a
 *   consumer-authored CSS concern (these scenarios use `[style.display]` directly on a
 *   `role="group"` wrapper `<div>` holding `matTreeNodeOutlet`).
 * - **Critical**: `CdkTreeNodeToggle` binds `(keydown.Enter)`/`(keydown.Space)` to its own
 *   `_toggle()` (which `stopPropagation()`s). On a node that carries `matTreeNodeToggle` directly
 *   (every expandable node here), Enter/Space toggle expand/collapse and NEVER reach the tree's
 *   `activate()`/`(activation)` output. Only a node WITHOUT `matTreeNodeToggle` on itself (a leaf,
 *   here) lets Enter/Space bubble up to `<mat-tree>` and genuinely activate. See 'keyboard-nav'.
 *
 * Scenario-by-scenario (see tree.ts for the full, live-verified blow-by-blow):
 *
 * - **flat-basic**: flat tree, roots "Fruit"→[Apple, Banana] and "Vegetables"→[Leafy
 *   greens→[Spinach, Kale], Carrot]. All collapsed. Steps: click Fruit's toggle → expands
 *   (Apple/Banana inserted, `padding-left: 40px`, `aria-expanded`→`true`, button→`[-]`); click
 *   again → collapses back to the two roots.
 * - **flat-initially-expanded**: same shape, `Fruit.expanded = true` pre-expands it via
 *   `[isExpanded]`. Initial default-focused node (`tabindex="0"`) is **Apple**, not Fruit (a
 *   live-verified quirk of pre-expanding mid-render — see tree.ts). Steps: click Vegetables'
 *   toggle → expands it (steals roving tabindex too); click Fruit's toggle → collapses it (steals
 *   roving tabindex back onto Fruit).
 * - **nested-basic**: nested tree, same shape, `matTreeNodeOutlet` + `role="group"` wrapper divs.
 *   All collapsed — descendants already in the DOM under `style="display: none"`. Default focus
 *   is on Fruit. Steps: click Fruit's toggle → group's style becomes `style=""` (empty, NOT
 *   removed) and children become visible; click again → `style="display: none"` returns.
 * - **nested-initially-expanded**: same as 'nested-basic' plus `Fruit.expanded = true`. Fruit's
 *   group starts with NO `style` attribute at all (contrast 'nested-basic', where toggling FROM
 *   collapsed leaves an empty `style=""` behind — starting expanded never creates the attribute).
 *   Default focus is on Fruit itself. Steps: click Vegetables' toggle → `style=""` + steals
 *   focus; click Fruit's toggle → `style="display: none"` + steals focus back.
 * - **not-expandable**: flat tree, roots "Leaf" (no `isExpandable` bound at all — no
 *   `aria-expanded`, no toggle; literally "a node with isExpandable false"), "Branch"
 *   (expandable, one child), "Disabled branch" (expandable AND `isDisabled`, one child, toggle
 *   button deliberately has no native `disabled` attribute). Default focus: Leaf. Steps: click
 *   Branch's toggle → expands + steals focus from Leaf; click Disabled branch's toggle → ALSO
 *   expands + ALSO steals focus (onto the disabled node!) — the documented `isDisabled`-doesn't-
 *   guard-the-toggle quirk.
 * - **keyboard-nav**: flat tree, same Fruit/Vegetables shape, `(activation)` wired to a `<p>Last
 *   activated: …</p>`. 13 steps, run and verified in this exact order — see the numbered list in
 *   tree.ts's header comment for the full reasoning. Summary: Tab in (Fruit) → ArrowDown
 *   (Vegetables) → ArrowUp (Fruit) → ArrowRight (expand Fruit) → ArrowRight (focus first child
 *   Apple) → Enter (Apple is a leaf → genuinely activates → "Last activated: Apple") →
 *   ArrowDown (Banana) → Space (activates Banana) → ArrowLeft (leaf, not expanded → focus parent
 *   Fruit) → Enter on Fruit (expandable + has its own toggle → COLLAPSES instead of activating;
 *   "Last activated" stays "Banana") → End (last visible: Vegetables) → Home (first visible:
 *   Fruit) → `*` (expands every root sibling: Fruit AND Vegetables).
 * - **disabled-skipped**: flat tree, three leaf roots "Alpha", "Beta" (`isDisabled`), "Gamma", no
 *   toggles. Default focus: Alpha (Beta skipped). Steps: Tab in (Alpha) → ArrowDown (skips Beta →
 *   Gamma) → ArrowUp (skips Beta → Alpha) → click Beta directly (force) → no DOM change at all.
 */

const SETTLE_MS = 150;

const clickToggle = (label: string): ParityStep => ({
  name: `click toggle "${label}"`,
  run: async (page: Page) => {
    await page.locator(`button[aria-label="Toggle ${label}"]`).click();
    await page.waitForTimeout(SETTLE_MS);
  },
});

/** Clicks a node directly (not its toggle) — e.g. a disabled or leaf node body. */
const clickNodeText = (text: string): ParityStep => ({
  name: `click node "${text}"`,
  run: async (page: Page) => {
    await page
      .locator('mat-tree-node, mat-nested-tree-node', {hasText: text})
      .last()
      .click({force: true});
    await page.waitForTimeout(SETTLE_MS);
  },
});

const pressKey = (key: string): ParityStep => ({
  name: `press ${key}`,
  run: async (page: Page) => {
    await page.keyboard.press(key);
    await page.waitForTimeout(SETTLE_MS);
  },
});

/** Tabs into the tree from a sentinel placed just before the parity root (the dev-app chrome
 * differs between the two apps, so natural Tab order from the top of the page differs). */
const tabIntoTree: ParityStep = {
  name: 'Tab into tree',
  run: async (page: Page) => {
    await page.locator('[data-parity-root]').evaluate(root => {
      const sentinel = document.createElement('button');
      root.before(sentinel);
      sentinel.focus();
    });
    await page.keyboard.press('Tab');
    await page.waitForTimeout(SETTLE_MS);
  },
};

test.describe('mat-tree — Angular DOM parity', () => {
  test('flat-basic', ({browser}) =>
    expectMaterialParity(browser, {
      route,
      scenario: 'flat-basic',
      steps: [clickToggle('Fruit'), clickToggle('Fruit')],
    }));

  test('flat-initially-expanded', ({browser}) =>
    expectMaterialParity(browser, {
      route,
      scenario: 'flat-initially-expanded',
      steps: [clickToggle('Vegetables'), clickToggle('Fruit')],
    }));

  test('nested-basic', ({browser}) =>
    expectMaterialParity(browser, {
      route,
      scenario: 'nested-basic',
      steps: [clickToggle('Fruit'), clickToggle('Fruit')],
    }));

  test('nested-initially-expanded', ({browser}) =>
    expectMaterialParity(browser, {
      route,
      scenario: 'nested-initially-expanded',
      steps: [clickToggle('Vegetables'), clickToggle('Fruit')],
    }));

  test('not-expandable', ({browser}) =>
    expectMaterialParity(browser, {
      route,
      scenario: 'not-expandable',
      steps: [clickToggle('Branch'), clickToggle('Disabled branch')],
    }));

  test('keyboard-nav', ({browser}) =>
    expectMaterialParity(browser, {
      route,
      scenario: 'keyboard-nav',
      steps: [
        tabIntoTree, // 1: focus Fruit
        pressKey('ArrowDown'), // 2: focus Vegetables
        pressKey('ArrowUp'), // 3: focus Fruit
        pressKey('ArrowRight'), // 4: expand Fruit
        pressKey('ArrowRight'), // 5: focus Apple (first child)
        pressKey('Enter'), // 6: activate Apple (leaf)
        pressKey('ArrowDown'), // 7: focus Banana
        pressKey(' '), // 8: activate Banana (leaf)
        pressKey('ArrowLeft'), // 9: focus parent Fruit
        pressKey('Enter'), // 10: Fruit has its own toggle -> collapses, does NOT activate
        pressKey('End'), // 11: focus last visible node (Vegetables)
        pressKey('Home'), // 12: focus first visible node (Fruit)
        pressKey('*'), // 13: expand every root sibling (Fruit + Vegetables)
      ],
    }));

  test('disabled-skipped', ({browser}) =>
    expectMaterialParity(browser, {
      route,
      scenario: 'disabled-skipped',
      steps: [
        tabIntoTree, // focus Alpha
        pressKey('ArrowDown'), // skip Beta -> Gamma
        pressKey('ArrowUp'), // skip Beta -> Alpha
        clickNodeText('Beta'), // disabled node body click -> no-op
      ],
    }));
});
