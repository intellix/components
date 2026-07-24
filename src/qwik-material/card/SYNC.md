# qwik-material/card sync log

Tracks the sync state between this port and `src/material/card/` upstream.
Every deviation from a verbatim copy is recorded here. Companion to
`src/qwik-material/dialog/SYNC.md` and `src/qwik-material/button/SYNC.md`
in the same package.

## Upstream sync state

| File                                     | Upstream path                                        | Sync state | Notes                                                                                     |
| ----------------------------------------- | ----------------------------------------------------- | ---------- | ------------------------------------------------------------------------------------------ |
| `card/mat-card.tsx`                      | `src/material/card/card.ts` (MatCard) + `card.html`  | ported     | Component→component$; renders <mat-card> custom-element tag; reads MAT_CARD_CONFIG        |
| `card/mat-card-header.tsx`               | `src/material/card/card.ts` (MatCardHeader) + `card-header.html` | ported | q:slot="avatar" + q:slot="text" replace ng-content-by-selector projection            |
| `card/mat-card-title-group.tsx`          | `src/material/card/card.ts` (MatCardTitleGroup) + `card-title-group.html` | ported | q:slot="text" + q:slot="image" replace ng-content-by-selector projection      |
| `card/mat-card-title.tsx`                | `src/material/card/card.ts` (MatCardTitle)           | ported     | Renders <mat-card-title>; upstream is directive on any element                            |
| `card/mat-card-subtitle.tsx`             | `src/material/card/card.ts` (MatCardSubtitle)        | ported     | Renders <mat-card-subtitle>                                                               |
| `card/mat-card-content.tsx`              | `src/material/card/card.ts` (MatCardContent)         | ported     | Renders <mat-card-content>                                                                |
| `card/mat-card-actions.tsx`              | `src/material/card/card.ts` (MatCardActions)         | ported     | align prop preserved verbatim (upstream marked TODO-to-deprecate; we follow if renamed)  |
| `card/mat-card-footer.tsx`               | `src/material/card/card.ts` (MatCardFooter)          | ported     | Renders <mat-card-footer>                                                                 |
| `card/mat-card-image.tsx`                | `src/material/card/card.ts` (MatCardImage + 4 size variants) | ported | Renders <img> directly (not directive on consumer <img>); 5 exports in one file    |
| `card/mat-card-avatar.tsx`               | `src/material/card/card.ts` (MatCardAvatar)          | ported     | Renders <img> directly                                                                    |
| `card/card-config.ts`                    | `src/material/card/card.ts` (MatCardConfig)          | ported     | Injection token → createContextId; folded into QwikMaterialProvider.matCardConfig         |
| `card/card-appearance.ts`                | `src/material/card/card.ts` (MatCardAppearance type) | ported     | Byte-equivalent type re-export                                                            |
| `card/intrinsic-elements.d.ts`           | (Qwik-material-specific)                             | new        | TS augmentation declaring 8 custom-element tag names as valid IntrinsicElements           |
| `scss/card/card.scss`                    | `src/material/card/card.scss`                        | synced     | byte-identical copy                                                                       |
| `scss/card/_card-theme.scss`             | `src/material/card/_card-theme.scss`                 | synced     | byte-identical copy                                                                       |
| `scss/card/_m2-card.scss`                | `src/material/card/_m2-card.scss`                    | synced     | byte-identical copy                                                                       |
| `scss/card/_m3-card.scss`                | `src/material/card/_m3-card.scss`                    | synced     | byte-identical copy                                                                       |
| `scss/card/card-prebuilt.scss`           | (Qwik-material-specific)                             | new        | @use of card.scss + M3 :root defaults                                                     |

## Removed upstream files

- `card.html` → inlined into `mat-card.tsx`; breadcrumb at `card.html.removed.md`
- `card-header.html` → inlined into `mat-card-header.tsx`; breadcrumb at `card-header.html.removed.md`
- `card-title-group.html` → inlined into `mat-card-title-group.tsx`; breadcrumb at `card-title-group.html.removed.md`
- `card-module.ts` → Qwik has no module concept
- `card.spec.ts` → port lives in `mat-card-scenarios.spec.tsx` with restructured coverage per the createDOM-hangs constraint

## Deviations from upstream

1. **Image and avatar are components that render `<img>`, not directives applied to a consumer-supplied `<img>`.** `<MatCardImage src alt />` renders `<img class="mat-mdc-card-image mdc-card__media" src alt />`. Consumers who want `<picture>` or `<video>` for card media must add the classes manually until a Slot-accepting variant is added.
2. **`MAT_CARD_CONFIG` folded into `QwikMaterialProvider.matCardConfig` field.** Mirrors the dialog + button pattern; upstream has a separate `MAT_CARD_CONFIG` injection token consumed only by `MatCard`.
3. **Custom-element tag names (`mat-card`, `mat-card-header`, etc.) emitted verbatim.** Requires a small `IntrinsicElements` TypeScript augmentation. Consumers using strict JSX intrinsic typing work automatically once the .d.ts is loaded.
4. **Header + title-group use `q:slot` named slots (`avatar`, `text`, `image`) for structured projection.** Upstream projects children by TYPE via `<ng-content select>`; Qwik has no equivalent so consumers must add the `q:slot` attribute explicitly. Documented with usage examples in the JSDoc of each component.
5. **`<MatCardActions>` `align` prop stays as `'start' | 'end'`.** Upstream marked `align` as TODO-to-deprecate in favor of `actionPosition` / `actionAlignment`. We keep the current name for parity; if upstream renames it, we follow.

## Stub inventory delta

No new stubs — card chain reused all existing dialog + button port stubs.

## Class count

`grep -nE "^export class" src/qwik-material/card/**/*.ts src/qwik-material/card/**/*.tsx`
→ 0 (no exported classes on the consumer surface).

## Pipeline

`pnpm test:qwik-material` at the repo root runs `build && vitest && lint:no-ssr-leaks && typecheck` for the whole qwik-material package, covering dialog + button + card.
