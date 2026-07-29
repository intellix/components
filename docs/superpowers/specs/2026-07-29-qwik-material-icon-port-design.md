# qwik-material Icon port — design spec

Port `src/material/icon/` into a `qwik-material/icon` entry-point. Sixth component after Dialog + Button + Card + Toolbar + Badge. Upstream has a real service surface — `MatIconRegistry` at 741 LOC with HttpClient / DomSanitizer / RxJS — that the port omits entirely; the port ships only the presentational `<MatIcon>` component with font-icon and inline-SVG modes.

- **Upstream source:** `src/material/icon/` (473-LOC `MatIcon` component + 741-LOC `MatIconRegistry` service + 4 SCSS files + 1501-LOC spec).
- **New entry-point:** `@angular-community/qwik-material/icon` at `src/qwik-material/icon/`.
- **New prebuilt CSS:** `@angular-community/qwik-material/icon-prebuilt.css`.
- **Branch:** `qwik-cdk-dialog-port` (continues on the same branch as Dialog + Button + Card + Toolbar + Badge).
- **Base commit:** tip of the Badge port after final review + fast-follow — `28146576a`.

---

## 1. Package layout

Under `src/qwik-material/`:

```
icon/
  icon-color.ts              — MatIconColor type
  icon-color.spec.ts
  icon-config.ts             — MatIconConfig + MAT_ICON_CONFIG token
  icon-config.spec.ts
  mat-icon.tsx               — <MatIcon>
  mat-icon.spec.tsx          — smoke
  mat-icon-scenarios.spec.tsx — upstream scenario port
  intrinsic-elements.d.ts    — `<mat-icon>` JSX declaration
  public-api.ts              — consumer-facing re-exports
  index.ts                   — `export * from './public-api'`
  SYNC.md                    — deviation log
scss/
  icon/
    icon.scss                — verbatim copy (may need `@use '@angular/cdk'` rewrite — verified in Task 2)
    _icon-theme.scss         — verbatim copy
    _m2-icon.scss            — verbatim copy
    _m3-icon.scss            — verbatim copy
    icon-prebuilt.scss       — NEW: @use icon.scss + M3 :root defaults
```

`<mat-icon>` is a custom-element tag (same as `<mat-card>`, `<mat-toolbar>`, `<mat-dialog-container>`). It ships with an `intrinsic-elements.d.ts` entry so consumer JSX typechecks.

Existing files reused (no changes):
- `tsconfig.json`, `vitest.setup.ts`, `scripts/lint-no-ssr-leaks.mjs`

**Modified:**
- `src/qwik-material/package.json` — add `./icon` + `./icon-prebuilt.css` exports (after `./badge` entries)
- `src/qwik-material/vite.config.ts` — `entries` gains `'icon'`; `sassEntries` gains icon prebuilt
- `src/qwik-material/dialog/qwik-material-provider.tsx` — add `matIconConfig?: MatIconConfig` prop + `useContextProvider(MAT_ICON_CONFIG, ...)` call (7th provider call)

**qwik-cdk-dev-app changes:**
- `src/root.tsx`: add `import '@angular-community/qwik-material/icon-prebuilt.css';`
- `src/routes/index.tsx`: add an "Icons" section with 8 route links (after Badges)
- `src/routes/mat-icon/<name>/index.tsx`: 8 new route files

**qwik-cdk-parity-tests changes:**
- `specs/material-icon/`: 8 Playwright specs asserting host classes + attributes + rendered content

---

## 2. Public API surface

Everything the consumer sees. No exported classes.

### 2.1 Types

```ts
export type MatIconColor = 'primary' | 'accent' | 'warn';

export interface MatIconConfig {
  color?: MatIconColor;
  fontSet?: string;
}
```

### 2.2 Context token

```ts
import {createContextId} from '@builder.io/qwik';

export const MAT_ICON_CONFIG = createContextId<MatIconConfig>(
  'qwik-material/icon-config',
);
```

### 2.3 Component props

```ts
export interface MatIconProps {
  /** M2 palette color. Adds `.mat-<color>` class. */
  color?: MatIconColor;
  /** Inline sizing — applies `.mat-icon-inline`. */
  inline?: boolean;
  /** Font-icon glyph name; emitted as `fontIcon` attribute for `::before content: attr(fontIcon)` rendering. */
  fontIcon?: string;
  /** Font-set class(es) applied to the host. Resolves from prop → config → undefined. */
  fontSet?: string;
  /** Raw SVG string set via `dangerouslySetInnerHTML`. Consumer's responsibility to trust. */
  svgLiteral?: string;
  /** Optional CMS-facing label for `data-mat-icon-name` attr in SVG mode. */
  svgName?: string;
  /** Optional CMS-facing label for `data-mat-icon-namespace` attr in SVG mode. */
  svgNamespace?: string;
  /** Overrides the default `aria-hidden='true'`. Pass `false` for labeled decorative-icon-as-control usage. */
  'aria-hidden'?: boolean | 'true' | 'false';
  class?: string | ReadonlyArray<string>;
  id?: string;
}
```

### 2.4 Component

```ts
export declare const MatIcon: Component<MatIconProps>;
```

### 2.5 Public API re-exports (`icon/public-api.ts`)

```ts
export type {MatIconColor} from './icon-color';
export type {MatIconConfig} from './icon-config';
export {MAT_ICON_CONFIG} from './icon-config';
export {MatIcon, type MatIconProps} from './mat-icon';
```

Zero `export declare class`. Zero `class` declarations on the consumer surface.

### 2.6 Provider extension

Consumers configure defaults via the shared provider:

```tsx
<QwikMaterialProvider
  matIconConfig={{color: 'primary', fontSet: 'material-symbols-outlined'}}
>
  <MatIcon>home</MatIcon>
</QwikMaterialProvider>
```

Both fields optional; empty `{}` is valid.

---

## 3. Internal architecture

### 3.1 Rendered DOM shape

**Font mode** (no `svgLiteral`):

```html
<mat-icon
  role="img"
  aria-hidden="true"
  class="mat-icon notranslate mat-primary mat-icon-inline"
  data-mat-icon-type="font"
  data-mat-icon-name="home"
  fontIcon="home"
>
  home
</mat-icon>
```

**SVG mode** (`svgLiteral` supplied):

```html
<mat-icon
  role="img"
  aria-hidden="true"
  class="mat-icon notranslate mat-icon-no-color"
  data-mat-icon-type="svg"
  data-mat-icon-name="cake"
  data-mat-icon-namespace="social"
>
  <svg viewBox="0 0 24 24"><path d="…"/></svg>
</mat-icon>
```

(No `color` prop supplied → `mat-icon-no-color` is present. See §3.3 for the class-ladder logic and CMS-parity rationale.)

Two mutually-exclusive JSX branches (`dangerouslySetInnerHTML` and `<Slot />` cannot coexist). `svgLiteral` wins if both provided.

### 3.2 Prop resolution chain

```
color      = props.color   ?? config.color                    (undefined ⇒ no `mat-<color>` class)
inline     = props.inline  ?? false
fontSet    = _cleanupFontValue(props.fontSet ?? config.fontSet)
fontIcon   = _cleanupFontValue(props.fontIcon)
usingSvg   = !!props.svgLiteral
ariaHidden = props['aria-hidden'] ?? 'true'
```

`_cleanupFontValue(value)` = `typeof value === 'string' ? value.trim().split(' ')[0] : value`. Same trim-and-first-token pattern as upstream, applied at prop-resolution time.

### 3.3 Class ladder (exact order)

```ts
const isPaletteColor = color === 'primary' || color === 'accent' || color === 'warn';

const classes = [
  'mat-icon',
  'notranslate',
  color && `mat-${color}`,
  inline && 'mat-icon-inline',
  !isPaletteColor && 'mat-icon-no-color',
  !usingSvg && fontSet,
  props.class,
].filter(Boolean) as string[];
```

Established `.filter(Boolean) as string[]` cast — Qwik's `ClassList` type rejects `(string | ReadonlyArray<string>)[]`.

Upstream logic parity:
- `mat-<color>` mirrors upstream `[class]: 'color ? "mat-" + color : ""'` binding — only emitted when `color` is set.
- `mat-icon-no-color` mirrors upstream `[class.mat-icon-no-color]: 'color !== "primary" && color !== "accent" && color !== "warn"'`. Applied whenever `color` is **not** a palette value — i.e. when unset (the common case, since we don't default a color) OR when overridden via `props.class`. This means the emitted DOM has `mat-icon-no-color` on every icon unless the consumer explicitly passes `color='primary' | 'accent' | 'warn'`. This is upstream behavior — CMS parity gate.

### 3.4 Host attributes (font branch)

- `id={props.id}` (optional)
- `class={classes}`
- `role="img"` (always)
- `aria-hidden={ariaHidden}` (default `'true'`, consumer-overridable)
- `data-mat-icon-type="font"`
- `data-mat-icon-name={fontIcon}` (only if set)
- `fontIcon={fontIcon}` (only if set) — SCSS uses `[fontIcon]::before { content: attr(fontIcon) }`
- Body: `<Slot />` for ligature text content

### 3.5 Host attributes (SVG branch)

- `id={props.id}` (optional)
- `class={classes}` (fontSet omitted here — SVG mode does not carry a font-set class)
- `role="img"` (always)
- `aria-hidden={ariaHidden}`
- `data-mat-icon-type="svg"`
- `data-mat-icon-name={svgName}` (only if set)
- `data-mat-icon-namespace={svgNamespace}` (only if set)
- `dangerouslySetInnerHTML={svgLiteral}`
- No `<Slot />` — children would be overwritten

### 3.6 No lifecycle work

- Zero `useVisibleTask$`, zero `useTask$`, zero `useResource$`.
- No id counter (unlike Dialog `nextTitleId()` / Badge `nextBadgeContentId()`).
- No `useSignal`.
- No subscription cleanup (nothing async is running).

Component is a pure function of `(props, context)` → JSX.

---

## 4. SSR & rendering safety

- Zero browser globals accessed (`document.` / `window.` / `navigator.` / `getComputedStyle(` / `requestAnimationFrame(` all absent).
- `dangerouslySetInnerHTML` is Qwik-native — it emits the string into the element's innerHTML at both SSR render and hydration. No hydration mismatch possible since `usingSvg` is derived from `props.svgLiteral` and props are stable across SSR + hydrate.
- No `isBrowser` import from `@builder.io/qwik/build` (banned per Global Constraints).
- SSR lint (`lint:no-ssr-leaks`) will find zero violations.
- Consumer-provided SVG strings are trusted verbatim — deviation catalogued (§6 deviation #4). If a consumer passes untrusted user-provided SVG, that's an XSS risk on them, same tradeoff as any `innerHTML` set.

---

## 5. CSS delivery

Standard port pattern — mirrors Badge / Toolbar exactly.

### 5.1 SCSS chain

Copy byte-identical from upstream:
- `_icon-theme.scss` (109 LOC)
- `_m2-icon.scss` (15 LOC)
- `_m3-icon.scss` (21 LOC)

Copy with documented rewrite (verified in Task 2):
- `icon.scss` (64 LOC) — its `@use` chain is `'../core/style/vendor-prefixes'` + `'./m3-icon'` + `'../core/tokens/token-utils'`. If any of those bring in `@angular/cdk` transitively, the port applies the established `@use '../cdk-stub' as cdk` rewrite. Existing stubs from prior ports (`_cdk-stub.scss`) already define `high-contrast`; Task 2 verifies whether icon's chain needs additional stubs.

### 5.2 Prebuilt CSS

New file: `scss/icon/icon-prebuilt.scss`. Wraps `@use './icon';` + a `:root { … }` block defining every `--mat-icon-*` and `--mat-sys-*` reference emitted by `_m3-icon.scss` + `_icon-theme.scss`, with M3 defaults verified against the repo's token source files (`_md-sys-color.scss`, `_md-sys-typescale.scss`, etc.).

Task 2 explicitly greps the emitted CSS for `--mat-icon-*` references vs. its own `:root` declarations to catch phantom variables (bug class first observed in Card Task 2) or missing declarations (Badge Task 2).

### 5.3 Consumer wiring

```ts
// consumer app root
import '@angular-community/qwik-material/icon-prebuilt.css';
```

Independent of other prebuilt entries. Consumer only pays for what they import.

---

## 6. Deviations catalog

Recorded verbatim in `src/qwik-material/icon/SYNC.md` (Task 10).

1. **`<mat-icon>` custom-element tag preserved.** Same as Card / Toolbar / Dialog. Emits an `intrinsic-elements.d.ts` entry for JSX typechecking. Consistent with the CMS-parity constraint that class + tag structure match upstream.
2. **`MatIconRegistry` service entirely omitted.** No XHR SVG loader, no `addSvgIcon` / `addSvgIconLiteral` / `addSvgIconInNamespace` / `addSvgIconResolver`, no icon-sets (`addSvgIconSet*`), no `getNamedSvgIcon`, no `getSvgIconFromUrl`. Consumers who need registry-style lookup pre-bundle SVG strings into a static map they own and pass the resolved string as `svgLiteral`.
3. **`svgIcon: string` prop replaced by explicit `svgLiteral` + `svgName` + `svgNamespace`.** Three props instead of one; no colon-split magic; no registry lookup at render time. Consumer supplies the raw SVG string directly (typically imported via `import svg from './home.svg?raw'`).
4. **DomSanitizer omitted.** Consumer's `svgLiteral` is set via `dangerouslySetInnerHTML` and trusted verbatim. No `SafeHtml` / `SafeResourceUrl` piping. Consumer's responsibility to only pass trusted SVG strings.
5. **`MAT_ICON_LOCATION` context + `ngAfterViewChecked` FuncIRI path-prepending omitted.** Upstream's Safari workaround for base-tag pages with in-app navigation. SSR-hostile and irrelevant to Qwik apps' resume model.
6. **`ErrorHandler` injection omitted.** No icon-fetch errors possible without a registry.
7. **`registerFontClassAlias` + `setDefaultFontSetClass` + `classNameForFontAlias` omitted.** Folded into `MAT_ICON_CONFIG.fontSet`; consumer passes actual class strings.
8. **RxJS `Subscription` lifecycle omitted.** No async fetching to cancel.
9. **`MAT_ICON_CONFIG` folded into `QwikMaterialProvider.matIconConfig`.** Established pattern from Dialog + Button + Card + Toolbar + Badge — 7th `useContextProvider` call.
10. **`_cleanupFontValue` (trim + first space-separated token)** applied at prop-resolution time, not on every setter mutation as upstream does. Same observable behavior.
11. **Font-mode vs. SVG-mode via two JSX branches.** `dangerouslySetInnerHTML` and `<Slot />` are mutually exclusive in Qwik; `svgLiteral` wins if both provided. No runtime warning — consumer's mistake to make.
12. **`aria-hidden='true'` default applied via prop merge.** Upstream sets it via constructor-time `setAttribute` if the consumer didn't declare it. The port emits `aria-hidden={props['aria-hidden'] ?? 'true'}` at render time — same observable behavior, no DOM mutation.

Everything above is deliberate. Additional deviations discovered during implementation get appended to the SYNC.md list.

---

## 7. Test coverage strategy

### 7.1 Vitest (smoke-only, per established convention)

`icon/mat-icon-scenarios.spec.tsx` mirrors Badge's structure. `createDOM(<component$/>)` hangs the Qwik optimizer worker under vitest — every prior port confirmed this — so specs use module-import assertions only. Real DOM assertions live in Playwright.

**Live sanity tests (~7):**
1. `MatIcon` is exported (typeof === 'function')
2. `MAT_ICON_CONFIG.id === 'qwik-material/icon-config'`
3. `MatIconColor` accepts `'primary' | 'accent' | 'warn'`
4. `MatIconConfig` accepts empty `{}`
5. `MatIconConfig` accepts every documented field
6. Public API re-exports resolve
7. Provider integration smoke: `QwikMaterialProvider matIconConfig={…}` type-checks

**describe.skip DOM-rendered (~14):** deferred to Playwright Task 9
- host classes: `mat-icon`, `notranslate`, `.mat-<color>`, `.mat-icon-inline`, `.mat-icon-no-color`
- host attrs: `role="img"`, `aria-hidden="true"`, `data-mat-icon-type`, `data-mat-icon-name`, `data-mat-icon-namespace`, `fontIcon`
- font ligature rendering
- inline SVG rendering
- `_cleanupFontValue` trim + first-token
- aria-hidden override

**describe.skip Angular-only (~20):** deferred forever per §6 deviations
- registry `addSvgIcon` / `addSvgIconInNamespace` / `addSvgIconSet` / `addSvgIconResolver`
- registry `getNamedSvgIcon` / `getSvgIconFromUrl` XHR flows
- `HttpClient` interception + error handling
- `DomSanitizer` bypass paths
- `MAT_ICON_LOCATION` path-change tick
- `ngAfterViewChecked` FuncIRI prepending
- `ErrorHandler.handleError` on fetch failure
- font-set alias registration
- `_previousFontSetClass` mutation lifecycle
- constructor-time `setAttribute('aria-hidden', 'true')`

### 7.2 Dev-app routes (8)

Under `src/qwik-cdk-dev-app/src/routes/mat-icon/`:

| Route | Scenario |
| --- | --- |
| `basic/` | `<MatIcon>home</MatIcon>` — font ligature via slot content |
| `font-icon/` | `<MatIcon fontIcon="home" />` — glyph via `[fontIcon]::before` |
| `font-set/` | `<MatIcon fontSet="material-symbols-outlined" fontIcon="home" />` — custom font-set class |
| `svg-literal/` | `<MatIcon svgLiteral={homeSvg} />` — raw SVG string |
| `svg-named/` | `<MatIcon svgLiteral={cakeSvg} svgName="cake" svgNamespace="social" />` — CMS-attr labeling |
| `colors/` | 3 icons: `color='primary'`, `'accent'`, `'warn'` — `.mat-<color>` classes |
| `inline/` | `<MatIcon inline>home</MatIcon>` — `.mat-icon-inline` class |
| `aria-labeled/` | `<MatIcon aria-hidden={false} aria-label="Home">home</MatIcon>` — override default |

Every route ends with `<main data-scenario-ready>ready</main>` marker for Playwright's `waitForSelector`.

### 7.3 Playwright parity specs (8)

Under `src/qwik-cdk-parity-tests/specs/material-icon/`. One spec per dev-app route. Each spec asserts:
- Locator `mat-icon` (custom-element tag — same as Card / Toolbar).
- Class ladder tokens: `mat-icon`, `notranslate`, mode-specific classes.
- Host attrs: `role`, `aria-hidden`, `data-mat-icon-type`, mode-specific data-attrs.
- Rendered content: text content for font mode, `svg` child for SVG mode.

CMS parity gate: every spec asserts on the `mat-icon` tag AT LEAST ONCE. A regression that drops the tag or the `.mat-icon` class fails loudly.

---

## 8. SYNC.md format

`src/qwik-material/icon/SYNC.md` follows the same table + deviation-catalog + stub-inventory-delta shape as Badge / Toolbar. Rows:

| File | Upstream path | Sync state | Notes |
| --- | --- | --- | --- |
| `icon/mat-icon.tsx` | `src/material/icon/icon.ts` (MatIcon component) | ported | Directive→component$; two mutually-exclusive JSX branches for font vs. SVG mode; registry omitted |
| `icon/icon-color.ts` | `src/material/icon/icon.ts` (ThemePalette narrowing) | ported | Narrowed to `'primary' \| 'accent' \| 'warn'` union |
| `icon/icon-config.ts` | `src/material/icon/icon.ts` (MatIconDefaultOptions) | ported | InjectionToken→createContextId; folded into QwikMaterialProvider.matIconConfig |
| `scss/icon/icon.scss` | `src/material/icon/icon.scss` | verify (Task 2) | if `@use '@angular/cdk'` present, apply `@use '../cdk-stub' as cdk` rewrite |
| `scss/icon/_icon-theme.scss` | `src/material/icon/_icon-theme.scss` | synced | byte-identical copy |
| `scss/icon/_m2-icon.scss` | `src/material/icon/_m2-icon.scss` | synced | byte-identical copy |
| `scss/icon/_m3-icon.scss` | `src/material/icon/_m3-icon.scss` | synced | byte-identical copy |
| `scss/icon/icon-prebuilt.scss` | (qwik-material-specific) | new | @use icon.scss + M3 :root defaults |

Removed upstream files:
- `icon-registry.ts` → entire service omitted (§6 deviation #2)
- `icon-module.ts` → Qwik has no module concept
- `fake-svgs.ts` → test-only SVG payloads for registry unit tests; no registry, no need
- `testing/` (MatIconTestingModule + FakeMatIconRegistry) → registry stubs; no registry, no need
- `public-api.ts` → replaced with our own re-export shape (§2.5)
- `icon.spec.ts` → ported to `mat-icon-scenarios.spec.tsx` with restructured coverage per the smoke-only vitest constraint

---

## 9. Explicit non-goals

- No async SVG loading of any kind (XHR, `fetch`, dynamic import).
- No SVG string sanitization.
- No FuncIRI path munging.
- No font-icon glyph mapping tables.
- No icon-set support.
- No `MatIcon.testing` fake registry.
- No IE-specific `innerHTML` compatibility shims.
- No `mat-icon-rtl-mirror` runtime toggling — consumer applies the class if they want RTL mirroring; CSS handles it (upstream ships the CSS rule).

---

## 10. Rough task decomposition

Plan-writer will refine, but the shape mirrors Badge/Toolbar exactly:

1. **Entry-point wiring** — package.json + vite.config.ts + intrinsic-elements.d.ts + empty index.ts stub
2. **SCSS chain + prebuilt** — copy 4 upstream files + write icon-prebuilt.scss with verified `:root` variables
3. **MatIconColor type** — 3-value union + spec
4. **MatIconConfig + MAT_ICON_CONFIG** — interface + context id + spec
5. **MatIcon component** — mat-icon.tsx with prop resolution + class ladder + two JSX branches + smoke spec
6. **Provider extension** — extend `QwikMaterialProvider` with `matIconConfig?` field (7th `useContextProvider` call)
7. **Public API** — public-api.ts re-exports + swap index.ts stub for real re-export + build validation
8. **Vitest scenario port** — mat-icon-scenarios.spec.tsx with restructured coverage
9. **Dev-app routes + Playwright specs** — 8 routes + 8 parity specs + root.tsx CSS import + index.tsx tile section
10. **SYNC.md + pipeline verification** — final `pnpm test:qwik-material` gate

Every task ends with a commit using scope `multiple` per the project-wide commit-msg hook constraint.
