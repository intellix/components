import {component$} from '@qwik.dev/core';
import {RouterOutlet, useQwikRouter} from '@qwik.dev/router';
import {QwikCdkRoot} from '@angular-community/qwik-cdk';
import {useMatRippleDelegate} from '@angular-community/qwik-material/core';
import {useMatProviders} from '@angular-community/qwik-material/providers';
import '@angular-community/qwik-cdk/overlay-prebuilt.css';
import '@angular-community/qwik-material/core-prebuilt.css';
import './styles/docs-shell.css';
import {withBase} from './lib/base-path';

/**
 * Root shell for the qwik-material docs site. Follows `src/qwik-cdk-dev-app/src/root.tsx`'s
 * established pattern for this monorepo's Qwik v2 apps: `useQwikRouter()` (v2's replacement for
 * the v1 `<QwikCityProvider>`), `<QwikCdkRoot>` wrapping `<RouterOutlet/>`, and only the global
 * CSS imported at the root (qwik-cdk's overlay, qwik-material's core) — each qwik-material
 * component brings its own CSS when a page renders it (`useStyles$`; qwik-material README
 * "Component styles").
 *
 * Also loads the real Roboto + Material Symbols Outlined webfonts (the dev-app only matches the
 * *class name* `material-symbols-outlined` for DOM parity — it never loads the actual glyphs,
 * since the parity harness only diffs DOM/computed-style, not rendered icon glyphs) and sets that
 * as the default `<MatIcon>` font set site-wide via the combined `useMatProviders()` hook (see
 * `@angular-community/qwik-material/providers`), so icons in the site's own chrome (and in
 * rendered examples that use ligature-text icons) show real glyphs. A real app with more than
 * one setting to configure would pass more keys to this same call; an individual page that
 * wants to override just ONE setting for its own subtree calls that setting's own
 * `useMat*Provider()` hook directly instead (see e.g. a component's overview page).
 */
export default component$(() => {
  useQwikRouter();
  useMatProviders({icon: {fontSet: 'material-symbols-outlined'}});
  // Every qwik-material ripple on the page goes through this one set of document listeners.
  useMatRippleDelegate();

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
        <link rel="icon" type="image/svg+xml" href={withBase('/favicon.svg')} />
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
          <RouterOutlet />
        </QwikCdkRoot>
      </body>
    </>
  );
});
