# qwik-material-docs

A documentation site for `@angular-community/qwik-cdk` / `@angular-community/qwik-material`,
modelled on [material.angular.dev](https://material.angular.dev) — browse every component and CDK
entry point, read guides, and see live Qwik examples with their real source. Built with
`@qwik.dev/router` (v2, rc.4) and dogfoods qwik-material itself for its own chrome (toolbar,
sidenav, tabs, cards, buttons, lists).

See `docs/superpowers/specs/2026-11-02-qwik-material-docs-site-design.md` for the design doc this
implements (Phase 1), and each referenced file's own header comment for the deeper "why."

## Run it

```bash
# from the repo root, after a normal `pnpm install`
pnpm -C src/qwik-material-docs dev          # dev server (http://localhost:5173 by default)
pnpm -C src/qwik-material-docs build        # full static build (see "Build pipeline" below)
pnpm -C src/qwik-material-docs preview      # serves dist/ on :4195 (vite preview --strictPort)
```

`dev`/`build` both run `pnpm run generate` first (see below) — never hand-edit anything under
`src/generated/`, it's rebuilt every time.

## Build pipeline

`pnpm build` runs, in order:

1. **`generate`** — two Node scripts that turn source into data the site reads at build time:
   - `scripts/generate-api.mjs`: scans every qwik-material/qwik-cdk entry point's `public-api.ts`
     with `ts-morph` (TypeScript compiler API) and writes one JSON file per entry point into
     `src/generated/api/` — components (props: name/type/optional/JSDoc), hooks, functions,
     exported types, constants. Consumed by `lib/api-registry.ts`.
   - `scripts/generate-examples-source.mjs`: Shiki-highlights every file in every
     `src/qwik-material-examples/<pkg>/<route>/` module and writes one JSON bundle per example
     into `src/generated/examples/` — the "View code" source panel's data. Consumed (lazily, one
     file at a time) by `lib/example-registry.ts`.
2. **`build.client`** (`vite build`) — the client JS/CSS bundle.
3. **`build.ssr`** (`vite build --ssr src/entry.ssr.tsx`) — the SSR render function.
4. **`build.preview`** (`vite build --ssr src/entry.preview.tsx`) — a Node `createQwikRouter`
   middleware bundle, same pattern `src/qwik-cdk-dev-app` already uses for its own preview.
5. **`prerender`** (`scripts/prerender.mjs`) — starts that Node middleware on a throwaway local
   port, requests every static route the site has, and writes each response body to
   `dist/<route>/index.html`. **This replaces `@qwik.dev/router`'s own `ssgAdapter`**
   (`vite.ssg.config.ts`, kept for reference but unused by `build`) — running real pages through
   the stock adapter fails every one with `Code(Q14)` the moment `<QwikCdkRoot>` is in the tree;
   see `scripts/prerender.mjs`'s header comment for the full bisection writeup. The output shape
   is identical to what the adapter would have produced (static HTML per route inside `dist/`,
   alongside the client build's JS/CSS/assets), so `vite preview` serves it exactly the same way.

After `build`, `dist/` is a fully static site — serve it with anything (`vite preview`, `npx
serve dist`, any CDN/static host).

## Adding content

- **A new component page**: add an entry to `src/data/components.ts` (id, category, summary,
  `devAppId`, `entryPoint`). The API tab and the headline-example Examples tab work immediately
  (as long as the component has a `src/qwik-material-examples/<pkg>/example` module and a
  `PORTED_EXAMPLES` entry in `src/data/examples-map.ts`); the Overview tab shows the "being
  adapted" placeholder until you add Markdown.
- **A fully adapted Overview guide**: write `src/content/overviews/<id>.md` (same headings/order
  as the upstream `src/material/<id>/<id>.md`, with every Angular API rewritten to the real,
  *verified* qwik-material prop/hook — never invented), ending in its own `## Angular → Qwik
  notes` section curated from that component's `SYNC.md`. Add the `?raw` import + registry entry
  in `src/content/overview-registry.ts`. Use `<!-- example(upstream-id) -->` (upstream's own
  marker syntax) anywhere you want a live example embedded — ported ones render live with a "View
  code" toggle; everything else renders a "not yet ported" placeholder linking to the real
  Angular example automatically (`components/example-embed.tsx`), no extra wiring needed.
- **A new ported example**: add a module at `src/qwik-material-examples/<pkg>/<route>/index.tsx`
  (see that package's own files for the pattern — a single top-level custom host tag mirroring the
  upstream example component's selector), add it to that package's `package.json` `exports`, add
  an entry to `src/data/examples-map.ts`'s `PORTED_EXAMPLES`, and add the two matching import
  lines (component + generated source) to `src/lib/example-registry.ts`. Also update
  `src/qwik-cdk-dev-app/src/routes/<devAppId>/<route>/index.tsx` to import it (the thin-wrapper
  pattern — see any existing route there) so the parity suite keeps covering it.
- **A new guide**: add to `src/data/guides.ts`, write `src/content/guides/<id>.md`, add the `?raw`
  import + registry entry in `src/content/guide-registry.ts`.

Whenever you add a route segment that didn't exist before, also update
`scripts/prerender.mjs`'s `COMPONENT_IDS`/`CDK_IDS`/`GUIDE_IDS` lists (and the matching lists in
`scripts/generate-api.mjs` and `src/qwik-cdk-parity-tests/specs/docs-site/smoke.spec.ts`) — they're
intentionally small, duplicated, plain-JS lists (same pattern already used across this repo's build
scripts) rather than a shared TypeScript import, so these scripts don't need a TS loader.

## Testing

```bash
# Playwright smoke suite (every page: console errors, live examples render)
pnpm -C src/qwik-material-docs build
pnpm -C src/qwik-material-docs preview &   # :4195
cd src/qwik-cdk-parity-tests && npx playwright test specs/docs-site

# qwik-material unit tests (unaffected by this app)
pnpm -C src/qwik-material exec vitest run

# Full DOM-parity suite (examples restructuring must stay green)
ANGULAR_URL=http://localhost:4201 QWIK_URL=http://localhost:<dev-app preview port> \
  npx playwright test --workers=4 --timeout=30000 -- src/qwik-cdk-parity-tests
```

## Known Phase 1 limitations

- Only each component's **headline** example is ported (`src/qwik-material-examples/*/example`);
  every other `<!-- example(...) -->` marker in an adapted Overview guide renders the "not yet
  ported" placeholder. Phase 2 ports the rest.
- Only **button**, **form-field**, and **select** have a fully adapted Overview guide; every other
  component's Overview tab shows "Overview being adapted" with a link to the real Angular guide.
- CDK entry points get a short description + generated API reference, not a full adapted guide.
- The "Using with Formisch" guide links to the real, live `/formisch/account/` example in
  `src/qwik-cdk-dev-app` rather than embedding it inline (it needs `@formisch/qwik`/`valibot`,
  which this app doesn't depend on — keeping the dependency surface and the
  `ssr.noExternal`/bundling concerns scoped to the one app that actually needs them).
- `vite.ssg.config.ts` (the stock `ssgAdapter` path) is unused — see "Build pipeline" above.
