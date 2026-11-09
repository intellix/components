#!/usr/bin/env node
/**
 * Hand-rolled static-site generator.
 *
 * Why not `@qwik.dev/router`'s own `ssgAdapter` (the documented, normal way to do this —
 * `vite.ssg.config.ts` in this directory still shows that setup)? Confirmed via extensive
 * bisection (disabling, one at a time, every piece of `<QwikCdkRoot>`'s render body — its
 * `useVisibleTask$`, its inline bootstrap `<script>`, `<OverlayContainerOutlet/>`, the
 * conditional `overlay-structure.scss` side-effect import — down to just its
 * `useStore`/`useContextProvider` setup rendering a bare `<Slot/>`): running this site's pages
 * through the `ssgAdapter`'s worker-based crawler fails EVERY page with `Code(Q14)` ("QRL can not
 * be dynamically resolved, because it does not have a chunk path") the moment `<QwikCdkRoot>` is
 * anywhere in the tree — reproducible even on the plainest possible page (a bare `<div>Hello</div>`
 * homepage, no `<SiteHeader>`, no component content at all). A synthetic stand-in component with
 * an equivalent shape (context + store + `useVisibleTask$` + cleanup + inline `<script>` + `<Slot/>`),
 * defined inline rather than imported from `qwik-cdk`, renders through the SAME SSG pipeline with
 * no error — so this looks like a real interaction between the SSG worker's module-loading and
 * something specific to `qwik-cdk/root.tsx`'s actual module graph (not yet root-caused further;
 * `<QwikCdkRoot>` has never been exercised through a true SSG build anywhere else in this repo —
 * `qwik-cdk-dev-app` only ever does per-request SSR, which is unaffected, see below).
 *
 * The workaround: this script drives the SAME per-request SSR path `qwik-cdk-dev-app` already
 * uses successfully (`entry.preview.tsx`'s `createQwikRouter` Node middleware) against every
 * static route this site has, and writes each response body to `dist/<route>/index.html` —
 * exactly the output shape `ssgAdapter` would have produced, servable the same way
 * (`vite preview`, or any static file server). Run via `pnpm run prerender` (wired into `build`).
 */
import {createServer} from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const DIST = path.join(ROOT, 'dist');
const PORT = 48193; // throwaway, loopback-only, not one of this repo's reserved docs ports.
// Site base path (Vite's `base`, from `DOCS_BASE`): routes are served under it, while files are
// written relative to `dist/` (a static host serves `dist/` itself at the base path).
const BASE = (process.env.DOCS_BASE ?? '/').replace(/\/?$/, '/');

// Keep these three lists in sync with `src/data/{components,cdk,guides}.ts` (duplicated here,
// same pattern as `scripts/generate-api.mjs`'s own entry-point lists, to avoid needing a
// TypeScript loader for this plain-`.mjs` build script).
const COMPONENT_IDS = [
  'autocomplete', 'badge', 'bottom-sheet', 'button', 'button-toggle', 'card', 'checkbox', 'chips',
  'datepicker', 'dialog', 'divider', 'expansion', 'form-field', 'grid-list', 'icon', 'input',
  'list', 'menu', 'paginator', 'progress-bar', 'progress-spinner', 'radio', 'select', 'sidenav',
  'slide-toggle', 'slider', 'snack-bar', 'sort', 'stepper', 'table', 'tabs', 'timepicker',
  'toolbar', 'tooltip', 'tree',
];
const CDK_IDS = [
  'a11y', 'accordion', 'bidi', 'clipboard', 'coercion', 'collections', 'dialog', 'keycodes',
  'layout', 'overlay', 'platform', 'portal', 'scrolling', 'stepper', 'table', 'text-field', 'tree',
];
const GUIDE_IDS = [
  'getting-started', 'theming', 'composing-directives', 'using-with-formisch',
  'migrating-from-angular-material',
];

function buildRouteList() {
  const routes = ['/', '/components/', '/cdk/', '/guide/'];
  for (const id of COMPONENT_IDS) {
    for (const tab of ['overview', 'api', 'examples']) {
      routes.push(`/components/${id}/${tab}/`);
    }
  }
  for (const id of CDK_IDS) {
    for (const tab of ['overview', 'api']) {
      routes.push(`/cdk/${id}/${tab}/`);
    }
  }
  for (const id of GUIDE_IDS) {
    routes.push(`/guide/${id}/`);
  }
  return routes;
}

/** `/components/<id>/` and `/cdk/<id>/` redirect to their Overview tab via an `onGet` handler,
 *  which only exists under SSR — a static host has no server to run it, so without a file there
 *  it falls back to the homepage. Write a meta-refresh page in its place instead. */
function writeRedirectStubs() {
  const stubs = [
    ...COMPONENT_IDS.map(id => `/components/${id}/`),
    ...CDK_IDS.map(id => `/cdk/${id}/`),
  ];
  for (const route of stubs) {
    const target = `${BASE}${route.slice(1)}overview/`;
    const file = routeToFile(route);
    fs.mkdirSync(path.dirname(file), {recursive: true});
    fs.writeFileSync(
      file,
      `<!doctype html><html lang="en"><head><meta charset="utf-8">` +
        `<title>Redirecting…</title><link rel="canonical" href="${target}">` +
        `<meta http-equiv="refresh" content="0; url=${target}">` +
        `<script>location.replace(${JSON.stringify(target)} + location.hash)</script>` +
        `</head><body><a href="${target}">Continue to the overview</a></body></html>\n`,
    );
  }
  return stubs.length;
}

function routeToFile(route) {
  const trimmed = route.replace(/^\//, '').replace(/\/$/, '');
  return trimmed === '' ? path.join(DIST, 'index.html') : path.join(DIST, trimmed, 'index.html');
}

async function main() {
  const {default: middleware} = await import(path.join(ROOT, 'server/entry.preview.js'));

  const server = createServer((req, res) => {
    middleware.router(req, res, err => {
      res.statusCode = 500;
      res.end(String(err));
    });
  });

  await new Promise(resolve => server.listen(PORT, '127.0.0.1', resolve));

  const routes = buildRouteList();
  let ok = 0;
  const failures = [];

  for (const route of routes) {
    const url = `http://127.0.0.1:${PORT}${BASE}${route.slice(1)}`;
    try {
      const res = await fetch(url);
      const html = await res.text();
      if (res.status !== 200 || !html.includes('<html')) {
        failures.push(`${route} -> HTTP ${res.status}`);
        continue;
      }
      const file = routeToFile(route);
      fs.mkdirSync(path.dirname(file), {recursive: true});
      fs.writeFileSync(file, html);
      ok++;
    } catch (err) {
      failures.push(`${route} -> ${err.message}`);
    }
  }

  console.log(`Prerendered ${ok}/${routes.length} routes, ${writeRedirectStubs()} redirect stubs.`);
  if (failures.length > 0) {
    console.error(`${failures.length} failure(s):`);
    for (const f of failures) console.error(' -', f);
    process.exitCode = 1;
  }

  // `server.close()` only resolves once every open socket closes on its own — `fetch()`'s
  // keep-alive connections can sit idle well past that, which silently hung this script for
  // minutes past the real work finishing (confirmed live: all 140 routes written, process still
  // "running" per the OS with flat CPU time). `closeAllConnections()` (Node >=18.2) forces them
  // shut immediately; the explicit `process.exit()` below is the actual guarantee this process
  // ends promptly either way.
  server.closeAllConnections?.();
  server.close();
  process.exit(process.exitCode ?? 0);
}

main();
