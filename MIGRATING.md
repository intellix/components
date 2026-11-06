# Migrating an Angular Material app to Qwik

This file is the single entry point for migrating an existing Angular application that uses
`@angular/material` and `@angular/cdk` to this repo's Qwik port. It is written for an AI coding
agent doing the migration autonomously, and is also useful for a human developer. Read this file
first; it links out to narrower guides, component overviews, and each entry point's `SYNC.md` for
anything that needs more depth than a migration guide should carry inline.

Do not duplicate what those linked files already say — if you need more detail than this file
gives you for a specific component or concept, follow the link rather than guessing.

## 1. What this is

Two packages, developed together in this repo:

- **`@angular-community/qwik-cdk`** (source: [`src/qwik-cdk`](src/qwik-cdk)) — a Qwik port of
  `@angular/cdk`.
- **`@angular-community/qwik-material`** (source: [`src/qwik-material`](src/qwik-material)) — a
  Qwik port of `@angular/material`, built on top of `qwik-cdk`.

**The parity contract.** Every ported component renders the **same DOM structure, the same class
names, and reads the same CSS custom properties** as `@angular/material@21.2.14`'s MDC-based
components. This is enforced by this repo's own parity test suite
([`src/qwik-cdk-parity-tests`](src/qwik-cdk-parity-tests)), which diffs rendered DOM and computed
styles against a real Angular reference app. Practically, this means:

- Your app's existing global CSS, deep/`::ng-deep`-style selectors rewritten as plain descendant
  selectors, and brand/CMS stylesheets that target Angular Material's real class names
  (`.mat-mdc-button`, `.mdc-text-field`, …) keep working unchanged.
- An existing Angular Material Sass theme (`mat.theme-overrides(...)`, per-component
  `mat.*-overrides(...)` mixins) keeps working unchanged — see [§4](#4-theming).

**Versions targeted:**

| | Version |
|---|---|
| Qwik | `@qwik.dev/core` / `@qwik.dev/router` **`2.0.0-rc.4`** |
| Angular Material / CDK parity base | `21.2.14` (git tag `v21.2.14`) |

**M3 only.** This port targets Angular Material's current, MDC-based (Material 3) component
architecture exclusively. Legacy, pre-MDC components and APIs have no equivalent anywhere in this
port — there is nothing to map them to. If the app being migrated still uses legacy Material,
upgrade it to current Material first, in Angular, before starting this migration.

**Narrower guides this file links to** (all under
[`src/qwik-material-docs/src/content/guides/`](src/qwik-material-docs/src/content/guides/)):

- [`getting-started.md`](src/qwik-material-docs/src/content/guides/getting-started.md) — the
  published-package install flow once the packages are on npm (this file's [§2](#2-install-locally)
  additionally covers installing from a **local, unpublished** build).
- [`theming.md`](src/qwik-material-docs/src/content/guides/theming.md) — design tokens, dark mode,
  applying a brand theme via Sass or plain CSS variables.
- [`composing-directives.md`](src/qwik-material-docs/src/content/guides/composing-directives.md) —
  the directive-hook + `mergeHostProps()` pattern that replaces stacking Angular attribute
  directives on one element.
- [`using-with-formisch.md`](src/qwik-material-docs/src/content/guides/using-with-formisch.md) — a
  complete, worked example of wiring a real form library.
- [`migrating-from-angular-material.md`](src/qwik-material-docs/src/content/guides/migrating-from-angular-material.md)
  — the shorter, website-published version of this file's concept map.

## 2. Install locally

The packages are not (yet) published to npm. This is the verified recipe for installing a local
build into an app outside this repo, confirmed by building the tarballs from this worktree and
running a real Qwik v2 app against them end to end (build → SSR → `vite preview` → `curl`).

### 2.1 Build and pack the tarballs (in this repo)

```bash
pnpm install
pnpm -C src/qwik-material pack:local
```

This runs [`src/qwik-material/scripts/pack-local.mjs`](src/qwik-material/scripts/pack-local.mjs),
which builds both packages and runs `pnpm pack` for each, producing:

```
dist/qwik-packages/angular-community-qwik-cdk-0.0.0.tgz
dist/qwik-packages/angular-community-qwik-material-0.0.0.tgz
```

Pass an output directory as an argument to put the tarballs somewhere else:
`pnpm -C src/qwik-material pack:local /some/dir`. `pnpm pack` rewrites the `workspace:*` peer
dependency `qwik-material` has on `qwik-cdk` to a real version number, so the tarballs install
correctly in any app, anywhere.

### 2.2 Install into the target app

```bash
pnpm add <path>/angular-community-qwik-cdk-0.0.0.tgz <path>/angular-community-qwik-material-0.0.0.tgz
pnpm add -D @qwik.dev/core@2.0.0-rc.4 @qwik.dev/router@2.0.0-rc.4 "vite@^8.3.5" sass esbuild
```

`@qwik.dev/router` is only needed if the app uses file-based routing (as every example in this
file assumes). All five dev dependencies are required even though the library itself doesn't list
them as `dependencies` — see the reasons below.

### 2.3 Required `vite.config.ts` settings

```ts
import {defaultClientConditions, defaultServerConditions, defineConfig} from 'vite';
import {qwikVite} from '@qwik.dev/core/optimizer';
import {qwikRouter} from '@qwik.dev/router/vite';

const QWIK_LIBS = ['@angular-community/qwik-cdk', '@angular-community/qwik-material'];

export default defineConfig({
  plugins: [qwikRouter(), qwikVite()],
  resolve: {conditions: ['qwik', ...defaultClientConditions]},
  ssr: {
    resolve: {conditions: ['qwik', ...defaultServerConditions]},
    noExternal: QWIK_LIBS,
  },
  build: {cssMinify: 'esbuild'},
});
```

Every one of these is required — none is a stylistic preference:

| Setting | Why |
|---|---|
| `'qwik'` prepended to `resolve.conditions` and `ssr.resolve.conditions` | Both packages' `package.json` `exports` maps publish their **unoptimized source** (real, literal `$(...)` calls, meant to be processed by the consuming app's own Qwik Vite plugin) under the `qwik` export condition. Without it, Vite resolves the prebuilt `dist` output instead. **Keep Vite's defaults after it** (`...defaultClientConditions` / `...defaultServerConditions`): replacing the list drops the `development`/`production` condition, and the dev server (`vite`/`pnpm dev`) then mixes production builds of Qwik with dev-mode code — every lazy chunk (`spa_init_event_…`, `…_useVisibleTask_…`) 404s and nothing is interactive. |
| `ssr.noExternal: QWIK_LIBS` | Without this, Vite's SSR build treats the packages as external (leaves `import` statements pointing at `node_modules` instead of bundling them). Combined with the `qwik` condition resolving to unoptimized source, this makes the server build reference QRL chunks that were never recorded in the client build's manifest — the page builds successfully but **crashes mid-render** with `Cannot resolve symbol "s_…"` the first time a lazy handler needs to load. `noExternal` forces Vite to actually bundle the library source into the SSR build, where the Qwik optimizer can see and register every `$()` boundary. |
| `sass` dev dependency | The library's component source imports `.scss` files directly (not pre-compiled CSS) along the `qwik`-condition resolution path above — Vite needs a Sass compiler available to process them. |
| `build.cssMinify: 'esbuild'` | Vite 8's default CSS minifier (`lightningcss`) rejects a selector upstream Angular Material's slide-toggle CSS uses (`::after:not(:empty)`) and fails the build. Switching the minifier to `esbuild` avoids the failure. |
| `esbuild` dev dependency | Vite 8 no longer bundles `esbuild` itself — once you set `cssMinify: 'esbuild'` you must install it directly as a dependency, or the build fails looking for it. |

### 2.4 Dev server (`vite` / `pnpm dev`): patch Qwik's HTML-nesting check

Qwik 2.0.0-rc.4's **dev-mode** server renderer validates element nesting and throws
`Code(Q12): SsrError(tag)` — killing the request, and with some setups the dev server — for
markup Angular Material itself renders and browsers keep as written:

- autonomous custom elements (`<mat-icon>`, `<mat-checkbox>`, …) inside a `<button>` or other
  phrasing content — HTML defines them as phrasing content, but the check rejects any
  hyphenated tag there;
- a `<div>` inside a `<button>` (slide toggle, button toggle, action-list items) — the HTML
  parser leaves it in place.

Production builds don't run the check. Until it's fixed upstream, apply the patch shipped with
this repo, [`src/qwik-material/patches/@qwik.dev__core@2.0.0-rc.4.patch`](src/qwik-material/patches/@qwik.dev__core@2.0.0-rc.4.patch).
It accepts hyphenated tags wherever phrasing content is allowed and `<div>` inside a button's
subtree, and keeps rejecting the genuinely broken case (a `<div>` inside a `<p>`). Copy it into
the app's `patches/` folder and register it with pnpm:

```yaml
# pnpm-workspace.yaml (or "pnpm": {"patchedDependencies": …} in package.json)
patchedDependencies:
  '@qwik.dev/core@2.0.0-rc.4': patches/@qwik.dev__core@2.0.0-rc.4.patch
```

Then `pnpm install`. The patch is version-specific: re-check it when upgrading Qwik.

### 2.5 Updating after a change to this repo

Re-run `pnpm -C src/qwik-material pack:local` and reinstall the tarballs in the app (`pnpm add
<path>/*.tgz` again — pnpm overwrites the previously-installed version since it's the same
version number, `0.0.0`; if pnpm caches too aggressively, `pnpm add --force` or bump the tarball
filenames).

### 2.6 How this was verified

A full end-to-end round trip was run against this exact worktree, outside the repo:

1. Ran `pnpm install && pnpm -C src/qwik-material pack:local <scratch-dir>/packs` from this
   worktree.
2. Pointed a minimal Qwik v2 app (the `vite.config.ts` above, a `root.tsx` with `<QwikCdkRoot>`, a
   layout calling `useMatProviders(...)`, and a route using `MatButton`/`MatFormField`/`MatInput`/
   `MatIcon`/`useMatDialog()`) at the freshly built tarballs.
3. `pnpm install --prefer-offline` succeeded; `pnpm build` (`vite build && vite build --ssr
   src/entry.ssr.tsx && vite build --ssr src/entry.preview.tsx`) succeeded.
4. `npx vite preview --port 4291 --strictPort` served the app; `curl -s -o
   /dev/null -w '%{http_code}' http://localhost:4291/` returned **200**, and the response body
   contained the expected Angular Material class names (`mat-mdc-button-base`, `mdc-button`,
   `mat-mdc-form-field`, `mat-icon`, …), the `mat-typography` class on `<body>`, and a resumable
   `q:container="paused"` marker — i.e. a real SSR render, not an error page.

Use the same app shape to compile-check any setup snippet in this file before trusting it.

## 3. App setup

### 3.1 Root component

Every qwik-material component reads shared state (overlay container, open dialogs, text
direction, a monotonic id generator) from `<QwikCdkRoot>`. It must wrap your whole app exactly
once, near the root:

```tsx
// src/root.tsx
import {component$} from '@qwik.dev/core';
import {RouterOutlet, useQwikRouter} from '@qwik.dev/router';
import {QwikCdkRoot} from '@angular-community/qwik-cdk';

// CSS: cdk overlay structure, material core (tokens/typography), then one
// `<component>-prebuilt.css` per qwik-material component actually used.
import '@angular-community/qwik-cdk/overlay-prebuilt.css';
import '@angular-community/qwik-material/core-prebuilt.css';
import '@angular-community/qwik-material/button-prebuilt.css';
import '@angular-community/qwik-material/form-field-prebuilt.css';
// ...one import per component you use — see §6 for each component's entry point name.

export default component$(() => {
  useQwikRouter();
  return (
    <>
      <head>
        <meta charset="utf-8" />
        <title>My app</title>
        {/* Roboto + an icon webfont — qwik-material injects neither automatically. */}
        <link rel="preconnect" href="https://fonts.gstatic.com" />
        <link
          href="https://fonts.googleapis.com/css2?family=Roboto:wght@300;400;500&display=swap"
          rel="stylesheet"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined&display=block"
          rel="stylesheet"
        />
      </head>
      <body class="mat-typography">
        <QwikCdkRoot>
          <RouterOutlet />
        </QwikCdkRoot>
      </body>
    </>
  );
});
```

`class="mat-typography"` on `<body>` matches what an Angular app's root typically sets, and is
required for the M2-era typography class aliases (`.mat-h1`, `.mat-body`, …) and plain `h1`–`h6`/
`p` tag styling from `typography-prebuilt.css` (opt-in, see [§4](#4-theming)) to apply.

`<QwikCdkRoot>` props:

| Prop | Type | Use when the Angular app set… |
|---|---|---|
| `dialogDefaults` | `Partial<DialogConfig>` | — (low-level CDK dialog defaults; usually configure `MatDialogConfig` instead via `useMatProviders({dialog: {...}})`, §3.3) |
| `overlayContainer` | `OverlayContainerOptions` | — (where overlay content attaches in the DOM) |
| `overlayDefaultConfig` | `OverlayDefaultConfig` (`{usePopover?: boolean}`) | `OVERLAY_DEFAULT_CONFIG` — e.g. `overlayDefaultConfig={{usePopover: false}}` if the app disabled the native Popover API for overlays |
| `direction` | `'ltr' \| 'rtl'` | the initial `Dir`/`Directionality` value |
| `loadStyles` | `boolean` (default `true`) | — (set `false` to opt out of this component's own auto-imported overlay-structure CSS) |

### 3.2 CSS imports, per component

Every component entry point ships its own prebuilt CSS; import only what you use, plus the three
always-needed files:

- `@angular-community/qwik-cdk/overlay-prebuilt.css` — needed by anything that opens an overlay
  (menu, select, autocomplete, datepicker, dialog, tooltip, snack bar, bottom sheet, timepicker).
- `@angular-community/qwik-material/core-prebuilt.css` — design tokens + base typography every
  other component's CSS depends on.
- `@angular-community/qwik-material/<component>-prebuilt.css` — one per component used (see the
  per-component entry-point names in [§6](#6-component-by-component-mapping)).
- Opt-in, only if the Angular app used the matching Sass mixin:
  `@angular-community/qwik-material/typography-prebuilt.css` (`mat.typography-hierarchy()`'s
  classes) and `@angular-community/qwik-material/elevation-prebuilt.css`
  (`mat.elevation-classes()`'s `.mat-elevation-zN` classes — see [§4](#4-theming) for a known
  upstream limitation with these).

There's no "import everything" bundle, by design — same per-component split Angular Material's own
Sass has.

### 3.3 Configuration: provider hooks

Angular Material configures global defaults via DI tokens (`MAT_FORM_FIELD_DEFAULT_OPTIONS`,
`MatPaginatorIntl`, …), provided in a module or at the app root. This port replaces every one of
those with a **hook**, called inside a `component$` — most conveniently once, in a root layout,
via the combined `useMatProviders()`:

```tsx
// src/routes/layout.tsx
import {component$, Slot} from '@qwik.dev/core';
import {useMatProviders} from '@angular-community/qwik-material/providers';

export default component$(() => {
  useMatProviders({
    formField: {appearance: 'outline'},
    icon: {fontSet: 'material-symbols-outlined'},
    errorStateMatcher: 'dirty',
  });
  return <Slot />;
});
```

**How inheritance works:** `useMatProviders({...})` fans out to one individual `useMat*Provider()`
hook **per key present in the object you pass** — nothing else. Each of those hooks provides
*only its own* context. So:

- A key you omit is simply not touched — a descendant sees whatever an ancestor already provided,
  or the library's built-in default if nothing did. Calling `useMatProviders({formField: {...}})`
  deeper in the tree does **not** reset `icon`/`errorStateMatcher` back to defaults; it leaves them
  exactly as an ancestor set them.
- A component deeper in the tree that wants to override just **one** setting for its own subtree
  calls that one hook directly instead of the combined one:

  ```tsx
  import {component$, Slot} from '@qwik.dev/core';
  import {useMatTooltipProvider} from '@angular-community/qwik-material/tooltip';

  export default component$(() => {
    useMatTooltipProvider({showDelay: 500}); // only the tooltip default changes here down
    return <Slot />;
  });
  ```

**Hard rule: the key *set* passed to `useMatProviders()` must never change across renders of the
component that calls it** (the *values* may change freely). Internally it calls each key's hook
inside a plain `if (keys.has('...'))`, with the key set frozen via `useConstant()` on first
render — Qwik (like any hooks-based model) requires the same sequence of hook calls on every
render of a given component instance; adding/removing a key later would shift every hook call
after it. In dev mode, changing the key set logs a `console.error` naming both the old and new key
sets. **Decide every setting you might ever configure up front** — pass `{}` for ones you don't
need yet rather than adding the key only once the data is ready.

### 3.4 Angular provider / DI token → Qwik hook mapping

Read [`src/qwik-material/providers/public-api.ts`](src/qwik-material/providers/public-api.ts) and
[`src/qwik-material/providers/SYNC.md`](src/qwik-material/providers/SYNC.md) for the authoritative,
full key list. The table below covers every token this port's own design doc and the brief for
this guide called out by name:

| Angular token / provider | `useMatProviders()` key | Qwik hook (direct form) | Notes |
|---|---|---|---|
| `MAT_FORM_FIELD_DEFAULT_OPTIONS` | `formField` | `useMatFormFieldProvider({appearance, color, hideRequiredMarker, floatLabel, subscriptSizing})` (`.../form-field`) | Upstream default `appearance: 'fill'`; `color` defaults `'primary'` (**not** `'accent'`, unlike most other components' config) |
| `MAT_DIALOG_DEFAULT_OPTIONS` + `MAT_DIALOG_SCROLL_STRATEGY` | `dialog` | `useMatDialogProvider({defaults, scrollStrategy})` (`.../dialog`) | `scrollStrategy` is a serializable `'block' \| {type:'reposition', scrollThrottle} \| 'close' \| 'noop'` descriptor, default `'block'` |
| `MAT_TOOLTIP_DEFAULT_OPTIONS` | `tooltip` | `useMatTooltipProvider({showDelay, hideDelay, position, touchGestures, ...})` (`.../tooltip`) | |
| `MAT_SELECT_SCROLL_STRATEGY` | `select` | `useMatSelectProvider({scrollStrategy})` (`.../select`) | default `{type: 'reposition'}` |
| `MAT_MENU_SCROLL_STRATEGY` | `menu` | `useMatMenuProvider({scrollStrategy})` (`.../menu`) | default `{type: 'reposition', scrollThrottle: 20}` |
| `MAT_AUTOCOMPLETE_SCROLL_STRATEGY` | `autocomplete` | `useMatAutocompleteProvider({scrollStrategy})` (`.../autocomplete`) | default `{type: 'reposition'}` |
| bottom sheet's scroll strategy | `bottomSheet` | `useMatBottomSheetProvider({defaults, scrollStrategy})` (`.../bottom-sheet`) | default `'block'` |
| `MAT_RIPPLE_GLOBAL_OPTIONS` | `ripple` | `useMatRippleProvider({disabled, animation: {enterDuration, exitDuration}, terminateOnPointerUp})` (`.../core`) | Reaches every built-in component's own ripple too, not just a standalone `useMatRipple()`/`<MatRipple>` |
| `ErrorStateMatcher` / `ShowOnDirtyErrorStateMatcher` / `[errorStateMatcher]` | `errorStateMatcher` | `useMatErrorStateMatcherProvider('touched' \| 'dirty' \| QRL<(state) => boolean>)` (`.../core`) | A class instance can't cross Qwik's serialization boundary — `'touched'`/`'dirty'` cover the two built-in modes; a custom matcher is a `QRL` |
| `DateAdapter` / `MAT_DATE_FORMATS` / `MAT_DATE_LOCALE` / `.setLocale()` | `dateAdapter` | `useMatDateAdapterProvider({factory: QRL<(locale) => DateAdapter<D>>, formats, locale})` (`.../core`); returns `{dateLocale: Signal<string>}` | `factory` **must** be a `QRL`, never a live adapter instance — one call configures the datepicker, range picker, *and* the timepicker together. Switch locale at runtime by writing `dateLocale.value`, not by calling an adapter method |
| `MatIconRegistry` (`addSvgIcon`, `addSvgIconSet`, …) + `DomSanitizer.bypassSecurityTrust*` | `icons` | `useMatIconRegistryProvider({icons, iconSets, ...})` (`.../icon`); returns a `MatIconRegistryStore` handle for later `addSvgIcon(registry, name, trustIconResourceUrl(url))` calls | `icons` (the registry) and `icon` (below) are deliberately two separate keys |
| `MAT_ICON_DEFAULT_OPTIONS`-equivalent (color/default font set) | `icon` | `useMatIconProvider({color, fontSet})` (`.../icon`) | |
| `OVERLAY_DEFAULT_CONFIG` | *(not a `useMatProviders()` key)* | `<QwikCdkRoot overlayDefaultConfig={{usePopover: false}}>` | A `qwik-cdk` root prop, not a qwik-material hook — see §3.1 |
| `MatPaginatorIntl` | `paginator` | `useMatPaginatorProvider({intl: {...}})` (`.../paginator`) | Full-bag replace (not a field merge), mirroring upstream's whole-service swap; `getRangeLabel` is **not** part of the intl shape — use the plain-string `rangeLabel` prop instead (see §9) |
| `STEPPER_GLOBAL_OPTIONS` | `stepper` | `useMatStepperProvider({displayDefaultIndicatorType, ...})` (`.../stepper`) | Underlying CDK context is `CDK_STEPPER_GLOBAL_OPTIONS` (`@angular-community/qwik-cdk/stepper`) |
| `provideAnimations()` / `provideNoopAnimations()` | `animationsDisabled` | `useMatAnimationsProvider(disabled: boolean)` (`.../dialog`); returns a `Signal<boolean>` handle | Write `.value` to toggle animations at runtime |
| `MAT_BUTTON_CONFIG`, `MAT_CARD_CONFIG`, `MAT_CHECKBOX_DEFAULT_OPTIONS`, and every other per-component `Mat*Config`/default-options token | `button`, `card`, `checkbox`, `badge`, `progressBar`, `progressSpinner`, `divider`, `gridList`, `list`, `buttonToggle`, `slideToggle`, `expansion`, `radio`, `sort`, `tabs`, `sidenav`, `chips`, `timepicker`, `snackBar`, `input` | `useMat<Component>Provider({...})` from that component's own entry point | See [`providers/SYNC.md`](src/qwik-material/providers/SYNC.md)'s full key→hook table for the exhaustive list |

## 4. Theming

qwik-material ships Angular Material's M3 design tokens as plain CSS custom properties
(`--mat-sys-*`, `--mat-button-*`, …) set once at `html`/`:root` by `core-prebuilt.css` and each
component's own prebuilt CSS — there's no Sass build step to run at migration time. Full detail,
including dark mode (`light-dark()`), scoping a theme to part of the page, and the known upstream
limitation with `elevation-prebuilt.css`'s shadow classes, is in
[`guides/theming.md`](src/qwik-material-docs/src/content/guides/theming.md). Summary for a
migration:

- **Keep the Angular app's existing Sass theme file as-is**, if it has one. Because tokens and DOM
  are byte-for-byte identical to upstream, Sass compiled against the real `@angular/material`
  package (a dependency your app keeps, not qwik-material) themes this port exactly the same way
  it themes Angular Material. Verified concretely: compiling `mat.button-overrides((filled-container-color:
  red))` against `@angular/material` produces `--mat-button-filled-container-color: red`, the exact
  variable `button-prebuilt.css` reads.
- **Only keep the token-emitting mixins**: `mat.theme-overrides(...)` and the per-component
  `mat.<component>-overrides(...)` mixins (e.g. `mat.button-overrides(...)`,
  `mat.checkbox-overrides(...)`). These only emit `--mat-*`/`--mat-sys-*` custom property
  declarations — exactly what the prebuilt CSS already reads.
- **Remove, don't keep**: `mat.core()` (a no-op at this Angular Material version anyway); any full
  `*-theme()`/`*-color()`/`*-typography()`/`*-density()`/`*-base()` mixin (`mat.button-theme(...)`,
  `mat.all-component-themes(...)`) — these emit the component's entire structural CSS, which this
  port already ships compiled into `<component>-prebuilt.css`; running them again just adds a
  duplicate, conflicting ruleset. Also drop `mat.typography-hierarchy($theme)`/
  `mat.elevation-classes()` themselves if only the token *values* need to change — those mixins
  emit the same classes `typography-prebuilt.css`/`elevation-prebuilt.css` already ship; override
  the tokens those files read instead.
- If the app's brand CSS targets Angular Material's real class names directly (`.mat-mdc-button`,
  `.mdc-text-field`) instead of going through the token layer, it applies here unchanged too — that
  is the whole point of the DOM/class parity contract.

## 5. Translating templates — the general rules

| Angular Material concept | Qwik equivalent |
|---|---|
| `NgModule` imports (`MatButtonModule`, …) | Plain ESM import from the matching entry point: `import {MatButton} from '@angular-community/qwik-material/button'` |
| A component (`<mat-card>`, `<mat-select>`, …) | A Qwik component with the same-shaped props, PascalCase name (`MatCard`, `MatSelect`) |
| `@Input()` | Component prop, same name |
| `@Output()` `EventEmitter` (`(selectionChange)`) | An `on<Name>$` prop taking a `QRL`: `onSelectionChange$={$(event => ...)}` |
| An attribute directive on your own element (`matTooltip`, `matBadge`, `matMenuTriggerFor`, `matRipple`, `matStepperNext`, `cdkCopyToClipboard`, `cdkTextareaAutosize`, …) | Either a host-owning component (`<MatTooltip as="button">`) **or**, to stack more than one on the same element, the matching `use*()` hook (`useMatTooltip()`, `useMatBadge()`, `useMatMenuTrigger()`, `useCdkCopyToClipboard()`, `useCdkTextareaAutosize()`, …) returning a spreadable `hostProps` bag, combined across hooks with `mergeHostProps()` — **never** two separate `{...a} {...b}` spreads, which silently drop same-named handlers/classes. Full pattern and rules of thumb: [`guides/composing-directives.md`](src/qwik-material-docs/src/content/guides/composing-directives.md) |
| A structural directive / injectable service (`MatDialog`, `MatBottomSheet`, `MatSnackBar`, `Overlay`, `Dialog`) | A `use*()` hook called once per component: `useMatDialog()`, `useMatBottomSheet()`, `useMatSnackBar()`, `useOverlay()`, `useDialog()`. `.open()` becomes `.open$(...)` (async); an Observable like `afterClosed()` becomes an awaited **`Promise` property**, `ref.afterClosed` (not a method call) |
| Content projection by element type (`<ng-content select="[mat-card-avatar]">`, `<mat-label>`/`<input matInput>`/`<mat-hint>` inside `<mat-form-field>`, `<mat-option>` inside `<mat-select>`, `*matHeaderCellDef`/`*matCellDef`) | A **named JSX prop** holding pre-built `JSXOutput`, or a **plain data array**, because Qwik's SSR is single-pass and can't let a parent re-inspect a child's content after the fact. Concretely: form field's `label`/`control`/`hintStart`/`hintEnd`/`iconPrefix`/`iconSuffix`/`errors` props; select/autocomplete's `options: OptionDef[]` data prop; table's `columns`/`rows` data props; card's `q:slot="avatar"`/`"title"`/`"image"` named slots. See each component's row in [§6](#6-component-by-component-mapping) |
| `*ngIf` / `*ngFor` / `\| async` pipe | Plain JS/JSX: a ternary or `&&`, `.map()`, reading a signal's `.value` directly |
| `ChangeDetectorRef.markForCheck()` / Zone.js | Not needed — writing to a signal's/store's `.value` triggers exactly the re-render that needs it |
| Two-way binding (`[(ngModel)]`, a custom `ControlValueAccessor`) | A `value`/`checked` prop + an `onChange$`/`onValueChange$` handler — every qwik-material control is a **controlled component**; there is no Qwik equivalent of `ControlValueAccessor` |
| `@Input()` default read from an injected DI token (`MAT_FORM_FIELD_DEFAULT_OPTIONS`, …) | The matching `useMat*Provider()` call higher in the tree (§3.3/§3.4) — a prop you don't pass falls back to whatever an ancestor provided, then the library's own hardcoded default |
| A template reference variable + `@ViewChild` | A `useSignal<HTMLElement>()` passed as the `ref` prop, or (for an imperative handle like a drawer/dialog) a dedicated hook returning one, e.g. `useMatDrawerRef()` |
| `[routerLink]` on a component with an anchor-capable host (`MatButton`, `MatListItem`) | An `href` prop (`<MatButton href="...">`), rendering a real `<a>` — plain navigation, independent of whichever router the app uses |

## 6. Component-by-component mapping

One row per component/entry point. "Notes" is deliberately short — the deeper gaps and footguns
for each are in [§8 Pitfalls](#8-pitfalls-an-agent-will-hit) and [§9 Not supported](#9-not-supported--deferred),
not repeated here. Follow the links for the full picture before writing non-trivial code against
a given component.

### Material components

| Component | Angular selector(s) | Qwik import (`@angular-community/qwik-material/<entry>`) | Component/hook | Key differences | Docs |
|---|---|---|---|---|---|
| Autocomplete | `input[matAutocomplete]`, `<mat-autocomplete>`, `<mat-option>` | `autocomplete` | `MatAutocomplete`, `MatOption`, `MatOptgroup` | One component renders the input **and** the panel; pass as `<MatFormField control={<MatAutocomplete options={mySignal} .../>}>`. `options` must be the **signal itself**, never `.value` — passing `.value` silently freezes the list. `displayWith$`/`onOptionSelected$`/`onOptionActivated$` are QRLs; option payload is plain data, never a component instance | [overview](src/qwik-material-docs/src/content/overviews/autocomplete.md) · [SYNC](src/qwik-material/autocomplete/SYNC.md) |
| Badge | `[matBadge]` directive on any element | `badge` | `MatBadge` (`as="span"\|"div"\|"button"\|"a"`, renders its own host), or `useMatBadge()` hook + `hostProps`/`content` to attach to an existing component | `content` replaces `matBadge="…"`; `color`/`position`/`size`/`overlap`/`hidden`/`description` map 1:1. To badge an *existing* qwik-material component (a button, an icon) use the hook, not `<MatBadge>` as a wrapper — there is no wrapper element upstream either | [overview](src/qwik-material-docs/src/content/overviews/badge.md) · [SYNC](src/qwik-material/badge/SYNC.md) |
| Bottom sheet | `MatBottomSheet` service | `bottom-sheet` | `useMatBottomSheet()` → `{open$, dismiss$}` | `afterDismissed`/`afterOpened` are `Promise` properties, not Observables; `onBackdropClick$`/`onKeydown$`/`onOutsidePointer$` QRLs replace the Observable streams; data via `componentProps`/`MAT_BOTTOM_SHEET_DATA`/`ref.setInput(name, value)`, not `viewContainerRef`/`injector` | [overview](src/qwik-material-docs/src/content/overviews/bottom-sheet.md) · [SYNC](src/qwik-material/bottom-sheet/SYNC.md) |
| Button (+ icon/fab/mini-fab) | `button[matButton]`/`a[matButton]` (+ legacy `mat-button`/`mat-raised-button`/`mat-flat-button`/`mat-stroked-button`), `[matIconButton]`, `[matFab]`, `[matMiniFab]` | `button` | `MatButton`, `MatIconButton`, `MatFabButton`, `MatMiniFabButton` — four separate components, each owning its own `<button>`/`<a>` host | `matButton=` appearance mapping: unset/`"text"`/legacy `mat-button` → `appearance="text"`; `mat-raised-button` → `"elevated"`; `mat-flat-button` → `"filled"`; `mat-stroked-button` → `"outlined"`; `tonal` has no legacy name. Anchor form via `href` (+ `target`, no other anchor attrs yet). `color` stays an open string, not a closed enum. Stack a menu trigger/tooltip/badge via the hooks pattern (§5), not stacked attributes | [overview](src/qwik-material-docs/src/content/overviews/button.md) · [SYNC](src/qwik-material/button/SYNC.md) |
| Button toggle | `<mat-button-toggle-group>` + `<mat-button-toggle>` | `button-toggle` | `MatButtonToggleGroup`, `MatButtonToggle` | Controlled: `value`+`onChange$` (single) or `values`+`multiple`+`onValuesChange$` (multi) — no `SelectionModel`/CVA. `formBound`/`touched`/`dirty`/`invalid`/`onTouched$` available on the group; `onTouched$` is **click-driven** (fires only on a click that changes that toggle's own checked state), not blur-driven | [overview](src/qwik-material-docs/src/content/overviews/button-toggle.md) · [SYNC](src/qwik-material/button-toggle/SYNC.md) |
| Card | `<mat-card>` + `mat-card-header`/`-title`/`-subtitle`/`-content`/`-actions`/`-footer`/`-image`/`[mat-card-avatar]` | `card` | `MatCard`, `MatCardHeader`, `MatCardTitle`, `MatCardSubtitle`, `MatCardContent`, `MatCardActions`, `MatCardFooter`, `MatCardImage` (+ `Sm`/`Md`/`Lg`/`Xl` size variants), `MatCardAvatar`, `MatCardTitleGroup` | `<MatCardImage>`/`<MatCardAvatar>` render their **own** `<img>` (pass `src`/`alt`) — they are not directives on your own `<img>`. `<MatCardHeader>`/`<MatCardTitleGroup>` need explicit `q:slot="avatar"`/`"text"`/`"image"` on their children (no implicit by-type projection) | [overview](src/qwik-material-docs/src/content/overviews/card.md) · [SYNC](src/qwik-material/card/SYNC.md) |
| Checkbox | `<mat-checkbox>` | `checkbox` | `MatCheckbox` | Controlled: `checked`+`onChange$={(e) => ...}` where `e = {checked: boolean}` (no `source` field, unlike upstream's event). `formBound`/`touched`/`dirty`/`invalid`/`onTouched$` replace CVA/`Validator`; `clickAction` configurable via `useMatCheckboxProvider()` | [overview](src/qwik-material-docs/src/content/overviews/checkbox.md) · [SYNC](src/qwik-material/checkbox/SYNC.md) |
| Chips | `<mat-chip-set>`/`<mat-chip>`, `<mat-chip-listbox>`/`<mat-chip-option>`, `<mat-chip-grid>`/`<mat-chip-row>`, `input[matChipInputFor]` | `chips` | `MatChipSet` (+`MatChipDef`), `MatChipListbox` (+`MatChipOptionDef`), `MatChipGrid`/`MatChipRow` (+`MatChipRowDef`/`MatChipGridInputDef`) | All three take a **data array** of chip defs, not nested `<mat-chip>` children. `matChipAvatar`/`matChipTrailingIcon`/`matChipRemove` become plain `avatar`/`trailingIcon`/`removeButton` fields on the def. **When a `<MatChipGrid>`'s rows can change after mount and it's nested in `<MatFormField control={...}>`, `rows` must be a `Signal<MatChipRowDef[]>`, not a plain array** — a plain array freezes after first render | [overview](src/qwik-material-docs/src/content/overviews/chips.md) · [SYNC](src/qwik-material/chips/SYNC.md) |
| Datepicker (+ range, toggle, custom adapter, `dateClass`) | `input[matDatepicker]`, `<mat-datepicker>`, `<mat-datepicker-toggle>`, `<mat-date-range-input>`/`<mat-date-range-picker>` | `datepicker` | `useMatDatepicker()`/`useMatDateRangePicker()` (called once, result passed as a `picker` prop to `MatDatepickerInput`/`MatDateRangeInput`, `MatDatepickerToggle`, `MatDatepicker`/`MatDateRangePicker`) | No `[matDatepicker]="#ref"` template-variable wiring — a shared `picker` handle instead. `actions` is a plain `JSXOutput` prop (ordinary `<MatButton>`s calling the exported `applyDatepickerSelection`/`cancelDatepickerSelection`). `picker.open()`/`close()` → `openDatepickerPanel(picker, cdk)` (with `cdk = useContext(QWIK_CDK)` read during render) / `closeDatepickerPanel(picker)`; `.opened` → `picker.isOpen`. A custom `DateAdapter` is a `QRL` **factory** (§3.4), never a live instance. Resetting the value from outside needs the exported `setMatDatepickerValue(picker, value)` function, not a reactive `value` prop | [overview](src/qwik-material-docs/src/content/overviews/datepicker.md) · [SYNC](src/qwik-material/datepicker/SYNC.md) |
| Dialog | `MatDialog` service | `dialog` | `useMatDialog()` → `{open$, afterAllClosed$, ...}`; `MatDialogTitle`, `MatDialogContent`, `MatDialogActions`, `MatDialogClose` | `.open$(Component, config)` returns a `MatDialogRef`; `afterClosed`/`afterOpened`/`beforeClosed` are `Promise` properties. `MAT_DIALOG_DATA` via `useContext`; `componentProps` + `ref.setInput(name, value)` replace `componentInstance` mutation. A plain `<MatButton>` can't be stacked with a close directive — read `MAT_DIALOG_REF` via `useContext` and call `.close(result)` yourself | [overview](src/qwik-material-docs/src/content/overviews/dialog.md) · [SYNC](src/qwik-material/dialog/SYNC.md) |
| Divider | `<mat-divider>` | `divider` | `MatDivider` | `inset`/`vertical` map 1:1 as plain booleans. Simplest component in the library — near-zero migration risk | [overview](src/qwik-material-docs/src/content/overviews/divider.md) · [SYNC](src/qwik-material/divider/SYNC.md) |
| Expansion (accordion) | `<mat-accordion>`, `<mat-expansion-panel>` (+ `-header`/`mat-panel-title`/`mat-panel-description`/`mat-action-row`) | `expansion` | `MatAccordion`, `MatExpansionPanel`, `MatExpansionPanelHeader`, `MatPanelTitle`, `MatPanelDescription`, `MatActionRow`, `MatExpansionPanelContent` | Panels nest as ordinary JSX children (unlike chips/select's data-array pattern), but `<MatExpansionPanelHeader>` must go through the panel's `header` prop, and `<MatPanelTitle>`/`<MatPanelDescription>` must be nested *inside that header's own children*, not as siblings. Controlled via `expanded`+`onExpandedChange$`/`onOpened$`/`onClosed$` | [overview](src/qwik-material-docs/src/content/overviews/expansion.md) · [SYNC](src/qwik-material/expansion/SYNC.md) |
| Form field | `<mat-form-field>` + `<mat-label>`/`<mat-hint>`/`<mat-error>`/`[matIconPrefix]`/`[matTextPrefix]`/`[matIconSuffix]`/`[matTextSuffix]` | `form-field` | `MatFormField`, `MatLabel`, `MatHint`, `MatError`, `MatIconPrefix`, `MatTextPrefix`, `MatIconSuffix`, `MatTextSuffix` | Every content-projected child becomes a named prop: `label`, `control`, `hintStart`/`hintEnd` (or `hintLabel`), `errors`, `iconPrefix`/`textPrefix`/`iconSuffix`/`textSuffix`. **`touched`/`dirty`/`invalid` must be passed BOTH as top-level `<MatFormField>` props AND nested inside the `control` value** — passed only nested, they render correctly once and then never update again (§8) | [overview](src/qwik-material-docs/src/content/overviews/form-field.md) · [SYNC](src/qwik-material/form-field/SYNC.md) |
| Grid list | `<mat-grid-list cols="…">` + `<mat-grid-tile>` | `grid-list` | `MatGridList`, `MatGridTile`, `MatGridTileHeader`, `MatGridTileFooter`, `MatGridAvatar`, `MatLine` | `cols`/`rowHeight`/`gutterSize` and tile `rowspan`/`colspan` map 1:1. `<MatGridList>` reads its `<MatGridTile>` children directly as data (it is a plain function, not `component$`) — tiles must be its **direct** JSX children, not nested deeper. No RTL | [overview](src/qwik-material-docs/src/content/overviews/grid-list.md) · [SYNC](src/qwik-material/grid-list/SYNC.md) |
| Icon | `<mat-icon>` + `MatIconRegistry` | `icon` | `MatIcon`; registry via `useMatIconRegistryProvider()`/`addSvgIcon(registry, name, url)` etc.; `trustIconResourceUrl`/`trustIconHtml` | Three render modes on one component: ligature-font text, `svgLiteral` (trusted raw SVG string), registry-resolved `svgIcon`. Every `addSvgIcon*`/`addSvgIconSet*` value must be wrapped in `trustIconResourceUrl()`/`trustIconHtml()` (these do **not** sanitize — never wrap untrusted content). **SVG icon URLs must be absolute for SSR** (§8) | [overview](src/qwik-material-docs/src/content/overviews/icon.md) · [SYNC](src/qwik-material/icon/SYNC.md) |
| Input | `input[matInput]`/`textarea[matInput]` | `input` | `MatInput` (`as="input"\|"textarea"`), used as `<MatFormField control={<MatInput .../>}>` | No CVA/`NgControl` — use `useMatFormControl()` + validators, or a real form library (§7). `value` is live-reactive **only** when written as a direct, inline `signal.value` read (§8). `touched`/`dirty`/`invalid` need the same "pass twice" rule as form-field above. No native `<select>` mode, no `cdkTextareaAutosize` built in (compose `useCdkTextareaAutosize()` yourself) | [overview](src/qwik-material-docs/src/content/overviews/input.md) · [SYNC](src/qwik-material/input/SYNC.md) |
| List (+ nav/action list) | `<mat-list>`/`<mat-nav-list>`/`<mat-action-list>` + `<mat-list-item>`/`[matListItemTitle]`/`[matListItemLine]`/`[matListItemIcon]`/`[matListItemAvatar]`/`[matListItemMeta]` | `list` | `MatList`, `MatNavList`, `MatActionList`, `MatSubheader`, `MatListItem` (`as="div"\|"a"\|"button"`) + `MatListItemAvatar`/`Icon`/`Title`/`Line`/`Meta` | Content pieces become **named props** on `<MatListItem>` (`title`, `lineContent` — accepts an array for multi-line, `icon`, `avatar`, `meta`), not projected children. Ripple only fires inside `<MatNavList>`/`<MatActionList>` (matches upstream). `MatSelectionList`/`MatListOption` not ported at all (§9) | [overview](src/qwik-material-docs/src/content/overviews/list.md) · [SYNC](src/qwik-material/list/SYNC.md) |
| Menu | `<mat-menu>` + `[matMenuTriggerFor]` + `[mat-menu-item]` | `menu` | `createMatMenu({content$})` (a **function call**, not JSX) returns a `MatMenuRef`; `<MatMenu />` is an empty placeholder; `useMatMenuTrigger({menu})` → `hostProps` spread onto any trigger component; `MatMenuItem`, `MatMenuContent` | Fundamentally different shape from Angular: menu content/config lives on the `MatMenuRef` the factory returns, never as literal JSX children of `<MatMenu>`. Submenus: pass a child menu's ref via `<MatMenuItem menu={submenu}>`. Scroll strategy must be the serializable descriptor form, never a function factory | [overview](src/qwik-material-docs/src/content/overviews/menu.md) · [SYNC](src/qwik-material/menu/SYNC.md) |
| Paginator | `<mat-paginator>` + `MatPaginatorIntl` | `paginator` | `MatPaginator` | `onPage$={(e: PageEvent) => ...}` replaces `(page)`. `pageIndex`/`pageSize` are read once to seed state and **cannot be reassigned from outside after mount** — no imperative "jump to page" (§9). `rangeLabel` plain-string prop replaces `MatPaginatorIntl.getRangeLabel` (a plain function can't cross the serialization boundary) | [overview](src/qwik-material-docs/src/content/overviews/paginator.md) · [SYNC](src/qwik-material/paginator/SYNC.md) |
| Progress bar | `<mat-progress-bar>` | `progress-bar` | `MatProgressBar` | `mode`/`value`/`bufferValue` same names. `onAnimationEnd$` replaces `(animationEnd)`. `color` is an open string | [overview](src/qwik-material-docs/src/content/overviews/progress-bar.md) · [SYNC](src/qwik-material/progress-bar/SYNC.md) |
| Progress spinner | `<mat-progress-spinner>`, `<mat-spinner>` | `progress-spinner` | `MatProgressSpinner`, `MatSpinner` | `MatSpinner` is a **distinct component**, not a subclass/alias — don't rely on `instanceof`-style identity with `MatProgressSpinner` | [overview](src/qwik-material-docs/src/content/overviews/progress-spinner.md) · [SYNC](src/qwik-material/progress-spinner/SYNC.md) |
| Radio | `<mat-radio-group>` + `<mat-radio-button>` | `radio` | `MatRadioGroup`, `MatRadioButton` | Controlled: `value`+`onChange$(value)` on the group (no `MatRadioChange` wrapper object). `formBound`/`touched`/`dirty`/`invalid`/`onTouched$` only on the **group**, never the button; `onTouched$` fires on blur of any radio in the group | [overview](src/qwik-material-docs/src/content/overviews/radio.md) · [SYNC](src/qwik-material/radio/SYNC.md) |
| Select | `<mat-select>` + `<mat-option>`/`<mat-optgroup>` | `select` | `MatSelect`, `MatSelectPanel` | **`options` is a plain data array** — `MatSelect` renders `<MatOption>`/`<MatOptgroup>` itself; you never write `<MatOption>` as a JSX child. `multiple` switches `value`/`onValueChange$` to an array. `compareWith$` must be a `QRL`. `controlType="mat-select"` must be passed explicitly when nested in `<MatFormField control={...}>` (no automatic fallback, unlike `MatInput`). `value` reassignment from outside after mount *is* live (fixed; trust the source over the overview page's older prose) | [overview](src/qwik-material-docs/src/content/overviews/select.md) · [SYNC](src/qwik-material/select/SYNC.md) |
| Sidenav | `<mat-sidenav-container>`/`-content`/`-sidenav` (and generic `mat-drawer-*`) | `sidenav` | `MatDrawer`/`MatSidenav`, `MatDrawerContent`/`MatSidenavContent`, `MatDrawerContainer`/`MatSidenavContainer`, `useMatDrawerRef()` | A drawer is placed via a named slot on the container (`q:slot="start-drawer"`/`"end-drawer"`), not a plain nested child. `opened`+`onOpenedChange$` is the controlled API; `useMatDrawerRef()` is the imperative `open$()`/`close$()`/`toggle$()` escape hatch (Promise-returning, usable from outside the drawer's own subtree, e.g. a toolbar button) | [overview](src/qwik-material-docs/src/content/overviews/sidenav.md) · [SYNC](src/qwik-material/sidenav/SYNC.md) |
| Slide toggle | `<mat-slide-toggle>` | `slide-toggle` | `MatSlideToggle` | `checked`+`onChange$(checked: boolean)` (flattened from the upstream event object); `onToggleChange$` fires on every click regardless of value change. `formBound`/`touched`/`dirty`/`invalid`/`onTouched$` same contract as radio/checkbox | [overview](src/qwik-material-docs/src/content/overviews/slide-toggle.md) · [SYNC](src/qwik-material/slide-toggle/SYNC.md) |
| Slider | `<mat-slider>` + `matSliderThumb`/`matSliderStartThumb`/`matSliderEndThumb` | `slider` | `MatSlider` | One component for both single-thumb (`value`+`onValueChange$`) and range (`startValue`/`endValue`+their `onChange$`s) modes — no separate thumb component. `displayWith` must be a `QRL`, not a plain function (a plain function 500s the SSR response) | [overview](src/qwik-material-docs/src/content/overviews/slider.md) · [SYNC](src/qwik-material/slider/SYNC.md) |
| Snack bar | `MatSnackBar` service | `snack-bar` | `useMatSnackBar()` → `{open$, openFromComponent$, openFromTemplate$, ...}` | `.openFromTemplate$()` takes a `component$`, not a `TemplateRef` (doesn't exist). `afterDismissed`/`afterOpened`/`onAction` are `Promise` properties. No true DI-singleton "one snack bar app-wide" — call `useMatSnackBar()` once per root and share the returned object | [overview](src/qwik-material-docs/src/content/overviews/snack-bar.md) · [SYNC](src/qwik-material/snack-bar/SYNC.md) |
| Sort | `matSort` + `<... mat-sort-header>` | `sort` | `MatSort` (`as="table"\|"div"`), `MatSortHeader` | `active`/`direction` on `<MatSort>` are live props (post-2026-11-03), but **a props-driven change does not fire `onSortChange$`** — only a real header click/keydown does (matches upstream). With `<MatTable>`, skip `<MatSort>` entirely: pass `sortHeader: true` on the column def and `sort={...}` directly on `<MatTable>` | [overview](src/qwik-material-docs/src/content/overviews/sort.md) · [SYNC](src/qwik-material/sort/SYNC.md) |
| Stepper | `<mat-stepper>`/`<mat-horizontal-stepper>`/`<mat-vertical-stepper>` + `<mat-step>`, `button[matStepperNext]`/`[matStepperPrevious]` | `stepper` | `MatStepper` (`steps: MatStepDef[]`), `MatStepperNext`/`MatStepperPrevious` + `useMatStepperNext()`/`useMatStepperPrevious()` | One component with a `steps` data array replaces nested `<mat-step>` children (same SSR/content-query constraint as tabs/table). Nav buttons are the hooks pattern — call `useMatStepperNext()`/`Previous()` from a component rendered *inside* a step's `content`. No per-occurrence `matStepperIcon` context (`{index, active, optional}`) — overrides are static per-state content, not per-step (§9) | [overview](src/qwik-material-docs/src/content/overviews/stepper.md) · [SYNC](src/qwik-material/stepper/SYNC.md) |
| Table (+ flex layout, sort, DataSource) | `<table mat-table>`/`<mat-table>` + `[matColumnDef]`/`*matHeaderCellDef`/`*matCellDef` | `table` | `MatTable`, `matTextColumn` | `columns: MatColumnDef[]` + `rows: MatTableRow[]` plain-data props replace content-projected cell templates — `cells` is already evaluated per row by your own `.map()`. `as="mat-table"` switches to the flex layout (no `<thead>`/`<tbody>`). Row-level `onClick$`/`class` and per-cell `cellProps` (`{class?, colSpan?}`) are 2026-11-03 additions. `DataSource` support is `useDataSourceConnection()` from **`@angular-community/qwik-cdk/collections`**, not a `dataSource` prop on `MatTable` itself — and is unwired by any example (treat as unproven). `MatTableDataSource`'s built-in filter/sort/paginate pipeline is not ported — sort/filter/paginate your own array first | [overview](src/qwik-material-docs/src/content/overviews/table.md) · [SYNC](src/qwik-material/table/SYNC.md) |
| Tabs | `<mat-tab-group>` + `<mat-tab>`; `[mat-tab-nav-bar]` + `[mat-tab-link]` + `<mat-tab-nav-panel>` | `tabs` | `MatTabGroup` (`tabs: MatTabDef[]`), `MatTabNav`, `MatTabLink`, `MatTabNavPanel` | Same data-array pattern as stepper/table. `MatTabNav`↔`MatTabNavPanel` wiring is a plain string id you thread yourself (`tabPanelId`/`id`), not Angular's automatic template-variable binding. Every tab's content is already lazy by default — no separate opt-in needed | [overview](src/qwik-material-docs/src/content/overviews/tabs.md) · [SYNC](src/qwik-material/tabs/SYNC.md) |
| Timepicker | `<mat-timepicker>` + `input[matTimepicker]` + `<mat-timepicker-toggle>` | `timepicker` | `useMatTimepicker()` (called once, `picker` prop passed to `MatTimepickerInput`/`MatTimepickerToggle`) | Same shared-handle pattern as datepicker — no template-ref cross-wiring. `formBound`/`value`/`disabled` must be duplicated on `<MatTimepickerInput>` even when form-bound, purely so `<MatFormField>`'s one-time introspection sees correct values. No `onTouched$`/`onDirty$` props — read `picker.touched.value`/`picker.dirty.value` directly | [overview](src/qwik-material-docs/src/content/overviews/timepicker.md) · [SYNC](src/qwik-material/timepicker/SYNC.md) |
| Toolbar | `<mat-toolbar>` + `<mat-toolbar-row>` | `toolbar` | `MatToolbar`, `MatToolbarRow` | `multipleRows` is an **explicit prop you must set** — there's no Angular-style automatic `@ContentChildren` detection of nested `<mat-toolbar-row>`s. Low-risk component otherwise | [overview](src/qwik-material-docs/src/content/overviews/toolbar.md) · [SYNC](src/qwik-material/toolbar/SYNC.md) |
| Tooltip | `[matTooltip]` | `tooltip` | `MatTooltip` (`as="button"` etc., renders its own host), or `useMatTooltip()` + `hostProps` to attach to an existing component | Two equally valid shapes depending on whether the target already has its own component. Pass the **whole live `props` object** into `useMatTooltip(props)`, never a rebuilt literal — a fresh object breaks the hook's reactive tracking. Known issue: hover never fires when composed onto `<MatButton>` specifically (§9) | [overview](src/qwik-material-docs/src/content/overviews/tooltip.md) · [SYNC](src/qwik-material/tooltip/SYNC.md) |
| Tree | `<mat-tree>` + `<mat-tree-node>`/`<mat-nested-tree-node>` + `[matTreeNodeToggle]` | `tree` | `MatTree` (`variant="flat"\|"nested"`, `nodes: CdkTreeNodeInput[]`), `MatTreeNodeToggle` | One component renders both DOM shapes from a **recursive data array** (not a `childrenAccessor` function) — every node explicitly carries `content`, `children`, `isExpandable`, etc. Expand/collapse state is owned internally by `<MatTree>`; place `<MatTreeNodeToggle node={key}>` inside a node's `content`. `recursive` on the toggle is accepted but not implemented (§9) | [overview](src/qwik-material-docs/src/content/overviews/tree.md) · [SYNC](src/qwik-material/tree/SYNC.md) |
| Ripple (standalone `matRipple`) | `[mat-ripple]`/`[matRipple]` | `core` | `useMatRipple({centered, unbounded, color, ...})` → `hostProps` + `launch$`/`fadeOutAll$`/`fadeOutAllNonPersistent$`; or `<MatRipple as="div">` | Same directive-hook pattern as badge/tooltip/menu-trigger — spread `hostProps` onto any element. Every built-in component's own ripple (buttons, checkboxes, radios, chips, menu items, tab labels, …) already honours app-wide `useMatRippleProvider()` defaults automatically | [`core/host-props.ts`](src/qwik-material/core/host-props.ts) · [SYNC](src/qwik-material/core/SYNC.md) |

### CDK entry points

| Entry point | Angular import | Qwik import (`@angular-community/qwik-cdk/<entry>`) | Key hooks/exports | Notes |
|---|---|---|---|---|
| a11y | `FocusMonitor`, `FocusTrap`, `LiveAnnouncer`, `ListKeyManager`/`FocusKeyManager`, `InteractivityChecker`, `_IdGenerator` | `a11y` | `useFocusOrigin()`/`focusVia()` (lightweight, typical case), `createFocusMonitor()` (full engine), `createFocusTrap()`/`useFocusTrap()`, `createLiveAnnouncer()`, `createListKeyManager()`/`createFocusKeyManager()`/`createTypeahead()`, `createIdGenerator()`/`useIdGenerator()`/`ID_GENERATOR_COUNTER`, `resolveTreeKeydown()` | Factory functions and hooks, not injectable classes; no RxJS (`onModalityChange(cb)`-style callback registration instead of `Observable`). `cdkTrapFocus`/`cdkAriaLive` attribute directives have no equivalent — use the hooks | [SYNC](src/qwik-cdk/a11y/SYNC.md) |
| accordion | `CdkAccordion`/`CdkAccordionItem` + `UniqueSelectionDispatcher` | `accordion` | `useCdkAccordion()`, `useCdkAccordionItem()` | Hooks, not directives. `UniqueSelectionDispatcher` replaced by a per-instance `Signal` broadcast scoped to one `useCdkAccordion()` call | [SYNC](src/qwik-cdk/accordion/SYNC.md) |
| bidi | `Directionality`, `Dir`, `DIR_DOCUMENT` | `bidi` | `createDirectionality()`, `DIRECTIONALITY`, `useDirectionality()` | No automatic initial-direction detection from `document.body.dir` — defaults to `'ltr'`; pass direction explicitly (e.g. `<QwikCdkRoot direction="rtl">`). **No consumer anywhere in this port currently calls `useContextProvider(DIRECTIONALITY, ...)`** — a bare `useDirectionality()` with no provider throws |  [SYNC](src/qwik-cdk/bidi/SYNC.md) |
| clipboard | `Clipboard`, `CdkCopyToClipboard` | `clipboard` | `copyToClipboard()`, `beginCopyToClipboard()`, `useCdkCopyToClipboard()` → `{hostProps: {onClick$}, copy}` | Service renamed to free functions (avoids shadowing the DOM `Clipboard` interface); `onCopied$` QRL replaces the `EventEmitter` output |  [SYNC](src/qwik-cdk/clipboard/SYNC.md) |
| coercion | `coerceBooleanProperty`, `coerceNumberProperty`, `coerceArray`, `coerceElement`, `coerceCssPixelValue`, `coerceStringArray` | `coercion` | same names | Ported verbatim; zero behavioral differences |  [SYNC](src/qwik-cdk/coercion/SYNC.md) |
| collections | `SelectionModel`, `DataSource`, `ArrayDataSource`, `UniqueSelectionDispatcher` | `collections` | `createSelectionModel()`/`useSelectionModel()`, `DataSource`/`ArrayDataSource`, `useDataSourceConnection(factory: QRL<() => DataSource<T> \| T[]>)` | No RxJS: `connect()` returns a minimal `Subscribable`, not `Observable`. **Never store a `DataSource`/`SelectionModel`/dispatcher instance directly in a signal/store/context** — it has methods and can't survive SSR→resume serialization; `useDataSourceConnection()`'s `QRL` factory exists specifically to sidestep this |  [SYNC](src/qwik-cdk/collections/SYNC.md) |
| dialog | `Dialog` (low-level, under `@angular/cdk/dialog`) | `dialog` | `useDialog()` → `{open$}`, `DialogRef`, `DialogConfig` | The low-level primitive `qwik-material/dialog`'s `useMatDialog()` is built on. `open$` is async; `DialogRef.closed` is a one-shot `Promise`, not an `Observable`. No `TemplateRef` overload. `DialogConfig.context?: OverlayContextOverride[]` is the generic context-passthrough mechanism (see combined note below) |  [SYNC](src/qwik-cdk/dialog/SYNC.md) |
| keycodes | `hasModifierKey`, key code constants | `keycodes` | same names | Ported verbatim |  [SYNC](src/qwik-cdk/keycodes/SYNC.md) |
| layout | `BreakpointObserver`, `MediaMatcher`, `Breakpoints` | `layout` | `Breakpoints`, `observeBreakpoints(queries, onChange): unsubscribe` | `BreakpointObserver`/`MediaMatcher` **classes are not ported** — collapsed into one plain function, no query de-duplication/caching, no debounce, no Safari<14 `addListener` fallback |  [SYNC](src/qwik-cdk/layout/SYNC.md) |
| overlay | `Overlay`, `OverlayConfig`, `OverlayRef`, position/scroll strategies | `overlay` | `useOverlay()` → `{create$}`, `OverlayConfig`, `createGlobalPositionStrategy()`/`createFlexibleConnectedPositionStrategy()`, four scroll strategies + `ScrollStrategyDescriptor` | `create$(Component, props, config)` creates **and** attaches in one call — no separate `ComponentPortal`. `OverlayConfig.context?: OverlayContextOverride[]` is the context-passthrough mechanism every higher-level `open$()` populates automatically from ambient qwik-material contexts (see below). `updateSize()` on an already-mounted ref does not reactively resize the pane (known gap) |  [SYNC](src/qwik-cdk/overlay/SYNC.md) |
| platform | `Platform` | `platform` | `createPlatform()`, `usePlatform()`, `PLATFORM`, `isBrowser` | Plain class, no `@Injectable`; lowest-risk entry point, ported essentially unchanged |  [SYNC](src/qwik-cdk/platform/SYNC.md) |
| portal | `ComponentPortal`/`TemplatePortal`/`DomPortal`, `CdkPortalOutlet`, `DomPortalOutlet` | `portal` | `Portal<P>` (`{Component, props}`), `<CdkPortalOutlet portal={...}>`, `useCdkDomPortal()`, `<CdkDomPortalOutlet target={...}>` | No class hierarchy, no `TemplatePortal` (no `TemplateRef`). `useCdkDomPortal()`/`<CdkDomPortalOutlet>` physically relocate real DOM nodes via `useVisibleTask$` — use `useVisibleTask$`, not a plain `useTask$`, for anything that must run even with no later interaction |  [SYNC](src/qwik-cdk/portal/SYNC.md) |
| scrolling | `ScrollDispatcher`, `CdkScrollable`, `ViewportRuler`; `cdk-virtual-scroll-viewport` | `scrolling` | `getSharedScrollDispatcher()`, `createViewportRuler()`, `useCdkScrollable()` → `{hostProps: {ref}, elementRef}`, `scrollToElement()`, `measureScrollOffset()` | `ScrollDispatcher`/`ViewportRuler` are **process-wide singletons**, not scoped per `<QwikCdkRoot>` subtree. No built-in throttle on `scrolled()`/`change()`. **Virtual scrolling (`cdk-virtual-scroll-viewport`, `*cdkVirtualFor`, all strategies) is entirely out of scope — no workaround** |  [SYNC](src/qwik-cdk/scrolling/SYNC.md) |
| stepper | `CdkStepper`/`CdkStep` (headless logic only) | `stepper` | Pure functions: `canMoveToIndex()`, `computeIndicatorType()`, `computeCompleted()`, etc.; `CDK_STEPPER_GLOBAL_OPTIONS` | **No `CdkStepper`/`CdkStep` component/directive exists** — only the pure logic `qwik-material/stepper`'s `MatStepper` is built on. A CDK-only (no Material) stepper has no 1:1 target; build your own on these functions |  [SYNC](src/qwik-cdk/stepper/SYNC.md) |
| table | `CdkTable`/`CdkRowDef`/`CdkColumnDef` (headless logic only) | `table` | `getRowDefsForData()`, `StickyStyler`, `getCellRole()`, etc. | **No `CdkTable` component layer** — `qwik-material/table`'s `MatTable` does the actual rendering from plain arrays. `StickyStyler` computes against a `VirtualStickyElement` plain-data stand-in with zero real measurement (exact for ≤1 sticky column/row per side, wrong beyond that unless you supply real measurements) |  [SYNC](src/qwik-cdk/table/SYNC.md) |
| text-field | `CdkTextareaAutosize`, `CdkAutofill`, `AutofillMonitor` | `text-field` | `useCdkTextareaAutosize()`, `useCdkAutofill()` → `hostProps` | Directive-hooks, spread onto any element (e.g. `<MatInput as="textarea" {...autosize.hostProps}>`). No live engine instance exposed — bump a `resizeTrigger` signal to force a remeasure instead of calling a method |  [SYNC](src/qwik-cdk/text-field/SYNC.md) |
| tree | `*matTreeNodeDef`, `childrenAccessor`, `TreeKeyManager` | `tree` | `flattenTree()`, `collectInitialExpanded()`, `CdkTreeNodeToggle`, `CDK_TREE_TOGGLE_STATE`; keyboard nav (`resolveTreeKeydown()`) lives in **`.../a11y`**, not here | Recursive **plain-data array** (`CdkTreeNodeInput<T>`) replaces the template/content-children model. `levelAccessor`/`treeControl`/`DataSource` tree sources not supported — only the current plain-array shape |  [SYNC](src/qwik-cdk/tree/SYNC.md) |

**Overlay/dialog context passthrough, exact mechanism:** `OverlayConfig`/`DialogConfig` both have a
`context?: OverlayContextOverride[]` field (`{ctx: ContextId<T>, value: T}[]`). It exists because
`<QwikCdkRoot>` renders overlay content as a **sibling** of whatever opened it (under
`<OverlayContainerOutlet>`), not a descendant — so Qwik context providers between the root and the
opener (a nested `useMat*Provider()` call) don't reach it for free the way Angular DI inheritance
does. `useMatDialog()`/`useDialog()`/`useMatBottomSheet()` populate this automatically from every
qwik-material configuration context visible where you call the hook (`useMatContextSnapshot()`),
merged with whatever you pass in `config.context` — so qwik-material settings "just work" inside a
dialog, and `context` is specifically the generic opt-in for **your own app's** contexts. A raw
`useOverlay()` call has no automatic snapshot and must set `context` itself.

## 7. Forms

Angular reactive forms, template-driven forms (`ngModel`), and Formly have **no equivalent** —
this port has no DI container and no `ControlValueAccessor` concept. Every form control is a
**controlled component**: a `value`/`checked` prop plus an `onChange$`/`onValueChange$` handler.

The forms-integration contract every control shares (text inputs, select, autocomplete, date/time
inputs, checkbox, radio group, slide toggle, button toggle group):

| Prop | Purpose |
|---|---|
| `formBound` | Opt-in flag — only a form-bound control renders `ng-untouched`/`ng-touched`, `ng-pristine`/`ng-dirty`, `ng-valid`/`ng-invalid` classes, matching Angular's `NgControlStatus` |
| `touched` / `dirty` / `invalid` | Plain booleans you compute and pass in; drive the classes above plus (for form-field-nested controls) error visibility |
| `onTouched$` | `QRL` fired on blur (or, for click-driven controls like button-toggle, on a selection-changing click) — the "mark as touched" signal a form library needs |
| `errorStateMatcher` | `'touched'` (default, matches `ErrorStateMatcher`) \| `'dirty'` (matches `ShowOnDirtyErrorStateMatcher`) \| a custom `QRL<(state) => boolean>` |

For hand-rolled state without a form library: `useMatFormControl()`
(`@angular-community/qwik-material/form-field`) is a small store (`value`/`touched`/`dirty` +
`setValue$`/`markAsTouched$`), paired with the pure validator functions `matRequiredValidator`/
`matEmailValidator` and `matControlInvalid(fc, [validators])` — the Qwik-appropriate replacement
for `FormControl`+`Validators`, since a class instance or plain closure can't cross Qwik's
serialization boundary the way `FormControl` does in Angular.

**For a real form library**, this repo documents one worked integration end to end:
[`guides/using-with-formisch.md`](src/qwik-material-docs/src/content/guides/using-with-formisch.md)
(and the live example at
[`src/qwik-cdk-dev-app/src/routes/formisch/account/`](src/qwik-cdk-dev-app/src/routes/formisch/account/)).
Key points if the Angular app's forms need a direct analogue of `FormGroup`/`Validators`:

- Native-element controls (`MatInput`, and via `ref` composition `MatDatepickerInput`/
  `MatTimepickerInput`/`MatAutocomplete`) take the form library's `field.props` (`ref`/`onFocus$`/
  `onInput$`/`onBlur$`) spread directly.
- Custom controls with no native element to register (`MatSelect`, `MatRadioGroup`, `MatCheckbox`,
  `MatSlideToggle`, `MatButtonToggleGroup`) drive the form library via `field.onInput(value)`
  instead, plus the `formBound`/`touched`/`dirty`/`invalid`/`onTouched$` props above.
- A form library that renders its own `<form>` can't be wrapped by `<MatForm>` (which also renders
  one) — use `MatFormSubmittedProvider` (`@angular-community/qwik-material/core`) instead, which
  provides the "is the form submitted" state without rendering an element.
- `value={field.input.value}` must be a **literal, inline signal read** at the JSX attribute —
  not a spread, not a value returned from a helper function (§8).

## 8. Pitfalls an agent will hit

Each verified against this port's `SYNC.md` files (or, where marked *(Qwik/HTML)*, general
Qwik/browser behavior relevant to any component in this library).

- **Never nest a component that renders a `<div>` (or any block element) inside a `<p>`.**
  *(Qwik/HTML)* The browser's HTML parser auto-closes an open `<p>` the moment it meets a block
  element, so the live DOM tree no longer matches what Qwik serialized during SSR — this breaks
  resumability. Many qwik-material components render a root `<div>` (form field, select/menu/
  autocomplete panels, chips, cards, …); never wrap one in a `<p>`.
- **Callbacks/handlers passed into the library must be real `$()` QRLs — plain functions and class
  instances don't survive SSR→resume.** Confirmed as an explicit, enforced requirement for: a
  custom `DateAdapter` (`useMatDateAdapterProvider({factory: $((locale) => new MyAdapter(locale))})`),
  `MatSelect`'s `compareWith$`, a custom `ErrorStateMatcher`, `MatSlider`'s `displayWith`,
  datepicker's `dateClass`. Passing a plain function in any of these either silently loses the
  value after resume or crashes the SSR response outright (slider's `displayWith` 500s mid-stream).
- **Never write a new value to a store/signal during a component's own render body, and never
  call a hook conditionally.** `useMatProviders()` enforces the second rule explicitly (freezes
  its hook-call key set via `useConstant()` on first render, logs a dev-mode error if the key set
  later changes) — see §3.3. A real bug this caused once (`sort/SYNC.md`): combining self-owned
  and props-owned state into one signal that was read-then-rewritten every render produced an
  infinite reactive loop, caught only by a timing-out Playwright test, not by `tsc`/vitest/lint.
  Split state so each signal has exactly one writer.
- **Overlay content (dialogs, menus, select/autocomplete panels, tooltips, snack bars, …) renders
  as a sibling of its opener under `<QwikCdkRoot>`, not a descendant.** Every qwik-material
  configuration context visible where you call `useMatDialog()`/`useMatBottomSheet()`/etc. is
  carried over automatically. Your **own** app's contexts are not — pass them explicitly via
  `config.context: OverlayContextOverride[]` (`{ctx, value}[]`, same field name on `DialogConfig`
  and the low-level `OverlayConfig`). See §6's CDK table footnote for the exact mechanism.
- **SVG icon URLs registered with `addSvgIcon`/`addSvgIconSet` etc. must be absolute during SSR.**
  This package has no router dependency, so it can't resolve a relative URL against the current
  request's origin the way a browser's own `fetch('/foo.svg')` does. Build an absolute URL
  yourself (e.g. `new URL('/icons/home.svg', requestEvent.url)` inside a `routeLoader$`, which has
  the request URL) before calling `addSvgIcon`.
- **Imported CSS is global, not scoped to a component.** Every `*-prebuilt.css` file from this
  library is intentionally global (it must match Angular Material's own global stylesheet
  behavior). Any CSS the migrated app imports for its *own* route-level or feature components
  should be scoped (e.g. `useStylesScoped$()`, a CSS Modules-style convention, or a unique root
  class) — importing a plain, unscoped `.css`/`.scss` file the way the library does will leak
  selectors across the whole page the same way an un-encapsulated Angular component's styles
  would with `ViewEncapsulation.None`.
- **`ng-touched`/`ng-dirty`/`ng-invalid` (and their `untouched`/`pristine`/`valid` opposites) are
  real, emitted classes**, present on every control that sets `formBound` — existing CSS/tests
  targeting them (common in a CMS/brand stylesheet mirroring Angular's `NgControlStatus`) keeps
  working, but **only when `formBound` is actually set**; omitting it (e.g. because the control is
  being used uncontrolled) means those classes never appear.
- **A value nested two levels deep — inside the *value* of another prop — does not get a live
  update binding.** This hits `<MatFormField control={<MatInput touched={x} .../>}>`: pass
  `touched`/`dirty`/`invalid` as **top-level** props on `<MatFormField>` itself too, or they render
  correctly once and then silently stop updating. The same "read once, frozen" rule applies to
  `MatSelect`'s old `options` (now fixed to require the signal itself, not `.value` — still worth
  checking any example code copied from an older snapshot), and to `value={...}` on `MatInput`/any
  form-library-bound control, which must be a **literal, inline `signal.value` read** — not a
  spread, not a value returned from a helper function — to pick up an externally-reassigned value
  (a form library's `reset()`/`setInput()`).
- **A `$()` handler captures the *whole* object it closes over, including any live `JSXOutput`
  fields — this can crash SSR serialization even when `tsc`/vitest pass.** (`tree/SYNC.md`.) Pull
  only the plain fields you need into local `const`s before the handler body; don't read
  `props.whatever` from inside a handler that also has unrelated JSX-bearing fields in scope.
- **An instance of `DataSource`, `SelectionModel`, `FocusMonitor`, or a key manager must never be
  stored directly in a signal, store, or context value.** These are plain closures/objects with
  methods, not QRLs — they fail SSR→resume serialization. Construct them fresh inside the
  `useVisibleTask$`/handler/QRL that needs them (see `qwik-cdk/collections`'s `useDataSourceConnection()`
  and `qwik-cdk/a11y`'s hooks for the pattern that avoids this).
- **`useVisibleTask$`, not `useTask$`, for anything that must run even with zero later
  interaction** (e.g. a one-time DOM relocation for a portal). A plain `useTask$` tracking only a
  `ref` never reruns for content that's part of the page's initial render and never gets touched
  again — `useVisibleTask$`'s `on:qvisible` is what wakes it up with no interaction at all.

## 9. Not supported / deferred

Gathered from every `SYNC.md` in both packages. Where a workaround exists, it's included; where
none does, migrate the affected feature manually or drop it.

**Across the whole library:**

- **Legacy, pre-MDC Angular Material components and APIs.** Not supported at all — this port
  targets current, MDC-based Material 3 only (§1). Upgrade the Angular app off legacy Material
  first if it hasn't already.
- **Angular CDK/Material test harnesses** (`Mat*Harness`, `Cdk*Harness`). None are ported, for any
  component in either package. Rewrite harness-based tests against the real rendered DOM (e.g.
  Playwright), the same way this repo's own parity suite works.
- **Virtual scrolling** (`cdk-virtual-scroll-viewport`, `*cdkVirtualFor`, every `VirtualScrollStrategy`,
  `CdkVirtualScrollable*`). Entirely out of scope — no Qwik structural-directive equivalent to
  build on, and no workaround offered. Flag loudly if the source app uses virtual scroll.
- **Drag and drop** (`@angular/cdk/drag-drop`). No `qwik-cdk` entry point exists at all; nothing
  has been started.
- **`@angular/cdk/listbox`, `@angular/cdk/menu`** (the low-level CDK menu primitive — distinct
  from the ported Material `menu`), **`@angular/cdk/observers`, `@angular/cdk/testing`,
  **`@angular/cdk/schematics`**. No entry point exists for any of these.
- **`MatSelectionList`/`MatListOption`** (selectable lists with checkbox/radio indicators). Not
  ported — described in `list/SYNC.md` as a dedicated future port, "genuinely out of scope here,
  not a small addition." No workaround; roll your own selectable list for now.
- **Chip input + autocomplete composition** (`matChipInputFor` stacked with `matAutocomplete` on
  the same input). Not supported — `qwik-material/autocomplete`'s `<MatAutocomplete>` is a
  standalone component with its own input, and a chip grid's internally-rendered input has no
  ref/hook escape hatch for a second behavior to attach to. Only manual chip entry works.
- **RxJS-based APIs.** None anywhere — every Angular `Observable` output is a QRL prop, and every
  Observable-returning method (`afterClosed()`, `afterDismissed()`, …) is a `Promise` **property**
  instead (not a method call).
- **Zone.js / `ChangeDetectorRef.markForCheck()`.** Not applicable — Qwik's reactivity is purely
  signal-based.
- **`TemplateRef`-based overlay content.** `MatDialog`/`MatBottomSheet`/`MatSnackBar`/the raw CDK
  `Dialog`/`Overlay` can only open a `component$`, never a template reference (doesn't exist).
- **`BreakpointObserver`/`MediaMatcher` classes.** Collapsed into one function,
  `observeBreakpoints()` (`qwik-cdk/layout`) — no query de-duplication/caching, no debounce, no
  Safari<14 `addListener` fallback.
- **`closeOnNavigation`/`disposeOnNavigation`** (dialog/overlay) only fires on real `popstate`/
  `hashchange`, never on an in-app router's `pushState`-driven link click (no router dependency is
  taken). Workaround: call `.close()`/`.dispose()` yourself from the app router's navigation hook.

**Per component (selected; see each component's `SYNC.md` for the complete list):**

- **autocomplete** — `matAutocompleteDisabled`/`-Position`/`-ConnectedTo` (no way to anchor the
  panel elsewhere); `autoSelectActiveOption` accepted but has no effect; no overlay resize-on-reattach.
- **badge** — `AriaDescriber` only partially ported (no shared, deduped description container) —
  keep per-badge descriptions short/unique.
- **button** — `showProgress`/`[progressIndicator]` not ported; `MatButton` has no leading `icon`
  prop (only the FAB variants do) — place the icon directly in content instead.
- **button-toggle** — `appearance="legacy"` and `vertical` not ported (style manually if needed);
  no RTL for arrow-key nav.
- **card** — no `<picture>`/`<video>` media variant for `MatCardImage`/`MatCardAvatar`.
- **checkbox** — no CVA/`Validator`/`required`-as-validation; use the `formBound` contract instead.
- **chips** — `MatChipGrid` has no `touched`/`dirty`/`invalid`/`formBound` concept at all.
- **datepicker** — `picker.open()`/`close()` are the functions `openDatepickerPanel(picker, cdk)`
  (with `cdk = useContext(QWIK_CDK)` read during render) / `closeDatepickerPanel(picker)`, and
  `.opened` is `picker.isOpen`; only `NativeDateAdapter` (no
  date-fns/Luxon/Moment — subclass `NativeDateAdapter` instead); comparison ranges and a custom
  `MatDateRangeSelectionStrategy` not ported; typed-text parsing into `MatDateRangeInput`'s two
  fields not ported (calendar-click selection only); confirm buttons are your own buttons in the
  `actions` prop calling `applyDatepickerSelection(picker)`/`cancelDatepickerSelection(picker)` —
  there are no `MatDatepickerActions`/`Apply`/`Cancel` components. `MatDateRangeInput` has no
  `formBound` concept of its own.
- **dialog** — no `TemplateRef` overload; `MatDialogRef.componentInstance` is always
  `Signal<null>`; no multi-`Dialog`-service hierarchy (`closeAll()` cascading parent→child).
- **expansion** — `afterExpand`/`afterCollapse` never fire when animations are globally disabled;
  no imperative `openAll()`/`closeAll()` on `<MatAccordion>`; no RTL keyboard nav.
- **form-field** — `appearance="outline"` + any prefix/suffix doesn't adjust the notch width (may
  visually clip); no dev-mode throw for a missing `control`/duplicate hints (silent instead).
- **grid-list** — header/footer/avatar/line sub-components have zero DOM-parity test coverage; no
  RTL.
- **icon** — the Safari `MAT_ICON_LOCATION` FuncIRI rewriting workaround not ported (SSR-hostile);
  `registerFontClassAlias`/`setDefaultFontSetClass` exist but aren't wired into `<MatIcon>`'s own
  rendering yet (use `MatIconConfig.fontSet` instead).
- **input** — no native `<select>` mode; `cdkTextareaAutosize` isn't built in (compose
  `useCdkTextareaAutosize()` yourself); autofill is a static marker class, not live detection.
- **list** — list-level `disabled` doesn't cascade into per-item disabled/ripple state.
- **menu** — `ContextMenuTrigger` (right-click menu) not ported; `menuitemcheckbox`/`menuitemradio`
  roles not supported; a known Qwik v2 focus-origin bug shows the wrong highlight color on a
  menu's auto-focused first item when the trigger is composed onto `<MatButton>`.
- **paginator** — `pageIndex`/`pageSize` can't be reassigned from outside after mount (no
  imperative "jump to page"); `MatPaginatorIntl.getRangeLabel` not supported (use the `rangeLabel`
  string prop, computed yourself); `selectConfig.disableOptionCentering` has no effect.
- **select** — `sortComparator` not accepted (multi-select always resorts into document order);
  `disableOptionCentering` is a genuine no-op in upstream Material 21.2 itself, not a scope cut.
- **sidenav** — no duplicate-drawer-per-position validation; `autosize` accepted for API-shape
  parity only (this port always keeps width live via `ResizeObserver` regardless).
- **slider** — `dragStart`/`dragEnd` not ported; no live `ResizeObserver` after mount (remeasures
  only at mount and on `pointerdown`); no RTL; `disableRipple` has no effect yet.
- **snack-bar** — no true DI-singleton "one snack bar app-wide" across injector scopes (call
  `useMatSnackBar()` once per root and share the object); no `BreakpointObserver`-driven handset
  mode.
- **sort** — custom sort-arrow icon projection (`[matSortHeaderIcon]`) not ported.
- **stepper** — **no per-occurrence `matStepperIcon` context** (`{index, active, optional}`) —
  overrides are one static `JSXOutput` shared by every step currently in that icon state, not
  re-evaluated per step; no `MatStepperIntl` i18n; no RTL.
- **table** — `MatTableDataSource`'s filter/sort/paginate pipeline not ported (sort/filter/
  paginate your own array first); no virtual scrolling, drag-and-drop reordering, or ripple on
  rows; sticky-column/row measurement defaults to `0` (exact for ≤1 sticky column/row per side,
  wrong beyond that unless you supply real measurements); `useDataSourceConnection()` exists but
  is unwired by any real example — treat as unproven.
- **tabs** — no drag-and-drop tab reordering; `backgroundColor`/`mat-background-*` theming not
  ported (deprecated upstream anyway); LTR only.
- **timepicker** — only the native `Date` adapter; a known, open Qwik-core crash
  (`"Rendering promises in JSX signals is not supported"`) on the `min`/`max` validation-error
  path under certain timing — test this path explicitly if migrating min/max validation.
- **toolbar** — no dev-mode "mixed content and rows" error (silently undefined behavior instead).
- **tooltip** — no imperative `show()`/`hide()`/`toggle()` public hook; no real `AriaDescriber`
  hidden-description element; a known, unresolved Qwik-core bug means hover never fires when
  `useMatTooltip()`'s `hostProps` are spread onto `<MatButton>` specifically — compose onto a
  plain host element, or test thoroughly if `MatButton` composition is required.
- **tree** — no `MatTreeFlatDataSource`/`MatTreeNestedDataSource`, no legacy `treeControl` API;
  `<CdkTreeNodeToggle recursive>` is accepted but is a documented no-op (implement cascading
  expand/collapse yourself); no virtual/infinite scrolling.
- **qwik-cdk/a11y** — `cdkTrapFocus`/`cdkAriaLive` attribute directives not ported (use the hooks);
  `ActivedescendantKeyManager`/`NoopTreeKeyManager` not ported; tree-keyboard typeahead not ported.
- **qwik-cdk/overlay** — `updateSize()` on an already-mounted `OverlayRef` doesn't reactively
  resize the pane; `width()`/`height()` on position strategies are no-ops.
- **qwik-cdk/portal** — no `CdkPortal` structural directive, no imperative `PortalOutlet`
  interface; no `onAttached$` callback for knowing exactly when a DOM relocation finishes (poll if
  you need this).
- **qwik-cdk/text-field** — `TextareaAutosize.reset()` while staying enabled has no direct
  trigger (toggle `enabled` off/on instead); the `text-field-autofill-color()` Sass mixin not
  ported.

## 10. Verifying a migrated page

This repo's own parity harness (`src/qwik-cdk-parity-tests`) diffs the **library's** components
against a real Angular reference app — it isn't meant to run against your migrated application.
For your own app, verify each migrated page the same way, by hand or scripted:

1. **Compare rendered DOM and computed styles** between the original Angular page and the migrated
   Qwik page for every component instance that matters — class lists, computed `background-color`/
   `color`/spacing for a few key states (default, hover/focus, disabled, error). Because DOM/class
   parity is this port's design contract (§1), a real difference almost always means either a
   missed prop (check the component's row in §6) or a genuine gap (check §9) — not an acceptable
   stylistic difference.
2. **Check the raw SSR HTML**, not just the hydrated page — `curl` the route directly (as in §2.6)
   and confirm the Angular Material class names and your app's expected content are present
   *before* any client JS runs. A missing class or empty content here usually means a prop that's
   read once from a JSX descriptor (form-field's `control`, a data-array prop like `rows`/`options`)
   was built from a value that wasn't ready at SSR time.
3. **Test every interaction after resume**, not just the initial render — open a dialog/menu/
   select, toggle a checkbox, submit a form, switch a tab — since a value that "looks right" in
   the SSR HTML can still be a stale snapshot that stopped updating after resume (§8's "nested
   prop never gets a live binding" pitfall is the most common cause).
4. **When something differs**, check in this order: the component's own `SYNC.md` (named in §6) for
   a documented deviation; this file's §8/§9; then the docs site's rendered component page for a
   working reference implementation — build and preview it locally:

   ```bash
   pnpm -C src/qwik-material-docs build
   pnpm -C src/qwik-material-docs preview
   ```
