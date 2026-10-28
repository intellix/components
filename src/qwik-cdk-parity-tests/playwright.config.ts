import {defineConfig} from '@playwright/test';

/**
 * No `webServer` block here (deliberately removed): it always tries to
 * ensure its hardcoded ports (4200, 4173) are up, regardless of which port
 * THIS run's QWIK_URL actually points at — in a worktree, that previously
 * meant a run could auto-start its own preview server on 4173 whenever the
 * main checkout's happened to be briefly down, then kill it again on exit,
 * breaking the main checkout's own verification. Each worktree starts its
 * OWN preview server on its OWN assigned port and always passes it via
 * QWIK_URL (see README.md for the human-setup steps); the shared Angular
 * dev-app at :4200 is started/managed separately and is never touched by
 * this config.
 */
export default defineConfig({
  testDir: './specs',
  // Every test cold-loads two apps (Angular + Qwik) in fresh contexts.
  timeout: 60_000,
  expect: {timeout: 10_000},
  use: {trace: 'retain-on-failure'},
});
