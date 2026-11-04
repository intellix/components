import {test, expect, type Page} from '@playwright/test';

/**
 * Functional (Qwik-only — no Angular comparison) coverage for the ripple-SUPPRESSION paths of
 * `qwik-material/list`'s new ripple wiring (`mat-list-item.tsx`'s `rippleDisabled`/`isInteractive`
 * — see `list/SYNC.md`'s "Ripple" section). Same category/technique as
 * `specs/material-core/ripple-global-options.spec.ts`: every row renders identical steady-state
 * DOM whether or not a ripple would fire, so there's nothing for a structural Angular-vs-Qwik
 * comparison to exercise (see the fixture's own doc comment,
 * `src/qwik-cdk-dev-app/src/routes/mat-list/ripple-functional/`). Reads the live
 * `.mat-ripple-element`'s presence synchronously right after the triggering `mousedown` —
 * `fadeInRipple` creates the element SYNCHRONOUSLY when it fires at all, so this needs no
 * animation-settle polling.
 *
 * `specs/material-list/ripple-mid-flight.spec.ts` covers the Angular-vs-Qwik DOM comparison
 * (mid-ripple AND after) for the one case that DOES fire — a plain interactive nav-list item.
 */

const QWIK_URL = process.env['QWIK_URL'] ?? 'http://localhost:4173';
const ROUTE = `${QWIK_URL}/mat-list/ripple-functional/`;

async function openPage(page: Page): Promise<void> {
  await page.goto(ROUTE);
  await page.waitForSelector('[data-scenario-ready]', {state: 'attached'});
}

async function pressDown(page: Page, selector: string): Promise<void> {
  const el = page.locator(selector).first();
  const box = await el.boundingBox();
  if (!box) throw new Error(`${selector} has no bounding box`);
  const x = box.x + box.width / 2;
  const y = box.y + box.height / 2;
  await page.mouse.move(x, y);
  await page.waitForTimeout(50);
  await page.mouse.down();
}

test.describe('qwik-material list-item ripple suppression — functional (Qwik only)', () => {
  test('control: a plain interactive item DOES launch a ripple on mousedown', async ({page}) => {
    await openPage(page);
    await pressDown(page, '.list-control button');
    await page.waitForTimeout(100);
    expect(
      await page.locator('.list-control .mat-ripple-element').count(),
      'fixture sanity check — ripples fire at all here',
    ).toBe(1);
    await page.mouse.up();
  });

  test('disableRipple on the containing list suppresses ripples for its items', async ({page}) => {
    await openPage(page);
    await pressDown(page, '.list-disable-ripple-on-list button');
    await page.waitForTimeout(100);
    expect(
      await page.locator('.list-disable-ripple-on-list .mat-ripple-element').count(),
      '<MatActionList disableRipple> — no ripple on its item',
    ).toBe(0);
    await page.mouse.up();
  });

  test('disableRipple on the item itself suppresses its own ripple', async ({page}) => {
    await openPage(page);
    await pressDown(page, '.list-disable-ripple-on-item button');
    await page.waitForTimeout(100);
    expect(
      await page.locator('.list-disable-ripple-on-item .mat-ripple-element').count(),
      '<MatListItem disableRipple> — no ripple',
    ).toBe(0);
    await page.mouse.up();
  });

  test('a non-interactive <MatList> item never launches a ripple', async ({page}) => {
    await openPage(page);
    await pressDown(page, '.list-non-interactive mat-list-item');
    await page.waitForTimeout(100);
    expect(
      await page.locator('.list-non-interactive .mat-ripple-element').count(),
      'non-interactive list — RippleRenderer never constructed at all',
    ).toBe(0);
    await page.mouse.up();
  });

  test('MAT_RIPPLE_GLOBAL_OPTIONS disabled suppresses a built-in list item ripple too', async ({
    page,
  }) => {
    await openPage(page);
    await pressDown(page, '.list-global-disabled button');
    await page.waitForTimeout(100);
    expect(
      await page.locator('.list-global-disabled .mat-ripple-element').count(),
      'useMatRippleProvider({disabled: true}) — no ripple',
    ).toBe(0);
    await page.mouse.up();
  });
});
