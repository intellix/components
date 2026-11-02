import {test, type Page} from '@playwright/test';
import {expectMaterialParity, type ParityStep} from '../../lib/material-parity.js';

const route = 'mat-tabs';

/**
 * mat-tabs — Angular DOM parity.
 *
 * Source of truth for every scenario: src/dev-app/qwik-parity/tabs.ts (exports
 * `TABS_SCENARIOS`, served at http://localhost:4200/qwik-parity/mat-tabs/<scenario>). The Qwik
 * side must render the same markup at http://localhost:4173/mat-tabs/<scenario>/ inside its own
 * `[data-parity-root]`.
 *
 * Every `<mat-tab-group>`/`<nav mat-tab-nav-bar>` is given a fixed inline `style="width: …px"`
 * (a plain DOM attribute, not a Material input) so header width — and therefore pagination
 * thresholds and ink-bar geometry — is identical regardless of the surrounding dev-app chrome,
 * which differs between the Angular and Qwik dev-apps.
 *
 * ========================================================================================
 * SHARED STRUCTURE — `<mat-tab-group>` (src/material/tabs/tab-group.html, tab-header.html,
 * tab-body.html; classes/host bindings from tab-group.ts, tab-header.ts, paginated-tab-header.ts,
 * ink-bar.ts, tab-body.ts):
 *
 *   <mat-tab-group class="mat-mdc-tab-group mat-{primary|accent|warn}
 *                         [mat-mdc-tab-group-dynamic-height] [mat-mdc-tab-group-inverted-header]
 *                         [mat-mdc-tab-group-stretch-tabs]"
 *                  [mat-align-tabs]="start|center|end"   (attr, only when alignTabs is set — see below)
 *                  style="width: …px; --mat-tab-animation-duration: 500ms;">
 *     <mat-tab-header class="mat-mdc-tab-header [mat-mdc-tab-header-pagination-controls-enabled]">
 *       <div class="mat-ripple mat-mdc-tab-header-pagination mat-mdc-tab-header-pagination-before
 *                   [mat-mdc-tab-header-pagination-disabled]" mat-ripple>
 *         <div class="mat-mdc-tab-header-pagination-chevron"></div>
 *       </div>
 *       <div class="mat-mdc-tab-label-container">
 *         <div role="tablist" class="mat-mdc-tab-list" [aria-label] [aria-labelledby]
 *              style="transform: translateX(Npx);">              (ALWAYS present, see note 1)
 *           <div class="mat-mdc-tab-labels">
 *             <div role="tab" mattablabelwrapper cdkmonitorelementfocus
 *                  class="mdc-tab mat-mdc-tab mat-focus-indicator [mdc-tab--active]
 *                         [mdc-tab-indicator--active] [mat-mdc-tab-disabled]"
 *                  id="mat-tab-group-#-label-#" tabindex="0|-1"
 *                  aria-posinset="N" aria-setsize="N" aria-controls="mat-tab-group-#-content-#"
 *                  aria-selected="true|false" aria-disabled="true|false"
 *                  [aria-label] [aria-labelledby]>
 *               <span class="mdc-tab__ripple"></span>
 *               <div class="mat-ripple mat-mdc-tab-ripple" mat-ripple></div>
 *               <span class="mdc-tab__content">
 *                 <span class="mdc-tab__text-label">…label text or portal-projected template…</span>
 *               </span>
 *               <span class="mdc-tab-indicator">                  (one per tab, see note 2)
 *                 <span class="mdc-tab-indicator__content mdc-tab-indicator__content--underline"></span>
 *               </span>
 *             </div>
 *             …one per tab…
 *           </div>
 *         </div>
 *       </div>
 *       <div class="mat-ripple mat-mdc-tab-header-pagination mat-mdc-tab-header-pagination-after
 *                   [mat-mdc-tab-header-pagination-disabled]" mat-ripple>
 *         <div class="mat-mdc-tab-header-pagination-chevron"></div>
 *       </div>
 *     </mat-tab-header>
 *     <div class="mat-mdc-tab-body-wrapper">
 *       <mat-tab-body role="tabpanel" class="mat-mdc-tab-body [mat-mdc-tab-body-active]
 *                                            [mat-tab-body-animating]"
 *                     id="mat-tab-group-#-content-#" aria-labelledby="mat-tab-group-#-label-#"
 *                     aria-hidden="true|false" [inert]>                  (inert present when NOT active)
 *         <div cdkscrollable class="mat-mdc-tab-body-content
 *                                    [mat-tab-body-content-left|-right|-can-animate]">
 *           …tab content (portal-attached, or absent until first centered — see note 3)…
 *         </div>
 *       </mat-tab-body>
 *       …one per tab, same order as the labels…
 *     </div>
 *   </mat-tab-group>
 *
 * NON-OBVIOUS BEHAVIORS VERIFIED LIVE (not something a from-scratch reading of the source
 * would reliably predict):
 *
 * 1. **`.mat-mdc-tab-list` ALWAYS carries an inline `transform: translateX(Npx)` style**, even
 *    when there's no overflow (`translateX(0px)`). It's set by `_updateTabScrollPosition()`,
 *    which runs once via `afterNextRender` on every load regardless of whether pagination is
 *    needed. The Qwik port must set this style unconditionally, not only when paginating.
 * 2. **Every tab gets an ink-bar `<span class="mdc-tab-indicator">…</span>` appended as the
 *    LAST child inside `.mdc-tab`** (sibling after `.mdc-tab__content`, created once via
 *    `document.createElement` by `InkBarItem.ngOnInit`/`MatInkBar`, not part of the Angular
 *    template — but it is deterministic and part of the DOM contract since it's always present).
 *    The ACTIVE class (`mdc-tab-indicator--active`) is added to the **outer `.mdc-tab` host
 *    div itself** (same element as `mdc-tab--active`), not to the inner `<span
 *    class="mdc-tab-indicator">` — i.e. `activateInkBar()`'s `element.classList.add(...)` acts
 *    on the tab-label-wrapper host, matching `mdc-tab--active`. The FLIP-animation inline
 *    `transform` that briefly appears on `.mdc-tab-indicator__content--underline` during a
 *    tab switch is set and cleared again SYNCHRONOUSLY within the same click handler (never
 *    observable after even a single animation frame), so it never needs to be captured by a
 *    snapshot — by the time any step's `settle()` runs, it is always empty/absent on both apps.
 * 3. **Tab-body content attach/detach (the lazy/portal mechanism) is NOT gated by
 *    `matTabContent`/lazy-loading alone** — ANY tab's content (plain or `<ng-template
 *    matTabContent>`) attaches the first time that tab becomes centered. For the tab that is
 *    *already* selected on initial load, this happens essentially immediately (the portal
 *    subscribes with `startWith(isCenterPosition())`, so an initially-active tab's content is
 *    never "lazy" from an observer's standpoint). A tab that starts inactive keeps its
 *    `.mat-mdc-tab-body-content` empty (only comment anchors) until first activated — this is
 *    what actually demonstrates "lazy" in the `lazy-content` scenario (tab 1, not tab 0).
 *    **Leaving** a tab detaches its content again (removes it from the DOM, not just hides it)
 *    UNLESS `preserveContent` is `true` — detachment is tied to the SAME `transitionend` event
 *    that clears `mat-tab-body-animating` (see note 4), so it completes within the same wait.
 *    Re-activating a previously-detached (non-preserved) tab re-attaches/re-renders its content
 *    from scratch (confirmed for `lazy-content`: clicking back to tab 0 re-shows its `<p>`).
 * 4. **Clicking/selecting a different tab updates almost everything SYNCHRONOUSLY** with the
 *    click (within the same change-detection cycle, before any CSS transition runs): both
 *    tabs' `mat-mdc-tab-body-active`/`aria-hidden`/`inert` swap immediately, and the entering/
 *    leaving bodies' position classes (`mat-tab-body-content-left/-right/-can-animate`) are set
 *    immediately too. The ONLY thing that lags behind is the transient
 *    `mat-tab-body-animating` class (added on `transitionstart`, removed ~500ms later — the
 *    default `animationDuration` — on `transitionend`/`transitioncancel`) and, tied to the same
 *    event, the content-detach described in note 3. Every step below that changes
 *    `selectedIndex` waits (`page.waitForFunction`, not a fixed sleep) for
 *    `.mat-tab-body-animating` to disappear from under `[data-parity-root]`, plus a small fixed
 *    buffer, on each app independently, before comparing — see `waitForTabSwitchSettled` below.
 *    Verified over several repeated runs with a `MutationObserver`: a clean single ~500–555ms
 *    window per switch, no flicker.
 * 5. **Clicking an ENABLED tab also focuses it** (it's a real `.focus()` call inside
 *    `_handleClick`/`FocusKeyManager.setActiveItem`), adding `cdk-focused cdk-mouse-focused` to
 *    the clicked tab (and removing any focus classes from whichever tab had them before).
 *    **Force-clicking a DISABLED tab (`{force: true}`, required because Playwright's own
 *    actionability check refuses a plain `.click()` on an `aria-disabled="true"` element) is a
 *    complete no-op** — confirmed live: no selection change AND no focus-class change either
 *    (not even `cdk-mouse-focused`). This matches `_handleClick` which unconditionally sets
 *    `tabHeader.focusIndex = index`, but the `focusIndex` setter is a no-op when the key
 *    manager's active index already equals the target — true here since the active tab (0)
 *    was never programmatically re-targeted by this synthetic event. The Qwik port only needs
 *    to match "nothing happens," not reproduce the internal reason.
 * 6. **Keyboard navigation is "manual activation"**: ArrowRight/ArrowLeft/Home/End move
 *    *focus* only (roving `tabindex`, `cdk-focused cdk-keyboard-focused` on the focused tab) —
 *    `aria-selected`/`mdc-tab--active`/body visibility do NOT change. Only Enter or Space, when
 *    the focused tab differs from the selected one AND isn't disabled, actually selects
 *    (`MatPaginatedTabHeader._handleKeydown`). Arrow navigation **wraps** (`.withWrap()`) —
 *    ArrowLeft from the first tab moves focus to the last. Home/End do NOT wrap and are a
 *    no-op at the respective end. A disabled tab IS reachable by arrow-key focus
 *    (`skipPredicate(() => false)`) and gets real `cdk-focused`/`cdk-keyboard-focused` classes,
 *    but Enter/Space on it is a no-op (the `!item.disabled` guard in `_handleKeydown`).
 * 7. **`mat-align-tabs` is NOT a consumer-chosen selector attribute** — it's an `@Input({alias:
 *    'mat-align-tabs'})` whose VALUE is reflected back onto the host via Material's own
 *    `[attr.mat-align-tabs]` host binding, the same category as `matripple` (compared,
 *    reproduced, never excluded). It's absent entirely (no attribute at all) when `alignTabs`
 *    is `null` (the default — see `basic` etc.). `mat-stretch-tabs` is purely an `@Input`
 *    alias with NO attribute reflection at all — it only ever shows up as the
 *    `mat-mdc-tab-group-stretch-tabs` class; it never appears as a literal attribute as long as
 *    scenarios bind it with `[mat-stretch-tabs]="false"` (bracket syntax) rather than a static
 *    attribute. Neither needed any `CONSUMER_SELECTOR_ATTRS` addition.
 * 8. `headerPosition: 'below'` only changes the host class (`mat-mdc-tab-group-inverted-header`,
 *    flipped visually by CSS `flex-direction`) — the DOM order of `<mat-tab-header>` vs the
 *    body wrapper is unchanged (header is always first in markup).
 * 9. `<mat-tab>` itself never appears in the live (non-SSR) DOM at all: `tab-group.html` only
 *    renders its `<ng-content/>` projection point `@if (_isServer)`, and the dev-app is CSR, so
 *    `_isServer` is always `false`. All content reaches the DOM exclusively through the
 *    `mat-tab-body` portals. Angular's `@if`/`@for` control-flow anchors appear live as
 *    `<!--container-->` comment nodes (e.g. bracketing each tab's text label) — the harness
 *    only walks Elements, so these never need to be reproduced.
 *
 * ========================================================================================
 * SHARED STRUCTURE — `<nav mat-tab-nav-bar>` + `<a mat-tab-link>` + `<mat-tab-nav-panel>`
 * (src/material/tabs/tab-nav-bar/tab-nav-bar.html, tab-link.html; tab-nav-bar.ts):
 *
 *   <nav mat-tab-nav-bar role="tablist"             (role="tablist" only because [tabPanel] is set)
 *        class="mat-mdc-tab-nav-bar mat-mdc-tab-header mat-mdc-tab-nav-bar-stretch-tabs
 *               mat-primary [mat-mdc-tab-header-pagination-controls-enabled]"
 *        style="width: …px;">                      (NO --mat-tab-animation-duration — see note 10)
 *     …pagination-before chevron, same markup as tab-group…
 *     <div class="mat-mdc-tab-link-container">
 *       <div class="mat-mdc-tab-list" style="transform: translateX(Npx);">
 *         <div class="mat-mdc-tab-links">
 *           <a mat-tab-link role="tab" class="mdc-tab mat-mdc-tab-link mat-focus-indicator
 *                                             [mdc-tab--active] [mdc-tab-indicator--active]
 *                                             [mat-mdc-tab-disabled]"
 *              aria-controls="mat-tab-nav-panel-#" aria-disabled="true|false"
 *              aria-selected="true|false" id="mat-tab-link-#" tabindex="0|-1">
 *             <span class="mdc-tab__ripple"></span>
 *             <div class="mat-ripple mat-mdc-tab-ripple" mat-ripple></div>
 *             <span class="mdc-tab__content"><span class="mdc-tab__text-label">…</span></span>
 *             <span class="mdc-tab-indicator"><span class="mdc-tab-indicator__content
 *                                                          mdc-tab-indicator__content--underline"></span></span>
 *           </a>
 *           …one per link, in document order (including the disabled one)…
 *         </div>
 *       </div>
 *     </div>
 *     …pagination-after chevron…
 *   </nav>
 *   <mat-tab-nav-panel role="tabpanel" class="mat-mdc-tab-nav-panel"
 *                       aria-labelledby="mat-tab-link-#" id="mat-tab-nav-panel-#">
 *     …projected content…
 *   </mat-tab-nav-panel>
 *
 * 10. **`MatTabNav` never sets `--mat-tab-animation-duration`** (unlike `MatTabGroup`,
 *     which always sets the custom property — see the shared tab-group structure above).
 *     `MatTabNav`'s constructor only defaults `disablePagination`/`fitInkBarToContent`/
 *     `stretchTabs` from `MAT_TABS_CONFIG`; `animationDuration` is left genuinely `undefined`
 *     unless a config explicitly provides one, and Angular's `[style.prop]` binding omits the
 *     property entirely for `undefined` — confirmed live (`style="width: 480px;"` only, no
 *     custom property at all). The `nav-bar` scenario provides no `MAT_TABS_CONFIG`, so the
 *     Qwik route must likewise emit NO animation-duration custom property on the nav host.
 * 11. `mat-tab-link`/`mattablink` (the `[mat-tab-link], [matTabLink]` selector on the anchor)
 *     and `mat-tab-nav-bar` (`[mat-tab-nav-bar]` on the `<nav>`) ARE consumer-written selector
 *     attributes, same category as `matButton`/`mat-fab` — report these for
 *     `CONSUMER_SELECTOR_ATTRS` (not edited here). By contrast, `[mat-tab-label]`/
 *     `[matTabLabel]` (on `<ng-template mat-tab-label>`) and `[matTabContent]` (on `<ng-template
 *     matTabContent>`) never need an entry: both decorate an `<ng-template>`, which never
 *     becomes a DOM element on its own, so the attribute never materializes to compare.
 * 12. **`active`/`aria-selected` on a link is driven purely by the `[active]` input**, not by
 *     focus. Arrow-key navigation among links moves focus only (same roving-tabindex, manual-
 *     activation pattern as the tab group — `MatTabNav` extends the same
 *     `MatPaginatedTabHeader`). Pressing Enter on a focused, non-active link **when `[tabPanel]`
 *     is bound** synthesizes a real `elementRef.nativeElement.click()` (Space does too, but
 *     additionally calls `preventDefault()` to stop the page from scrolling) — confirmed live:
 *     Tab-in, ArrowRight, Enter correctly flips `active`/selects the next link exactly like a
 *     mouse click would.
 * 13. A mouse click on a link, unlike a mouse click on a `.mdc-tab` tab-group label, picks up
 *     `cdk-focused cdk-mouse-focused` because `<a>` is natively focusable and a real click
 *     focuses it — no `FocusKeyManager.setActiveItem` indirection needed (contrast with note 5).
 *
 * ========================================================================================
 * Per-scenario render contract (`TABS_SCENARIOS` key → class):
 *
 * - **basic**: one `<mat-tab-group style="width: 480px">`, three tabs "First"/"Second"/"Third",
 *   plain-text bodies "Content 1"/"Content 2"/"Content 3", `selectedIndex` starts at 0 (tab 0
 *   active). `<p>Selected: N</p>` below, bound to `(selectedIndexChange)`. No `mat-align-tabs`
 *   attribute (alignTabs unset). Steps: Tab in from a sentinel (focus → tab 0, picks up
 *   `cdk-focused cdk-keyboard-focused`); ArrowRight (focus → tab 1, no selection change);
 *   End (focus → tab 2, last); Home (focus → tab 0, first); ArrowRight then Enter (focus → tab
 *   1, then selects it — "Selected: 1"); ArrowRight then Space (focus → tab 2, then selects it
 *   — "Selected: 2"); a plain mouse click on tab 0 (selects it directly, "Selected: 0", tab 0
 *   gains `cdk-focused cdk-mouse-focused`); ArrowLeft (focus wraps from tab 0 to tab 2, last —
 *   no selection change).
 * - **selected-index-initial**: same three tabs/content as `basic`, but `[selectedIndex]="2"`
 *   initially — tab 2 ("Third") starts active/selected, its body has
 *   `mat-tab-body-content-can-animate` (center) while tabs 0/1's bodies have
 *   `mat-tab-body-content-left` (both to the left of the selected one). `<p>Selected: 2</p>`.
 *   Step: click tab 0 → selects it, "Selected: 0" (crossing two positions in one jump; both
 *   apps compute the same left/right direction since the algorithm is purely index-based).
 * - **disabled-tab**: same three tabs, tab 1 ("Second") has `[disabled]="true"` — its label
 *   gets `mat-mdc-tab-disabled` + `aria-disabled="true"`; its content "Content 2 (disabled)"
 *   never renders (never becomes active in this scenario). `<p>Selected: 0</p>`. Steps:
 *   force-click tab 1 (`{force: true}`, required since Playwright refuses a plain click on
 *   `aria-disabled="true"`) → complete no-op, DOM identical to before (see note 5); Tab in
 *   (focus → tab 0); ArrowRight (focus → tab 1, disabled tab IS focusable — gains
 *   `cdk-focused cdk-keyboard-focused` same as any other tab); Enter → no-op, "Selected: 0"
 *   unchanged (see note 6).
 * - **custom-label**: one group, two tabs. Tab 0 uses `<ng-template mat-tab-label>` containing
 *   `<strong>First</strong> (custom)` — renders inside `.mdc-tab__text-label` as
 *   `<strong>First</strong>` followed by a sibling text node `(custom)` (portal-projected
 *   directly, no wrapping element), body "Content 1". Tab 1 is a plain `label="Second"` tab,
 *   body "Content 2". `<p>Selected: 0</p>`. Step: click tab 1 → selects it, "Selected: 1".
 * - **lazy-content**: one group, two tabs, each body wrapped in `<ng-template matTabContent>`
 *   (tab 0: `<p>Loaded content 1</p>`, tab 1: `<p>Loaded content 2</p>`). Tab 0 starts active —
 *   per note 3, its content is NOT actually deferred (already attached on load, `<p>Loaded
 *   content 1</p>` present in the initial snapshot); tab 1's `.mat-mdc-tab-body-content` is
 *   empty (comment anchors only) until first activated. `<p>Selected: 0</p>`. Steps: click tab
 *   1 → its `<p>Loaded content 2</p>` now renders for the first time, "Selected: 1" (tab 0's
 *   content detaches once its leave-transition settles, per note 3/4); click tab 0 → re-selects
 *   it, its `<p>Loaded content 1</p>` RE-renders from scratch (it was detached, not preserved),
 *   "Selected: 0".
 * - **preserve-content**: one group, two tabs, `[preserveContent]="true"`, plain-text bodies
 *   "Content 1"/"Content 2". `<p>Selected: 0</p>`. Step: click tab 1 → selects it, "Selected:
 *   1", and — unlike every non-preserving scenario above — tab 0's `<p>`-less text content
 *   "Content 1" remains in the DOM (not detached) even after the leave-transition fully
 *   settles; its body still gets `mat-tab-body-content-left` and loses `inert`'s absence (i.e.
 *   still gets `inert` back) exactly like the non-preserving case — only the content removal
 *   is skipped.
 * - **align**: three separate `<mat-tab-group style="width: 320px" [mat-stretch-tabs]="false">`,
 *   each with two tabs ("First"/"Second", bodies "Content 1"/"Content 2"), differing only in
 *   `[mat-align-tabs]`: `'start'`, `'center'`, `'end'`. None has the
 *   `mat-mdc-tab-group-stretch-tabs` class (stretch is off); each DOES have the literal
 *   `mat-align-tabs="start|center|end"` attribute (see note 7). No `<p>` readout. Step: click
 *   tab 1 of the FIRST (`start`) group only → selects it there (other two groups untouched).
 * - **header-below**: one group, `[headerPosition]="'below'"`, three tabs identical to `basic`
 *   (labels/content/`<p>`). Host gains `mat-mdc-tab-group-inverted-header`; DOM order of header
 *   vs. body wrapper is UNCHANGED (see note 8). Step: click tab 1 → selects it, "Selected: 1".
 * - **dynamic-height**: one group, `[dynamicHeight]="true"`, two tabs "Short"/"Tall" with
 *   bodies of deliberately different heights (a `<p style="height: 40px">` vs `<p
 *   style="height: 200px">`). Host gains `mat-mdc-tab-group-dynamic-height`. `<p>Selected:
 *   0</p>`. Steps: click tab 1 (Tall) → selects it, "Selected: 1"; click tab 0 (Short) → back,
 *   "Selected: 0". NOTE: `_setTabBodyWrapperHeight`/`_removeTabBodyWrapperHeight` do set a
 *   transient inline `height` on `.mat-mdc-tab-body-wrapper` to drive the grow/shrink
 *   animation, but it is explicitly cleared (`wrapper.style.height = ''`) in the SAME
 *   `transitionend` handling this spec already waits out for every click — confirmed live the
 *   wrapper carries NO inline style once a step settles, with or without `dynamicHeight`. This
 *   spec therefore only exercises (not strictly asserts) the dynamic-height resize code path,
 *   the same accepted limitation as the transient animation classes in other components'
 *   parity specs (e.g. checkbox's `mdc-checkbox--anim-*`).
 * - **pagination**: one group, `style="width: 300px"`, 20 tabs ("Tab 0"–"Tab 19", bodies
 *   "Content for Tab N"), generated via `@for`. `<mat-tab-header>` gains
 *   `mat-mdc-tab-header-pagination-controls-enabled`; the "before" chevron starts
 *   `mat-mdc-tab-header-pagination-disabled` (scroll distance 0), the "after" chevron does NOT
 *   (more to scroll); `.mat-mdc-tab-list` starts at `transform: translateX(0px)`. `<p>Selected:
 *   0</p>` (unaffected by paginating — scrolling never changes selection). Step: click the
 *   "after" pagination chevron → "before" chevron's `-disabled` class is REMOVED (now
 *   scrollable backwards), "after" chevron remains enabled (still more ahead), `.mat-mdc-tab-
 *   list`'s `transform` changes to a negative `translateX` (one-third of the 300px viewport,
 *   `_scrollHeader`) — the exact pixel value is deterministic from the fixed width/font/tab
 *   count and must match bit-for-bit between the two apps given synced CSS.
 * - **nav-bar**: `<nav mat-tab-nav-bar style="width: 480px" [tabPanel]="tabPanel">` with three
 *   `<a mat-tab-link>` links ("First"/"Second"/"Third", `[active]` bound to `activeLink ===
 *   link`, click sets `activeLink`) plus a fourth `[disabled]="true"` link ("Disabled", always
 *   `active=false`), followed by `<mat-tab-nav-panel #tabPanel>` containing `<p>Panel content
 *   for {{ activeLink }}</p>`, then a top-level `<p>Selected: {{ activeLink }}</p>`. "First"
 *   starts active. No `--mat-tab-animation-duration` custom property (note 10). Steps:
 *   click link 1 ("Second") → `active`/`aria-selected`/`mdc-tab--active`/ink-bar move to it,
 *   it gains `cdk-focused cdk-mouse-focused` (note 13), panel's `aria-labelledby` + projected
 *   text + "Selected: Second" all update; Tab in from a sentinel (focus → link 1, already
 *   active/tabindex 0); ArrowRight (focus → link 2 "Third", no selection change — `aria-
 *   selected` stays on link 1); Enter → synthesizes a click on link 2 (note 12), selecting it —
 *   "Selected: Third".
 * - **aria-label**: two separate `<mat-tab-group style="width: 480px">`, each with two tabs
 *   ("First"/"Second", bodies "Content 1"/"Content 2"), no `<p>` readout. Group 0 has
 *   `[aria-label]="'Settings sections'"` → the inner `.mat-mdc-tab-list` gets
 *   `aria-label="Settings sections"`. Group 1 is preceded by `<label id="ext-tabs-label">
 *   External tabs label</label>` and has `[aria-labelledby]="'ext-tabs-label'"` → its
 *   `.mat-mdc-tab-list` gets `aria-labelledby="ext-tabs-label"` instead. Step: click tab 1 of
 *   the FIRST group only → selects it there.
 */

/** Waits for the one-time, time-delayed `mat-tab-body-animating` class (see note 4 above) to
 * clear from every tab body under the root, then a small fixed buffer for the zone-triggered
 * detach (note 3) that lands in the same event but may be a tick behind the class removal. */
async function waitForTabSwitchSettled(page: Page): Promise<void> {
  await page.waitForFunction(
    () => !document.querySelector('[data-parity-root] .mat-tab-body-animating'),
    undefined,
    {timeout: 5000},
  );
  await page.waitForTimeout(300);
}

/** Scopes to the Nth `<mat-tab-group>`'s tab labels (defaults to the only/first group). */
const tabLabel = (page: Page, index: number, groupIndex = 0) =>
  page.locator('[data-parity-root] mat-tab-group').nth(groupIndex).locator('.mdc-tab').nth(index);

const clickTab = (index: number, opts?: {force?: boolean; groupIndex?: number}): ParityStep => ({
  name: `click tab ${index}`,
  run: async (page: Page) => {
    await tabLabel(page, index, opts?.groupIndex).click({force: opts?.force});
    await waitForTabSwitchSettled(page);
  },
});

/** Focus-only keyboard navigation (ArrowRight/ArrowLeft/Home/End): no selection change, so a
 * short fixed wait is enough (no body transition is ever triggered). */
const pressKeyFocusOnly = (key: string): ParityStep => ({
  name: `press ${key} (focus only)`,
  run: async (page: Page) => {
    await page.keyboard.press(key);
    await page.waitForTimeout(150);
  },
});

/** Enter/Space select the currently-focused tab (when it differs from the selected one and
 * isn't disabled) — waits out the same tab-switch transition as a click. */
const pressKeySelect = (key: string): ParityStep => ({
  name: `press ${key} (select)`,
  run: async (page: Page) => {
    await page.keyboard.press(key);
    await waitForTabSwitchSettled(page);
  },
});

/** Tabs into the first tab label from a sentinel placed just before the parity root (the
 * dev-app chrome differs between the two apps, so natural Tab order from the page top differs). */
const tabIntoFirstTab: ParityStep = {
  name: 'Tab into first tab',
  run: async (page: Page) => {
    await page.locator('[data-parity-root]').evaluate(root => {
      const sentinel = document.createElement('button');
      root.before(sentinel);
      sentinel.focus();
    });
    await page.keyboard.press('Tab');
    await page.waitForTimeout(150);
  },
};

const tabIntoFirstLink: ParityStep = {
  name: 'Tab into first link',
  run: async (page: Page) => {
    await page.locator('[data-parity-root]').evaluate(root => {
      const sentinel = document.createElement('button');
      root.before(sentinel);
      sentinel.focus();
    });
    await page.keyboard.press('Tab');
    await page.waitForTimeout(150);
  },
};

const clickChevron = (direction: 'before' | 'after'): ParityStep => ({
  name: `click ${direction} chevron`,
  run: async (page: Page) => {
    await page.locator(`[data-parity-root] .mat-mdc-tab-header-pagination-${direction}`).click();
    await page.waitForTimeout(250);
  },
});

const clickLink = (index: number): ParityStep => ({
  name: `click link ${index}`,
  run: async (page: Page) => {
    await page.locator('[data-parity-root] a[mat-tab-link]').nth(index).click();
    await page.waitForTimeout(250);
  },
});

test.describe('mat-tabs — Angular DOM parity', () => {
  test('basic', ({browser}) =>
    expectMaterialParity(browser, {
      route,
      scenario: 'basic',
      steps: [
        tabIntoFirstTab,
        pressKeyFocusOnly('ArrowRight'),
        pressKeyFocusOnly('End'),
        pressKeyFocusOnly('Home'),
        pressKeyFocusOnly('ArrowRight'),
        pressKeySelect('Enter'),
        pressKeyFocusOnly('ArrowRight'),
        pressKeySelect('Space'),
        clickTab(0),
        pressKeyFocusOnly('ArrowLeft'),
      ],
    }));

  test('selected-index-initial', ({browser}) =>
    expectMaterialParity(browser, {
      route,
      scenario: 'selected-index-initial',
      steps: [clickTab(0)],
    }));

  test('disabled-tab', ({browser}) =>
    expectMaterialParity(browser, {
      route,
      scenario: 'disabled-tab',
      steps: [
        clickTab(1, {force: true}),
        tabIntoFirstTab,
        pressKeyFocusOnly('ArrowRight'),
        pressKeySelect('Enter'),
      ],
    }));

  test('custom-label', ({browser}) =>
    expectMaterialParity(browser, {route, scenario: 'custom-label', steps: [clickTab(1)]}));

  test('lazy-content', ({browser}) =>
    expectMaterialParity(browser, {
      route,
      scenario: 'lazy-content',
      steps: [clickTab(1), clickTab(0)],
    }));

  test('preserve-content', ({browser}) =>
    expectMaterialParity(browser, {route, scenario: 'preserve-content', steps: [clickTab(1)]}));

  test('align', ({browser}) =>
    expectMaterialParity(browser, {
      route,
      scenario: 'align',
      steps: [clickTab(1, {groupIndex: 0})],
    }));

  test('header-below', ({browser}) =>
    expectMaterialParity(browser, {route, scenario: 'header-below', steps: [clickTab(1)]}));

  test('dynamic-height', ({browser}) =>
    expectMaterialParity(browser, {
      route,
      scenario: 'dynamic-height',
      steps: [clickTab(1), clickTab(0)],
    }));

  test('pagination', ({browser}) =>
    expectMaterialParity(browser, {route, scenario: 'pagination', steps: [clickChevron('after')]}));

  test('nav-bar', ({browser}) =>
    expectMaterialParity(browser, {
      route,
      scenario: 'nav-bar',
      steps: [
        clickLink(1),
        tabIntoFirstLink,
        pressKeyFocusOnly('ArrowRight'),
        pressKeySelect('Enter'),
      ],
    }));

  test('aria-label', ({browser}) =>
    expectMaterialParity(browser, {
      route,
      scenario: 'aria-label',
      steps: [clickTab(1, {groupIndex: 0})],
    }));
});
