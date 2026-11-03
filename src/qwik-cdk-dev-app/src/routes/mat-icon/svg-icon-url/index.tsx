import {component$} from '@qwik.dev/core';
import {routeLoader$} from '@qwik.dev/router';
import {MatIcon, MatIconRegistryProvider, trustIconResourceUrl} from '@angular-community/qwik-material/icon';

// This package has no router dependency (see icon/SYNC.md's "no HTTP
// base-URL resolution" deviation), so a relative icon URL can't be
// resolved during SSR — this loader builds the ABSOLUTE url from the
// current request, exactly as that deviation's own doc comment recommends.
export const useHomeSvgUrl = routeLoader$(requestEvent => {
  return new URL('/mat-icon/assets/home.svg', requestEvent.url).toString();
});

/**
 * Registers an icon by URL (fetched during SSR, server-side, via
 * `icon-fetch.ts`'s `fetch()` + cache) and renders it via `svgIcon` — proves
 * the SSR-blocking-until-resolved contract: `specs/material-icon/
 * svg-icon-url.spec.ts` fetches this route's raw HTML with no JS at all
 * and asserts the resolved `<svg>` markup is already there.
 */
export default component$(() => {
  const url = useHomeSvgUrl();
  return (
    <>
      <div data-parity-root>
        <MatIconRegistryProvider icons={[{name: 'home', url: trustIconResourceUrl(url.value)}]}>
          <MatIcon svgIcon="home" aria-label="Home" aria-hidden={false} />
        </MatIconRegistryProvider>
      </div>
      <main data-scenario-ready>ready</main>
    </>
  );
});
