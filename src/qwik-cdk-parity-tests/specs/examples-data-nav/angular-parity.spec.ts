import {test, type Page} from '@playwright/test';
import {expectMaterialParity, type ParityStep} from '../../lib/material-parity.js';

/**
 * Phase 2 of the qwik-material docs site (data & navigation batch): material.angular.dev
 * examples referenced by this batch's component guides, beyond each component's Phase-1
 * headline example (covered by `specs/examples/angular-parity.spec.ts`).
 *
 * Uses the generic `examples/:exampleId` route on both sides: Angular renders any upstream
 * example by id unmodified at `/qwik-parity/examples/<id>`; the Qwik side is a thin wrapper at
 * `src/qwik-cdk-dev-app/src/routes/examples/<id>/index.tsx`, same shape as every other wrapper
 * route in this dev-app.
 */
const EXAMPLES: string[] = ['toolbar-simple', 'toolbar-multirow', 'table-sorting'];

const SETTLE_MS = 150;

/** `table-sorting` — sorting the "Name" column ascending via its `<MatTable sort>` header. */
const clickSortHeader = (index: number): ParityStep => ({
  name: `click sort header ${index}`,
  run: async (page: Page) => {
    await page.locator('[data-parity-root] th[mat-sort-header]').nth(index).click({force: true});
    await page.waitForTimeout(SETTLE_MS);
  },
});

/** Interactions for examples whose main behavior is behind one. */
const EXAMPLE_STEPS: Record<string, {steps: ParityStep[]; rootSelector?: string}[]> = {
  'table-sorting': [{steps: [clickSortHeader(1)]}],
};

/** Per-example `ignoreAttrs` — see `specs/examples/angular-parity.spec.ts`'s own comment. */
const EXAMPLE_IGNORE_ATTRS: Record<string, string[]> = {
  'table-sorting': ['sortactiondescription'],
};

/** Known, documented gaps — run as expected failures so the suite stays green but flags them if
 *  they start passing. */
const EXPECTED_FAILURES: Record<string, string> = {};

test.describe('material.angular.dev examples (data & navigation) — Angular DOM parity', () => {
  for (const id of EXAMPLES) {
    const ignoreAttrs = EXAMPLE_IGNORE_ATTRS[id];
    test(`examples/${id}`, ({browser}) => {
      const gap = EXPECTED_FAILURES[id];
      test.fail(gap !== undefined, gap);
      return expectMaterialParity(browser, {
        pinRoot: true,
        route: 'examples',
        scenario: id,
        ignoreAttrs,
      });
    });
    for (const [i, extra] of (EXAMPLE_STEPS[id] ?? []).entries()) {
      test(`examples/${id} (interaction ${i + 1})`, ({browser}) =>
        expectMaterialParity(browser, {
          pinRoot: true,
          route: 'examples',
          scenario: id,
          steps: extra.steps,
          rootSelector: extra.rootSelector,
          ignoreAttrs,
        }));
    }
  }
});
