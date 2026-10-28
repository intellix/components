import {test, type Page} from '@playwright/test';
import {expectMaterialParity, type ParityStep} from '../../lib/material-parity.js';

const route = 'mat-bottom-sheet';

/**
 * mat-bottom-sheet — Angular DOM parity.
 *
 * Source of truth for every scenario: src/dev-app/qwik-parity/bottom-sheet.ts (exports
 * `BOTTOM_SHEET_SCENARIOS`, served at http://localhost:4200/qwik-parity/mat-bottom-sheet/
 * <scenario>). The Qwik side must render the same markup at
 * http://localhost:4173/mat-bottom-sheet/<scenario>/ inside its own `[data-parity-root]`.
 *
 * Unlike mat-dialog's scenarios, none of these auto-open: every scenario renders a real
 * `<button>` trigger inside `[data-parity-root]` and the sheet is opened by clicking it. Bottom
 * sheets render into `.cdk-overlay-container` under <body>, not inside the routed component's
 * own DOM, so every test below compares with `rootSelector: '.cdk-overlay-container'` instead
 * of the default `[data-parity-root]` (which only has to exist, holding the trigger button(s),
 * for `expectMaterialParity`'s `open()` to wait on — its content, including the trigger
 * button's own markup, is NEVER diffed). Nothing auto-opens, so — unlike mat-dialog's spec —
 * none of these need `skipInitialCompare`: the pre-step compare runs with no overlay on either
 * side yet (both apps' `.cdk-overlay-container` is absent until the first `MatBottomSheet.open()`
 * call, same lazy-creation behavior already proven by the mat-dialog/cdk-dialog specs).
 *
 * Shared skeleton every scenario produces once open — verified live against the real Angular
 * dev-app (not read off source alone), default Playwright viewport (1280x720):
 *
 *   <div class="cdk-overlay-container">
 *     <div class="cdk-overlay-popover cdk-global-overlay-wrapper" popover="manual" dir="ltr"
 *          style="justify-content: center; align-items: flex-end">
 *       <div class="cdk-overlay-backdrop cdk-overlay-dark-backdrop cdk-overlay-backdrop-showing">
 *       </div>  <!-- absent entirely when hasBackdrop: false; see backdrop notes below -->
 *       <div class="cdk-overlay-pane" id="cdk-overlay-#"
 *            style="max-width: 100%; position: static; margin-bottom: 0px">
 *         <div class="cdk-visually-hidden cdk-focus-trap-anchor" aria-hidden="true" tabindex="0">
 *         </div>
 *         <mat-bottom-sheet-container
 *             class="mat-bottom-sheet-container cdk-dialog-container
 *                    mat-bottom-sheet-container-large mat-bottom-sheet-container-animations-enabled
 *                    [mat-bottom-sheet-container-enter|mat-bottom-sheet-container-exit]"
 *             tabindex="-1" role="dialog" aria-modal="false" [aria-label="..."]
 *             id="cdk-dialog-#" [mat-exit=""]>
 *           <!-- content component, host tag = its own `selector` (see bottom-sheet.ts) -->
 *         </mat-bottom-sheet-container>
 *         <div class="cdk-visually-hidden cdk-focus-trap-anchor" aria-hidden="true" tabindex="0">
 *         </div>
 *       </div>
 *     </div>
 *   </div>
 *
 * Notes on the above, all verified against the live Angular dev-app:
 *   - The backdrop and the pane are SIBLINGS, both direct children of the
 *     `.cdk-overlay-popover.cdk-global-overlay-wrapper` div — not nested inside one another. That
 *     wrapper also carries `popover="manual"` (this Angular build's CDK overlay is implemented on
 *     top of the native HTML Popover API) and an inline `justify-content`/`align-items` pair
 *     (`center`/`flex-end` for the bottom-center position every scenario here uses — see
 *     `GlobalPositionStrategy` in src/cdk/overlay/position/global-position-strategy.ts).
 *   - The pane itself always carries `id="cdk-overlay-#"` (a *different* id sequence than the
 *     container's own `cdk-dialog-#`) plus inline `position: static; margin-bottom: 0px` in
 *     addition to the `max-width: 100%` that `MatBottomSheet.open()` hardcodes — all from the
 *     shared `GlobalPositionStrategy`/`OverlayRef` machinery, not bottom-sheet-specific.
 *   - The container's class list includes BOTH `mat-bottom-sheet-container` (its own) AND
 *     `cdk-dialog-container` (inherited straight from `CdkDialogContainer`'s own host binding,
 *     which Angular keeps even though `MatBottomSheetContainer`'s `@Component` redeclares
 *     `'class': 'mat-bottom-sheet-container'`) — both classes are real and both must be present.
 *   - `mat-bottom-sheet-container-large` (not `-medium`/`-xlarge`): `BreakpointObserver.observe`
 *     evaluates synchronously against the real viewport the moment the container is
 *     constructed. 1280x720 (Playwright's default) falls in `Breakpoints.Large`
 *     (1280–1919.98px), not Medium (960–1279.98) or XLarge (>=1920px) — see bottom-sheet.ts's
 *     header comment. This is a real-viewport fact, not something either app can special-case.
 *   - The focus-trap anchors are present in EVERY scenario, not only ones with a non-default
 *     `autoFocus` — `CdkDialogContainer._initializeFocusTrap()` always calls
 *     `FocusTrapFactory.create()` with eager anchor attachment. See bottom-sheet.ts.
 *   - `id="cdk-dialog-#"` (digits squashed by the harness) appears on every container: the
 *     underlying `Dialog.open()` auto-generates one whenever the caller doesn't supply one,
 *     which `MatBottomSheet` never does.
 *   - `aria-modal` is `"false"` on every scenario here (none override `ariaModal`) — this is
 *     MatBottomSheetConfig's own real default, NOT the dialog-specific drift called out in
 *     dialog.ts (qwik-material's `MatDialogContainer` wrongly defaults dialogs' `ariaModal` to
 *     `true`); that drift must not be reproduced for bottom sheets.
 *   - Backdrop classes: with no explicit `backdropClass`, the backdrop is
 *     `cdk-overlay-backdrop cdk-overlay-dark-backdrop` — an explicit `backdropClass` (see
 *     `panel-class` below) REPLACES `cdk-overlay-dark-backdrop` entirely rather than adding
 *     alongside it (verified live: the `panel-class` scenario's backdrop shows
 *     `cdk-overlay-backdrop my-backdrop-class`, with no `cdk-overlay-dark-backdrop`). Once
 *     shown, it also gains `cdk-overlay-backdrop-showing` (controls its fade-in opacity
 *     transition); once a close starts, that class is REMOVED and an inline
 *     `style="pointer-events: none"` is added instead (verified live via the `close-on-escape`
 *     step below) — so a "closing" snapshot's backdrop no longer has `-showing` and does carry
 *     that inline style.
 *   - `exit()` (see bottom-sheet-container.ts) sets a bare `mat-exit=""` attribute via a direct
 *     `setAttribute()` call, synchronously, before the `-exit` class even lands via change
 *     detection on the next tick. It shows up in every "closing" step below.
 *
 * `enter()` forces the `-enter` class synchronously (`detectChanges()`), so it's already present
 * by the time a trigger click's handler returns — no extra wait needed beyond the harness's own
 * two-animation-frame settle. `exit()` only `markForCheck()`s, applied on the next CD tick — for
 * Escape (a direct, synchronous `keydown` listener) that's still well within the harness's
 * two-animation-frame settle, so `escape` below needs no extra wait. A backdrop click is
 * different: verified live, `MatBottomSheetRef`'s backdrop-click-driven `dismiss()` can take
 * noticeably longer than two animation frames to land (CDK's overlay backdrop click plumbing
 * isn't perfectly synchronous with the click event) — so `backdropClickClose` below (used
 * wherever a backdrop click is expected to actually close the sheet) explicitly waits for the
 * `mat-exit` attribute (or full removal) before returning, the same way `clickTrigger` explicitly
 * waits for the container to attach on open. The plain `backdropClick` (no wait) is reused for
 * `disable-close`, where the click is expected to do nothing. No scenario below waits for the
 * container to be fully removed from the DOM — "closing" snapshots are taken mid-exit.
 */

const rootSelector = '.cdk-overlay-container';

/**
 * Clicks a trigger that opens the bottom sheet, then waits for the container to attach. Qwik's
 * `open$` (or equivalent) is a lazily-loaded QRL — on a cold click there is a real (if brief)
 * async gap between the click resolving and the overlay actually registering, unlike Angular's
 * fully-synchronous `MatBottomSheet.open()`. Without this wait, a compare run immediately after
 * this step could race ahead of Qwik's QRL load — see the identical helper in
 * specs/material-dialog/angular-parity.spec.ts.
 */
const clickTrigger = (selector: string): ParityStep => ({
  name: 'click trigger',
  run: async (page: Page) => {
    await page.locator(selector).click();
    await page.waitForSelector('mat-bottom-sheet-container', {state: 'attached', timeout: 10_000});
  },
});

const escape: ParityStep = {
  name: 'press Escape',
  run: (page: Page) => page.keyboard.press('Escape'),
};

/**
 * Clicks the backdrop near a corner, NOT its (Playwright-default) center — see the identical
 * helper + comment in specs/material-dialog/angular-parity.spec.ts: the backdrop's bounding box
 * is the full viewport and the sheet pane spans the full width at the bottom, but a corner like
 * `{5, 5}` (top-left) is reliably outside of it for every scenario here. Used where the click is
 * expected to do nothing (`disable-close`) — see `backdropClickClose` below for where it's
 * expected to actually close the sheet.
 */
const backdropClick: ParityStep = {
  name: 'click backdrop',
  run: (page: Page) =>
    page.locator('.cdk-overlay-backdrop').click({position: {x: 5, y: 5}, force: true}),
};

/**
 * Like `backdropClick`, but for scenarios where the click is expected to actually dismiss the
 * sheet. Verified live: the resulting `dismiss()` can land noticeably later than the harness's
 * own two-animation-frame settle (unlike Escape's direct, synchronous `keydown` handler) — so
 * this waits for `mat-exit` to appear (or the container to be removed outright) before
 * returning, giving a consistent snapshot point for both apps. See the spec's header comment.
 */
const backdropClickClose: ParityStep = {
  name: 'click backdrop (closes)',
  run: async (page: Page) => {
    await page.locator('.cdk-overlay-backdrop').click({position: {x: 5, y: 5}, force: true});
    await page
      .waitForFunction(
        () => {
          const el = document.querySelector('mat-bottom-sheet-container');
          return !el || el.hasAttribute('mat-exit');
        },
        undefined,
        {timeout: 10_000},
      )
      .catch(() => {});
  },
};

const clickButton = (text: string): ParityStep => ({
  name: `click button "${text}"`,
  run: (page: Page) => page.getByRole('button', {name: text, exact: true}).click(),
});

/**
 * `basic`'s nav-list actions (`<a mat-list-item href="#">`, mirroring the real demo — see
 * `BottomSheetNavBody` in bottom-sheet.ts) are links, not buttons, so they need the `link` role
 * rather than `clickButton`'s `button` role.
 */
const clickLink = (text: string): ParityStep => ({
  name: `click link "${text}"`,
  run: (page: Page) => page.getByRole('link', {name: text, exact: true}).click(),
});

/**
 * For `replace-sheet`: the "Open second" button lives INSIDE the first sheet's own content
 * (see `BottomSheetFirstBody` in bottom-sheet.ts) rather than on the page underneath — the
 * page's own triggers sit behind the first sheet's `hasBackdrop: true` backdrop once it's open
 * (the backdrop blocks pointer events to everything behind it, by design), so a page-level
 * "open second" button would need an unrealistic forced click. Clicking it dismisses the first
 * sheet (starting its 375ms exit) and only calls `enter()` on the second once the first's
 * `afterDismissed()` fires — see `MatBottomSheet.open()`'s `if (this._openedBottomSheetRef)`
 * branch in src/material/bottom-sheet/bottom-sheet.ts. For a brief window there can be TWO
 * `<mat-bottom-sheet-container>` elements in the overlay container at once (the first mid-exit,
 * the second already attached but still in its initial `'void'` animation state, pinned
 * off-screen by `.mat-bottom-sheet-container-animations-enabled`'s base `transform`). This step
 * waits past that window for the steady end state: exactly one container, carrying the
 * `-enter` class, whose content is the SECOND body.
 */
const secondSheetSettled: ParityStep = {
  name: 'second sheet replaces first',
  run: async (page: Page) => {
    await page
      .waitForFunction(
        () => {
          const containers = document.querySelectorAll('mat-bottom-sheet-container');
          if (containers.length !== 1) return false;
          const el = containers[0];
          return (
            el.classList.contains('mat-bottom-sheet-container-enter') &&
            (el.textContent ?? '').includes('Second sheet')
          );
        },
        undefined,
        {timeout: 10_000},
      )
      .catch(() => {});
  },
};

test.describe('mat-bottom-sheet — Angular DOM parity', () => {
  test('basic', ({browser}) =>
    expectMaterialParity(browser, {
      route,
      scenario: 'basic',
      rootSelector,
      steps: [clickTrigger('button.open-button')],
    }));

  test('basic — dismiss via content click', ({browser}) =>
    expectMaterialParity(browser, {
      route,
      scenario: 'basic',
      rootSelector,
      steps: [clickTrigger('button.open-button'), clickLink('Action 1')],
    }));

  test('close-on-backdrop', ({browser}) =>
    expectMaterialParity(browser, {
      route,
      scenario: 'close-on-backdrop',
      rootSelector,
      steps: [clickTrigger('button.open-button'), backdropClickClose],
    }));

  test('close-on-escape', ({browser}) =>
    expectMaterialParity(browser, {
      route,
      scenario: 'close-on-escape',
      rootSelector,
      steps: [clickTrigger('button.open-button'), escape],
    }));

  test('disable-close', ({browser}) =>
    expectMaterialParity(browser, {
      route,
      scenario: 'disable-close',
      rootSelector,
      steps: [clickTrigger('button.open-button'), escape, backdropClick],
    }));

  test('no-backdrop', ({browser}) =>
    expectMaterialParity(browser, {
      route,
      scenario: 'no-backdrop',
      rootSelector,
      steps: [clickTrigger('button.open-button')],
    }));

  test('panel-class', ({browser}) =>
    expectMaterialParity(browser, {
      route,
      scenario: 'panel-class',
      rootSelector,
      steps: [clickTrigger('button.open-button')],
    }));

  test('aria-label', ({browser}) =>
    expectMaterialParity(browser, {
      route,
      scenario: 'aria-label',
      rootSelector,
      steps: [clickTrigger('button.open-button')],
    }));

  test('with-data', ({browser}) =>
    expectMaterialParity(browser, {
      route,
      scenario: 'with-data',
      rootSelector,
      steps: [clickTrigger('button.open-button')],
    }));

  test('with-data — dismiss with result', ({browser}) =>
    expectMaterialParity(browser, {
      route,
      scenario: 'with-data',
      rootSelector,
      steps: [clickTrigger('button.open-button'), clickButton('Close')],
    }));

  test('restore-focus', ({browser}) =>
    expectMaterialParity(browser, {
      route,
      scenario: 'restore-focus',
      rootSelector,
      steps: [clickTrigger('button.restore-trigger')],
    }));

  test('restore-focus — close restores focus', ({browser}) =>
    expectMaterialParity(browser, {
      route,
      scenario: 'restore-focus',
      rootSelector,
      steps: [clickTrigger('button.restore-trigger'), escape],
    }));

  test('replace-sheet', ({browser}) =>
    expectMaterialParity(browser, {
      route,
      scenario: 'replace-sheet',
      rootSelector,
      steps: [clickTrigger('button.open-first'), clickButton('Open second'), secondSheetSettled],
    }));
});
