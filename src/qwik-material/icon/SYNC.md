# qwik-material/icon sync log

Tracks the sync state between this port and `src/material/icon/` upstream.
Every deviation from a verbatim copy is recorded here. Companion to
`src/qwik-material/dialog/SYNC.md`, `src/qwik-material/button/SYNC.md`,
`src/qwik-material/card/SYNC.md`, `src/qwik-material/toolbar/SYNC.md`, and
`src/qwik-material/badge/SYNC.md`.

**2026-11-03 SVG icon registry.** This file previously said "the
`MatIconRegistry` *service* … is still omitted" (old §Removed upstream
files, and deviation #2 below). That's no longer true: `icon-registry.ts`
now ports `addSvgIcon`/`addSvgIconInNamespace`/`addSvgIconLiteral`/
`addSvgIconLiteralInNamespace`/`addSvgIconSet`/`addSvgIconSetInNamespace`/
`addSvgIconSetLiteral`/`addSvgIconSetLiteralInNamespace`/
`addSvgIconResolver`/`getNamedSvgIcon`/`getSvgIconFromUrl`/
`registerFontClassAlias`/`classNameForFontAlias`/`setDefaultFontSetClass`/
`getDefaultFontSetClass`, and `<MatIcon>` gets a new `svgIcon` prop that
resolves against it — SSR-blocking (no flash, works with no client JS) and
re-resolving on the client when the prop changes after resume. See the new
"SVG icon registry" section below for the full design, and the updated
upstream-sync table / deviations list for exactly what changed and why.
`svgLiteral`/`svgName`/`svgNamespace` (deviation #3's original replacement
for `svgIcon`) stay exactly as they were — fully backwards compatible,
`svgLiteral` wins if both are set on the same `<MatIcon>`.

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
| `icon/mat-icon.tsx` | `src/material/icon/icon.ts` (MatIcon component) | ported | Directive→component$; THREE JSX-relevant modes now (font / `svgLiteral` / `svgIcon`, the last two sharing one JSX branch); `svgIcon` resolves via `icon-registry.ts` through a `useComputed$` |
| `icon/icon-color.ts` | `src/material/icon/icon.ts` (ThemePalette narrowing) | ported | Narrowed to `'primary' | 'accent' | 'warn'` union (the PROP itself is further widened to `OpenString<MatIconColor>` — see button/SYNC.md's identical 2026-11-03 entry; this type stays narrow, used for `MatIconConfig.color`) |
| `icon/icon-config.ts` | `src/material/icon/icon.ts` (MatIconDefaultOptions) + `icon-registry.ts` (`_defaultFontSetClass`) | ported | InjectionToken→createContextId; folded into QwikMaterialProvider.matIconConfig; exports `MAT_ICON_DEFAULT_FONT_SET_CLASS` (upstream registry's built-in default) |
| `icon/icon-svg-attrs.ts` | `src/material/icon/icon-registry.ts` (`_setSvgAttributes`) | ported (string-surgery, new file) | No live `SVGElement` to `setAttribute` on with `dangerouslySetInnerHTML` — stitches the same 5 attributes into the literal's opening `<svg>` tag instead. 2026-11-03: `withIconSvgAttributes()` grew an optional 2nd `viewBox` param (`IconOptions.viewBox`'s override, used by the registry path only) |
| `icon/icon-registry.ts` | `src/material/icon/icon-registry.ts` (`MatIconRegistry`, minus the parts explicitly still omitted — see deviations) | ported (2026-11-03, new file) | `@Injectable` class → a plain `MatIconRegistryStore` (data, in a Qwik `useStore()`) PLUS plain exported functions operating on it (logic) — no class instance anywhere; see this file's own module doc comment |
| `icon/icon-trusted.ts` | `icon-registry.ts`'s `SafeResourceUrl`/`SafeHtml` requirement (via `DomSanitizer`) | ported (new file, no DomSanitizer) | `trustIconResourceUrl(url)`/`trustIconHtml(html)` branded-wrapper functions — the explicit "I trust this" opt-in, without an Angular DI sanitizer service |
| `icon/icon-fetch.ts` | `icon-registry.ts`'s `_fetchIcon`/`_inProgressUrlFetches`/`_cachedIconsByUrl` | ported (string-based, new file) | Module-level `Map<url, Promise<string>>`, not request/store-scoped — see deviation below |
| `icon/icon-set-extract.ts` | `icon-registry.ts`'s `_extractSvgIconFromSet`/`_toSvgElement` | ported (string-surgery, new file) | No live DOM to `querySelector`/`cloneNode` on — regex + depth-counted tag matching over the icon-set's raw markup string instead |
| `icon/mat-icon-registry-provider.tsx` | (no 1:1 upstream file — `MatIconRegistry` is `providedIn: 'root'`, auto-injected) | new | `<MatIconRegistryProvider icons={...} iconSets={...}>` — the Qwik-idiomatic "place this once near the app root" equivalent of upstream's automatic DI |
| `scss/icon/icon.scss` | `src/material/icon/icon.scss` | synced | byte-identical copy — no `@use '@angular/cdk'` present, unlike badge/toolbar/dialog port SCSS which needed the cdk-stub rewrite |
| `scss/icon/_icon-theme.scss` | `src/material/icon/_icon-theme.scss` | synced | byte-identical copy |
| `scss/icon/_m2-icon.scss` | `src/material/icon/_m2-icon.scss` | synced | byte-identical copy |
| `scss/icon/_m3-icon.scss` | `src/material/icon/_m3-icon.scss` | synced | byte-identical copy |
| `scss/icon/icon-prebuilt.scss` | (qwik-material-specific) | new | `@use` icon.scss only — no `:root` token defaults (removed 2026-10-30, see `core/SYNC.md` "Default theme"): `--mat-icon-color` already carries its own fallback baked in at Sass-compile time (`var(--mat-icon-color, inherit)`), matching upstream's actual default |

## Removed upstream files

- `icon-module.ts` → Qwik has no module concept
- `fake-svgs.ts` → test-only SVG payloads for upstream's OWN registry unit
  tests (Angular TestBed + HttpTestingController); `icon-registry.spec.ts`
  (this port's vitest suite) uses its own small inline fixtures with a mocked
  `fetch` instead — no TestBed/HttpTestingController equivalent to port the
  upstream fixtures FOR.
- `testing/` (`MatIconTestingModule` + `FakeMatIconRegistry` + the harness) →
  Angular CDK component-harness framework has no Qwik equivalent in this
  port at all (true for every component, not icon-specific) — a Qwik
  consumer test that needs a stub registry constructs a plain
  `MatIconRegistryStore` via `createIconRegistryStore()` directly (it's
  already just plain data, no fake/mock wrapper needed).
- `public-api.ts` → replaced with our own re-export shape (see `public-api.ts`)
- `icon.spec.ts` → ported to `mat-icon-scenarios.spec.tsx` with restructured coverage per the smoke-only vitest constraint

## Deviations from upstream

1. **`<mat-icon>` custom-element tag preserved.** Emitted via `intrinsic-elements.d.ts` JSX augmentation. Consistent with the CMS-parity constraint.
2. **`MatIconRegistry` service — PORTED 2026-11-03** (previously "entirely omitted"; see this file's top-of-file 2026-11-03 note and the "SVG icon registry" section below). What's STILL genuinely omitted from the upstream service, and why: XHR specifically (replaced by the platform `fetch()` — see deviation #4 below); the Safari `MAT_ICON_LOCATION`/FuncIRI path-rewriting workaround (deviation #5, unrelated to the registry, SSR-hostile); `RxJS Subscription` lifecycle (deviation #8, `useComputed$` has its own cleanup). Everything else upstream's registry does (`addSvgIcon*`, `addSvgIconSet*`, `addSvgIconResolver`, `getNamedSvgIcon`, `getSvgIconFromUrl`, font-aliasing) is ported.
3. **`svgIcon: string` prop — RESTORED 2026-11-03, alongside (not instead of) `svgLiteral` + `svgName` + `svgNamespace`.** This deviation previously said the single upstream `svgIcon` input was replaced outright by the three explicit props. It's now back, resolving by name against a `MAT_ICON_REGISTRY` ancestor exactly like upstream (colon-split namespace included — `splitIconName()`, throwing on a 2nd `:`, same as upstream's `_splitIconName`) — see `MatIconProps.svgIcon`'s own doc comment in `mat-icon.tsx`. `svgLiteral`/`svgName`/`svgNamespace` are UNCHANGED and still work exactly as before (this deviation's original text, below, still describes them); `svgLiteral` wins if a `<MatIcon>` somehow has both.
4. **DomSanitizer omitted.** `svgLiteral` set via `dangerouslySetInnerHTML` and trusted verbatim. The registry's `addSvgIcon*`/`addSvgIconSet*` functions (new 2026-11-03) reproduce upstream's EXPLICIT-trust requirement without DomSanitizer: they require a `TrustedResourceUrl`/`TrustedHtml` (`icon-trusted.ts`'s `trustIconResourceUrl()`/`trustIconHtml()`), not a plain string — calling either function on a string is the one-line opt-in Angular's `DomSanitizer.bypassSecurityTrustResourceUrl()`/`bypassSecurityTrustHtml()` call is upstream, and carries the exact same warning: it does NOT sanitize anything (upstream's own bypass functions don't either), so never wrap unvalidated/user-submitted content with it. `fetch()` (not XHR/`HttpClient`) does the actual fetching — this package takes no HTTP-client dependency; `IconOptions.withCredentials` is accepted on the type for API-surface parity but not applied (see `icon-registry.ts`'s doc comment on that field for the escape hatch).
5. **`MAT_ICON_LOCATION` context + `ngAfterViewChecked` FuncIRI path-prepending omitted.** Safari workaround for base-tag pages; SSR-hostile. Unaffected by the 2026-11-03 registry addition — `<symbol>`/`<use>`-style id/url() rewriting for THAT specific Safari issue stays out of scope, same reasoning as before.
6. **`ErrorHandler` injection omitted.** `svgIcon` resolution failures (no registry ancestor, name not found, fetch failed) are logged via `console.error` directly from `mat-icon.tsx` (2026-11-03) — matching Angular's own DEFAULT `ErrorHandler` implementation (what you get with no custom one provided), not a DI token.
7. **`registerFontClassAlias` + `classNameForFontAlias` — PORTED 2026-11-03, but NOT wired into `<MatIcon>`'s rendering.** `icon-registry.ts` now has both functions (operating on `MatIconRegistryStore.fontAliases`), for upstream API-surface completeness — but merging them into `<MatIcon>`'s font-mode class resolution (which still uses the independent, pre-existing `MatIconConfig.fontSet` mechanism described below) was judged a larger, separate, riskier change than this task's actual scope (SVG resolution), and no current scenario needs a font alias consulted by rendering. `setDefaultFontSetClass`/`getDefaultFontSetClass` are ALSO now real registry functions (same completeness rationale, same "not wired into rendering" caveat) — the *effect* upstream's `setDefaultFontSetClass` has on rendering is STILL the separate mechanism this item originally described: `MatIconConfig.fontSet` (provider-configurable) falls back to `MAT_ICON_DEFAULT_FONT_SET_CLASS = 'material-icons mat-ligature-font'` when neither the prop nor the config is set. Per `_updateFontIconClasses`, this resolved class list may contain multiple space-separated classes; the explicit `fontSet` *prop* (and `data-mat-icon-namespace`) still only ever reflects one, pre-cleaned token — the registry-style default is class-ladder-only and never attribute-visible, matching upstream's split between the `[attr.data-mat-icon-namespace]` host binding and `getDefaultFontSetClass()`. Additionally, when the resolved font-set classes do **not** include `mat-ligature-font`, `fontIcon` is now also added as a class (non-ligature fonts render per-icon glyphs via a CSS class).
8. **RxJS `Subscription` lifecycle omitted.**
9. **`MAT_ICON_CONFIG` folded into `QwikMaterialProvider.matIconConfig`.** 7th `useContextProvider` call.
10. **`_cleanupFontValue` (trim + first space-separated token)** applied at prop-resolution time, not per-setter as upstream does.
11. **Font-mode vs. SVG-mode via two JSX branches.** `dangerouslySetInnerHTML` and `<Slot />` are mutually exclusive; `svgLiteral` wins if both provided.
12. **`aria-hidden='true'` default via prop merge** (`props['aria-hidden'] ?? 'true'`) instead of upstream's constructor-time `setAttribute`.
13. **`aria-label` prop added to `MatIconProps`.** User-adjudicated during Task 9: spec §7.2's `aria-labeled/` route demonstrates `<MatIcon aria-label="Home">` for icons used as labeled controls, but §2.3's original prop list did not declare `aria-label`. Extension forwards `aria-label={props['aria-label']}` on both JSX branches so labeled icons carry the a11y attribute in the emitted DOM.
14. **`_setSvgAttributes` reproduced via string surgery, not DOM mutation.** Upstream calls `svg.setAttribute('fit', '')` / `'height', '100%'` / `'width', '100%'` / `'preserveAspectRatio', 'xMidYMid meet'` / `'focusable', 'false'` on the live `SVGElement` it parsed from the registered literal, on top of whatever the literal already carries (`viewBox`, `aria-hidden`, …). Since `svgLiteral` is set via `dangerouslySetInnerHTML` (no live element to mutate, and it must behave identically at SSR and in the browser), `icon-svg-attrs.ts`'s `withIconSvgAttributes()` inserts the same 5 attributes into the opening `<svg>` tag's markup instead, overwriting any pre-existing occurrence of one of them and leaving every other attribute untouched. `IconOptions.viewBox` (upstream's optional override) is now reproduced too (2026-11-03, `withIconSvgAttributes()`'s new optional 2nd parameter) — but ONLY for icons resolved through the registry (`svgIcon`, `getNamedSvgIcon`, `getSvgIconFromUrl`); the plain `svgLiteral` prop has no options bag to carry one, so its literal's own `viewBox` (if any) still just passes through unchanged, as before.
15. **`trailingContent` prop added (2026-10-31, docs-example port).** `badge-overview` (material.angular.dev's headline badge example, ported to `src/qwik-cdk-dev-app/src/routes/mat-badge/example/`) has `<mat-icon matBadge="15">home</mat-icon>` — upstream's `[matBadge]` directive attaches to the `<mat-icon>` host directly and appends its own `.mat-badge-content` span as that host's last child. A plain `<MatIcon>` can't be decorated like that from the outside (font mode's only content hook is the ligature-text `<Slot/>`), so `trailingContent?: JSXOutput` renders after it, as the host's real last child — mirrors `MatButtonProps.trailingContent` (same motivating case, same rationale, see button/SYNC.md). Font mode only.
16. **Registry data is context-scoped (per `<MatIconRegistryProvider>`/`useMatIconRegistry()` subtree), NOT a module-level singleton (2026-11-03).** Upstream's `MatIconRegistry` is `providedIn: 'root'` — effectively one instance per Angular app bootstrap, which for Angular Universal SSR means a NEW instance (and NEW registrations) per request. A naive module-level singleton in this port would instead SHARE one mutable registry across every concurrent SSR request in the same Node process — wrong the moment two requests register different icons (e.g. different tenants' data from a `routeLoader$`). `MatIconRegistryStore` is created with `useStore()` and provided via `MAT_ICON_REGISTRY` context specifically so it's scoped to the component tree that creates it, same as every other `Mat*Config`. The two pieces of upstream's registry state that genuinely CAN'T go in a serializable Qwik store — the fetch cache (live, unserializable `Promise` objects) and `addSvgIconResolver`'s resolver functions (plain functions, also unserializable, see item 18) — are the ones kept at plain module scope instead, and `icon-fetch.ts`'s/this deviation's own doc comments call out why sharing those two specifically across requests is fine (a URL's fetched text and a resolver function are the same regardless of which request asks).
17. **No HTTP base-URL resolution for relative icon URLs during SSR.** This package doesn't depend on `@qwik.dev/router`/Qwik City (so it has no access to the current request's origin to resolve a root-relative URL against, the way a browser's `fetch('/foo.svg')` resolves against `document.baseURI`). Register icons with an absolute URL for SSR to be able to fetch them (e.g. resolve a relative path to absolute inside your own `routeLoader$`, which DOES have the request URL, before calling `addSvgIcon`) — see `icon-fetch.ts`'s doc comment.
18. **`addSvgIconResolver` resolvers live at plain MODULE scope, not inside `MatIconRegistryStore` (2026-11-03).** A resolver is a plain JS function — Qwik can't serialize a bare function into resumable state (the same "class instances with methods"/"keep logic in plain functions or QRLs" constraint that keeps this whole registry's LOGIC out of a class also means a raw function value can't be DATA inside a `useStore()`). Resolvers registered this way apply to every registry in the process (closer to upstream's "exactly one `MatIconRegistry` per Angular app" than the request-scoped store is) — call `addSvgIconResolver()` at module-evaluation time (e.g. once from a root layout), not conditionally per-request.
19. **Icon-set search is sequential, not upstream's parallel-fetch-then-search-again.** `getNamedSvgIcon`'s icon-set fallback (`src/material/icon/icon-registry.ts`'s `_getSvgFromIconSetConfigs`) searches already-cached sets first, then fetches every UNCACHED set in the namespace in parallel and searches once more. This port searches newest-registered-first, sequentially, stopping at the first match — same winning icon either way (upstream's "icon sets added later have precedence" is preserved), just without the parallel-fetch optimization; see `getNamedSvgIcon`'s own doc comment for the one resulting reactivity caveat (a store mutation that lands WHILE a multi-set search is already awaiting a fetch won't retroactively be picked up by that specific in-flight call).
20. **`useComputed$` with an async compute function is this port's FIRST use of Qwik's async-render-suspension model** (`MatIcon`'s `resolvedSvgIcon` — see `mat-icon.tsx`). Reading a still-pending `ComputedSignal.value` throws the in-flight promise, which Qwik's own renderer catches and retries once it settles — confirmed from `@qwik.dev/core`'s own `AsyncSignal`/`ComputedSignal` type-doc comments ("reading the AsyncSignal will throw a Promise, which will retry the component or task once the value resolves"), not assumed. This is what makes SSR naturally block until the real icon markup is ready (no flash, no fallback state ever reaches the response) and makes the SAME computed re-suspend on the client when `svgIcon` changes after resume, with NO extra wiring. The compute function is written to return a plain, synchronous, non-`Promise` value (not even an `async function`) whenever `svgIcon` isn't actually in play — a REAL `async function` always returns a `Promise` even when nothing inside it ever awaits, which would otherwise push every `<MatIcon>` in the app (including every font-mode and legacy `svgLiteral` one) through the async engine's retry machinery for no reason.
21. **`addSvgIconSet`/icon-set extraction is string-surgery (`icon-set-extract.ts`), not `querySelector`/`cloneNode`.** Same rationale and precedent as deviation #14's `withIconSvgAttributes()` — no live DOM at SSR time, must behave identically there and in the browser. Regex + depth-counted tag matching finds the element with a matching `id="..."` (exact-value match, like upstream's `[id="..."]` selector), strips the id, and converts a matched `<symbol>` into a standalone `<svg>` carrying the same attributes/children — see that file's own module doc comment for the three cases (`<svg>` / `<symbol>` / anything else) it reproduces from `_extractSvgIconFromSet`/`_toSvgElement`.

## SVG icon registry

Added 2026-11-03 (see top-of-file note). Quick-start:

```tsx
import {routeLoader$} from '@qwik.dev/router';
import {MatIconRegistryProvider, trustIconResourceUrl} from '@angular-community/qwik-material/icon';

export const useIcons = routeLoader$(async () => {
  const icons = await fetch('https://api.example.com/icons').then(r => r.json());
  return icons as Array<{name: string; url: string}>; // loaded at runtime, e.g. per-tenant
});

export default component$(() => {
  const icons = useIcons();
  return (
    <MatIconRegistryProvider
      icons={icons.value.map(i => ({name: i.name, url: trustIconResourceUrl(i.url)}))}
    >
      <MatIcon svgIcon="thumbs-up" />      {/* default namespace */}
      <MatIcon svgIcon="animals:cat" />    {/* namespaced */}
    </MatIconRegistryProvider>
  );
});
```

Imperative registration (e.g. from elsewhere in the tree, after startup) uses
the same plain functions the provider calls internally:

```tsx
const registry = useOptionalIconRegistry(); // store, or undefined with no provider ancestor
if (registry) addSvgIconLiteral(registry, 'star', trustIconHtml(STAR_SVG));
```

See `icon-registry.ts`'s own module doc comment for the full data/logic
split rationale, and deviations #2/#4/#6/#7/#16–21 above for every other
design decision and gap.

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

**2026-11-03 SVG icon registry routes.** New `/mat-icon/*` scenarios, each a
functional (Qwik-only, no Angular comparison) spec target —
`specs/material-icon/svg-icon-registry.spec.ts`:
- `svg-icon-url/` — registers an icon by URL (`/mat-icon/assets/home.svg/
  index.ts`, a plain `onGet` request handler serving a tiny real SVG — this
  app has no `public/` dir) and renders it via `svgIcon`. The URL is built
  absolute from the current request inside a `routeLoader$`
  (`new URL('/mat-icon/assets/home.svg', requestEvent.url)`) — see
  deviation #17's "no router dependency" note for why that's necessary.
  `specs/material-icon/svg-icon-registry.spec.ts`'s first case fetches this
  route with Playwright's `request.get()` (a plain HTTP fetch, no browser/JS
  at all) and asserts the resolved `<svg>` is already in the raw response body.
- `svg-icon-namespace/` — one icon SET, two `<symbol>`s, registered in the
  `animals` namespace; both resolved via `svgIcon="animals:cat"`/`"animals:dog"`.
- `svg-icon-literal/` — a single `addSvgIconLiteral`-equivalent registration
  (via the provider's `icons` seed), resolved via `svgIcon` — the registry
  literal path, distinct from the pre-existing `svg-literal/` route (which
  tests the OLD, still-separate `svgLiteral` PROP, no registry involved).
- `svg-icon-switch/` — a button flips `svgIcon` between two registered
  names after resume, proving client-side re-resolution (not just an
  SSR-only effect).
- `svg-icon-missing/` — `svgIcon` names nothing registered; proves the
  error path renders an empty host instead of throwing/crashing SSR.

None of these five need `mat-icon/layout.tsx`'s font-set provider (they're
all SVG mode) — plain routes, no extra layout wiring.

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
