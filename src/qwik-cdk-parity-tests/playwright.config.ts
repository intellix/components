import {defineConfig} from '@playwright/test';

/**
 * No `webServer` block: both apps are run manually (see README.md) and
 * targeted via ANGULAR_URL/QWIK_URL env vars (defaulting to localhost:4200
 * and localhost:4173 respectively — see lib/material-parity.ts). An opt-in
 * `webServer` auto-start previously lived here, but it fired for every test
 * run regardless of which app(s) a given spec file actually needed, and
 * would race with / tear down a manually-run preview server on the same
 * port from another worktree — surprising and disruptive for concurrent
 * work across worktrees. Each worktree should run its own preview server on
 * its own port and pass it via QWIK_URL.
 */
export default defineConfig({
  testDir: './specs',
  // Every test cold-loads two apps (Angular + Qwik) in fresh contexts.
  timeout: 60_000,
  expect: {timeout: 10_000},
  use: {trace: 'retain-on-failure'},
});
