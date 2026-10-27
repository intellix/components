# qwik-material/list sync log

Tracks the sync state between this port and `src/material/list/` upstream.
Companion to the other `src/qwik-material/*/SYNC.md` files.

**2026-10-27 remediation:** this port previously made several scope cuts
(CSS :has() instead of content-derived classes, rewritten list.scss,
wrapper `<div>` elements for avatar/icon/title/line/meta/subheader, an
invented `<mat-subheader>` custom tag, dropped focus indicator). Those cuts
are **revoked** — see
`docs/superpowers/specs/2026-10-27-qwik-material-dom-parity-remediation-design.md`.
This file now reflects the DOM-parity-restored state, verified against
`src/dev-app/qwik-parity/list.ts` via
`src/qwik-cdk-parity-tests/specs/material-list/angular-parity.spec.ts`
(8/8 scenarios passing: basic, avatar, icon-meta, nav, action, three-line,
two-line, with-subheader). Upstream commit synced: current `main` HEAD of
`src/material/list/` at the time of this remediation (see `git log` for
`src/material/list/*` — no local modifications to the upstream tree).

## Upstream sync state

| File | Upstream path | Sync state | Notes |
| --- | --- | --- | --- |
| `list/mat-list.tsx` | `src/material/list/list.ts` (MatList) + `nav-list.ts` (MatNavList) + `action-list.ts` (MatActionList) + `subheader.ts` (MatListSubheaderCssMatStyler) | ported | 4 upstream files collapsed into one Qwik file. Each container provides `MAT_LIST_BASE_STATE` (`isNonInteractive`) via `list-context.ts` so descendant `<MatListItem>`s know whether to add `mat-mdc-list-item-interactive` (mirrors upstream's DI-based `inject(MatListBase)`). `aria-disabled` is always `"true"`/`"false"` (upstream's `[attr.aria-disabled]` binding always stringifies, never removes the attribute). `MatListSubheaderCssMatStyler` → `MatSubheader`, now polymorphic (`as`, default `'div'` — the tag used in both the Material demo and the parity scenario) instead of a `<mat-subheader>` custom tag |
| `list/mat-list-item.tsx` | `src/material/list/list.ts` (MatListItem) + `list-base.ts` (MatListItemBase, non-ripple parts) + `list-item.html` | ported | Polymorphic host via `as` (`'div'`→`<mat-list-item>`, `'a'`, `'button'`). Renders upstream's template shape: leading avatar/icon, `<span class="mdc-list-item__content">` wrapping title + lineContent + a `<span class="mat-mdc-list-item-unscoped-content">`, trailing meta, an optional nested divider, then `<div class="mat-focus-indicator">`. Content-derived classes (`mdc-list-item--with-leading-avatar/-icon`, `--with-trailing-meta`, `mat-mdc-list-item-both-leading-and-trailing`, `--with-one/two/three-lines`, `mat-mdc-list-item-single-line`) are computed from named props, not nested JSX children — **see the "Why sections are props" deviation below, it's the load-bearing one.** `aria-disabled` always stringified; native `disabled` is the *string* `"true"` (not a bare boolean attribute) because upstream sets it via `[attr.disabled]`, an attribute binding Angular stringifies, not a property binding. `type="button"` unconditional on the button variant (we never accept a custom `type`, matching upstream's "only if not already set" default). `mat-mdc-list-item-interactive` comes from `MAT_LIST_BASE_STATE` context, not from a local ripple system (ripple itself remains out of scope — see deviations) |
| `list/mat-list-item-sections.tsx` | `src/material/list/list-item-sections.ts` (5 directives: Avatar, Icon, Title, Line, Meta) | ported | 5 upstream attribute directives ported as 5 polymorphic `component$`s (`as`, default `'div'`; Avatar also takes `'img'`, Icon also takes `'span'`), each rendering its own host element directly (the directive's exact class list) — no wrapper. `style` prop passes through (upstream directives can carry arbitrary attributes/style on the same host element they decorate) |
| `list/list-context.ts` | (no direct upstream file; mirrors `MatListBase._isNonInteractive`) | new | `MAT_LIST_BASE_STATE` context + defaults, see above |
| `list/list-config.ts` | (no upstream equivalent) | new, unchanged | `MatListConfig = {}` + `MAT_LIST_CONFIG` context id; folded into `QwikMaterialProvider.matListConfig` for family-shape parity |
| `scss/list/list.scss` | `src/material/list/list.scss` | **synced byte-for-byte** | No `@angular/cdk` import in this file itself, so no stub swap needed |
| `scss/list/_list-inherited-structure.scss` | `src/material/list/_list-inherited-structure.scss` | **synced byte-for-byte** (restored — previously deleted) | MDC's structural/flex layout + height-per-line-count rules. No `@angular/cdk` import |
| `scss/list/_list-item-hcm-indicator.scss` | `src/material/list/_list-item-hcm-indicator.scss` | **synced**, cdk-stub swap | `@use '@angular/cdk';` → `@use '../cdk-stub' as cdk;` (same stub `badge.scss` etc. use). Now actually referenced by `list.scss` (upstream's own chain) — previously orphaned in this port |
| `scss/list/_list-theme.scss` | `src/material/list/_list-theme.scss` | synced, unchanged | byte-identical |
| `scss/list/_m2-list.scss` | `src/material/list/_m2-list.scss` | synced, unchanged | byte-identical |
| `scss/list/_m3-list.scss` | `src/material/list/_m3-list.scss` | synced, unchanged | byte-identical |
| `scss/list/list-prebuilt.scss` | (qwik-material-specific) | new, trimmed | `@use './list';` + one `:root` default (`--mat-list-subheader-text-size`, the one token with no M3 equivalent at all — see upstream `_list-theme.scss`'s own comment). The restored `list.scss` now uses the SAME `token-utils.slot(...)` key names as `_m3-list.scss`'s `get-tokens()` map, so most `--mat-list-*` variables get a real fallback baked into their `var()` chain automatically — the two manual `label-text-size`/`supporting-text-size` overrides this file previously needed (to paper over a key-name mismatch in the old *rewritten* `list.scss`) are gone |

## Why sections are named props on `<MatListItem>`, not nested JSX children

Upstream distributes projected content via `<ng-content select="...">`:
avatar/icon always render before a `<span class="mdc-list-item__content">`
that itself only wraps title + lines + unscoped text (in a fixed
sub-order), then meta, then an optional divider — regardless of the
author's source order. This needs BOTH (a) redistributing children into a
*new* wrapper element, and (b) knowing counts/presence to compute
`<MatListItem>`'s own classes.

Qwik has no `@ContentChildren`-equivalent content-query API, so (b) is
out. For (a), reading `props.children` directly and re-embedding the nodes
in a different shape was tried and **does not work on `@builder.io/qwik`
1.20.0**: confirmed by a throwaway `component$` that read `props.children`
into an array and rendered `{array}` — the array rendered as nothing, and
the original nodes reappeared as a hidden `<q:template q:slot hidden
aria-hidden="true">` sibling instead (Qwik's SSR renderer treats a
component's `children` specially end-to-end and only "consumes" them
through an actual `<Slot>`, which itself can't redistribute a flat child
list into a different wrapper shape). A **named prop holding a JSX value**
(not Qwik's special `children`) was verified to render exactly where
placed, with no stash — so `<MatListItem>` takes `avatar` / `icon` /
`title` / `lineContent` / `meta` / `divider` / `content` as props (each
built with the matching exported section component,
e.g. `avatar={<MatListItemAvatar>...</MatListItemAvatar>}`), and derives
every content-driven class from their presence/array-length. This is the
design doc's explicitly-sanctioned fallback ("if Qwik can't inspect
slotted children, add an explicit prop") extended from just `lines` to
every section, because the *placement* problem applies to all of them,
not just the line count.

The `lines` prop keeps its upstream name/meaning (`number`, explicit
override of the inferred count) since there's no naming conflict with it.

## Removed upstream files (still out of scope — unchanged from before)

- `list-module.ts` — Qwik has no module concept.
- `testing/` — Angular test harness surface; no equivalent needed.
- `list.spec.ts` — ported to `mat-list-scenarios.spec.tsx` as sanity/shape
  tests; see that file's own header comment for why (no DOM-rendering
  vitest in this project — `createDOM(<Component$/>)` hangs the worker).
- `list-option.ts`, `list-option.html`, `list-option.scss`,
  `list-option-types.ts`, `selection-list.ts`, `selection-list.spec.ts` —
  `MatListOption` / `MatSelectionList` are a dedicated future port with a
  forms tier (checkbox/radio). No scenario in `src/dev-app/qwik-parity/list.ts`
  exercises them, so they remain out of this remediation's scope.
- `tokens.ts` — inlined via SCSS token references (`token-utils.slot(...)`
  calls in the restored `list.scss` reference the same keys).

## Deviations from upstream

1. **Ripple system removed.** Upstream `MatListItemBase` wires up
   `RippleRenderer` + `MAT_RIPPLE_GLOBAL_OPTIONS` + `RippleTarget` for
   interactive items. No scenario in this component's
   `angular-parity.spec.ts` has interaction steps, so no ripple DOM is
   exercised; `mat-mdc-list-item-interactive` (the one ripple-adjacent
   class added at *construction*, not on interaction) IS reproduced via
   `MAT_LIST_BASE_STATE` context. Actual ripple elements remain a future
   qwik-cdk primitive.
2. **`_mat-animation-noopable` wired through the existing
   `useAnimationsDisabled()` hook** (`../dialog/use-animations-disabled`,
   already used by progress-bar/progress-spinner) rather than a new
   mechanism — defaults to animations-enabled (class absent) outside a
   `<QwikMaterialProvider>`, matching upstream's default.
3. **`@ContentChildren` / `AfterViewInit` / `cdkObserveContent` removed.**
   No Qwik equivalent; replaced by the named-props design above, which
   computes everything at SSR render time from props instead of a
   post-render DOM inspection pass.
4. **`NgZone` / `Platform` / `MAT_LIST` / `MAT_NAV_LIST` DI tokens
   removed.** Only used by the ripple system and Angular's DI graph; no
   Qwik equivalent need.
5. **Sections are named props, not nested children** — see the dedicated
   section above; this is the one deviation worth reading in full before
   touching this file.
6. **Angular-specific removals (unchanged from before):**
   `@Input()` + `BooleanInput`/`NumberInput` coercion → TS types + inline
   defaults; `signal()` → plain props; `Directive`/`MatListBase`/
   `MatListItemBase` class hierarchy → `component$` + one small context;
   `exportAs` → N/A; host bindings → plain JSX attributes; `providers:
   [...]` → no Angular DI graph.

## Class count

`grep -rnE "^export class" src/qwik-material/list/ 2>/dev/null`
→ 0 (no exported classes on the consumer surface).

## Pipeline

`pnpm test:qwik-material` at the repo root runs
`build && vitest && lint:no-ssr-leaks && typecheck` for the whole
qwik-material package, covering dialog + button + card + toolbar + badge +
icon + progress-bar + progress-spinner + divider + grid-list + list +
button-toggle.

DOM parity is gated by
`src/qwik-cdk-parity-tests/specs/material-list/angular-parity.spec.ts`
(8/8 scenarios, run twice clean) plus the Qwik-only specs in the same
directory (all updated to read `QWIK_URL` instead of hardcoding
`localhost:4173`, and to assert content-derived classes / DOM order
instead of pixel geometry that doesn't even hold in the Angular reference
— the `avatar`/`icon-meta` scenarios' own inline
`style="width:100%;height:100%"` collapses the title to 0 width on BOTH
sides, verified directly against `localhost:4200`; computed-style parity
is out of scope per the remediation design doc).
