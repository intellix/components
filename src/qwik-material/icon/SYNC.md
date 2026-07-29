# qwik-material/icon sync log

Tracks the sync state between this port and `src/material/icon/` upstream.
Every deviation from a verbatim copy is recorded here. Companion to
`src/qwik-material/dialog/SYNC.md`, `src/qwik-material/button/SYNC.md`,
`src/qwik-material/card/SYNC.md`, `src/qwik-material/toolbar/SYNC.md`, and
`src/qwik-material/badge/SYNC.md`.

## Upstream sync state

| File | Upstream path | Sync state | Notes |
| --- | --- | --- | --- |
| `icon/mat-icon.tsx` | `src/material/icon/icon.ts` (MatIcon component) | ported | Directive→component$; two mutually-exclusive JSX branches for font vs. SVG mode; registry omitted |
| `icon/icon-color.ts` | `src/material/icon/icon.ts` (ThemePalette narrowing) | ported | Narrowed to `'primary' | 'accent' | 'warn'` union |
| `icon/icon-config.ts` | `src/material/icon/icon.ts` (MatIconDefaultOptions) | ported | InjectionToken→createContextId; folded into QwikMaterialProvider.matIconConfig |
| `scss/icon/icon.scss` | `src/material/icon/icon.scss` | synced | byte-identical copy — no `@use '@angular/cdk'` present, unlike badge/toolbar/dialog port SCSS which needed the cdk-stub rewrite |
| `scss/icon/_icon-theme.scss` | `src/material/icon/_icon-theme.scss` | synced | byte-identical copy |
| `scss/icon/_m2-icon.scss` | `src/material/icon/_m2-icon.scss` | synced | byte-identical copy |
| `scss/icon/_m3-icon.scss` | `src/material/icon/_m3-icon.scss` | synced | byte-identical copy |
| `scss/icon/icon-prebuilt.scss` | (qwik-material-specific) | new | @use icon.scss + M3 :root defaults matching emitted --mat-icon-* references |

## Removed upstream files

- `icon-registry.ts` → entire 741-LOC MatIconRegistry service omitted (§Deviations #2)
- `icon-module.ts` → Qwik has no module concept
- `fake-svgs.ts` → test-only SVG payloads for registry unit tests; no registry, no need
- `testing/` (MatIconTestingModule + FakeMatIconRegistry) → registry stubs; no registry, no need
- `public-api.ts` → replaced with our own re-export shape (see `public-api.ts`)
- `icon.spec.ts` → ported to `mat-icon-scenarios.spec.tsx` with restructured coverage per the smoke-only vitest constraint

## Deviations from upstream

1. **`<mat-icon>` custom-element tag preserved.** Emitted via `intrinsic-elements.d.ts` JSX augmentation. Consistent with the CMS-parity constraint.
2. **`MatIconRegistry` service entirely omitted.** No XHR SVG loader, no `addSvgIcon*`, no icon-sets, no `getNamedSvgIcon`. Consumers who need registry-style lookup pre-bundle SVG strings and pass the resolved string as `svgLiteral`.
3. **`svgIcon: string` prop replaced by explicit `svgLiteral` + `svgName` + `svgNamespace`.** Three props instead of one; no colon-split magic; no registry lookup.
4. **DomSanitizer omitted.** `svgLiteral` set via `dangerouslySetInnerHTML` and trusted verbatim.
5. **`MAT_ICON_LOCATION` context + `ngAfterViewChecked` FuncIRI path-prepending omitted.** Safari workaround for base-tag pages; SSR-hostile.
6. **`ErrorHandler` injection omitted.** No icon-fetch errors possible without a registry.
7. **`registerFontClassAlias` + `setDefaultFontSetClass` + `classNameForFontAlias` omitted.** Folded into `MAT_ICON_CONFIG.fontSet`.
8. **RxJS `Subscription` lifecycle omitted.**
9. **`MAT_ICON_CONFIG` folded into `QwikMaterialProvider.matIconConfig`.** 7th `useContextProvider` call.
10. **`_cleanupFontValue` (trim + first space-separated token)** applied at prop-resolution time, not per-setter as upstream does.
11. **Font-mode vs. SVG-mode via two JSX branches.** `dangerouslySetInnerHTML` and `<Slot />` are mutually exclusive; `svgLiteral` wins if both provided.
12. **`aria-hidden='true'` default via prop merge** (`props['aria-hidden'] ?? 'true'`) instead of upstream's constructor-time `setAttribute`.
13. **`aria-label` prop added to `MatIconProps`.** User-adjudicated during Task 9: spec §7.2's `aria-labeled/` route demonstrates `<MatIcon aria-label="Home">` for icons used as labeled controls, but §2.3's original prop list did not declare `aria-label`. Extension forwards `aria-label={props['aria-label']}` on both JSX branches so labeled icons carry the a11y attribute in the emitted DOM.

## Stub inventory delta

No new stubs — the icon SCSS chain does NOT reference `@angular/cdk` (unlike badge/toolbar/dialog port SCSS which did). Zero additions to `scss/cdk-stub/_cdk-stub.scss` or any other stub file.

## Class count

`grep -rnE "^export class" src/qwik-material/icon/ 2>/dev/null`
→ 0 (no exported classes on the consumer surface).

## Pipeline

`pnpm test:qwik-material` at the repo root runs `build && vitest && lint:no-ssr-leaks && typecheck` for the whole qwik-material package, covering dialog + button + card + toolbar + badge + icon.
