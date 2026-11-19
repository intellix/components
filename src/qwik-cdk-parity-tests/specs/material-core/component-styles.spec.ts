import {test, expect, type Page} from '@playwright/test';

const QWIK_URL = process.env['QWIK_URL'] ?? 'http://localhost:4173';

/**
 * qwik-material components register their own CSS with `useStyles$` when they render, inside
 * `@layer qwik-material` (qwik-material README "Component styles") — the app imports only the
 * global core CSS. Checked against the built dev-app, since how a component's CSS reaches a
 * component first rendered in the browser depends on the production client build's chunking (a
 * style segment re-exporting an `?inline` import registered an empty `<style>` there).
 */
const componentStyles = (page: Page) =>
  page.evaluate(() =>
    Array.from(document.querySelectorAll('style[q\\:style]')).map(s => ({
      parent: s.parentElement!.tagName.toLowerCase(),
      css: s.textContent ?? '',
    })),
  );

test.describe('qwik-material component styles', () => {
  test("a server-rendered page carries each rendered component's CSS once, in the layer", async ({
    page,
  }) => {
    // The dialog-overview example: a form field and a button, no dialog until one is opened.
    await page.goto(`${QWIK_URL}/mat-dialog/example/`);
    await page.waitForSelector('[data-scenario-ready]');
    const styles = await componentStyles(page);
    const carrying = (rule: string) => styles.filter(s => s.css.includes(rule));
    expect(carrying('.mat-mdc-button{')).toHaveLength(1);
    expect(carrying('.mat-mdc-form-field{')).toHaveLength(1);
    expect(carrying('.mat-mdc-dialog-container{')).toHaveLength(0);
    for (const style of styles)
      expect(style.css).toMatch(/^@layer qwik-cdk,qwik-material;@layer qwik-material\{[^]+\}$/);
    await expect(page.locator('.mat-mdc-button-base')).toHaveCSS('display', 'inline-flex');
  });

  test('a dialog first rendered in the browser brings its CSS', async ({page}) => {
    // Opens a dialog after resume.
    await page.goto(`${QWIK_URL}/mat-dialog/basic/`);
    await expect(page.locator('.mdc-dialog--open')).toBeVisible();
    const dialog = (await componentStyles(page)).filter(s =>
      s.css.includes('.mat-mdc-dialog-container{'),
    );
    expect(dialog).toHaveLength(1);
    expect(dialog[0].parent).toBe('head');
    // dialog.css's `.cdk-overlay-pane.mat-mdc-dialog-panel { min-width: … 280px }` applies.
    await expect(page.locator('.cdk-overlay-pane.mat-mdc-dialog-panel')).toHaveCSS(
      'min-width',
      '280px',
    );
  });

  // qwik-cdk's CSS sits in `@layer qwik-cdk`, declared below `qwik-material`
  // (`@layer qwik-cdk, qwik-material;`), so material's rules on CDK overlay elements beat the
  // CDK's own — as source order (cdk imported first) had it before either was layered.
  test("dialog.css's 560px max-width beats the CDK pane's 100%", async ({page}) => {
    await page.setViewportSize({width: 1600, height: 900});
    await page.goto(`${QWIK_URL}/mat-dialog/basic/`);
    await expect(page.locator('.mdc-dialog--open')).toBeVisible();
    await expect(page.locator('.cdk-overlay-pane.mat-mdc-dialog-panel')).toHaveCSS(
      'max-width',
      '560px',
    );
  });

  test("autocomplete.css hides a hidden panel's pane from pointer events over the CDK's", async ({
    page,
  }) => {
    // autocomplete.css: `.cdk-overlay-pane:has(> .mat-mdc-autocomplete-hidden) { pointer-events:
    // none }` against the CDK's `.cdk-overlay-pane { pointer-events: auto }`.
    await page.goto(`${QWIK_URL}/mat-autocomplete/basic-filter/`);
    await page.waitForSelector('[data-scenario-ready]');
    const pointerEvents = await page.evaluate(() => {
      const pane = document.createElement('div');
      pane.className = 'cdk-overlay-pane';
      pane.innerHTML = '<div class="mat-mdc-autocomplete-panel mat-mdc-autocomplete-hidden"></div>';
      document.body.append(pane);
      return getComputedStyle(pane).pointerEvents;
    });
    expect(pointerEvents).toBe('none');
  });

  // datepicker.css overrides the button CSS at equal specificity (`.mat-calendar-period-button {
  // min-width: 0 }` over `.mdc-button`'s 64px); inside the one `qwik-material` layer only document
  // order settles it, so the button `<style>` must come first however the calendar arrives.
  const openCalendar = async (page: Page, route: string, serverButtonCss: boolean) => {
    await page.goto(`${QWIK_URL}/mat-datepicker/${route}/`);
    await page.waitForSelector('[data-scenario-ready]');
    const before = await componentStyles(page);
    expect(before.filter(s => s.css.includes('.mat-mdc-button{'))).toHaveLength(
      serverButtonCss ? 1 : 0,
    );
    expect(before.filter(s => s.css.includes('.mat-calendar-period-button{'))).toHaveLength(0);
    await page.locator('button.open-calendar').click();
    const period = page.locator('.mat-calendar-period-button');
    await expect(period).toBeVisible();
    return period;
  };

  test('a calendar first rendered in a dialog overrides the server-rendered button CSS', async ({
    page,
  }) => {
    const period = await openCalendar(page, 'calendar-in-dialog', true);
    await expect(period).toHaveCSS('min-width', '0px');
  });

  test('a calendar first rendered in a dialog brings the button CSS before its own', async ({
    page,
  }) => {
    const period = await openCalendar(page, 'calendar-in-dialog-plain', false);
    const css = (await componentStyles(page)).map(s => s.css);
    expect(css.findIndex(c => c.includes('.mat-mdc-button{'))).toBeLessThan(
      css.findIndex(c => c.includes('.mat-calendar-period-button{')),
    );
    await expect(period).toHaveCSS('min-width', '0px');
  });

  // Known limitation (README "Component styles"): a SECOND copy of the button CSS — registered
  // from a non-first hook position, which the README says not to do — lands after the datepicker
  // CSS and wins the tie. Upstream has the same order dependency (styles attach in creation
  // order). Per-entry sub-layers would make it order-independent but break the specificity-based
  // overlaps between entry points (`.mat-mdc-icon-button svg` over `.mat-mdc-paginator-icon`,
  // `.mat-badge.mat-badge` over `.mat-icon`, …), so this stays an expected failure.
  test('known limitation: a second copy of the button CSS registered later wins the tie', async ({
    page,
  }) => {
    test.fail();
    const period = await openCalendar(page, 'calendar-in-dialog', true);
    await page.locator('button.show-hand-written').click();
    await expect(page.locator('button.hand-written')).toBeVisible();
    const css = (await componentStyles(page)).map(s => s.css);
    expect(css.filter(c => c.includes('.mat-mdc-button{'))).toHaveLength(2);
    await expect(period).toHaveCSS('min-width', '0px', {timeout: 2000});
  });

  test("an app's unlayered rule beats qwik-material's, whatever the specificity", async ({
    page,
  }) => {
    await page.goto(`${QWIK_URL}/mat-dialog/example/`);
    await page.waitForSelector('[data-scenario-ready]');
    const button = page.locator('.mat-mdc-button-base').first();
    await expect(button).not.toHaveCSS('padding-left', '3px');
    // A type selector (0,0,1) in <head>, BEFORE the component's `<style>` in <body>, against
    // `.mat-mdc-button`'s (0,1,0) padding: only the layer can make it win.
    await page.evaluate(() => {
      const style = document.createElement('style');
      style.textContent = 'button { padding-left: 3px; }';
      document.head.prepend(style);
    });
    await expect(button).toHaveCSS('padding-left', '3px');
  });
});
