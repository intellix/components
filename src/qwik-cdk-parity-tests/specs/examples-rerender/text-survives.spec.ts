import {test, expect} from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const BASE_URL = process.env['QWIK_URL'] ?? 'http://localhost:4173';

/**
 * Qwik v2 corrupts a `JSXOutput` that a component renders a second time (see
 * `qwik-material/core/jsx-reuse.ts`): a prop like a FAB's `icon` or a chip's remove-button
 * `content` came back empty after the first re-render — for most components, triggered by just
 * hovering or focusing them (ripple loader init, focus-origin classes). Every docs example is
 * swept: hover and focus each interactive element, then no element may have lost its own text.
 */
const ROUTES_DIR = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '../../../qwik-cdk-dev-app/src/routes',
);
const ROUTES = [
  ...fs
    .readdirSync(ROUTES_DIR)
    .filter(d => d.startsWith('mat-') && fs.existsSync(path.join(ROUTES_DIR, d, 'example')))
    .map(d => `${d}/example/`),
  ...fs
    .readdirSync(path.join(ROUTES_DIR, 'examples'), {withFileTypes: true})
    .filter(d => d.isDirectory())
    .map(d => `examples/${d.name}/`),
].sort();

/**
 * Known, documented gaps — run as expected failures so the suite stays green but flags them if
 * they start passing (same pattern `specs/examples/angular-parity.spec.ts`'s own
 * `EXPECTED_FAILURES` establishes).
 */
const EXPECTED_FAILURES: Record<string, string> = {
  'examples/checkbox-reactive-forms/':
    "downstream symptom of this example's own ALREADY-documented <p>/<div> parsing gap (see " +
    "its EXPECTED_FAILURES entry in specs/examples-forms/angular-parity.spec.ts): each <mat-" +
    'checkbox> is wrapped in a <p>, which the HTML5 parsing algorithm closes early at the ' +
    "checkbox's own inner <div> — so the browser's REAL parsed DOM never matches the tree Qwik's " +
    'own vnode model was built from. Confirmed live (isolated repro, narrowed down step by step): ' +
    'reproduces ONLY with the <p> wrapper present (removing it, keeping everything else — 2 ' +
    'checkboxes, formBound, onTouched$ — makes the sweep clean) and ONLY once a checkbox ' +
    "ACTUALLY re-renders client-side after mount (this example's new onTouched$-driven `touched` " +
    'signal write, fired on blur, is the first scenario combining the <p> wrapper with a ' +
    "live client-side re-render) — hovering off/onto a checkbox while it's patching a tree that " +
    "no longer matches the DOM's real shape corrupts its own <label><Slot/></label> into a " +
    'duplicate, empty one. Not a new MatCheckbox bug; a previously-unexercised consequence of the ' +
    'existing structural gap.',
};

const INTERACTIVE = [
  'button',
  'a[href]',
  '[role=tab]',
  '[role=option]',
  '[role=menuitem]',
  '.mat-mdc-chip',
  'input',
  'textarea',
  '[tabindex="0"]',
  '.mat-mdc-list-item',
  'mat-expansion-panel-header',
  '.mat-sort-header-container',
  'mat-tree-node',
  'mat-nested-tree-node',
].join(', ');

// Up to 40 hover+focus steps per page — more than the suite's default 30s under full-suite load.
test.describe.configure({timeout: 60_000});

for (const route of ROUTES) {
  test(`${route} keeps its text through hover/focus re-renders`, async ({page}) => {
    const gap = EXPECTED_FAILURES[route];
    test.fail(gap !== undefined, gap);
    await page.goto(`${BASE_URL}/${route}`);
    await page.waitForSelector('[data-parity-root]');
    await page.waitForTimeout(250);
    await page.evaluate(() => {
      for (const el of Array.from(document.querySelectorAll('[data-parity-root] *'))) {
        const own = Array.from(el.childNodes)
          .filter(c => c.nodeType === Node.TEXT_NODE)
          .map(c => c.textContent)
          .join('')
          .trim();
        if (own) el.setAttribute('data-text-before', own);
      }
    });

    const targets = page.locator(`[data-parity-root] :is(${INTERACTIVE})`);
    const count = Math.min(await targets.count(), 40);
    for (let i = 0; i < count; i++) {
      const target = targets.nth(i);
      await target.evaluate(el => el.scrollIntoView({block: 'center'}));
      const box = await target.boundingBox();
      if (!box || !box.width) continue;
      // Mouse moves (not `hover()`) so disabled controls are swept too.
      await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
      await page.waitForTimeout(100);
      await target.evaluate(el => (el as HTMLElement).focus?.());
      await page.waitForTimeout(60);
    }
    await page.mouse.move(1, 1);
    await page.waitForTimeout(350);

    const lost = await page.evaluate(() =>
      Array.from(document.querySelectorAll('[data-text-before]'))
        .filter(
          el =>
            !Array.from(el.childNodes)
              .filter(c => c.nodeType === Node.TEXT_NODE)
              .map(c => c.textContent)
              .join('')
              .trim(),
        )
        .map(el => `<${el.tagName.toLowerCase()}> lost "${el.getAttribute('data-text-before')}"`),
    );
    expect(lost).toEqual([]);
  });
}
