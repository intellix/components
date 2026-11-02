# Getting started

`@angular-community/qwik-material` and `@angular-community/qwik-cdk` are a Qwik port of Angular
Material and the Angular CDK. If you know Angular Material, the component APIs will look
familiar — props instead of `@Input()`s, `$`-suffixed handler props instead of `@Output()`s, and
hooks instead of structural/attribute directives.

## Requirements

- **Qwik v2.** `@qwik.dev/core` `>=2.0.0-rc.4` (and `@qwik.dev/router` if you're using file-based
  routing) as peer dependencies. Both packages were upgraded from Qwik 1.x to v2 on 2026-11-01 —
  if your app is still on Qwik 1 (`@builder.io/qwik`), upgrade first (`qwik migrate-v2`, see
  [next.qwik.dev/docs/upgrade](https://next.qwik.dev/docs/upgrade/)).
- **Current, MDC-based Angular Material concepts.** This port targets `@angular/material@21.2.14`
  — the current, MDC-based component architecture. Legacy (pre-MDC) Material components and APIs
  are not supported; there's nothing to migrate from if your Angular app is already on a current
  Material version.

## Install

```bash
pnpm add @angular-community/qwik-cdk @angular-community/qwik-material
```

(or `npm install` / `yarn add` — both are plain workspace packages with `@qwik.dev/core` as a peer
dependency).

## Wire up your app root

Every qwik-material component reads shared state (the overlay container, open dialogs, text
direction, a monotonic id generator) from context that `<QwikCdkRoot>` provides. It must wrap your
whole app exactly once, near the root — the same role Angular's root injector plays for CDK
services:

```tsx
import {component$} from '@qwik.dev/core';
import {QwikCdkRoot} from '@angular-community/qwik-cdk';

export default component$(() => (
  <QwikCdkRoot>
    {/* the rest of your app */}
  </QwikCdkRoot>
));
```

`<QwikCdkRoot>` takes a few optional props: `dialogDefaults` (default `MatDialogConfig` overrides),
`overlayContainer` (where overlay content attaches), `direction` (`'ltr'` | `'rtl'`).

Some components also read defaults from a `<QwikMaterialProvider>` — for example, a site-wide
default icon font set. It's optional and can be nested anywhere under `<QwikCdkRoot>`, including
multiple times with different config for different sections of your app:

```tsx
import {QwikMaterialProvider} from '@angular-community/qwik-material/dialog';

<QwikMaterialProvider matIconConfig={{fontSet: 'material-symbols-outlined'}}>
  {/* ... */}
</QwikMaterialProvider>
```

## Fonts and prebuilt CSS

Angular Material ships a Roboto font recommendation and a Material Symbols/Icons webfont for
`<mat-icon>`'s default ligature mode; qwik-material is no different — load them yourself (there's
no automatic injection):

```html
<link rel="preconnect" href="https://fonts.gstatic.com" />
<link href="https://fonts.googleapis.com/css2?family=Roboto:wght@300;400;500&display=swap" rel="stylesheet" />
<link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined&display=block" rel="stylesheet" />
```

Each qwik-material entry point ships its own **prebuilt CSS** file — import only the ones for
components you actually use, plus `core-prebuilt.css` (the design tokens and typography every
other component's CSS depends on) and qwik-cdk's `overlay-prebuilt.css` (needed by anything that
opens an overlay — menu, select, autocomplete, datepicker, dialog, tooltip, snack bar, bottom
sheet, …):

```ts
import '@angular-community/qwik-cdk/overlay-prebuilt.css';
import '@angular-community/qwik-material/core-prebuilt.css';
import '@angular-community/qwik-material/button-prebuilt.css';
import '@angular-community/qwik-material/form-field-prebuilt.css';
// ...one import per component you use
```

There's no single "import everything" CSS bundle by design — same reasoning as Angular Material's
own per-component stylesheets, just without a build-time Sass mixin to assemble them for you.

## Render your first component

```tsx
import {component$} from '@qwik.dev/core';
import {MatButton} from '@angular-community/qwik-material/button';

export default component$(() => <MatButton appearance="filled">Hello</MatButton>);
```

From here:

- **[Theming](/guide/theming/)** — the default theme, design tokens, and applying your own brand
  colors.
- **[Migrating from Angular Material](/guide/migrating-from-angular-material/)** — a
  concept-by-concept map if you're porting an existing Angular app.
- Browse the **[component list](/components/)** for the rest of the API.
