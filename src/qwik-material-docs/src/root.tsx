import {component$} from '@qwik.dev/core';
import {RouterOutlet, useQwikRouter} from '@qwik.dev/router';
import {QwikCdkRoot} from '@angular-community/qwik-cdk';
import {QwikMaterialProvider} from '@angular-community/qwik-material/dialog';
import '@angular-community/qwik-cdk/overlay-prebuilt.css';
import '@angular-community/qwik-material/core-prebuilt.css';
import '@angular-community/qwik-material/dialog-prebuilt.css';
import '@angular-community/qwik-material/button-prebuilt.css';
import '@angular-community/qwik-material/card-prebuilt.css';
import '@angular-community/qwik-material/toolbar-prebuilt.css';
import '@angular-community/qwik-material/badge-prebuilt.css';
import '@angular-community/qwik-material/icon-prebuilt.css';
import '@angular-community/qwik-material/progress-bar-prebuilt.css';
import '@angular-community/qwik-material/progress-spinner-prebuilt.css';
import '@angular-community/qwik-material/divider-prebuilt.css';
import '@angular-community/qwik-material/grid-list-prebuilt.css';
import '@angular-community/qwik-material/list-prebuilt.css';
import '@angular-community/qwik-material/button-toggle-prebuilt.css';
import '@angular-community/qwik-material/slide-toggle-prebuilt.css';
import '@angular-community/qwik-material/expansion-prebuilt.css';
import '@angular-community/qwik-material/radio-prebuilt.css';
import '@angular-community/qwik-material/checkbox-prebuilt.css';
import '@angular-community/qwik-material/sort-prebuilt.css';
import '@angular-community/qwik-material/tabs-prebuilt.css';
import '@angular-community/qwik-material/sidenav-prebuilt.css';
import '@angular-community/qwik-material/snack-bar-prebuilt.css';
import '@angular-community/qwik-material/bottom-sheet-prebuilt.css';
import '@angular-community/qwik-material/form-field-prebuilt.css';
import '@angular-community/qwik-material/stepper-prebuilt.css';
import '@angular-community/qwik-material/chips-prebuilt.css';
import '@angular-community/qwik-material/tooltip-prebuilt.css';
import '@angular-community/qwik-material/slider-prebuilt.css';
import '@angular-community/qwik-material/menu-prebuilt.css';
import '@angular-community/qwik-material/select-prebuilt.css';
import '@angular-community/qwik-material/timepicker-prebuilt.css';
import '@angular-community/qwik-material/table-prebuilt.css';
import '@angular-community/qwik-material/tree-prebuilt.css';
import '@angular-community/qwik-material/paginator-prebuilt.css';
import '@angular-community/qwik-material/autocomplete-prebuilt.css';
import '@angular-community/qwik-material/datepicker-prebuilt.css';
import './styles/docs-shell.css';

/**
 * Root shell for the qwik-material docs site. Follows `src/qwik-cdk-dev-app/src/root.tsx`'s
 * established pattern for this monorepo's Qwik v2 apps: `useQwikRouter()` (v2's replacement for
 * the v1 `<QwikCityProvider>`), `<QwikCdkRoot>` wrapping `<RouterOutlet/>`, and every component's
 * prebuilt CSS imported eagerly at the root — this IS the docs site for every one of those
 * components, so (unlike a real consuming app) all of them are genuinely needed on some page.
 *
 * Also loads the real Roboto + Material Symbols Outlined webfonts (the dev-app only matches the
 * *class name* `material-symbols-outlined` for DOM parity — it never loads the actual glyphs,
 * since the parity harness only diffs DOM/computed-style, not rendered icon glyphs) and sets that
 * as the default `<MatIcon>` font set site-wide via `<QwikMaterialProvider>`, so icons in the
 * site's own chrome (and in rendered examples that use ligature-text icons) show real glyphs.
 */
export default component$(() => {
  useQwikRouter();

  return (
    <>
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>qwik-material</title>
        <meta
          name="description"
          content="Qwik port of Angular Material — browse components, guides, and live examples."
        />
        <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
        <link rel="preconnect" href="https://fonts.gstatic.com" />
        <link
          href="https://fonts.googleapis.com/css2?family=Roboto:wght@300;400;500;700&display=swap"
          rel="stylesheet"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@24,400,0,0&display=block"
          rel="stylesheet"
        />
      </head>
      <body>
        <QwikCdkRoot>
          <QwikMaterialProvider matIconConfig={{fontSet: 'material-symbols-outlined'}}>
            <RouterOutlet />
          </QwikMaterialProvider>
        </QwikCdkRoot>
      </body>
    </>
  );
});
