#!/usr/bin/env node
// Regenerates scss/core/default-theme.scss from upstream's real Sass theming
// API (`mat.theme()`), so the one-default-theme qwik-material ships is never
// hand-written. See core/SYNC.md "Default theme" entry and the design spec
// referenced there for why this exists.
//
// Usage: node src/qwik-material/scripts/generate-default-theme.mjs
// (also runnable via `pnpm -C src/qwik-material generate-default-theme`)
//
// What it does: compiles a tiny entry Sass string that `@use`s
// `@angular/material` (resolved, via a custom file importer below, straight
// to this repo's `src/material/_index.scss` — there is no published/built
// `@angular/material` package in node_modules here) and calls
//
//   @include mat.theme((
//     color: mat.$azure-palette,
//     typography: Roboto,
//     density: 0,
//   ));
//
// on `html`, exactly matching the recipe in `guides/theming.md`'s "Getting
// Started" section (swapping violet for azure — azure is Angular's own
// documented default palette, and what the Angular dev-app's
// `demo-experimental-theme` variant uses — see `src/dev-app/theme-m3.scss`).
// `color-scheme: light dark;` is added alongside the mixin call, matching
// that same guide example: azure-palette-alone has no explicit `theme-type`,
// so `mat.theme()` defaults it to `color-scheme` and emits every color
// token as `light-dark(<light>, <dark>)`, which only switches with the
// user's OS preference once something sets the CSS `color-scheme` property
// (the mixin itself never emits that property; the guide sets it manually).
//
// The compiled output is a flat `html { --mat-sys-*: ...; }` block; see
// `scss/core/default-theme.scss`'s own header for how it's consumed.

import * as sass from 'sass';
import {pathToFileURL} from 'node:url';
import {writeFile} from 'node:fs/promises';
import path from 'node:path';

const repoRoot = path.resolve(import.meta.dirname, '../../..');
const materialIndex = path.resolve(repoRoot, 'src/material/_index.scss');
const cdkIndex = path.resolve(repoRoot, 'src/cdk/_index.scss');
const outFile = path.resolve(repoRoot, 'src/qwik-material/scss/core/default-theme.scss');

const ENTRY = `@use '@angular/material' as mat;

html {
  color-scheme: light dark;
  @include mat.theme((
    color: mat.\$azure-palette,
    typography: Roboto,
    density: 0,
  ));
}
`;

function importer() {
  return {
    findFileUrl(url) {
      if (url === '@angular/material') return pathToFileURL(materialIndex);
      if (url === '@angular/cdk') return pathToFileURL(cdkIndex);
      return null;
    },
  };
}

function main() {
  const result = sass.compileString(ENTRY, {
    style: 'expanded',
    importers: [importer()],
    logger: {
      warn(message, options) {
        // Surface upstream deprecation warnings (if any) without failing —
        // they're upstream's concern, not something to silently swallow.
        console.warn(
          `[generate-default-theme] ${options?.deprecation ? 'deprecation: ' : ''}${message}`,
        );
      },
    },
  });

  const header = `// AUTO-GENERATED — do not hand-edit.
// Regenerate with: node scripts/generate-default-theme.mjs (from src/qwik-material/)
//
// Compiled from upstream's real .scss sources (src/material/core/tokens/_system.scss's
// \`mat.theme()\` mixin) via the Sass entry below — see generate-default-theme.mjs for the
// full explanation and the importer that resolves \`@angular/material\`/\`@angular/cdk\` to
// this repo's src/material/src/cdk (there is no built @angular/material package here):
//
//   @use '@angular/material' as mat;
//
//   html {
//     color-scheme: light dark;
//     @include mat.theme((
//       color: mat.$azure-palette,
//       typography: Roboto,
//       density: 0,
//     ));
//   }
//
// This is qwik-material's ONE shipped default theme (see core/SYNC.md). It is scoped to
// \`html\` — Angular's own recommended theme scope (guides/theming.md) — specifically so a
// consumer theme declared on \`html\`, \`body\`, or any class overrides it: CSS custom
// properties resolve at the element where they're declared, and a later/more-specific rule
// setting the same --mat-sys-* custom property on html (or an ancestor/self of the themed
// subtree) wins over this file's declarations for any element inside it.
`;

  return writeFile(outFile, header + '\n' + result.css + '\n', 'utf8');
}

await main();
console.log(`Wrote ${path.relative(repoRoot, outFile)}`);
