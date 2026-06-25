# qwik-cdk-parity-tests

Playwright test package that loads both the Angular CDK dev-app and the qwik-cdk dev-app
side-by-side, snapshots their DOM trees, and asserts structural parity.

## Human setup steps

### 1. Install dependencies

From the workspace root (run once after this package was added):

```bash
pnpm install
```

### 2. Install Playwright browser

```bash
cd src/qwik-cdk-parity-tests
pnpm playwright install chromium
```

### 3. Start the Angular CDK dev-app (port 4200)

**Requires Bazel and ibazel to be installed.**

```bash
pnpm dev-app   # from workspace root
```

This invokes `ibazel run //src/dev-app:devserver`. If you prefer to use another
Angular dev-server setup, start it on port 4200 — `reuseExistingServer: true`
means Playwright will detect and reuse a running server.

**URL mismatch note:** The CDK dev-app's dialog demo is at `http://localhost:4200/dialog`
(a single component with all scenarios), not `/dialog/basic`. The test spec currently
navigates to `/dialog/basic`. If that route does not exist in the CDK dev-app (it likely
404s), edit `specs/dialog-basic.spec.ts` to use `http://localhost:4200/dialog` instead,
and adjust the selector/snapshot target to isolate the basic-dialog portion of the DOM.

### 4. Start the qwik-cdk dev-app (port 4173)

Due to a qwik-city dev-mode bug discovered during Task 25, routes do not work correctly
under `vite dev`. You must build first, then serve with `vite preview`:

```bash
pnpm -C src/qwik-cdk-dev-app build
pnpm -C src/qwik-cdk-dev-app preview
```

Vite preview defaults to port **4173** (not 5173). The playwright config and spec file
both use 4173.

### 5. Run the tests

```bash
pnpm -C src/qwik-cdk-parity-tests test
```

Or from inside the package:

```bash
cd src/qwik-cdk-parity-tests
pnpm test
```

## Interpreting failures

Diffs reported by the test are structural differences between the Angular CDK DOM and the
qwik-cdk DOM. The Angular CDK side is the reference. When diffs appear, investigate
the qwik-cdk side (OverlayHost, DialogContainer component output) and iterate until the
diff is empty.

## Adding more scenarios

1. Add a spec file under `specs/` (e.g. `specs/dialog-backdrop.spec.ts`).
2. Both dev-apps must expose matching routes (qwik-cdk: `src/qwik-cdk-dev-app/src/routes/dialog/<scenario>/`,
   Angular: `src/dev-app/dialog/` — see URL mismatch note above).
3. Use `snapshot()` + `diffNodes()` from `lib/structural-diff.ts`.
