import type {RequestHandler} from '@qwik.dev/router';

// A tiny real SVG asset, served as a plain request handler (no `public/`
// dir in this app) — the fetch target for the `svg-icon-url` scenario,
// which registers THIS route's absolute URL with the icon registry and
// proves resolution happens during SSR (server-side `fetch()`, cached).
const HOME_SVG = `<svg viewBox="0 0 24 24"><path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"/></svg>`;

export const onGet: RequestHandler = requestEvent => {
  requestEvent.headers.set('Content-Type', 'image/svg+xml');
  requestEvent.send(200, HOME_SVG);
};
