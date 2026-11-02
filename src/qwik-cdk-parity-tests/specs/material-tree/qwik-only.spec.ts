import {expect, test} from '@playwright/test';

const BASE_URL = process.env['QWIK_URL'] ?? 'http://localhost:4173';

/**
 * Qwik-only: behaviour `angular-parity.spec.ts` doesn't exercise — see
 * src/qwik-cdk-dev-app/src/routes/mat-tree/qwik-only/index.tsx's header
 * comment for why none of these has an Angular-mirrored scenario.
 */
test.describe('material-tree — qwik-only', () => {
  test('onExpandedChange$ fires with correct (key, expanded) for toggle-click and keyboard-driven changes', async ({
    page,
  }) => {
    await page.goto(`${BASE_URL}/mat-tree/qwik-only/`);
    await page.waitForSelector('[data-scenario-ready]');

    const log = page.locator('.expanded-change-log');
    await expect(log).toHaveText('(none)');

    await page.locator('button[aria-label="Toggle Root"]').click();
    await expect(log).toHaveText('root:true');

    await page.locator('button[aria-label="Toggle Root"]').click();
    await expect(log).toHaveText('root:true,root:false');

    // Keyboard-driven: focus the root node, ArrowRight expands, ArrowLeft
    // collapses — both go through the SAME callback as the toggle click.
    await page.locator('mat-tree-node[aria-expanded]').focus();
    await page.keyboard.press('ArrowRight');
    await expect(log).toHaveText('root:true,root:false,root:true');
    await page.keyboard.press('ArrowLeft');
    await expect(log).toHaveText('root:true,root:false,root:true,root:false');
  });

  test('onActivation$ fires with the activated node data for a leaf Enter/Space', async ({
    page,
  }) => {
    await page.goto(`${BASE_URL}/mat-tree/qwik-only/`);
    await page.waitForSelector('[data-scenario-ready]');

    const log = page.locator('.activation-log');
    await expect(log).toHaveText('(none)');

    await page.locator('button[aria-label="Toggle Root"]').click();
    await page.locator('mat-tree-node', {hasText: 'ChildA'}).click();
    await page.keyboard.press('Enter');
    await expect(log).toHaveText('ChildA');

    await page.keyboard.press('ArrowDown');
    await page.keyboard.press(' ');
    await expect(log).toHaveText('ChildA,ChildB');
  });

  test('MatTreeNodeToggle (qwik-material) and CdkTreeNodeToggle (qwik-cdk) are the same component', async ({
    page,
  }) => {
    await page.goto(`${BASE_URL}/mat-tree/qwik-only/`);
    await page.waitForSelector('[data-scenario-ready]');

    const cdkTree = page.locator('.cdk-toggle-tree');
    const matTree = page.locator('.mat-toggle-tree');
    await expect(cdkTree.locator('mat-nested-tree-node[aria-expanded="false"]')).toHaveCount(1);
    await expect(matTree.locator('mat-nested-tree-node[aria-expanded="false"]')).toHaveCount(1);

    await cdkTree.locator('button').click();
    await matTree.locator('button').click();
    await expect(cdkTree.locator('mat-nested-tree-node[aria-expanded="true"]')).toHaveCount(1);
    await expect(matTree.locator('mat-nested-tree-node[aria-expanded="true"]')).toHaveCount(1);
    await expect(cdkTree.getByText('Child', {exact: true})).toBeVisible();
    await expect(matTree.getByText('Child', {exact: true})).toBeVisible();
  });
});
