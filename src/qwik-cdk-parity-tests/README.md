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

## qwik-material ↔ Angular Material DOM parity

`specs/material-*/angular-parity.spec.ts` are the authoritative parity gate for
qwik-material: the brand CSS consumers apply targets Angular Material's DOM, so
the Qwik DOM must match it exactly (tags, nesting, classes, attributes, text).

- **Angular side:** `src/dev-app/qwik-parity/<component>.ts` (a local, non-upstream
  addition registered under `/qwik-parity` in `src/dev-app/routes.ts`). One
  standalone component per scenario, each rendering inside `<div data-parity-root>`.
- **Qwik side:** the existing `src/qwik-cdk-dev-app/src/routes/<route>/<scenario>/`
  routes, with the compared content wrapped in `<div data-parity-root>`.
- **Helper:** `lib/material-parity.ts` → `expectMaterialParity(browser, {route, scenario, steps})`
  compares the initial DOM and again after every step (clicks, key presses).

Each comparison is eventually consistent: on a mismatch it re-settles and
retries (5 attempts) before failing, since the contract is the settled DOM.

Normalization: Angular (`_ngcontent-*`, `ng-reflect-*`) and Qwik (`q:*`, `on:*`,
comments) bookkeeping is stripped; digits in id-like attributes become `#`;
transient `.mat-ripple-element` nodes are waited out. CDK `AriaDescriber`'s own
bookkeeping attribute (`cdk-describedby-host`) is fully ignored, and any
`cdk-describedby-message-<APP_ID>-<n>` id token (its value bakes in Angular's
APP_ID, which a digit-only squash can't normalize) collapses to the bare
`cdk-describedby-message` prefix — see `material-parity.ts`.

Directive selector attributes that the consumer writes (`matFab`,
`mat-card-avatar`, `matListItemTitle`, …) are ignored — see
`CONSUMER_SELECTOR_ATTRS`. Attributes Material's own templates emit (`matripple`,
`mat-ripple-loader-*`) are compared and must be reproduced.

Checkbox/radio inputs are compared on their live `.checked` state, not the
`checked` attribute: Qwik's SSR writes `checked` so a selected control paints
before JS runs, and that attribute is never updated afterwards (Angular's
client-only dev-app never writes it). Known, accepted difference — consumer CSS
should use `:checked`, not `[checked]`.

Angular scenarios bind inputs with `[prop]` syntax. Angular also copies a
static-attribute input (`value="x"`) onto the host element, which a Qwik component
cannot tell apart from a prop — that echo is a known, accepted difference.

Running (no ibazel needed):

```bash
pnpm bazel run //src/dev-app:devserver                       # Angular, :4200
pnpm -C src/qwik-cdk-dev-app build && pnpm -C src/qwik-cdk-dev-app preview   # Qwik, :4173
pnpm -C src/qwik-cdk-parity-tests exec playwright test specs/material-button-toggle/angular-parity.spec.ts
```

`ANGULAR_URL` / `QWIK_URL` env vars override the default origins (e.g. a second
Qwik preview on another port from a git worktree, sharing one Angular server).

Restart `preview` after every Qwik rebuild; rebuild the Angular side with
`pnpm bazel build //src/dev-app:devserver` (the running server picks it up).
