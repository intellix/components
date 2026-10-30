# qwik-material/grid-list sync log

Tracks the sync state between this port and `src/material/grid-list/` upstream.
Companion to the sibling `SYNC.md` files under `src/qwik-material/*`.

**2026-10-27 remediation note:** the original port (see
`docs/superpowers/plans/2026-08-02-qwik-material-grid-list-port.md` /
`docs/superpowers/specs/2026-08-02-qwik-material-grid-list-port-design.md`)
rewrote layout as CSS grid, dropped `TileCoordinator`/`TileStyler`, dropped
header/footer/avatar, and rewrote the SCSS. All of that is **superseded** by
`docs/superpowers/specs/2026-10-27-qwik-material-dom-parity-remediation-design.md`:
Angular's DOM (including its exact inline styles) is now the contract. This
log reflects the state *after* that remediation.

## The one deliberate non-`component$` in this package

`<MatGridList>` (and, for the same reason, `<MatGridTileHeader>` /
`<MatGridTileFooter>`) is a **plain function**, not `component$`. This is
load-bearing, not a style choice — see `mat-grid-list.tsx`'s header comment
for the full reasoning, summarized:

- Upstream computes every tile's absolute-position inline style via
  `@ContentChildren` + an imperative `ngAfterContentChecked` pass that only
  runs once the full tile set is known, and only then mutates both the
  tiles *and* the list's own element (`height`/`padding-bottom`, depending
  on `rowHeight` mode).
- A `component$`'s render function is invoked with `children` **always**
  stripped from its props — confirmed empirically against this Qwik version
  (1.20.0): `setComponentProps$1` in `@builder.io/qwik`'s core explicitly
  skips copying the `children` key when building the props a `component$`
  sees, no matter how it's read (`props.children`, a cast, `<Slot/>` or
  not). Content projection is deliberately kept separate from props, for
  resumability. There is no supported technique for a `component$` to read
  what was written inside it.
- The list's own style has to be in the `<mat-grid-list>` open tag, which is
  written to the HTML stream before any child — there's no "render
  children, inspect them, then decide the parent's attributes" order
  available to a `component$`.
- A plain function is just an inlined function call (no Qwik-tracked
  boundary), so `props.children` *is* the real, unfiltered JSXNode data the
  caller wrote — including each `<MatGridTile>`'s already-evaluated
  `rowspan`/`colspan`/content (JSX prop values are plain data at the point
  the caller's JSX is built). That's enough to run the full upstream
  algorithm synchronously.
- The cost: a plain function has no Qwik component boundary, so it cannot
  call Qwik hooks (`useContext`, `useSignal`, …). `<MatGridList>` doesn't
  need any (see "Removed" below); `<MatGridTileHeader>`/`<MatGridTileFooter>`
  never used any.
- None of this is visible to a consumer: the JSX authoring ergonomic
  (`<MatGridList cols={4} rowHeight="100px"><MatGridTile>…</MatGridTile>…</MatGridList>`)
  and the rendered DOM are both unchanged from what a `component$`-based
  version would produce. `<MatGridTile>` instances nested inside
  `<MatGridList>` are never actually mounted — `<MatGridList>` reads their
  props as configuration and renders the final `<mat-grid-tile>` markup
  itself, via `renderGridTile` (mat-grid-tile.tsx), the single shared
  builder also used by `<MatGridTile>`'s own (`component$`) standalone
  rendering. `<MatGridTile>` stays a real `component$` for that standalone
  case (outside a list — matches upstream's optional `_gridList` absence).

## Upstream sync state

| File | Upstream path | Sync state | Notes |
| --- | --- | --- | --- |
| `grid-list/mat-grid-list.tsx` | `src/material/grid-list/grid-list.ts` (`MatGridList`) + `grid-list.html` | ported | **Plain function, not `component$`** — see above. Runs `TileCoordinator`+`TileStyler` against spans read directly off its JSX children, then renders each tile's final markup itself via `renderGridTile` |
| `grid-list/mat-grid-tile.tsx` | `src/material/grid-list/grid-tile.ts` (`MatGridTile` only) + `grid-tile.html` | ported | `component$`, for standalone use (no position style, matching upstream with no `_gridList`). Exports `renderGridTile`, the markup builder `MatGridList` also calls |
| `grid-list/tile-coordinator.ts` | `src/material/grid-list/tile-coordinator.ts` | ported | Verbatim algorithm; `MatGridTile` coupling replaced by a plain `{rowspan, colspan}` `Tile` shape |
| `grid-list/tile-styler.ts` | `src/material/grid-list/tile-styler.ts` | ported | Same arithmetic/calc()-string-building as upstream; imperative `tile._setStyle(prop, value)` mutation replaced by methods that *return* a style record (Qwik re-renders declaratively, nothing to mutate); `reset()` dropped (nothing to clean up — see file header comment) |
| `grid-list/jsx-children.ts` | (no upstream equivalent) | new | SSR-safe stand-in for `@ContentChildren` — reads tile rowspan/colspan directly off JSX (already-evaluated prop values, no QRL involved) instead of a live content query. Also backs the header/footer avatar/line partitioning |
| `grid-list/grid-list-config.ts` | (no upstream equivalent) | new | `MatGridListConfig = {}` interface + `MAT_GRID_LIST_CONFIG` context id; kept for family shape parity with `QwikMaterialProvider.matGridListConfig`, but **currently unconsumed** — `<MatGridList>` can't call `useContext` (see above), and there are no fields on the config yet anyway |
| `grid-list/mat-grid-tile-text.tsx` | `src/material/grid-list/grid-tile.ts` (`MatGridTileHeaderCssMatStyler`/`MatGridTileFooterCssMatStyler`) + `grid-tile-text.html` (`MatGridTileText`) | ported | Directive class + templated component collapse into one Qwik component per tag (plain functions — see above); see file header comment for the content-projection mapping. **Not exercised by any parity scenario or dev-app route** — vitest shape coverage only (`mat-grid-tile-text.spec.tsx`) |
| `grid-list/mat-grid-avatar.tsx` | `src/material/grid-list/grid-tile.ts` (`MatGridAvatarCssMatStyler`) | ported | Directive → polymorphic-`as` `component$` (API rule #4; no children-introspection need, so a real `component$` with `<Slot/>` works fine). Vitest shape coverage only |
| `grid-list/mat-line.tsx` | `src/material/core/line/line.ts` (`MatLine` + `setLines`) | ported (local) | `core/line` has no shared qwik-material port yet, so this is a grid-list-local stand-in — see file header. `component$` (same reasoning as `MatGridAvatar`). Vitest shape coverage only |
| `scss/grid-list/grid-list.scss` | `src/material/grid-list/grid-list.scss` | synced | byte-identical copy (confirmed via `diff`) — no `@angular/cdk` reference in this file or its `@use` chain, so no cdk-stub swap needed |
| `scss/grid-list/_grid-list-theme.scss` | `src/material/grid-list/_grid-list-theme.scss` | synced | byte-identical copy; theme mixin inert on our end (not invoked by the prebuilt pipeline — same as every other already-ported component) but kept for `diff -q` parity |
| `scss/grid-list/_m2-grid-list.scss` | `src/material/grid-list/_m2-grid-list.scss` | synced | byte-identical copy |
| `scss/grid-list/_m3-grid-list.scss` | `src/material/grid-list/_m3-grid-list.scss` | synced | byte-identical copy |
| `scss/core/style/_list-common.scss` | `src/material/core/style/_list-common.scss` | synced | byte-identical copy (self-contained, zero deps — not a reduced stub) |
| `scss/grid-list/grid-list-prebuilt.scss` | (qwik-material-specific) | new | `@use grid-list.scss` only — no `:root` token defaults (removed 2026-10-30, see `core/SYNC.md` "Default theme"): the 4 `--mat-grid-list-tile-{header,footer}-{primary,secondary}-text-size` vars `token-utils.slot()` emits carry no fallback at all in grid-list.scss's own compiled output, matching upstream's own gap (relies on `mat.grid-list-theme()`, not run here) — nothing to default for tile positioning either, which is inline style, not CSS |

## Removed upstream files

- `grid-list-module.ts` → Qwik has no module concept.
- `testing/` (`MatGridListHarness`) → Angular test harness surface; no equivalent needed.
- `public-api.ts` → replaced with our own re-export shape.
- `grid-list.html`, `grid-tile.html` → trivial templates inlined into JSX.
- `grid-tile-text.html` → inlined into `mat-grid-tile-text.tsx`.

## Deviations from upstream

1. **No `@ContentChildren` / `ngAfterContentChecked` re-layout; `<MatGridList>`
   is a plain function.** See "The one deliberate non-`component$`" above
   for the full reasoning. `<MatGridList>` reads tile spans directly off its
   JSX children once, synchronously, at render time
   (`jsx-children.ts#collectTypedChildren`). A **shallow-only** limitation:
   tiles must be *direct* JSX children of `<MatGridList>`, or nested only
   inside other components (whose own children are stashed on
   `props.children`, readable here because `MatGridList` is a plain
   function too) or plain elements (`.children`) — the walker descends
   through both, matching `{descendants: true}` for the structures this
   package can introspect. It stops at a matched tile's own content (no
   searching for tiles nested inside tiles).

2. **`tile._setStyle(prop, value)` imperative mutation → returned style
   records.** `tile-styler.ts`'s methods return `Record<string, string>`
   instead of mutating a tile instance; `TileStyler.reset()` is dropped
   entirely (see that file's header comment — Qwik's declarative re-render
   has nothing left over to clean up).

3. **Direction hardcoded to `'ltr'`.** Upstream falls back to `'ltr'` too
   when no `Directionality` is injected (`@angular/cdk/bidi`, optional). This
   package doesn't wire `qwik-cdk/bidi`'s `useDirectionality()` yet (nothing
   in qwik-material does, and `<MatGridList>` couldn't call it anyway — see
   above) — no scenario exercises RTL. `tile-styler.ts` already takes a
   `direction` parameter; wiring real `dir` support later means reading it
   some other way (e.g. a plain prop) in `mat-grid-list.tsx`.

4. **`<MatGridTile>` nested inside `<MatGridList>` is never actually
   mounted.** `<MatGridList>` reads its props as configuration and renders
   the tile's final markup itself (`renderGridTile`, shared with
   `<MatGridTile>`'s own standalone `component$` rendering). Invisible to
   consumers — same JSX authoring, same DOM output — but means a
   `<MatGridTile>` used this way can't have its own independent client-side
   behavior (it has none today; if a future version needs one, it would
   have to move to the parent or a different mechanism).

5. **Angular-specific removals (unchanged from before the remediation):**
   `@Input()` decorators + `NumberInput` coercion — replaced by TypeScript
   `number` types + inline `Math.max`/`Math.round`; `ngOnInit` — folded into
   the top of the render function; `MAT_GRID_LIST` DI token — N/A (no
   per-instance handoff needed now that the list renders tiles itself);
   `exportAs` — N/A (Qwik has no template-ref concept);
   `[attr.cols]`/`[attr.rowspan]`/`[attr.colspan]` host bindings — replaced
   by plain attribute passthrough (same DOM shape).

6. **Dev-mode `throw Error()` guards removed** (missing `cols`, invalid
   ratio, oversized colspan, invalid fixed-height CSS) — see
   `tile-coordinator.ts`/`tile-styler.ts` inline comments; TypeScript or the
   browser's own silent-ignore-invalid-CSS behavior cover the same ground
   without a dev-mode-only code path. `TileCoordinator._findMatchingGap`'s
   oversized-colspan throw is the one exception, kept verbatim (it's not
   dev-mode-gated upstream either).

7. **Header/footer/avatar/line are implemented but untested by Playwright.**
   No Angular mirror scenario (`src/dev-app/qwik-parity/grid-list.ts`) or
   qwik-cdk-dev-app route uses `<MatGridTileHeader>`/`<MatGridTileFooter>`/
   `<MatGridAvatar>`/`<MatLine>` — adding one would mean editing
   `src/dev-app/qwik-parity/grid-list.ts`, which this worktree is told not to
   do without flagging it first (and no scenario there looks *wrong* to
   justify flagging). Covered by vitest shape checks only
   (`mat-grid-tile-text.spec.tsx`, `mat-grid-avatar.spec.tsx`,
   `mat-line.spec.tsx`). Flagging this here per the task's instructions: a
   future pass should add
   `src/dev-app/qwik-parity/grid-list.ts#GridListHeaderFooter` (or similar)
   plus a matching qwik-cdk-dev-app route to close this gap with a real DOM
   parity assertion.

8. **Content-projection by type, not by Angular's `ng-content select`.**
   `grid-tile-text.html` projects by directive-selector match
   (`[mat-grid-avatar]`, `[mat-line]`); Qwik has no structural-directive
   matching, so `<MatGridTileHeader>`/`<MatGridTileFooter>` partition their
   *direct* children by component type (`MatGridAvatar`, `MatLine`) instead
   — see `jsx-children.ts#partitionDirectChildren` and
   `mat-grid-tile-text.tsx`'s header comment.

9. **`intrinsic-elements.d.ts` widening for custom numeric attrs,
   unchanged.** `<mat-grid-list>` gets `& {cols?: number}`, `<mat-grid-tile>`
   gets `& {rowspan?: number; colspan?: number}` (Qwik's base
   `HTMLAttributes` doesn't cover custom numeric attrs on custom elements).
   `<mat-grid-tile-header>`/`<mat-grid-tile-footer>` need no widening (div
   attribute set covers them).

10. **Qwik-cdk-dev-app route fix, not upstream-related:** `mat-grid-list/fit/index.tsx`'s
    inline `<style>{'.fit-host > .fit-grid { height: 100%; }'}</style>`
    rule never applied — Qwik's SSR HTML-escapes `>` to `&gt;` inside
    `<style>` text content, which the browser can't parse as a child
    combinator, so the list silently got no computed height at all in that
    scenario (pre-existing bug, not something this remediation introduced —
    it's unrelated to layout mode). Changed to a descendant selector
    (`.fit-host .fit-grid`), which sidesteps the escaping bug and is
    behaviorally identical here. Worth a bug report against
    `@builder.io/qwik`'s SSR `<style>` serialization, and worth checking
    whether any other qwik-cdk-dev-app route has the same latent issue.

## Stub inventory delta

- `scss/core/style/_list-common.scss` — **not** a reduced stub (unlike the
  other `scss/core/*` stand-ins listed in `src/qwik-material/dialog/SYNC.md`):
  upstream's `_list-common.scss` has zero `@use` dependencies, so this is a
  full, byte-identical port. No `@angular/cdk` reference anywhere in the
  grid-list SCSS chain (grep-confirmed) — zero additions to
  `scss/cdk-stub.scss`.

## Class count

`grep -rnE "^export class" src/qwik-material/grid-list/ 2>/dev/null` → 0 (no
exported classes on the consumer surface; `TileCoordinator`/`TileStyler` are
internal, not exported from `public-api.ts`).

## Pipeline

`pnpm test:qwik-material` at the repo root runs `build && vitest &&
lint:no-ssr-leaks && typecheck` for the whole qwik-material package.

## Parity status (2026-10-27, post-remediation)

`specs/material-grid-list/angular-parity.spec.ts` — all 7 scenarios (basic,
fit, gutter, ratio, ratio-spanning, spanning, aria-labeled) pass, confirmed
on two consecutive runs. All 7 Qwik-only specs under `specs/material-grid-list/`
pass too (rewritten to assert the Angular-equivalent absolute-position
layout model instead of the old CSS-grid one — see each file). Spot-checked
no regression in divider/toolbar/progress-spinner/card's `angular-parity.spec.ts`
(58/58 passing together with grid-list's own 14).
