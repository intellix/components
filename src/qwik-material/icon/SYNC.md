# qwik-material/icon sync log

Tracks the sync state between this port and `src/material/icon/` upstream.
Every deviation from a verbatim copy is recorded here. Companion to
`src/qwik-material/dialog/SYNC.md`, `src/qwik-material/button/SYNC.md`,
`src/qwik-material/card/SYNC.md`, `src/qwik-material/toolbar/SYNC.md`, and
`src/qwik-material/badge/SYNC.md`.

**2026-10-27 DOM-parity remediation.** `specs/material-icon/angular-parity.spec.ts`
(diffed against `src/material/icon/icon.ts` + `icon-registry.ts` behavior, live
in the Angular dev-app) found three drifts, all fixed — see the updated
deviations #7 and new #14 below:
1. No default font-set class was ever applied (Deviation #7 below previously
   dropped `MatIconRegistry.getDefaultFontSetClass()`'s effect entirely instead
   of folding it in) — font-mode icons rendered with zero font-set class.
2. `fontIcon`-derived class (`_updateFontIconClasses`'s `elem.classList.add(this.fontIcon)`
   when the resolved font-set isn't `mat-ligature-font`) was never reproduced.
3. SVG-mode icons never got `MatIconRegistry._setSvgAttributes`'s
   `fit`/`height`/`width`/`preserveAspectRatio`/`focusable` on the root `<svg>`.

## Upstream sync state

| File | Upstream path | Sync state | Notes |
| --- | --- | --- | --- |
| `icon/mat-icon.tsx` | `src/material/icon/icon.ts` (MatIcon component) | ported | Directive→component$; two mutually-exclusive JSX branches for font vs. SVG mode; registry omitted |
| `icon/icon-color.ts` | `src/material/icon/icon.ts` (ThemePalette narrowing) | ported | Narrowed to `'primary' | 'accent' | 'warn'` union |
| `icon/icon-config.ts` | `src/material/icon/icon.ts` (MatIconDefaultOptions) + `icon-registry.ts` (`_defaultFontSetClass`) | ported | InjectionToken→createContextId; folded into QwikMaterialProvider.matIconConfig; exports `MAT_ICON_DEFAULT_FONT_SET_CLASS` (upstream registry's built-in default) |
| `icon/icon-svg-attrs.ts` | `src/material/icon/icon-registry.ts` (`_setSvgAttributes`) | ported (string-surgery, new file) | No live `SVGElement` to `setAttribute` on with `dangerouslySetInnerHTML` — stitches the same 5 attributes into the literal's opening `<svg>` tag instead |
| `scss/icon/icon.scss` | `src/material/icon/icon.scss` | synced | byte-identical copy — no `@use '@angular/cdk'` present, unlike badge/toolbar/dialog port SCSS which needed the cdk-stub rewrite |
| `scss/icon/_icon-theme.scss` | `src/material/icon/_icon-theme.scss` | synced | byte-identical copy |
| `scss/icon/_m2-icon.scss` | `src/material/icon/_m2-icon.scss` | synced | byte-identical copy |
| `scss/icon/_m3-icon.scss` | `src/material/icon/_m3-icon.scss` | synced | byte-identical copy |
| `scss/icon/icon-prebuilt.scss` | (qwik-material-specific) | new | `@use` icon.scss only — no `:root` token defaults (removed 2026-10-30, see `core/SYNC.md` "Default theme"): `--mat-icon-color` already carries its own fallback baked in at Sass-compile time (`var(--mat-icon-color, inherit)`), matching upstream's actual default |

## Removed upstream files

- `icon-registry.ts` → the `MatIconRegistry` *service* (XHR loading, icon-sets,
  `addSvgIcon*`, `getNamedSvgIcon`, aliasing) is still omitted (§Deviations #2),
  but two pieces of its state that are directly observable in rendered DOM —
  the default font-set class and `_setSvgAttributes`'s sizing attrs — are now
  reproduced without a registry object (see `icon-config.ts` /
  `icon-svg-attrs.ts` above).
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
7. **`registerFontClassAlias` + `classNameForFontAlias` omitted; `setDefaultFontSetClass` folded into config, not omitted.** There is no alias map (no scenario needs one). But the *effect* of `setDefaultFontSetClass` — the font-set class ladder applied when a `<mat-icon>` has no explicit `fontSet` — is real rendered DOM and is reproduced: `MatIconConfig.fontSet` (provider-configurable, same as before) now falls back to the upstream registry's own built-in default, `MAT_ICON_DEFAULT_FONT_SET_CLASS = 'material-icons mat-ligature-font'`, when neither the prop nor the config is set, instead of silently applying no class at all. Per `_updateFontIconClasses`, this resolved class list may contain multiple space-separated classes; the explicit `fontSet` *prop* (and `data-mat-icon-namespace`) still only ever reflects one, pre-cleaned token — the registry-style default is class-ladder-only and never attribute-visible, matching upstream's split between the `[attr.data-mat-icon-namespace]` host binding and `getDefaultFontSetClass()`. Additionally, when the resolved font-set classes do **not** include `mat-ligature-font`, `fontIcon` is now also added as a class (non-ligature fonts render per-icon glyphs via a CSS class) — previously omitted outright.
8. **RxJS `Subscription` lifecycle omitted.**
9. **`MAT_ICON_CONFIG` folded into `QwikMaterialProvider.matIconConfig`.** 7th `useContextProvider` call.
10. **`_cleanupFontValue` (trim + first space-separated token)** applied at prop-resolution time, not per-setter as upstream does.
11. **Font-mode vs. SVG-mode via two JSX branches.** `dangerouslySetInnerHTML` and `<Slot />` are mutually exclusive; `svgLiteral` wins if both provided.
12. **`aria-hidden='true'` default via prop merge** (`props['aria-hidden'] ?? 'true'`) instead of upstream's constructor-time `setAttribute`.
13. **`aria-label` prop added to `MatIconProps`.** User-adjudicated during Task 9: spec §7.2's `aria-labeled/` route demonstrates `<MatIcon aria-label="Home">` for icons used as labeled controls, but §2.3's original prop list did not declare `aria-label`. Extension forwards `aria-label={props['aria-label']}` on both JSX branches so labeled icons carry the a11y attribute in the emitted DOM.
14. **`_setSvgAttributes` reproduced via string surgery, not DOM mutation.** Upstream calls `svg.setAttribute('fit', '')` / `'height', '100%'` / `'width', '100%'` / `'preserveAspectRatio', 'xMidYMid meet'` / `'focusable', 'false'` on the live `SVGElement` it parsed from the registered literal, on top of whatever the literal already carries (`viewBox`, `aria-hidden`, …). Since `svgLiteral` is set via `dangerouslySetInnerHTML` (no live element to mutate, and it must behave identically at SSR and in the browser), `icon-svg-attrs.ts`'s `withIconSvgAttributes()` inserts the same 5 attributes into the opening `<svg>` tag's markup instead, overwriting any pre-existing occurrence of one of them and leaving every other attribute untouched. `IconOptions.viewBox` (upstream's optional override, tied to the now-omitted registry) is not reproduced — the literal's own `viewBox` passes through unchanged.
15. **`trailingContent` prop added (2026-10-31, docs-example port).** `badge-overview` (material.angular.dev's headline badge example, ported to `src/qwik-cdk-dev-app/src/routes/mat-badge/example/`) has `<mat-icon matBadge="15">home</mat-icon>` — upstream's `[matBadge]` directive attaches to the `<mat-icon>` host directly and appends its own `.mat-badge-content` span as that host's last child. A plain `<MatIcon>` can't be decorated like that from the outside (font mode's only content hook is the ligature-text `<Slot/>`), so `trailingContent?: JSXOutput` renders after it, as the host's real last child — mirrors `MatButtonProps.trailingContent` (same motivating case, same rationale, see button/SYNC.md). Font mode only.

## Qwik dev-app wiring

`src/qwik-cdk-dev-app/src/routes/mat-icon/layout.tsx` wraps every `/mat-icon/*`
scenario in `<QwikMaterialProvider matIconConfig={{fontSet: 'material-symbols-outlined'}}>`,
mirroring the Angular dev-app's effective default (`DevAppLayout.toggleM3` →
`MatIconRegistry.setDefaultFontSetClass('material-symbols-outlined')`,
`src/dev-app/dev-app/dev-app-layout.ts`, in effect by default since
`m3Enabled` defaults to `true`). `mat-stepper/layout.tsx`, `mat-button/layout.tsx`,
`mat-toolbar/layout.tsx`, and `mat-badge/layout.tsx` apply the identical
provider for their own `<MatIcon>`-using scenarios (stepper step icons; the
`button-overview`/`toolbar-overview`/`badge-overview` docs examples), and
`mat-tree/example/` (the `tree-flat-child-accessor-overview` docs example) wraps
just its own `<MatTree>` in the same provider. Any other route tree that renders
a font-mode `<MatIcon>` needs the same (an explicit `fontSet` prop is NOT
equivalent — see deviation #7 above: a prop value also renders
`data-mat-icon-namespace`, which the registry-style config default never does).

`src/qwik-cdk-dev-app/src/routes/mat-icon/svg-literal/index.tsx` now passes
`svgName="home"` to `<MatIcon svgLiteral={HOME_SVG} />`. This is a scenario
fix, not a component fix: the Angular mirror
(`src/dev-app/qwik-parity/icon.ts` `IconSvgLiteral`) registers the literal via
`iconRegistry.addSvgIconLiteral('home', ...)`, so Angular's `MatIcon` renders
`data-mat-icon-name="home"`. The Qwik route previously passed an anonymous
literal with no name; it now mirrors the Angular registration.

## Stub inventory delta

No new stubs — the icon SCSS chain does NOT reference `@angular/cdk` (unlike badge/toolbar/dialog port SCSS which did). Zero additions to `scss/cdk-stub/_cdk-stub.scss` or any other stub file.

## Class count

`grep -rnE "^export class" src/qwik-material/icon/ 2>/dev/null`
→ 0 (no exported classes on the consumer surface).

## Pipeline

`pnpm test:qwik-material` at the repo root runs `build && vitest && lint:no-ssr-leaks && typecheck` for the whole qwik-material package, covering dialog + button + card + toolbar + badge + icon.

## Directive-hook host support (2026-10-31, directive-hooks remediation)

**Item 15 above (`trailingContent`) is REMOVED, replaced by `hostContent?: JSXOutput`** — the
same rename/generalization `button/SYNC.md` documents: no longer a badge-specific escape hatch,
it's the host-side half of ANY directive hook's `content` field (`useMatBadge(...).content`; see
`qwik-material/core/host-props.ts` and `qwik-material/README.md`'s "Composing directives"
section). Also added: `ref?: HostRef` (forwarded onto `<mat-icon>`, for a future directive hook
needing the live element) and a generic `[extraAttr: string]: unknown` index signature +
`extraHostAttrs()` passthrough, same rationale as `button/SYNC.md`'s identical additions. `mat-
badge/example` was rewritten to call `useMatBadge()` directly and pass `hostContent={badge.
content}` instead of hand-computing the badge markup — see that route's own header comment and
`badge/SYNC.md`'s directive-hook section. Verified: the full `specs/material-icon` suite and
`specs/examples`'s `mat-badge/example` interaction both stay green.
