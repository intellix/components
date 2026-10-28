import {defineConfig} from '@playwright/test';

/**
 * PLACEHOLDER NOTICE (webServer config):
 *
 * The Angular CDK dev-app command below requires Bazel + ibazel to be installed.
 * `pnpm dev-app` (from workspace root) ultimately invokes `ibazel run //src/dev-app:devserver`.
 *
 * If you already have the Angular dev-app running on port 4200 by other means,
 * `reuseExistingServer: true` means Playwright will detect and reuse it.
 *
 * The qwik-cdk-dev-app must be built first then served with `pnpm preview` due to a
 * qwik-city dev-mode bug discovered in Task 25; `pnpm dev` does not serve routes correctly.
 * Run: `pnpm -C src/qwik-cdk-dev-app build && pnpm -C src/qwik-cdk-dev-app preview`
 *
 * See README.md for full human-setup steps.
 */
export default defineConfig({
  testDir: './specs',
  // Every test cold-loads two apps (Angular + Qwik) in fresh contexts.
  timeout: 60_000,
  expect: {timeout: 10_000},
  use: {trace: 'retain-on-failure'},
  // No `webServer` block: both dev-apps (Angular on 4200, Qwik on QWIK_URL) are shared,
  // long-running servers started manually. Auto-starting/killing them from here races with
  // other worktrees and the main checkout's own verification runs. Always pass QWIK_URL
  // explicitly when running these specs.
});
