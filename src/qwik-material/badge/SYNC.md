# qwik-material/badge sync log

Tracks the sync state between this port and `src/material/badge/` upstream.
Every deviation from a verbatim copy is recorded here. Companion to
`src/qwik-material/dialog/SYNC.md`, `src/qwik-material/button/SYNC.md`,
`src/qwik-material/card/SYNC.md`, and `src/qwik-material/toolbar/SYNC.md`.

## Upstream sync state

| File                                | Upstream path                                     | Sync state | Notes                                                                                    |
| ----------------------------------- | ------------------------------------------------- | ---------- | ---------------------------------------------------------------------------------------- |
| `badge/mat-badge.tsx`               | `src/material/badge/badge.ts` (MatBadge directive) | ported     | Directive→component$; renders <span class="mat-badge"> wrapper with Slot for consumer content + inline description span |
| `badge/badge-color.ts`              | `src/material/badge/badge.ts` (ThemePalette narrowing) | ported | Narrowed to `'primary' \| 'accent' \| 'warn'` union                                      |
| `badge/badge-position.ts`           | `src/material/badge/badge.ts` (MatBadgePosition type) | ported  | Verbatim 8-value union                                                                   |
| `badge/badge-size.ts`               | `src/material/badge/badge.ts` (MatBadgeSize type) | ported     | Verbatim 3-value union                                                                   |
| `badge/badge-config.ts`             | `src/material/badge/badge.ts` (MatBadgeConfig) | ported     | InjectionToken→createContextId; folded into QwikMaterialProvider.matBadgeConfig          |
| `scss/badge/badge.scss`             | `src/material/badge/badge.scss`                   | synced with one deviation | `@use '@angular/cdk'` rewritten to `@use '../cdk-stub' as cdk` — only `cdk.high-contrast` is called and `_cdk-stub.scss` defines it. Same rewrite as dialog + button + card + toolbar ports. |
| `scss/badge/_badge-theme.scss`      | `src/material/badge/_badge-theme.scss`            | synced     | byte-identical copy                                                                      |
| `scss/badge/_m2-badge.scss`         | `src/material/badge/_m2-badge.scss`               | synced     | byte-identical copy                                                                      |
| `scss/badge/_m3-badge.scss`         | `src/material/badge/_m3-badge.scss`               | synced     | byte-identical copy                                                                      |
| `scss/badge/badge-prebuilt.scss`    | (qwik-material-specific)                          | new        | @use badge.scss + M3 :root defaults matching emitted --mat-badge-* references            |

## Removed upstream files

- `badge-module.ts` → Qwik has no module concept
- `badge.spec.ts` → port lives in `mat-badge-scenarios.spec.tsx` with restructured coverage per the smoke-only vitest constraint
- `_MatBadgeStyleLoader` component (in `badge.ts`) → omitted; qwik-material consumers import `badge-prebuilt.css` directly at their app root

## Deviations from upstream

1. **`[matBadge]` attribute directive → `<MatBadge>` wrapper component.** Consumer wraps their element in `<MatBadge>`; wrapper renders an extra `<span class="mat-badge">` around consumer content. Classes on the wrapper, NOT on the consumer's element.
2. **CDK `AriaDescriber` + `InteractivityChecker` skipped.** `description` prop always renders an inline `<span class="cdk-visually-hidden">` inside the badge-content span. Works for both interactive and non-interactive hosts. Deferred: no `aria-describedby` on the host element.
3. **`ngDevMode` "matBadge on aria-hidden mat-icon" warning skipped** — Angular-specific dev-mode helper.
4. **rAF fade-in animation skipped.** `.mat-badge-active` class always applied at render time — no `useVisibleTask$` deferring the class toggle. Consumer sees the badge immediately.
5. **SSR badge-cleanup (`_clearExistingBadges`) skipped.** Angular's `renderer.createElement` + `host.appendChild` approach needed cleanup on re-hydration; Qwik's static resume model doesn't need it.
6. **`content` prop typed `string | number | undefined`** (drops `null` — Qwik idiom favors `undefined`).
7. **`MAT_BADGE_CONFIG` folded into `QwikMaterialProvider.matBadgeConfig`** — established pattern from Dialog + Button + Card.
8. **Module-level `_idSeq` counter** for `.mat-badge-content` id. Global monotonic id per module load. Not request-scoped; on SSR + hydration, ids may not match between server and client renders. Same pattern as Dialog + Card `_idSeq`.
9. **`throwError` on non-element hosts skipped.** Consumer's Slot content is whatever they pass; no runtime validation.
10. **`_MatBadgeStyleLoader` component omitted.** Upstream uses it via `_CdkPrivateStyleLoader` to lazy-load the badge CSS. Qwik-material consumers import `badge-prebuilt.css` directly at their app root; no lazy loading needed.

## Stub inventory delta

No new stubs — badge chain reused the existing dialog + button + card + toolbar port stubs. The `@use '@angular/cdk'` → `@use '../cdk-stub' as cdk` rewrite in `scss/badge/badge.scss` calls only `cdk.high-contrast`, which `_cdk-stub.scss` already defines.

## Class count

`grep -nE "^export class" src/qwik-material/badge/**/*.ts src/qwik-material/badge/**/*.tsx`
→ 0 (no exported classes on the consumer surface).

## Pipeline

`pnpm test:qwik-material` at the repo root runs `build && vitest && lint:no-ssr-leaks && typecheck` for the whole qwik-material package, covering dialog + button + card + toolbar + badge.
