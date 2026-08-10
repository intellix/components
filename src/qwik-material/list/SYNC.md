# qwik-material/list sync log

Tracks the sync state between this port and `src/material/list/` upstream.
Every deviation from a verbatim copy is recorded here. Companion to
`src/qwik-material/dialog/SYNC.md`, `src/qwik-material/button/SYNC.md`,
`src/qwik-material/card/SYNC.md`, `src/qwik-material/toolbar/SYNC.md`,
`src/qwik-material/badge/SYNC.md`, `src/qwik-material/icon/SYNC.md`,
`src/qwik-material/progress-bar/SYNC.md`,
`src/qwik-material/progress-spinner/SYNC.md`,
`src/qwik-material/divider/SYNC.md`, and
`src/qwik-material/grid-list/SYNC.md`.

## Upstream sync state

| File | Upstream path | Sync state | Notes |
| --- | --- | --- | --- |
| `list/mat-list.tsx` | `src/material/list/list.ts` (MatList) + `nav-list.ts` (MatNavList) + `action-list.ts` (MatActionList) + `subheader.ts` (MatListSubheaderCssMatStyler) | ported | 4 upstream files collapsed into one Qwik file — each is a thin component$ wrapper (config read + class ladder + Slot). MatNavList forces role='navigation', MatActionList forces role='group'. Subheader upstream is a directive; ported as real component with `<mat-subheader>` custom-element tag |
| `list/mat-list-item.tsx` | `src/material/list/list.ts` (MatListItem class, lines 44-91) | ported | Polymorphic host via `as` prop mirrors upstream's `mat-list-item, a[mat-list-item], button[mat-list-item]` selector. Drops ripple/focus-indicator/@ContentChildren/cdkObserveContent/mdc-list-item__content wrapper. aria-current='page' only when as='a' AND activated (matches _getAriaCurrent) |
| `list/mat-list-item-sections.tsx` | `src/material/list/list-item-sections.ts` (5 directives: Avatar, Icon, Title, Line, Meta) | ported | 5 upstream directives ported as 5 component$ wrappers. Shared MatListItemSectionProps interface. Directive pattern doesn't map to Qwik; wrapper components each render `<div class="<hooks>"><Slot />` |
| `list/list-config.ts` | (no upstream equivalent) | new | MatListConfig = {} interface + MAT_LIST_CONFIG context id; folded into QwikMaterialProvider.matListConfig for family shape parity |
| `scss/list/list.scss` | `src/material/list/list.scss` (185 LOC) | rewritten | ~80 LOC of CSS-grid rules replacing MDC's absolute-positioning + state-layer + ripple + focus-indicator approach. Drops all `.mdc-list-item--with-*` modifier class handling — replaced by CSS :has() selectors. No `@angular/cdk` rewrite needed for this file itself (fourth port after Icon + Divider + Grid List) — see the Stub inventory delta section below for the one file in this chain that DOES retain a `@use '@angular/cdk';` |
| `scss/list/_list-theme.scss` | `src/material/list/_list-theme.scss` | synced | byte-identical copy; theme mixin inert on our end (typography tokens for dropped ripple/state-layer variants) but kept for `diff -q` parity |
| `scss/list/_list-item-hcm-indicator.scss` | `src/material/list/_list-item-hcm-indicator.scss` | synced | byte-identical copy, including its `@use '@angular/cdk';` line — small high-contrast helper, inert on our end. This file is never `@use`'d by `list.scss` or `list-prebuilt.scss`, so it's orphaned: not part of the compiled chain, and its `@angular/cdk` reference never resolves at build time. See Stub inventory delta below |
| `scss/list/_m2-list.scss` | `src/material/list/_m2-list.scss` | synced | byte-identical copy |
| `scss/list/_m3-list.scss` | `src/material/list/_m3-list.scss` | synced | byte-identical copy |
| `scss/list/list-prebuilt.scss` | (qwik-material-specific) | new | @use list.scss + 5 :root defaults matching emitted --mat-list-* references (2 label/supporting-text color tokens + 3 text-size tokens). The 3 text-size vars exist because `_m3-list.scss`'s token keys use a doubled prefix — e.g. `list-list-item-label-text-size` — that doesn't match the `token-utils.slot(...)` lookups in the rewritten `list.scss` (e.g. `list-item-label-text-size`), so no fallback bakes into the compiled `var()`. Reconciled against the compiled `dist/list-prebuilt.css` output |

## Removed upstream files

- `_list-inherited-structure.scss` (477 LOC) — MDC flex-positioning mixins + ripple hooks + state-layer + activated-state gradients; replaced by CSS-grid rewrite + `:has()` line-count sizing (spec §5 deviation #7)
- `list-base.ts` (350 LOC) — MatListBase + MatListItemBase abstract classes with ripple integration + line-count management; replaced by plain component$ wrappers (spec §5 deviation #10)
- `list-module.ts` — Qwik has no module concept
- `testing/` — Angular test harness surface; no equivalent needed
- `public-api.ts` (upstream) — replaced with our own re-export shape (§3.6)
- `list.spec.ts` (650 LOC) — ported to `mat-list-scenarios.spec.tsx` per smoke-only vitest constraint
- `list-item.html` — upstream projection template; inlined into JSX (no `<span class="mdc-list-item__content">` wrapper — CSS grid handles positioning directly on item host)
- `list-option.ts` (328 LOC), `list-option.html`, `list-option.scss`, `list-option-types.ts` — MatListOption is selection-list territory, out of scope
- `selection-list.ts` (482 LOC), `selection-list.spec.ts` (1970 LOC) — future dedicated port with forms tier (checkbox / radio / slide-toggle)
- `tokens.ts` — inlined via SCSS token references
- `MatLine` reuse from `../core` — grid-list precedent; not needed for display-list layout

## Deviations from upstream

1. **Ripple system removed entirely.** Upstream MatListItemBase integrates `RippleRenderer` + `MAT_RIPPLE_GLOBAL_OPTIONS` + `RippleTarget` interface (~50 LOC). Consumers who want tap feedback style `:active` / `:focus-visible` themselves.

2. **`@ContentChildren` line-count JS removed.** Upstream `_updateItemLines` + `cdkObserveContent` inspect projected content on every mutation, then set `.mdc-list-item--with-*-lines` / `.mdc-list-item--with-leading-*` / `.mdc-list-item--with-trailing-*` classes. Replaced by CSS `:has()` selectors — reacts naturally to slot content changes at zero JS cost, SSR-safe by definition. Deviation depends on browsers that ship `:has()` (Baseline Late 2023 — Chrome ≥ 105, Safari ≥ 15.4, Firefox ≥ 121).

3. **`AfterViewInit` / `OnDestroy` lifecycle removed.** No lifecycle work needed — port is pure component$(props) → JSX.

4. **`NgZone` + `Platform` dependencies removed.** Only used by the ripple system + line-count observer.

5. **Focus indicator `<div class="mat-focus-indicator">` removed from MatListItem template.** Upstream renders this element for the CDK focus-indicator system. Since we don't ship the CDK focus indicator, the element serves no purpose. Users get browser-default `:focus-visible` outline on `<a>` / `<button>` variants.

6. **`MAT_LIST` and `MAT_NAV_LIST` DI tokens removed.** Nothing in the display-list scope reads them, and selection-list is out of scope. Family-shape config still ships as `MAT_LIST_CONFIG`.

7. **`_list-inherited-structure.scss` (477 LOC) dropped entirely.** Contains MDC's flex-based positioning mixins + ripple hooks + state layer + activated-state background gradients. Replaced by our ~80-LOC CSS-grid rewrite of `list.scss`.

8. **`MatListSubheaderCssMatStyler` (upstream `[matSubheader]` directive) → `MatSubheader` component with `<mat-subheader>` custom-element tag.** Upstream is a directive that applies a CSS class to any host. We ship a real custom element with a component wrapper for Qwik ergonomics (directive pattern doesn't map cleanly). CSS class hooks preserved for consumer stylesheet parity.

9. **Slot directives (`[matListItemAvatar]` / `[matListItemIcon]` / `[matListItemTitle]` / `[matListItemLine]` / `[matListItemMeta]`) replaced with 5 wrapper components.** Same reasoning as #8. Wrapper components each render `<div class="<hooks>"><Slot />`. CSS class hooks preserved. No `q:slot` required from the consumer since layout is CSS-grid-driven (class-based placement, not slot-name-based).

10. **Angular-specific removals:**
   - `@Input()` decorators + `BooleanInput` / `NumberInput` coercion — replaced by TypeScript types + inline defaults.
   - `signal()` for reactive disabled state — plain prop consumed each render.
   - `Directive` scaffolding + `MatListBase` / `MatListItemBase` abstract classes — collapsed to plain `component$` wrappers.
   - `exportAs: 'matList' / 'matListItem' / ...` — Angular template-ref concept, N/A.
   - Host bindings (`[attr.aria-disabled]`, `[attr.disabled]`, `[attr.aria-current]`, `[class.mdc-list-item--*]`) — plain JSX attribute passthrough.
   - `providers: [{provide: MatListBase, useExisting: MatList}]` — no Angular DI graph.
   - `<ng-content select="mat-divider">` slot inside `MatListItem` template — dropped; consumers place `<MatDivider />` between items instead of nested inside.
   - `<span class="mdc-list-item__content">` inner wrapper in `MatListItem` template — dropped; CSS grid handles positioning directly on the item host.

## Stub inventory delta

No new stubs — the *compiled* list SCSS chain (`list.scss`, `list-prebuilt.scss`, and everything they transitively `@use`: `_m3-list.scss`, `_m2-list.scss`, `token-utils`) does NOT reference `@angular/cdk`.

One caveat, discovered during implementation: `_list-item-hcm-indicator.scss` is a byte-identical synced copy of the upstream file, and upstream's copy contains `@use '@angular/cdk';`. Unlike the other synced partials, this file is never `@use`'d by `list.scss` or `list-prebuilt.scss` (grep-confirmed — no reference to `hcm-indicator` anywhere in the chain), so it is orphaned dead weight that never resolves during compilation. Because it never resolves, it never needs a cdk-stub rewrite at runtime — the "no cdk anywhere in the *build*" outcome still holds, it's just reached via "unreferenced" rather than "referenced and clean" for this one file. Zero additions to `scss/cdk-stub/_cdk-stub.scss` or any other stub file.

## Class count

`grep -rnE "^export class" src/qwik-material/list/ 2>/dev/null`
→ 0 (no exported classes on the consumer surface).

## Pipeline

`pnpm test:qwik-material` at the repo root runs `build && vitest && lint:no-ssr-leaks && typecheck` for the whole qwik-material package, covering dialog + button + card + toolbar + badge + icon + progress-bar + progress-spinner + divider + grid-list + list.
