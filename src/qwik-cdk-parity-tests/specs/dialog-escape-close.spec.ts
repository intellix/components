import {test, expect} from '@playwright/test';
import {snapshot, diffNodes} from '../lib/structural-diff.js';

/**
 * URL NOTE:
 * - Angular CDK dev-app: the dialog demo lives at http://localhost:4200/dialog
 *   (not /dialog/escape-close — the CDK dev-app uses a single demo component with all scenarios).
 *   The test navigates to /dialog/escape-close; if that 404s, update the URL to /dialog and
 *   adjust the selector to target the portion of the DOM that corresponds to this scenario.
 * - qwik-cdk dev-app: runs on port 4173 (preview mode) at http://localhost:4173/dialog/escape-close.
 *   (Vite preview default is 4173, not 5173 — see playwright.config.ts.)
 *
 * INTERACTION NOTE:
 * This spec snapshots the OPEN state only (before pressing Escape). The behaviour of closing
 * on Escape is verified by the qwik-cdk dialog vitest unit tests, not by this structural
 * parity test. DOM diffing is meaningful only while both dialogs are in the same open state.
 */
test('dialog escape-close: structural parity (open state)', async ({page, browser}) => {
  // Snapshot Angular CDK dev-app (open state before Escape)
  await page.goto('http://localhost:4200/dialog/escape-close');
  await page.waitForSelector('.cdk-overlay-container');
  const angularSnap = await snapshot(page.locator('.cdk-overlay-container'));

  // Snapshot qwik-cdk dev-app in a fresh context (open state before Escape)
  const ctx2 = await browser.newContext();
  const page2 = await ctx2.newPage();
  try {
    await page2.goto('http://localhost:4173/dialog/escape-close');
    await page2.waitForSelector('.cdk-overlay-container');
    const qwikSnap = await snapshot(page2.locator('.cdk-overlay-container'));

    const diffs = diffNodes(angularSnap, qwikSnap);
    expect(diffs, diffs.join('\n')).toEqual([]);
  } finally {
    await ctx2.close();
  }
});
