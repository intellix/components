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
  use: {trace: 'retain-on-failure'},
  webServer: [
    {
      // PLACEHOLDER: Angular CDK dev-app — requires Bazel + ibazel.
      // Substitute with your preferred Angular dev-app start command if needed.
      // Actual URL served: http://localhost:4200
      // Note: Angular's dialog demo is at /dialog NOT /dialog/basic — see README.
      command: 'pnpm -C ../../ dev-app',
      port: 4200,
      reuseExistingServer: true,
      timeout: 120_000,
    },
    {
      // qwik-cdk dev-app — must build first, then preview (not dev) due to qwik-city bug.
      command: 'pnpm -C ../qwik-cdk-dev-app preview',
      port: 4173,
      reuseExistingServer: true,
      timeout: 60_000,
    },
  ],
});
