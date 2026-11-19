import {component$} from '@qwik.dev/core';
import {RouterOutlet, useQwikRouter} from '@qwik.dev/router';
import {QwikCdkRoot} from '@angular-community/qwik-cdk';
import '@angular-community/qwik-cdk/overlay-prebuilt.css';
import '@angular-community/qwik-material/core-prebuilt.css';
import '@angular-community/qwik-material/typography-prebuilt.css';
import '@angular-community/qwik-material/elevation-prebuilt.css';

export default component$(() => {
  // v2: `useQwikRouter()` replaces the v1 `<QwikCityProvider>` wrapper
  // component (still present but deprecated in rc.4 — removed in v3).
  useQwikRouter();

  return (
    <>
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
    </>
  );
});
