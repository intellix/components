# qwik-material/badge sync log

Tracks the sync state between this port and `src/material/badge/` upstream.
Companion to `src/qwik-material/dialog/SYNC.md`, `src/qwik-material/button/SYNC.md`,
`src/qwik-material/card/SYNC.md`, and `src/qwik-material/toolbar/SYNC.md`.

DOM parity verified against `src/qwik-cdk-parity-tests/specs/material-badge/angular-parity.spec.ts`
(9/9 scenarios) per the 2026-10-27 DOM-parity-remediation design doc. Upstream
commit synced: the `badge.ts` / `badge.scss` tree as of this repo's current
`src/material/badge/`.

## Upstream sync state

| File                                | Upstream path                                     | Sync state | Notes                                                                                    |
| ------------------------------------ | ------------------------------------------------- | ---------- | ---------------------------------------------------------------------------------------- |
| `badge/mat-badge.tsx`                | `src/material/badge/badge.ts` (MatBadge directive) | ported     | Directive→component$ that renders the HOST element itself via a polymorphic `as` prop (`span`\|`div`\|`button`\|`a`), appending `<span class="mat-badge-content">` as its last child — no wrapper. |
| `badge/badge-color.ts`              | `src/material/badge/badge.ts` (ThemePalette narrowing) | ported | Narrowed to `'primary' \| 'accent' \| 'warn'` union                                      |
| `badge/badge-position.ts`           | `src/material/badge/badge.ts` (MatBadgePosition type) | ported  | Verbatim 8-value union                                                                   |
| `badge/badge-size.ts`               | `src/material/badge/badge.ts` (MatBadgeSize type) | ported     | Verbatim 3-value union                                                                   |
| `badge/badge-config.ts`             | `src/material/badge/badge.ts` (MatBadgeConfig) | ported     | InjectionToken→createContextId; folded into QwikMaterialProvider.matBadgeConfig          |
| `scss/badge/badge.scss`             | `src/material/badge/badge.scss`                   | synced with one deviation | `@use '@angular/cdk'` rewritten to `@use '../cdk-stub' as cdk` — only `cdk.high-contrast` is called and `_cdk-stub.scss` defines it. Same rewrite as dialog + button + card + toolbar ports. |
| `scss/badge/_badge-theme.scss`      | `src/material/badge/_badge-theme.scss`            | synced     | byte-identical copy                                                                      |
| `scss/badge/_m2-badge.scss`         | `src/material/badge/_m2-badge.scss`               | synced     | byte-identical copy                                                                      |
| `scss/badge/_m3-badge.scss`         | `src/material/badge/_m3-badge.scss`               | synced     | byte-identical copy                                                                      |
| `scss/badge/badge-prebuilt.scss`    | (qwik-material-specific)                          | new        | `@use` badge.scss only — no `:root` token defaults (removed 2026-10-30, see core/SYNC.md "Default theme"): every `--mat-badge-*` name already carries a real M3 fallback to `--mat-sys-*` baked in via `token-utils.slot()`. The one default theme now ships from `core/default-theme.scss` via `core-prebuilt.css`. |

## Removed upstream files

- `badge-module.ts` → Qwik has no module concept
- `badge.spec.ts` → port lives in `mat-badge-scenarios.spec.tsx` with restructured coverage per the smoke-only vitest constraint
- `_MatBadgeStyleLoader` component (in `badge.ts`) → omitted; qwik-material consumers import `badge-prebuilt.css` directly at their app root

## Fixed in the 2026-10-27 DOM-parity remediation pass

These replace the "Deviations from upstream" previously recorded here:

1. **No more wrapper `<span class="mat-badge">`.** `<MatBadge>` now renders
   the consumer's own host element via a polymorphic `as` prop
   (`'span' | 'div' | 'button' | 'a'`, default `'span'`) — the same pattern
   `MatListItem` uses. The `mat-badge*` classes land on that element, and
   `.mat-badge-content` is appended as its last child, matching
   `[matBadge]`'s host-directive model exactly. Confirmed against the
   Angular dev-app's live DOM (`/qwik-parity/mat-badge/*`): e.g. basic
   renders `<button class="mat-badge …">Notifications<span class="mat-badge-content …">5</span></button>`
   with no intervening element.
2. **Empty/whitespace content renders NO `.mat-badge-content` element.**
   Previously the span was always rendered. Upstream only creates the badge
   element when there's trimmed, non-empty content (`ngOnInit`:
   `if (this.content && !this._badgeElement) …`). `mat-badge-hidden` is
   still computed independently (`hidden || !contentStr`) and can be true
   while the badge-content element also exists (see the `hidden` scenario,
   where content="5" + hidden ⇒ class present AND span present).
3. **`color` only ever produces a class when explicitly passed as a prop —
   never from the config default.** This mirrors a genuine upstream quirk:
   `matBadgeColor`'s setter (`classList.add('mat-badge-' + value)`) only
   runs when Angular's change detection processes an explicit
   `[matBadgeColor]` binding. The directive's constructor assigns its
   *default* color (`'primary'`, or the injected config's default) straight
   to the private backing field, bypassing the setter — so neither the
   literal default nor a `MAT_BADGE_CONFIG`-provided default ever produces a
   class. Confirmed on the live Angular dev-app: the `basic` scenario
   (no `[matBadgeColor]` binding) renders **no** `mat-badge-primary` class,
   while `colors` (explicit `[matBadgeColor]="'primary'"` etc.) does.
   `MatBadgeConfig.color` is kept in the type for API-shape parity but has
   no rendering effect, same as upstream.
4. **`description` now branches on host interactivity, matching upstream's
   `AriaDescriber` vs. inline-span split**, instead of always inlining:
   - Interactive host (currently: `as="button"`, or `as="a"` with `href`, or
     any tag with a valid `tabIndex`) → `aria-describedby="cdk-describedby-message-…"`
     on the host, no inline span. This is independent of whether
     `.mat-badge-content` exists (matches upstream: `_updateDescription`
     never checks `_badgeElement`).
   - Non-interactive host → inline `<span class="cdk-visually-hidden">`
     appended inside `.mat-badge-content` — only when that span exists
     (matches upstream: the inline node is only ever appended into
     `_badgeElement`, so it's effectively invisible otherwise).
   - **Still deferred / CDK `AriaDescriber` not fully ported:** upstream
     also appends a shared, de-duplicated hidden message element into a
     `div.cdk-describedby-message-container.cdk-visually-hidden` under
     `<body>`, and sets `cdk-describedby-host` on the host for cleanup
     bookkeeping. MatBadge emits a correctly-shaped `aria-describedby` id
     (`cdk-describedby-message-<n>` via the shared qwik-cdk id generator)
     but does **not** render the backing body-level container or the
     `cdk-describedby-host` attribute — the id currently has no element to
     point to. This is outside `[data-parity-root]` (the parity harness
     never compares body-level content), so it doesn't affect the gate, but
     it's a real a11y gap for description-on-non-interactive-host and
     description-on-interactive-host consumers alike until a proper
     `AriaDescriber` port exists in `qwik-cdk/a11y`. `_isHostInteractive` is
     also only a static approximation of upstream's
     `InteractivityChecker.isFocusable(host, {ignoreVisibility: true})` —
     derived from `(as, href, tabIndex)` at render time, since there's no
     live DOM element to inspect during SSR.
5. **Badge ids use the shared qwik-cdk id generator.** `.mat-badge-content`
   ids (and now the `aria-describedby` ids) come from one
   `createIdGenerator()` instance (from `@angular-community/qwik-cdk/a11y`)
   shared by every `<MatBadge>` in the app — mirrors upstream's
   root-provided `_IdGenerator` singleton. Still not request-scoped (same
   caveat as Dialog + Card's `_idSeq`): SSR and hydration counters can
   diverge, but the parity harness normalizes digits in id-bearing
   attributes away, so this doesn't affect the gate.
6. **Harness normalization added (`lib/material-parity.ts`), applicable to
   any component that uses `AriaDescriber`, not just badge:**
   - `cdk-describedby-host` added to `IGNORE_ATTRS` — its value bakes in
     Angular's own `APP_ID` plus an app-global service-instance counter
     (e.g. `"ng-1"`), framework-internal bookkeeping with no cross-framework
     meaning (same category as `_nghost-*` / `ng-reflect-*`).
   - Id-attribute value normalization (`id`, `aria-describedby`, …) now
     splits on whitespace and collapses any `cdk-describedby-message-…`
     token to the bare `cdk-describedby-message` prefix before the existing
     digit-squash, because that id's shape embeds the same non-numeric
     `APP_ID` segment (digit-squash alone can't normalize it away).

## Remaining deviations from upstream

1. **CDK `AriaDescriber` partially ported** — see item 4 above. No shared
   message container under `<body>`, no `cdk-describedby-host` bookkeeping,
   no dedup across multiple badges describing the same text, no
   `removeDescription` / cleanup on unmount (Qwik has no imperative
   teardown hook here). `_isHostInteractive` is a static, prop-driven
   approximation of `InteractivityChecker.isFocusable`, not the real
   DOM-based check.
2. **`ngDevMode` "matBadge on aria-hidden mat-icon" warning skipped** — Angular-specific dev-mode helper.
3. **rAF fade-in animation skipped.** `.mat-badge-active` class always applied at render time — no `useVisibleTask$` deferring the class toggle. In the live Angular dev-app the rAF resolves well before Playwright reads the DOM, so both sides end up with the class regardless.
4. **SSR badge-cleanup (`_clearExistingBadges`) skipped.** Angular's `renderer.createElement` + `host.appendChild` approach needed cleanup on re-hydration; Qwik's static resume model doesn't need it.
5. **`content` prop typed `string | number | undefined`** (drops `null` — Qwik idiom favors `undefined`).
6. **`MAT_BADGE_CONFIG` folded into `QwikMaterialProvider.matBadgeConfig`** — established pattern from Dialog + Button + Card.
7. **`throwError` on non-element hosts skipped.** The `as` prop is a closed enum (`'span' | 'div' | 'button' | 'a'`), so there's no runtime-invalid-host case to guard against.
8. **`_MatBadgeStyleLoader` component omitted.** Upstream uses it via `_CdkPrivateStyleLoader` to lazy-load the badge CSS. Qwik-material consumers import `badge-prebuilt.css` directly at their app root; no lazy loading needed.
9. **No native-`disabled` passthrough on the `button`/`a` host.** `disabled` on `<MatBadge>` is `matBadgeDisabled` (the visual `.mat-badge-disabled` class only) — there's currently no prop to also set the host's real `disabled` attribute. Not exercised by any parity scenario (all use a plain, non-disabled `<button>`).

## Stub inventory delta

No new stubs — badge chain reused the existing dialog + button + card + toolbar port stubs. The `@use '@angular/cdk'` → `@use '../cdk-stub' as cdk` rewrite in `scss/badge/badge.scss` calls only `cdk.high-contrast`, which `_cdk-stub.scss` already defines.

## Class count

`grep -nE "^export class" src/qwik-material/badge/**/*.ts src/qwik-material/badge/**/*.tsx`
→ 0 (no exported classes on the consumer surface).

## Consumer API change (2026-10-27)

`<MatBadge>` no longer wraps its children in a `<span class="mat-badge">`.
It now renders the host element itself and requires an `as` prop to pick the
tag (`'span' | 'div' | 'button' | 'a'`, default `'span'`):

```diff
- <MatBadge content="5">
-   <button>Notifications</button>
- </MatBadge>
+ <MatBadge as="button" content="5">
+   Notifications
+ </MatBadge>
```

All `src/qwik-cdk-dev-app/src/routes/mat-badge/*/index.tsx` routes were
updated to this shape (host = `button`, matching the Angular mirror scenarios
in `src/dev-app/qwik-parity/badge.ts`).

## Pipeline

`pnpm test:qwik-material` at the repo root runs `build && vitest && lint:no-ssr-leaks && typecheck` for the whole qwik-material package, covering dialog + button + card + toolbar + badge.
