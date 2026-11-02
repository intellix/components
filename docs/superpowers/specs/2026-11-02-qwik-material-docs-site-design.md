# qwik-material docs site — design

**Goal:** a browsable documentation site for `@angular-community/qwik-material` / `qwik-cdk`, modelled on
https://material.angular.dev (source in this repo's `docs/`), so a team can see how to use each
component in Qwik: overview guide, live examples with source, API reference, and Angular → Qwik notes.

## Decisions

- **Where:** a new Qwik Router app in this repo, `src/qwik-material-docs/`, built as a static site
  (Qwik Router static adapter / SSG). Depends on the workspace `qwik-cdk` + `qwik-material` packages.
- **Look & navigation:** mirror material.angular.dev's information architecture (`docs/src/app/pages/`:
  homepage, component category list, component sidenav, component viewer with Overview / API /
  Examples tabs, guide list/viewer). Build the chrome with qwik-material itself (toolbar, sidenav,
  tabs, list, card, button…) — the site dogfoods the library, like the Angular site does.
- **Overview content:** adapted per component from upstream's guide `src/material/<c>/<c>.md`
  (same headings and order), with Angular-specific code/API rewritten to the real Qwik API
  (verified against each component's props and SYNC.md, never invented). Each guide's
  `<!-- example(id) -->` marker renders the Qwik port of that example live, with tabs for its
  source (`index.tsx`, CSS). Stored as Markdown (or MDX-like) files in the docs app, with a small
  build-time renderer.
- **Examples:** reuse the ported docs examples (`src/qwik-cdk-dev-app/src/routes/<c>/example*`) as
  the single source of truth — move/share them so the dev-app (parity tests) and the docs site use
  the same files. Unported examples render a clear "not yet ported" card linking to the Angular
  example on material.angular.dev.
- **API tab:** generated at build time from the TypeScript sources (props interfaces, hooks,
  exported functions/types, JSDoc, defaults) of each entry point's `public-api.ts`.
- **Angular → Qwik notes:** per component, a section summarising the API mapping and deliberate
  deviations, sourced from that component's SYNC.md (curated, not dumped).
- **Guides:** Getting started (install, prebuilt CSS, `QwikCdkRoot`/providers, Qwik v2), Theming
  (default theme, `--mat-sys-*` tokens, applying a brand theme / CMS CSS), Composing directives
  (directive hooks), Using with Formisch, Migrating from Angular Material (concept mapping table,
  MDC requirement — legacy components are not supported).
- **CDK section:** pages for the ported CDK entry points (overlay, a11y, dialog, portal, layout, …).

## Phases

1. Site shell + navigation, content pipeline (guide rendering + live example embedding + source
   tabs), API generator, guides, and three fully finished reference components (button, form-field,
   select) that set the pattern; every other component gets a page with its API tab and headline
   example.
2. Adapt the remaining component overviews and port the remaining guide-embedded examples
   (~123 of 158), in parallel batches, each example also added to the parity suite.

## Non-goals

Versioned docs, search (later), harness/testing docs (harnesses are not ported).

## Phase 1 implementation notes (2026-11-02)

Phase 1 is implemented in `src/qwik-material-docs/` (app), `src/qwik-material-examples/` (the
shared example-module package the "Examples" decision above called for), and
`src/qwik-cdk-parity-tests/specs/docs-site/` (smoke suite). See
`src/qwik-material-docs/README.md` for how to run/build/extend it. Notable deviations from the
plan as written above:

- **35 components, not 34.** The design doc's rough count was off by one — `input` is its own
  material.angular.dev component page, separate from `form-field` (verified against
  `src/qwik-material/*` — 35 entry points excluding `core`). The CDK section covers all 13 of
  `qwik-cdk`'s real entry points (`a11y`, `accordion`, `bidi`, `coercion`, `dialog`, `keycodes`,
  `layout`, `overlay`, `platform`, `portal`, `stepper`, `table`, `tree`).
- **Static build does NOT use `@qwik.dev/router`'s `ssgAdapter`.** Running any real page through
  it fails with `Code(Q14)` ("QRL can not be dynamically resolved") the instant `<QwikCdkRoot>` is
  anywhere in the tree — reproduced on a one-line `<div>Hello</div>` homepage with no other
  content, confirmed via bisection down to just `<QwikCdkRoot>`'s `useStore`/`useContextProvider`
  setup rendering a bare `<Slot/>` (every other piece — its `useVisibleTask$`, inline bootstrap
  `<script>`, `<OverlayContainerOutlet/>`, the conditional `.scss` side-effect import — individually
  disabled, still fails). An equivalent-shaped synthetic stand-in component defined inline (not
  imported from `qwik-cdk`) renders through the same SSG pipeline with no error, so this looks like
  a real, not-yet-root-caused interaction between the SSG worker's module loading and something
  specific to `qwik-cdk/root.tsx`'s own module graph — `<QwikCdkRoot>` had never been exercised
  through a true build-time SSG pass anywhere in this repo before (`qwik-cdk-dev-app` only ever
  does per-request SSR, which is unaffected). Worked around with a hand-rolled prerender script
  (`scripts/prerender.mjs`) that drives the same per-request SSR path (`createQwikRouter` Node
  middleware) `qwik-cdk-dev-app` already uses successfully, producing the identical output shape
  (static `index.html` per route under `dist/`). `vite.ssg.config.ts` is kept in the app for
  reference/documentation and in case a future `@qwik.dev/router` patch fixes the underlying issue.
- **The top Overview/API/Examples tab bar is plain `<a>` navigation styled with qwik-material's own
  `mat-mdc-tab-*` CSS classes, not a live `<MatTabNav>`/`<MatTabLink>`.** Those components own
  their entire host element and have no `href` prop (by design — see "Composing directives" in
  `qwik-material/README.md`), and this is real multi-page navigation between sibling routes, not a
  same-page panel switch. The sidenav (`ComponentNav`/`CdkNav`) and every card use real
  `<MatNavList>`/`<MatListItem as="a">`/`<MatCard>` components, which do support `href` — only the
  section-tab bar needed this compromise.
- **"Using with Formisch" links to the real, already-proven-DOM-identical
  `src/qwik-cdk-dev-app/src/routes/formisch/account/` example rather than embedding it live** — it
  needs `@formisch/qwik`/`valibot` plus `ssr.noExternal`, which the docs app doesn't otherwise
  depend on; scoped out of Phase 1 rather than widening this app's dependency surface for one guide.
- **The API JSON generator (`ts-morph`) stays at the syntax level** (prints each prop's literal
  type-annotation text) rather than resolving through the full TypeScript checker — every prop
  interface in this codebase already carries an explicit annotation, so this is both simpler (no
  need to add every dependency package to the ts-morph project to get a valid program) and a more
  faithful reference (shows exactly what a consumer writes, e.g. `QRL<(event: PointerEvent) =>
  void>`, not an expanded structural type).
