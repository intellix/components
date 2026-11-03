import {test} from '@playwright/test';
import {expectMaterialParity} from '../../lib/material-parity.js';

/**
 * Bespoke (not a ported material.angular.dev example) DOM/computed-style parity for
 * `@angular/material/core`'s typography hierarchy (`mat.typography-hierarchy()`) and elevation
 * classes (`mat.elevation-classes()`) — see `qwik-material/core/SYNC.md`'s "Typography +
 * elevation classes" entry.
 *
 * UNLIKE every other `angular-parity.spec.ts` in this suite, the Angular side here is NOT the
 * shared `:4201` reference server — `src/dev-app/qwik-parity/core.ts` is new, bespoke scenario
 * code added by this task (not present on the shared server, which other agents' worktrees also
 * read from and must not be disturbed). Run this file with `ANGULAR_URL` pointed at a SEPARATE,
 * throwaway Angular dev-app server built from THIS worktree instead:
 *
 *   cd <this worktree> && nohup pnpm bazel run //src/dev-app:devserver -- --port=4213 > /tmp/t2-style-ng.log 2>&1 &
 *   # wait for it to come up (cold build is 10+ minutes), then:
 *   ANGULAR_URL=http://localhost:4213 QWIK_URL=http://localhost:4193 \
 *     npx playwright test specs/material-core/angular-parity.spec.ts --workers=1 --reporter=line
 *
 * Never run this file against the shared `:4201` server — it has no `mat-core/*` routes.
 */
const route = 'mat-core';

test.describe('mat-core — Angular DOM parity (typography + elevation)', () => {
  test('typography', ({browser}) => expectMaterialParity(browser, {route, scenario: 'typography'}));

  test('elevation', ({browser}) => expectMaterialParity(browser, {route, scenario: 'elevation'}));
});
