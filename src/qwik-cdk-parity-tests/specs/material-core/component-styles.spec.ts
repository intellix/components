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
    for (const style of styles) expect(style.css).toMatch(/^@layer qwik-material\{[^]+\}$/);
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
