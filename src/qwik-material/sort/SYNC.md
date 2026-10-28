# qwik-material/sort sync log

Tracks the sync state between this port and `src/material/sort/` upstream.
Every deviation from a verbatim copy is recorded here. Companion to
`src/qwik-material/dialog/SYNC.md`, `src/qwik-material/button/SYNC.md`,
`src/qwik-material/card/SYNC.md`, `src/qwik-material/toolbar/SYNC.md`,
`src/qwik-material/badge/SYNC.md`, `src/qwik-material/icon/SYNC.md`,
`src/qwik-material/progress-bar/SYNC.md`,
`src/qwik-material/progress-spinner/SYNC.md`,
`src/qwik-material/divider/SYNC.md`, `src/qwik-material/grid-list/SYNC.md`,
`src/qwik-material/list/SYNC.md`, `src/qwik-material/button-toggle/SYNC.md`,
`src/qwik-material/slide-toggle/SYNC.md`, and `src/qwik-material/core/SYNC.md`.

## 2026-10-28 initial port

New entry point, gated from the start by
`specs/material-sort/angular-parity.spec.ts` per
`docs/superpowers/specs/2026-10-27-qwik-material-remaining-components-roadmap.md`
(wave 2). 8/8 Angular-mirror scenarios + 2 Qwik-only provider-default
scenarios pass, run 3 times. Full non-regression sweep (263 Playwright
specs across every previously-ported component) passes.

`MatSort` (container, `[matSort]` directive) and `MatSortHeader`
(`[mat-sort-header]` component) are the first qwik-material port to
involve a parent directive and child component sharing live, bidirectional
state through context — previous shared-context precedent
(`MatButtonToggleGroup`/`MatButtonToggle`) only needed the child to READ
group state and round-trip changes through a QRL callback; here the child
mutates the parent's own state directly (see below).

## Upstream sync state

| File | Upstream path | Sync state | Notes |
| --- | --- | --- | --- |
| `sort/sort-direction.ts` | `src/material/sort/sort-direction.ts` (`SortDirection`) + `sort.ts` (`Sort` interface) | ported | Plain type re-export; `MatSortable` interface not ported (no registration model — see deviations). |
| `sort/sort-config.ts` | `src/material/sort/sort.ts` (`SortHeaderArrowPosition`, `MatSortDefaultOptions`, `MAT_SORT_DEFAULT_OPTIONS`) | ported | `MatSortConfig` carries both upstream fields (`disableClear`, `arrowPosition`); folded into `QwikMaterialProvider.matSortConfig`. |
| `sort/sort-state.ts` | `src/material/sort/sort.ts` (`MatSort` class: `getSortDirectionCycle`, `getNextSortDirection`, `sort()`, `register`/`deregister`/`sortables`/`initialized`/`_stateChanges`) | ported (math) / not ported (registration) | `getSortDirectionCycle`/`getNextSortDirection` ported verbatim as pure functions (fully vitest-tested, DOM-free — see sort-state.spec.ts). `computeNextSort` ports `MatSort.sort(sortable)`'s branching (new column adopts its own `start` override; re-activating the current column advances the cycle using its own `disableClear` override) as a pure function too. `register`/`deregister`/`sortables` Map/`initialized`/`_stateChanges` NOT ported — see deviations #1. |
| `sort/mat-sort.tsx` | `src/material/sort/sort.ts` (`MatSort` directive, no template) | ported | Polymorphic `as` prop (`'table' \| 'div'`, default `'table'`) renders the host element itself — same pattern as `MatBadge`/`MatListItem` for a directive with no view of its own. Provides `MAT_SORT_STATE` (two independently-owned Signals — see sort-state.ts's `MatSortSharedState` doc comment and the "real bug" section below). |
| `sort/mat-sort-header.tsx` | `src/material/sort/sort-header.ts` (`MatSortHeader` component class) + `sort-header.html` (42 LOC template inlined) | ported | Renders `<th>` itself as its own host (upstream: `ViewEncapsulation.None`, selector `[mat-sort-header]`, no wrapper tag) — host-level `click`/`keydown`/`mouseleave` listeners + `aria-sort`/`mat-sort-header-disabled` (matches upstream's `host: {...}` bindings being on the component's host, NOT the inner container). Inner `.mat-sort-header-container.mat-focus-indicator` div carries `tabindex`/`role`/`aria-describedby` + all direction/sorted/position/recently-cleared/animations classes, exactly per `sort-header.html`. `_renderArrow()` (`!isDisabled \|\| isSorted`) ported verbatim. `useFocusOrigin()` (qwik-cdk/a11y) replaces `FocusMonitor.monitor(this._elementRef, true)` for the generic `cdk-focused`/`cdk-*-focused` classes. `useAnimationsDisabled()` drives `mat-sort-header-animations-disabled`. `useIdGenerator()` mints the `aria-describedby` id (always present — upstream's `sortActionDescription` defaults to `'Sort'` and AriaDescriber runs unconditionally in `ngOnInit`). |
| `scss/sort/sort-header.scss` | `src/material/sort/sort-header.scss` (104 LOC) | synced | Byte-identical copy — no `@angular/cdk` import exists in this file, so no cdk-stub swap is needed (unlike every other synced qwik-material SCSS file so far). |
| `scss/sort/_m2-sort.scss` | `src/material/sort/_m2-sort.scss` | synced | byte-identical copy |
| `scss/sort/_m3-sort.scss` | `src/material/sort/_m3-sort.scss` | synced | byte-identical copy; `sort-header.scss`'s `$fallbacks` actually resolves through this (`m3-sort.get-tokens()`, default args) |
| `scss/sort/_sort-theme.scss` | `src/material/sort/_sort-theme.scss` | synced | byte-identical copy; theme mixins inert on our end but kept for `diff -q` parity, same as every other component's theme partial |
| `scss/sort/sort-prebuilt.scss` | (qwik-material-specific) | new | `@use` sort-header.scss + `:root` defaults for the ONE component token it resolves through (`--mat-sort-arrow-color`) and the ONE `--mat-sys-*` system token it falls back to (`--mat-sys-on-surface`) — compiled + grep-confirmed (`sass.compile('scss/sort/sort-header.scss')` emits exactly one `var(--mat-…)`, on `.mat-sort-header-arrow`'s `color`). By far the smallest prebuilt file in this port (the whole component has exactly one color token). |

## Removed upstream files

- `sort-module.ts` — Qwik has no module concept
- `sort-header-intl.ts` (`MatSortHeaderIntl`) — deprecated upstream ("No longer used, will be removed"), unused even by `MatSort`/`MatSortHeader` themselves
- `sort-errors.ts` — dev-time `Error()` factories for registration/validation guards this port doesn't implement (see deviations #1); nothing reads them
- `testing/` (`MatSortHarness`) — Angular test harness surface; no equivalent needed
- Upstream `index.ts`/`public-api.ts` — replaced with our own re-export shape
- `sort.spec.ts` (692 LOC) — the direction-cycle math (`testSingleColumnSortDirectionSequence` sequences, the "should allow MatSortable to override the default sort parameters" cases, the `MAT_SORT_DEFAULT_OPTIONS` describe blocks) is ported DOM-free as pure-function tests in `sort-state.spec.ts` — a genuine advantage of this port's architecture (upstream's own tests need `TestBed`/`detectChanges()` for the identical math because the cycle logic lives inside an Angular directive class; here it's an exported pure function). Everything DOM-dependent (`aria-sort` toggling, arrow rendering/absence, focus classes, registration/duplicate-id/missing-id/invalid-direction errors) is `describe.skip`-documented in `mat-sort-scenarios.spec.tsx` and actually covered by `angular-parity.spec.ts` + the two Qwik-only provider-default specs.
- `sort-header.html` (42 LOC) — inlined into JSX
- `CdkColumnDef` id-fallback integration — out of scope; the dev-app scenario contract (sort.ts's header comment) is explicit that `matSort` doesn't depend on `mat-table`/`cdk-table`, so there's no column-def to fall back to.

## Deviations from upstream

1. **No registration model (`sortables` Map, `register`/`deregister`, `initialized`/`_stateChanges` Observables, dev-time error guards).** Upstream uses these for (a) letting a CdkColumnDef-less header still work (N/A here — no cdk-table integration) and (b) dev-mode validation (duplicate/missing header id, invalid direction, "header not contained within MatSort"). None produce DOM output; Qwik's reactive context already notifies descendants directly without a registry. A `<MatSortHeader>` rendered without a `<MatSort>` ancestor therefore renders inert (reading a safe fallback — see `sort-state.ts`'s `MatSortSharedState` doc comment) instead of upstream's `getSortHeaderNotContainedWithinSortError()` throw; no parity scenario exercises this path.
2. **No AriaDescriber message DOM node.** The `aria-describedby`/id pair is always generated (matching upstream's unconditional default `'Sort'` description), but the actual message `<div>` AriaDescriber injects into `<body>` is not rendered — it sits outside the compared `[data-parity-root]` subtree anyway, and the harness normalizes every `cdk-describedby-message-*` id token to the same bare token regardless of the underlying text (see angular-parity.spec.ts behavior #1). Same approach as badge's `description` handling.
3. **Custom sort-arrow icon projection (`[matSortHeaderIcon]`) not ported.** A Qwik named `<Slot name="matSortHeaderIcon">` with inline fallback children did NOT render its fallback content in this project's installed `@builder.io/qwik@1.20.0` when no consumer provided matching projected content — verified live (the SSR'd slot comment markers rendered with nothing between them). The default arrow SVG is rendered unconditionally instead. No parity scenario provides a custom icon.
4. **Tables need explicit sections.** A bare `<table><tr>` gains an implicit `<tbody>` when the browser parses SSR HTML, but not when Angular builds it client-side. The library does not rewrite consumer markup; the parity scenarios (both sides) put the header row in `<thead>`, as real tables do. Consumers should write `<thead>`/`<tbody>` explicitly.
5. **`mat-sort-header="<id>"` is rendered as a real DOM attribute**, unlike `matbadge`/`mat-dialog-close`/etc. elsewhere, even though it's a `CONSUMER_SELECTOR_ATTRS` entry ignored by the structural diff. Necessary because `angular-parity.spec.ts`'s own Playwright steps locate headers via `th[mat-sort-header]` on BOTH pages to click/focus them — omitting it (the usual "consumer writes this, we don't echo it" treatment) would make every interaction step fail to find the Qwik-side element at all.
6. **Angular-specific removals:** `@Input()` decorators + `booleanAttribute` transforms + `inject()` → TypeScript prop types + plain prop passthrough; `OnInit`/`OnDestroy`/`AfterViewInit`/`OnChanges` lifecycle → no lifecycle (state seeded via a lazily-initialized `useSignal(() => …)`, same pattern as every other qwik-material port); `exportAs`/`ViewEncapsulation.None` + host bindings → plain JSX attribute passthrough on the appropriate element (the component's HOST for `MatSortHeader`'s `click`/`keydown`/`mouseleave`/`aria-sort`/disabled-class bindings, matching upstream's `host: {...}` object being on the `<th>` itself, not the inner container).

## A real bug found and fixed during this port

### 1. Infinite reactive loop from a self-subscribing signal write

**First implementation** (wrong): a single combined `Signal<MatSortContextValue>` carried `active`/`direction` (self-owned, mutated by headers) PLUS `start`/`disableClear`/`disabled`/`onSortChange` (owned by `MatSort`, needing to stay reactive to props). To keep the latter fresh on every `MatSort` render while preserving the former, the code did:

```ts
state.value = {...state.value, start: tableStart, disableClear: resolvedDisableClear, ...};
```

This READS `state.value` (via the spread) during `MatSort`'s own render — which subscribes `MatSort` to its own signal — and then WRITES a brand-new object reference to it. Since the write produces a different object reference every time (even when every field's VALUE is identical), Qwik's signal-change detection treats it as a real change and re-schedules every subscriber, including `MatSort` itself. `MatSort`'s re-render runs the exact same read-then-rewrite line again, producing yet another new reference, forever: an infinite reactive loop, entirely client-side (SSR is unaffected — it's a single synchronous pass with no reactive scheduling).

**Symptom:** clicking a header froze the page. Not caught by vitest (no DOM rendering there) or by the build/typecheck/lint pipeline (all static). Caught only by an isolated Playwright script that clicked a header and then called `page.locator(...).textContent()`, which hung past a 30s timeout — the main thread never yielded back to the browser's event/render loop. The project's own Playwright suite surfaced this as generic `Test timeout of 60000ms exceeded` / `browserContext.close: Test ended` errors with no structural diff attached, which (without isolating the interaction manually) looked like unrelated infrastructure flakiness rather than an application-level infinite loop.

**Fix:** split the one signal into two, each with exactly one owner (see `sort-state.ts`'s `MatSortSharedState` doc comment for the full rationale): `sortValue` (`active`/`direction`) is seeded once by `MatSort` and thereafter written ONLY by `MatSortHeader.toggleOnInteraction$`; `tableConfig` (`start`/`disableClear`/`disabled`/`onSortChange`) is owned by `MatSort`, which overwrites it with a fresh object every render WITHOUT ever reading it first — so that write cannot re-trigger `MatSort` itself (it never subscribed to a signal it never reads). `MatSortHeader` reads both (via `readSortState()`) and writes only `sortValue`, which correctly re-renders every header that reads it (the desired, bounded reactivity for behavior #2's shared direction classes) without looping.

### 2. A `focusin`-based reset racing against the same interaction's own explicit set

**First implementation** (wrong): `recentlyCleared` (driving `mat-sort-header-recently-cleared-*`) was reset to `null` on BOTH `focusin` and `focusout` (mirroring upstream's FocusMonitor subscription, which fires on any origin change in either direction), via a second `useOn('focusin', ...)`/`useOn('focusout', ...)` pair layered on top of `useFocusOrigin()`'s own internal `focusin`/`focusout` listeners on the same host.

**Symptom:** `initial-active-direction`'s first step (clicking a header that has never been focused before, and whose click ALSO clears its sort state) intermittently lost its `mat-sort-header-recently-cleared-descending` class — confirmed live against the real Angular app that the class SHOULD persist (the explicit set wins). Debug logging showed the click handler's `recentlyCleared.value = 'desc'` running, immediately followed by the `focusin` reset handler setting it back to `null` — the OPPOSITE of native browser dispatch order (`focusin` always fires before `click`). Root cause: `focusin` had TWO queued QRLs (`useFocusOrigin`'s + this reset's), processed in order, while `click` is a wholly separate event whose own QRL import can resolve independently; if `click`'s chunk finishes loading before `focusin`'s SECOND queued handler gets its turn, the effective execution order inverts even though dispatch order was correct. This is a genuine hazard of lazy QRL loading whenever multiple handlers are chained across different event types in the same user gesture, not something `Promise.resolve().then()`-style microtask deferral (upstream's own trick, which relies on JS's synchronous, non-lazily-loaded execution model) can replicate here.

**Fix:** removed the `focusin`-based reset entirely, keeping only `focusout` and `mouseleave`. No parity scenario ever needs a GAIN-focus reset — `recentlyCleared` is already `null` whenever a header gains fresh focus for any reason unrelated to its own click (the only way it becomes non-null is via that SAME click's own explicit set, which must win). Every scenario that DOES need a reset is a LOSE-focus case (tabbing/clicking to a DIFFERENT header), which has no such race: the blurring header's `focusout` and the focusing header's `click` mutate two different headers' independent local signals, so whichever finishes loading first, each header's own final state is still correct.

## Class count

`grep -rnE "^export class" src/qwik-material/sort/ 2>/dev/null` → 0 (no exported classes on the consumer surface).

## Pipeline

`pnpm test:qwik-material` at the repo root runs `build && vitest &&
lint:no-ssr-leaks && typecheck` for the whole qwik-material package,
covering dialog + button + card + toolbar + badge + icon + progress-bar +
progress-spinner + divider + grid-list + list + button-toggle +
slide-toggle + sort + core.

## Qwik-only Playwright specs (no Angular mirror)

`MAT_SORT_DEFAULT_OPTIONS` equivalents have no Angular-side parity scenario
(the dev-app's `qwik-parity` routes don't exercise provider defaults on the
Angular side either, same precedent as every other qwik-material config):

- `config-default-disable-clear.spec.ts` — upstream "with default options" /
  "should be able to cycle from asc -> desc from either start point"
  (`MAT_SORT_DEFAULT_OPTIONS = {disableClear: true}`, no per-table/-header
  override): the cycle never reaches `''`.
- `config-default-arrow-position.spec.ts` — upstream "with default
  arrowPosition" / "should render arrows in proper position"
  (`MAT_SORT_DEFAULT_OPTIONS = {arrowPosition: 'before'}`, no per-header
  override): every header gets `mat-sort-header-position-before`.
