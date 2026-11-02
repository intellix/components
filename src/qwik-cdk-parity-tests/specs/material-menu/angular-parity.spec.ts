import {test, type Page} from '@playwright/test';
import {expectMaterialParity, type ParityStep} from '../../lib/material-parity.js';

/**
 * mat-menu — Angular DOM parity.
 *
 * Source of truth for every scenario: src/dev-app/qwik-parity/menu.ts (exports
 * `MENU_SCENARIOS`, served at http://localhost:4200/qwik-parity/mat-menu/<scenario>). The Qwik
 * side must render the same markup at http://localhost:4173/mat-menu/<scenario>/.
 *
 * TWO roots per scenario, because the menu panel's own content never lives where its trigger
 * does — same dual-root approach as material-tooltip and material-dialog/cdk-dialog:
 *
 *   - `[data-parity-root]` (the default root) — the trigger button(s) AND every `<mat-menu>`
 *     declaration in the scenario.
 *   - `.cdk-overlay-container` (passed as `rootSelector`) — the floating menu panel(s), which
 *     CDK always renders under `<body>`. Absent entirely until the first menu anywhere on the
 *     page opens; once created it persists for the page's life (empty when every menu is
 *     closed, exactly like material-tooltip's overlay container).
 *
 * Every scenario below has two `test()`s — `<scenario> (trigger)` and `<scenario> (overlay)` —
 * running the identical step sequence against the two different roots.
 *
 * Every trigger is a plain native `<button class="menu-trigger">` (not `matButton`/
 * `matIconButton`), given a fixed position AND fixed size via a *static* inline `style`
 * (never bound), so the overlay's computed pixel geometry is reproducible regardless of
 * surrounding dev-app chrome. All inputs that take a value use `[prop]` bindings per the
 * harness's static-attribute-echo rule (README.md) — EXCEPT `matMenuItemIcon`, which is a bare
 * content-projection *selector* attribute with no backing directive (see
 * src/material/menu/menu-item.html: `<ng-content select="mat-icon, [matMenuItemIcon]">`), so
 * there is nothing to bind; writing it as a literal attribute is correct, the same category as
 * `mat-card-avatar`.
 *
 * IMPORTANT, non-obvious — VERIFIED LIVE (http://localhost:4200/qwik-parity/mat-menu/<scenario>,
 * Chromium, repeated runs):
 *
 *   - `<mat-menu>`'s own template is a *lone* `<ng-template>`: its content is only ever
 *     instantiated later, as a `TemplatePortal`, inside the overlay. But `<mat-menu>` is still
 *     a *component* (selector `mat-menu`), so Angular still creates and renders its own HOST
 *     element at the point it's declared — it just stays empty (no children) there forever.
 *     That means every `<mat-menu>` tag below appears, empty, inside `[data-parity-root]`
 *     itself (a sibling of its trigger), not only inside the overlay — confirmed:
 *     `<mat-menu></mat-menu>` with zero attributes when neither `panelClass` nor any
 *     `aria-*` input is bound (see `basic`/`aria-label` below — the `aria-label` INPUT's value
 *     lands only on the real overlay panel, never on this host; see next bullet for why).
 *     The Qwik port must render an equivalent empty placeholder element at each `<mat-menu>`
 *     declaration site for the trigger-root comparison to pass.
 *   - `MatMenu` host bindings `[attr.aria-label]`/`[attr.aria-labelledby]`/
 *     `[attr.aria-describedby]` are all hard-bound to `null` — this exists ONLY to strip the
 *     static-attribute echo a bare `aria-label="…"` attribute would otherwise leave on that
 *     empty host tag (confirmed by menu.spec.ts's "should clear the static aria-label from the
 *     menu host" tests); it has no effect when the input is bound with `[aria-label]` (as every
 *     scenario below does) since there is no static attribute to echo in the first place.
 *   - Setting `panelClass` (bound via `[class]` — see `panel-class` below) does NOT leave the
 *     `<mat-menu>` host with no `class` attribute at all; `MatMenu.panelClass`'s setter
 *     explicitly runs `this._elementRef.nativeElement.className = ''` whenever a non-empty
 *     value is set — confirmed live: the host renders `<mat-menu class="">` (present, empty
 *     string), vs. truly no `class` attribute at all when `panelClass` is never set. The Qwik
 *     port must reproduce this exact distinction.
 *   - The trigger button always carries `aria-haspopup="menu"` (as long as a menu is assigned)
 *     and `aria-expanded="false"/"true"` (always present, a literal string, never removed);
 *     `aria-controls` is present ONLY while open, holding the panel's `id`
 *     (`mat-menu-panel-#` after harness id-normalization).
 *   - Overlay geometry: unlike material-tooltip's pane (which carries `top`/`left`/`transform`
 *     directly), a menu's `.cdk-overlay-pane` itself is bare (`style="position: static;"` —
 *     plus `transform: translateY(-8px)` for a submenu, see `nested` below); the REAL computed
 *     position lives on the pane's parent, `.cdk-overlay-popover.cdk-overlay-connected-
 *     position-bounding-box` (`style="inset: <top>px <right|auto> <bottom|auto> <left>px;
 *     width: …; height: …; align-items: …; justify-content: …;"`), because
 *     `MatMenuTriggerBase._getOverlayConfig` additionally calls `.withGrowAfterOpen()`, which
 *     switches the strategy to flexbox-based pane layout. Confirmed stable across runs given
 *     this spec's fixed-position/fixed-size triggers and Playwright's default viewport (e.g.
 *     `basic`: `inset: 168px auto auto 120px;`).
 *   - A ROOT trigger's overlay has a `cdk-overlay-backdrop cdk-overlay-transparent-backdrop
 *     cdk-overlay-backdrop-showing` div (a direct child of the popover box, before the pane) —
 *     UNLESS `hasBackdrop` is explicitly `false` (see `no-backdrop`), in which case no backdrop
 *     element exists at all. A SUBMENU's own popover never has a backdrop regardless (its
 *     `MatMenuTrigger` always computes `hasBackdrop = menu.hasBackdrop ?? false`, and
 *     `_triggersSubmenu()` makes the "is this a submenu" branch of that computation moot —
 *     confirmed live in `nested`: only the root popover ever gets a backdrop div).
 *   - `MatMenuItem`'s host: `role="menuitem"` always; `tabindex="0"` enabled / `"-1"` disabled;
 *     `aria-disabled="false"/"true"` (always present, literal string); a disabled item ALSO
 *     gets a literal `disabled="true"` attribute (`[attr.disabled]="disabled || null"` — note
 *     the VALUE is the string `"true"`, not an empty string/bare presence, even though it's on
 *     a plain `<button>`). A submenu-trigger item additionally gets the host classes
 *     `mat-mdc-menu-trigger mat-mdc-menu-item-submenu-trigger` PLUS — because it's also a
 *     `[matMenuTriggerFor]` target — its OWN `aria-haspopup="menu"`/`aria-expanded`/
 *     `aria-controls` (same bindings as a top-level trigger), AND an appended
 *     `<svg class="mat-mdc-menu-submenu-icon" viewBox="0 0 5 10" focusable="false"
 *     aria-hidden="true"><polygon points="0,0 5,5 0,10"/></svg>` after its ripple div. While
 *     its submenu is open it additionally gains `mat-mdc-menu-item-highlighted`.
 *   - Every item's ripple div is Material's own template markup (not a consumer selector,
 *     already compared/reproduced per the harness's general rule): `<div matripple=""
 *     class="mat-ripple mat-mdc-menu-ripple"></div>`.
 *   - FocusMonitor: each `MatMenuItem` calls `focusMonitor.monitor()` on itself
 *     (`ngAfterViewInit`), so — UNLIKE the plain trigger buttons used in this spec, which are
 *     never monitored and never gain any `cdk-*-focused` class — an item that becomes the
 *     active item gets `cdk-focused` plus an origin class: `cdk-mouse-focused` when the menu
 *     was opened by a click, `cdk-keyboard-focused` once an arrow/Home/End/ArrowRight moves
 *     the active item (`MatMenu._handleKeydown` calls `manager.setFocusOrigin('keyboard')` only
 *     for UP/DOWN_ARROW specifically — Home/End reuse whatever origin was last set, so a
 *     Home/End press right after an arrow key still yields `cdk-keyboard-focused`). These
 *     classes move with the active item and are cleared on blur — confirmed live: clicking
 *     anywhere outside with no backdrop to intercept it (see `no-backdrop`) blurs the active
 *     item (classes cleared) even though the menu itself stays open, because the click still
 *     lands on and focuses some other page element.
 *   - Disabled items are skipped by keyboard nav (CDK `ListKeyManager`'s default skip
 *     predicate); `withWrap()` is enabled (confirmed live: ArrowDown from the last enabled item
 *     wraps to the first).
 *   - Opening (`mat-menu-panel-animating`, newly-added panel) and closing (`mat-menu-panel-
 *     animating mat-menu-panel-exit-animation`, panel still fully present with all its content)
 *     both have a real, observable transient state — confirmed live at 0ms-after-action. A
 *     *closing* panel is NOT removed from the DOM until the MDC-style exit animation's
 *     `animationend` fires (`MatMenuTriggerBase._destroyMenu` awaits `menu._animationDone`
 *     before calling `overlayRef.detach()`), unlike a simple class toggle — every step below
 *     that opens/closes/opens-a-submenu waits (`page.waitForFunction`, never a fixed sleep) for
 *     the exact resulting `.mat-mdc-menu-panel` COUNT with none of them mid-animation, on each
 *     app independently, so the structural compare that follows always sees a fully settled
 *     state and two independently-timed browser contexts can never race each other.
 *   - `matMenuContent` (lazy content, see `lazy-content`): `MatMenuContent.attach()` creates a
 *     `DomPortalOutlet` whose own host is a bare, attribute-less `<div>` — confirmed live: the
 *     open panel's `.mat-mdc-menu-content` contains one extra wrapping `<div>` around the
 *     `ng-template`'s items that is NOT present for a menu whose items are declared directly
 *     (compare `basic`'s `<div class="mat-mdc-menu-content"><button mat-menu-item>…` to
 *     `lazy-content`'s `<div class="mat-mdc-menu-content"><div><button mat-menu-item>…`). The
 *     Qwik port must reproduce this extra wrapper exactly when `matMenuContent` is used.
 *
 * Per-scenario render contract:
 *
 * - `basic`: one trigger ("Actions", fixed top:120/left:120/160×48), plain `<mat-menu>` with
 *   three items — Refresh (0, enabled), Settings (1, `[disabled]="true"`), Sign Out (2,
 *   enabled). Steps: click trigger → opens (1 panel), auto-focuses Refresh with
 *   `cdk-mouse-focused`; ArrowDown → skips disabled Settings, focuses Sign Out
 *   (`cdk-keyboard-focused`); ArrowDown again → wraps to Refresh; Home → Refresh (no-op, same
 *   item); End → Sign Out; Enter → native button activation synthesizes a `click`, which
 *   bubbles to the panel's own `(click)="closed.emit('click')"` → closes (0 panels), trigger's
 *   `aria-expanded`/`aria-controls` revert, focus restored to the trigger (plain `.focus()`,
 *   no visible class — the trigger itself is never FocusMonitor-monitored); click trigger again
 *   → reopens; Escape → closes (reason `'keydown'`, always restores focus); click trigger again
 *   → reopens; click far outside (5,5) → hits the full-viewport transparent backdrop → closes.
 *
 * - `positions`: four independent trigger/menu pairs, each a static `[xPosition]`/`[yPosition]`
 *   binding, 2 plain items each — `before` (top:80/left:360), `after` (top:160/left:360),
 *   `above` (top:320/left:360), `below` (top:400/left:360). Steps: open trigger 0 → resolved
 *   panel classes `mat-menu-before mat-menu-below` (default y), popover `align-items: flex-end`
 *   (anchored to the trigger's right edge); Escape closes; open 1 → `mat-menu-after
 *   mat-menu-below` (identical panel shape to an unset default, since `'after'`/`'below'` ARE
 *   the defaults); Escape closes; open 2 → `mat-menu-above mat-menu-after`, popover
 *   `justify-content: flex-end` (anchored above); Escape closes; open 3 → `mat-menu-after
 *   mat-menu-below`; Escape closes.
 *
 * - `overlap-trigger`: one trigger/menu pair, `[overlapTrigger]="true"`, 2 plain items. Step:
 *   open → popover `inset` top/left exactly match the trigger's own fixed top/left (120/120,
 *   confirmed live) instead of sitting below it — the panel overlaps the trigger instead of
 *   abutting its bottom edge; Escape closes.
 *
 * - `icons`: one trigger/menu pair, three items each shaped `<button mat-menu-item><span
 *   matMenuItemIcon>…</span><span>Redial</span></button>` (plain Unicode glyphs in bare
 *   `<span>`s — no `mat-icon`/icon font needed); middle item (`Check voicemail`) is
 *   `[disabled]="true"`. Confirmed live: the icon span projects BEFORE the component's own
 *   `<span class="mat-mdc-menu-item-text">`, which itself wraps the consumer's text `<span>`
 *   (nested spans: `<span class="mat-mdc-menu-item-text"><span>Redial</span></span>`). Step:
 *   open → 3 items with icon spans in place; Escape closes.
 *
 * - `nested`: one root trigger ("Animals") opening a 2-item menu — Vertebrates
 *   (`[matMenuTriggerFor]="vertebrates"`, a submenu trigger) and Invertebrates (plain) — plus a
 *   second `<mat-menu #vertebrates>` with 2 plain leaf items (Fish, Birds). Two `<mat-menu>`
 *   tags therefore sit in `[data-parity-root]` (see the general note above). Steps: click root
 *   trigger → opens (1 panel), Vertebrates auto-focused (`cdk-mouse-focused`), carries
 *   `mat-mdc-menu-trigger mat-mdc-menu-item-submenu-trigger`, `aria-haspopup="menu"
 *   aria-expanded="false"`, and the submenu-arrow `<svg>`; hover Vertebrates → opens the
 *   submenu WITHOUT moving focus (2 panels; Vertebrates gains `mat-mdc-menu-item-highlighted`
 *   and `aria-expanded="true" aria-controls="mat-menu-panel-#"`; submenu's own popover has NO
 *   backdrop div and its pane carries `transform: translateY(-8px)` — the parent-padding
 *   offset); ArrowLeft → closes the submenu only (1 panel; Vertebrates keeps
 *   `cdk-mouse-focused`, loses `-highlighted`/`aria-expanded`); ArrowRight (dir is `ltr`, fired
 *   on the still-focused Vertebrates trigger) → reopens the submenu, this time AUTO-FOCUSING
 *   its first item Fish (2 panels; Vertebrates loses its `cdk-*-focused` class entirely — focus
 *   moved — but keeps `-highlighted`; Fish gains `cdk-keyboard-focused`); ArrowLeft → closes the
 *   submenu again, restoring focus to Vertebrates (now `cdk-keyboard-focused`, origin carried
 *   over from the ArrowRight open); Escape → closes the root menu entirely (0 panels).
 *
 * - `no-backdrop`: one trigger/menu pair, `[hasBackdrop]="false"`, 2 plain items. Steps: open →
 *   1 panel, NO backdrop div in the popover (confirmed live — compare to `basic`'s popover,
 *   which has one); click far outside (5,5) → genuine no-op for the menu (no backdrop element
 *   exists to intercept/close it, and `MatMenuTrigger._getOutsideClickStream` is strictly
 *   `overlayRef.backdropClick()` with nothing else — menu stays open, same panel) BUT the click
 *   still blurs the active item on the real page (it focuses whatever is actually at (5,5)), so
 *   Item 1 loses its `cdk-focused cdk-mouse-focused` class even though nothing else changes;
 *   Escape → closes (0 panels; Escape is independent of the backdrop, handled by the overlay's
 *   own keydown stream).
 *
 * - `panel-class`: one trigger/menu pair, `[class]="'custom-menu-panel'"`, 2 plain items. The
 *   `<mat-menu>` host renders `class=""` (present, empty — see the general note above) in BOTH
 *   the closed and open trigger-root snapshots. Step: open → panel classes become
 *   `mat-mdc-menu-panel custom-menu-panel mat-menu-after mat-menu-below`; Escape closes.
 *
 * - `aria-label`: one trigger/menu pair, `[aria-label]="'Account actions'"`, 2 plain items. The
 *   `<mat-menu>` host has NO `aria-label` attribute at all (host binding nulls the static
 *   echo); the real `aria-label="Account actions"` appears only on the open overlay panel.
 *   Step: open → panel carries the attribute; Escape closes.
 *
 * - `lazy-content`: one trigger/menu pair whose 2 plain items are declared inside
 *   `<ng-template matMenuContent>` instead of directly. Step: open → 1 panel, with the extra
 *   `DomPortalOutlet` wrapper `<div>` described in the general note above, wrapping both items;
 *   Escape closes.
 */

const route = 'mat-menu';
const overlayRoot = '.cdk-overlay-container';

const trigger = (page: Page, index = 0) =>
  page.locator('[data-parity-root] .menu-trigger').nth(index);

const menuItem = (page: Page, name: string) =>
  page.locator(overlayRoot).getByRole('menuitem', {name, exact: true});

/**
 * Waits until exactly `count` `.mat-mdc-menu-panel` elements exist AND none of them is
 * mid-animation (`mat-menu-panel-animating`, added on open and on close alike — see the file
 * header). Used after every action that opens, closes, or opens/closes a submenu, so the
 * structural compare that follows always sees a fully settled DOM on both independently-timed
 * apps, never a mid-transition frame.
 */
const waitForPanelCount = (page: Page, count: number) =>
  page.waitForFunction(
    (n: number) => {
      const panels = document.querySelectorAll('.mat-mdc-menu-panel');
      return (
        panels.length === n &&
        Array.from(panels).every(p => !p.classList.contains('mat-menu-panel-animating'))
      );
    },
    count,
    {timeout: 5000},
  );

/** Clicks a trigger and waits for its menu (and any menus already open) to settle. */
const open = (triggerIndex: number, expectedCount: number): ParityStep => ({
  name: `click trigger ${triggerIndex} (open)`,
  run: async (page: Page) => {
    await trigger(page, triggerIndex).click();
    await waitForPanelCount(page, expectedCount);
  },
});

/** Hovers a named open menu item (used to open a submenu without moving keyboard focus). */
const hoverItem = (name: string, expectedCount: number): ParityStep => ({
  name: `hover item "${name}"`,
  run: async (page: Page) => {
    await menuItem(page, name).hover();
    await waitForPanelCount(page, expectedCount);
  },
});

/** Presses a key and waits for the resulting number of open panels to settle. */
const keyTo = (key: string, expectedCount: number): ParityStep => ({
  name: `press ${key}`,
  run: async (page: Page) => {
    await page.keyboard.press(key);
    await waitForPanelCount(page, expectedCount);
  },
});

/** Presses a navigation key that only moves the active item (no panel count change). */
const nav = (key: string): ParityStep => ({
  name: `press ${key} (nav)`,
  run: (page: Page) => page.keyboard.press(key),
});

/**
 * Clicks the full-viewport transparent backdrop (near a corner, `{5,5}`, well clear of the
 * pane — same technique as material-dialog's `backdropClick` helper). Locator-based (not raw
 * `page.mouse.click` coordinates): Playwright's own actionability wait on the located element
 * is what makes this reliable — a raw coordinate click fired the instant the panel-count
 * condition resolves can race the backdrop's own fade-in (`_attachBackdrop`'s
 * `requestAnimationFrame`, see overlay-ref.ts), landing on dev-app chrome underneath instead;
 * confirmed by repeated stress-testing during this scenario's development.
 */
const backdropClick = (expectedCount: number): ParityStep => ({
  name: 'click backdrop',
  run: async (page: Page) => {
    await page.locator('.cdk-overlay-backdrop').click({position: {x: 5, y: 5}});
    await waitForPanelCount(page, expectedCount);
  },
});

/**
 * Clicks far outside any menu/trigger (5,5) on a menu that has NO backdrop at all
 * (`no-backdrop`) — there is nothing to locate/wait on, so a raw coordinate click is fine here:
 * it's deliberately a no-op for the menu (confirmed it stays open), landing on whatever real
 * page content is at that point instead.
 */
const clickOutsideNoBackdrop = (expectedCount: number): ParityStep => ({
  name: 'click outside (5,5), no backdrop',
  run: async (page: Page) => {
    await page.mouse.click(5, 5);
    await waitForPanelCount(page, expectedCount);
  },
});

test.describe('mat-menu — Angular DOM parity', () => {
  const basicSteps = [
    open(0, 1),
    nav('ArrowDown'),
    nav('ArrowDown'),
    nav('Home'),
    nav('End'),
    keyTo('Enter', 0),
    open(0, 1),
    keyTo('Escape', 0),
    open(0, 1),
    backdropClick(0),
  ];

  test('basic (trigger)', ({browser}) =>
    expectMaterialParity(browser, {route, scenario: 'basic', steps: basicSteps}));

  test('basic (overlay)', ({browser}) =>
    expectMaterialParity(browser, {
      route,
      scenario: 'basic',
      rootSelector: overlayRoot,
      steps: basicSteps,
    }));

  const positionsSteps = [
    open(0, 1),
    keyTo('Escape', 0),
    open(1, 1),
    keyTo('Escape', 0),
    open(2, 1),
    keyTo('Escape', 0),
    open(3, 1),
    keyTo('Escape', 0),
  ];

  test('positions (trigger)', ({browser}) =>
    expectMaterialParity(browser, {route, scenario: 'positions', steps: positionsSteps}));

  test('positions (overlay)', ({browser}) =>
    expectMaterialParity(browser, {
      route,
      scenario: 'positions',
      rootSelector: overlayRoot,
      steps: positionsSteps,
    }));

  const overlapTriggerSteps = [open(0, 1), keyTo('Escape', 0)];

  test('overlap-trigger (trigger)', ({browser}) =>
    expectMaterialParity(browser, {
      route,
      scenario: 'overlap-trigger',
      steps: overlapTriggerSteps,
    }));

  test('overlap-trigger (overlay)', ({browser}) =>
    expectMaterialParity(browser, {
      route,
      scenario: 'overlap-trigger',
      rootSelector: overlayRoot,
      steps: overlapTriggerSteps,
    }));

  const iconsSteps = [open(0, 1), keyTo('Escape', 0)];

  test('icons (trigger)', ({browser}) =>
    expectMaterialParity(browser, {route, scenario: 'icons', steps: iconsSteps}));

  test('icons (overlay)', ({browser}) =>
    expectMaterialParity(browser, {
      route,
      scenario: 'icons',
      rootSelector: overlayRoot,
      steps: iconsSteps,
    }));

  const nestedSteps = [
    open(0, 1),
    hoverItem('Vertebrates', 2),
    keyTo('ArrowLeft', 1),
    keyTo('ArrowRight', 2),
    keyTo('ArrowLeft', 1),
    keyTo('Escape', 0),
  ];

  test('nested (trigger)', ({browser}) =>
    expectMaterialParity(browser, {route, scenario: 'nested', steps: nestedSteps}));

  test('nested (overlay)', ({browser}) =>
    expectMaterialParity(browser, {
      route,
      scenario: 'nested',
      rootSelector: overlayRoot,
      steps: nestedSteps,
    }));

  const noBackdropSteps = [open(0, 1), clickOutsideNoBackdrop(1), keyTo('Escape', 0)];

  test('no-backdrop (trigger)', ({browser}) =>
    expectMaterialParity(browser, {route, scenario: 'no-backdrop', steps: noBackdropSteps}));

  test('no-backdrop (overlay)', ({browser}) =>
    expectMaterialParity(browser, {
      route,
      scenario: 'no-backdrop',
      rootSelector: overlayRoot,
      steps: noBackdropSteps,
    }));

  const panelClassSteps = [open(0, 1), keyTo('Escape', 0)];

  test('panel-class (trigger)', ({browser}) =>
    expectMaterialParity(browser, {route, scenario: 'panel-class', steps: panelClassSteps}));

  test('panel-class (overlay)', ({browser}) =>
    expectMaterialParity(browser, {
      route,
      scenario: 'panel-class',
      rootSelector: overlayRoot,
      steps: panelClassSteps,
    }));

  const ariaLabelSteps = [open(0, 1), keyTo('Escape', 0)];

  test('aria-label (trigger)', ({browser}) =>
    expectMaterialParity(browser, {route, scenario: 'aria-label', steps: ariaLabelSteps}));

  test('aria-label (overlay)', ({browser}) =>
    expectMaterialParity(browser, {
      route,
      scenario: 'aria-label',
      rootSelector: overlayRoot,
      steps: ariaLabelSteps,
    }));

  const lazyContentSteps = [open(0, 1), keyTo('Escape', 0)];

  test('lazy-content (trigger)', ({browser}) =>
    expectMaterialParity(browser, {route, scenario: 'lazy-content', steps: lazyContentSteps}));

  test('lazy-content (overlay)', ({browser}) =>
    expectMaterialParity(browser, {
      route,
      scenario: 'lazy-content',
      rootSelector: overlayRoot,
      steps: lazyContentSteps,
    }));
});
