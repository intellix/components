import {component$} from '@builder.io/qwik';
import {QwikCityProvider, RouterOutlet} from '@builder.io/qwik-city';
import {QwikCdkRoot} from '@angular-community/qwik-cdk';
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
import '@angular-community/qwik-material/tooltip-prebuilt.css';
import '@angular-community/qwik-material/menu-prebuilt.css';

export default component$(() => (
  <QwikCityProvider>
    <head>
      <meta charSet="utf-8" />
      <title>qwik-cdk dev-app</title>
      {/* Matches the Angular dev-app's body font (src/dev-app's own Roboto <link> + global CSS)
          — not for visual theming (full computed-style/theme parity between the two dev-apps
          is an out-of-scope follow-up per the design doc), but because WITHOUT it this app's
          body text falls back to the browser's serif UA default, measurably changing
          `offsetWidth` for any scenario whose content sizes itself to unstyled text (e.g.
          mat-sidenav's `autosize` scenario) — confirmed empirically while porting that
          scenario. Just matching the fallback NAME isn't enough either (Arial's metrics for
          the same text differ measurably from real Roboto's) — the actual webfont is loaded,
          same as Angular's. The font-family value here avoids any name containing a
          space/quote: a JSX text child inside `<style>` gets HTML-entity-escaped (`'` →
          `&#39;`), which breaks a quoted CSS string — confirmed empirically. The drawer's
          `ResizeObserver`-based width tracking (mat-drawer.tsx) picks up the reflow once the
          font finishes loading, same as any other content size change. */}
      <link rel="preconnect" href="https://fonts.gstatic.com" />
      <link
        href="https://fonts.googleapis.com/css2?family=Roboto:wght@300;400;500&display=swap"
        rel="stylesheet"
      />
      <style>{`body { font-family: Roboto, Arial, sans-serif; }`}</style>
    </head>
    <body>
      <QwikCdkRoot>
        <RouterOutlet />
      </QwikCdkRoot>
    </body>
  </QwikCityProvider>
));
