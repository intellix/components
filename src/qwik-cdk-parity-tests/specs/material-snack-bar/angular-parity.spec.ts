import {test, type Page} from '@playwright/test';
import {expectMaterialParity, type ParityStep} from '../../lib/material-parity.js';

/**
 * mat-snack-bar — Angular DOM parity.
 *
 * Source of truth for every scenario: src/dev-app/qwik-parity/snack-bar.ts (exports
 * `SNACK_BAR_SCENARIOS`, served at http://localhost:4200/qwik-parity/mat-snack-bar/<scenario>).
 * The Qwik side must render the same markup at
 * http://localhost:4173/mat-snack-bar/<scenario>/ once its own trigger is clicked.
 *
 * None of these scenarios auto-open — every page renders only a trigger button (or several)
 * inside `[data-parity-root]`, matching the task requirement that nothing opens on mount. The
 * snack bar itself attaches into `.cdk-overlay-container` under <body> (see
 * `specs/material-dialog/angular-parity.spec.ts` / `specs/cdk-dialog/angular-parity.spec.ts` for
 * the established pattern), so every test below uses that as `rootSelector`. Before any trigger
 * is clicked, neither app has created an overlay yet, so `.cdk-overlay-container` doesn't exist
 * on either side — the initial comparison (not skipped) passes trivially (both sides report 0
 * elements; see `expectMaterialParity`'s early return when `aCount === 0`), the same precedent
 * `close-with-result`/`restore-focus` rely on in the mat-dialog spec.
 *
 * SETTLING: two separate async processes must be waited out before any snapshot, independent of
 * the two animation frames `expectMaterialParity` already awaits after every step — see
 * src/dev-app/qwik-parity/snack-bar.ts's header comment for the full explanation:
 *
 *   1. The screen-reader-announce move: ~150ms after a snack bar enters, the WHOLE `<div
 *      aria-hidden="true">` wrapper (not just its content) relocates to become a child of the
 *      sibling `<div aria-live="...">`, with the `aria-hidden` attribute stripped off in the
 *      process — a genuine DOM mutation on a plain timer, unrelated to CSS animation state. Once
 *      this has happened, no `[aria-hidden]` element remains anywhere in the container.
 *      `waitSettled()` below polls for "exactly one `.mat-mdc-snack-bar-container`, and it no
 *      longer contains an `[aria-hidden]` element" before resolving, so a snapshot never lands
 *      mid-move on either app.
 *   2. Replacing an open snack bar with another (`MatSnackBar.open()` et al. called again):
 *      verified directly against the running Angular app (not just by reading
 *      `MatSnackBar._attach()`/`_animateSnackBar()`), both the old (exiting) and new (entering)
 *      `.mat-mdc-snack-bar-container` elements ARE briefly both present — upstream attaches the
 *      new container's overlay *before* `_animateSnackBar()` even looks at whether to dismiss a
 *      previous one; only the new one's `enter()` call is deferred until the old one's
 *      `afterDismissed`. An earlier draft of this comment (and of the mirrored header comment in
 *      `src/dev-app/qwik-parity/snack-bar.ts`) claimed the opposite ("never a moment with two
 *      containers at once") from reading the source alone, without checking the real timing —
 *      that claim was wrong and is corrected here. Practical consequence for this file:
 *      `clickThenSettle()` below inserts a short real delay after the click, before the first
 *      `waitSettled()`/`waitRemoved()` poll — not to wait out the transition itself (the
 *      polling loops already do that, how ever long it takes, up to their own 5s timeout), but
 *      because a Qwik click handler is *never* run synchronously within the browser's own
 *      `click` event dispatch (`on:click` is resolved via a dynamically-imported QRL, at best a
 *      microtask away, unlike Angular's directly-bound, synchronous `(click)` listener) — so
 *      `page.waitForFunction`'s very first (effectively immediate) check can observe the *pre*-
 *      click, already-settled state and resolve right away, before the Qwik side's handler has
 *      had any chance to even start. That's not a race specific to this component; it would
 *      affect any Qwik interaction polled this tightly. The delay is far shorter than the ~150ms/
 *      ~75ms timers it's guarding against, so it adds negligible time while removing the false
 *      positive.
 *
 * Dismissal (explicit `dismiss()`, or the snack bar's own action button calling
 * `dismissWithAction()`) runs a ~75ms exit animation before the whole overlay (wrapper + pane +
 * container) is removed from the DOM; `waitRemoved()` below waits for that end state directly
 * rather than trying to catch the transient `mat-exit`-attributed frame in between (the exit-
 * animation analogue of how the mat-dialog spec's `settled` step waits past MDC's transient
 * `mdc-dialog--opening` class instead of asserting it).
 */

const route = 'mat-snack-bar';
const rootSelector = '.cdk-overlay-container';
const CONTAINER = '.mat-mdc-snack-bar-container';

/** Scopes a trigger lookup to this scenario's own content, never the dev-app chrome around it. */
const trigger = (page: Page, text: string) =>
  page.locator('[data-parity-root]').getByRole('button', {name: text, exact: true});

/**
 * Waits for exactly one snack bar container to be present AND for the screen-reader-announce
 * move to have already happened (see header comment, point 1) — i.e. no `[aria-hidden]` element
 * remains anywhere inside the container. Safe to call after opening a fresh snack bar or after
 * replacing one that was already open — in both cases there is only ever one container by the
 * time this condition can be true.
 */
function waitSettled(page: Page): Promise<unknown> {
  return page.waitForFunction(
    () => {
      const containers = document.querySelectorAll('.mat-mdc-snack-bar-container');
      if (containers.length !== 1) return false;
      return !containers[0].querySelector('[aria-hidden]');
    },
    undefined,
    {timeout: 5000},
  );
}

/** Waits for the snack bar container to be fully removed from the DOM (exit animation done). */
function waitRemoved(page: Page): Promise<unknown> {
  return page.waitForSelector(CONTAINER, {state: 'detached', timeout: 5000});
}

/**
 * Lets a just-dispatched click's handler actually start running before any settle-polling
 * begins — see header comment, point 2, for why this is needed on the Qwik side specifically
 * (a Qwik `on:click` always resolves its QRL asynchronously, unlike Angular's synchronous
 * `(click)` binding). 50ms is generously more than the handler-dispatch latency this guards
 * against (observed a few ms to ~20ms) and negligible next to the ~75–225ms the subsequent
 * poll already waits out.
 */
async function settleClick(page: Page): Promise<void> {
  await page.waitForTimeout(50);
}

/** Clicks a trigger button in `[data-parity-root]`, then waits for the opened state to settle. */
const open = (buttonText: string): ParityStep => ({
  name: `click "${buttonText}"`,
  run: async (page: Page) => {
    await trigger(page, buttonText).click();
    await settleClick(page);
    await waitSettled(page);
  },
});

/** Clicks a trigger button that calls `MatSnackBar.dismiss()`, then waits for full removal. */
const dismissByButton = (buttonText: string): ParityStep => ({
  name: `click "${buttonText}"`,
  run: async (page: Page) => {
    await trigger(page, buttonText).click();
    await settleClick(page);
    await waitRemoved(page);
  },
});

/** Clicks the snack bar's OWN action button (by its visible text), then waits for full removal. */
const dismissByAction = (actionText: string): ParityStep => ({
  name: `click action "${actionText}"`,
  run: async (page: Page) => {
    await page.locator(CONTAINER).getByRole('button', {name: actionText, exact: true}).click();
    await settleClick(page);
    await waitRemoved(page);
  },
});

test.describe('mat-snack-bar — Angular DOM parity', () => {
  test('simple-message', ({browser}) =>
    expectMaterialParity(browser, {
      route,
      scenario: 'simple-message',
      rootSelector,
      steps: [open('Show message'), dismissByButton('Dismiss')],
    }));

  test('with-action', ({browser}) =>
    expectMaterialParity(browser, {
      route,
      scenario: 'with-action',
      rootSelector,
      steps: [open('Show with action'), dismissByAction('Undo')],
    }));

  test('horizontal-position', ({browser}) =>
    expectMaterialParity(browser, {
      route,
      scenario: 'horizontal-position',
      rootSelector,
      steps: [open('Start'), open('Center'), open('End'), open('Left'), open('Right')],
    }));

  test('vertical-position', ({browser}) =>
    expectMaterialParity(browser, {
      route,
      scenario: 'vertical-position',
      rootSelector,
      steps: [open('Top'), open('Bottom')],
    }));

  test('panel-class', ({browser}) =>
    expectMaterialParity(browser, {
      route,
      scenario: 'panel-class',
      rootSelector,
      steps: [open('Show styled')],
    }));

  test('politeness', ({browser}) =>
    expectMaterialParity(browser, {
      route,
      scenario: 'politeness',
      rootSelector,
      steps: [open('Assertive'), open('Off')],
    }));

  test('custom-component', ({browser}) =>
    expectMaterialParity(browser, {
      route,
      scenario: 'custom-component',
      rootSelector,
      steps: [open('Show custom'), dismissByAction('View')],
    }));

  test('from-template', ({browser}) =>
    expectMaterialParity(browser, {
      route,
      scenario: 'from-template',
      rootSelector,
      steps: [open('Show template'), dismissByButton('Dismiss')],
    }));
});
