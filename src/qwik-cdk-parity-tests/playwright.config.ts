import {defineConfig} from '@playwright/test';

/**
 * Start the servers yourself (README): `pnpm bazel run //src/dev-app:devserver`
 * (Angular, :4200) and a Qwik preview (`pnpm -C src/qwik-cdk-dev-app build &&
 * vite preview`, :4173 or QWIK_URL). PARITY_START_SERVERS=1 restores auto-start.
 */
export default defineConfig({
  testDir: './specs',
  // Every test cold-loads two apps (Angular + Qwik) in fresh contexts.
  timeout: 60_000,
  expect: {timeout: 10_000},
  use: {trace: 'retain-on-failure'},
  // Servers are started by hand (see README): the Angular dev-app on :4200 and
  // a Qwik preview per checkout (QWIK_URL). Auto-starting them here let a run
  // from one git worktree spawn — and later kill — the preview another
  // checkout was testing against. Opt back in with PARITY_START_SERVERS=1.
  webServer: process.env['PARITY_START_SERVERS']
    ? [
        {
          command: 'pnpm -C ../../ dev-app',
          port: 4200,
          reuseExistingServer: true,
          timeout: 120_000,
        },
        {
          command: 'pnpm -C ../qwik-cdk-dev-app preview',
          port: 4173,
          reuseExistingServer: true,
          timeout: 60_000,
        },
      ]
    : undefined,
});
