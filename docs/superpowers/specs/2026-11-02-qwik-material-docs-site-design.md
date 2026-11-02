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
