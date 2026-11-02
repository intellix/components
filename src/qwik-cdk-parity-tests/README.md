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

**Ripples are real, interactive animations** (`qwik-material/core/ripple/`) —
every component with an upstream `[mat-ripple]`/`matRipple`/`MatRippleLoader`
launches real `.mat-ripple-element` spans on pointer events, not just a
static container. Since the settled-DOM contract above waits transient
ripples OUT before comparing, it structurally can't cover a ripple
mid-animation; `specs/material-button/ripple-mid-flight.spec.ts` covers
that case separately, with its own narrower harness (opens both pages
directly, holds `mousedown` via `page.mouse.down()` with no matching
`mouseup` until after reading, never calls `snapshotParityRoot`) that
compares a launched ripple's classes + literal inline style
(`left`/`top`/`height`/`width`/`transition-duration`/`transform`) between
both apps while the enter animation is still in progress — deterministic
despite the CSS animation, because those properties are set once,
synchronously, at ripple-creation time and never rewritten until fade-out.

Checkbox/radio inputs are compared on their live `.checked` state, not the
`checked` attribute: Qwik's SSR writes `checked` so a selected control paints
before JS runs, and that attribute is never updated afterwards (Angular's
client-only dev-app never writes it). Known, accepted difference — consumer CSS
should use `:checked`, not `[checked]`.

Angular scenarios bind inputs with `[prop]` syntax. Angular also copies a
static-attribute input (`value="x"`) onto the host element, which a Qwik component
cannot tell apart from a prop — that echo is a known, accepted difference. This
project's own internal scenarios always use the bracket form specifically to avoid
it, but an unmodified `material.angular.dev` docs example (`specs/examples/`) is
real upstream source that can't be rewritten, and some genuinely use the bare form
(e.g. `expansion-overview-example.html`'s `<mat-expansion-panel hideToggle>`). Known
cases are listed by exact attribute name in `STATIC_INPUT_ECHO_ATTRS`
(`material-parity.ts`) and ignored unconditionally — a no-op for any scenario that
binds the same input via `[prop]`, since Angular never adds the static attribute
there either.

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

## Computed-style comparison (default; `PARITY_STYLES=0` to disable)

The structural diff only sees markup, so a missing or wrong stylesheet (e.g. ripples rendering
as opaque squares because `.mat-ripple-element` had no CSS) passes it. So every compared element — and its `::before`/`::after` when rendered — also compares a set of
computed styles (`COMPUTED_STYLE_PROPS` in `lib/material-parity.ts`): position, display,
visibility, overflow, box-sizing, pointer-events, border radii, opacity, z-index,
flex-direction, background-color and color. Sizes/offsets are not compared here (they depend on
page fonts and layout; inline `style` attributes are already compared).

Colors are only meaningful under the same theme, so before any comparison `syncTheme()` gives
the Qwik page Angular's exact theme: every token-only rule from Angular's stylesheets (the
`mat.theme()`/`all-component-themes` output, density and color-variant classes) and every rule
scoped to the Angular dev-app shell's `.demo-*` classes, copied verbatim
with Angular's `<html>`/`<body>` classes, plus `color-scheme` and the inherited text styles of
Angular's `<body>` (overlays) and parity root (in-page content). A remaining color difference is
therefore the component's CSS, not the theme. Style diffs print the element's classes.

To keep pointer state from leaking into colors, the harness re-sends the pointer's last position
after each step so `:hover` reflects the settled pointer (Chrome otherwise keeps a stale `:hover`
under a stationary pointer depending on each app's timing). `PARITY_STYLES=0` disables the
comparison (structural diff only), e.g. to bisect whether a failure is markup or CSS.

## Clock emulation (`ParityScenario.clockDate`)

A `material.angular.dev` docs example is rendered unmodified (`specs/examples/`) — it never gets a
pinned `startAt`/value the way this repo's OWN `qwik-parity/<component>.ts` scenarios do. When such
an example's main interaction (e.g. opening a datepicker/timepicker with no initial value) renders
"today"-relative content, `expectMaterialParity(browser, {..., clockDate: new Date(...)})` freezes
`Date.now()`/`new Date()` to that moment on BOTH pages, via Playwright's `page.clock.setFixedTime()`,
before navigation — real timers/animations are unaffected, only the clock reading is faked. Never
pin the date by editing the upstream example itself.

## Google Fonts are cached (memory + disk)

Both dev-apps load Roboto/Material Icons from fonts.googleapis.com / fonts.gstatic.com, and every
test opens two fresh browser contexts. `cacheGoogleFonts()` serves those URLs from memory, backed by
a gitignored `.font-cache/` directory, so after one successful download runs need no network. A URL
that can't be downloaded (8s timeout) is aborted immediately for the rest of the run, so both apps
fall back to the same local fonts instead of each page's `load` event hanging into a test timeout.
On a slow network, prime the cache once with a single worker and a long timeout:
`PARITY_FONT_TIMEOUT_MS=60000 npx playwright test specs/examples --workers=1 -g "mat-(icon|button)/"`.
