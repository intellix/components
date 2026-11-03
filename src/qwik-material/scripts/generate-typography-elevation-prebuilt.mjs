#!/usr/bin/env node
// Regenerates scss/core/typography-prebuilt.scss and scss/core/elevation-prebuilt.scss from
// upstream's real Sass theming API (`mat.typography-hierarchy()` / `mat.elevation-classes()`),
// so neither is ever hand-written — same convention generate-default-theme.mjs already
// established for scss/core/default-theme.scss. See core/SYNC.md's "Typography + elevation
// classes" entry.
//
// Usage: node src/qwik-material/scripts/generate-typography-elevation-prebuilt.mjs
// (also runnable via `pnpm -C src/qwik-material generate-typography-elevation-prebuilt`)
//
// What it does: compiles two tiny entry Sass strings that `@use` `@angular/material` (resolved,
// via the same custom file importer generate-default-theme.mjs uses, straight to this repo's
// `src/material/_index.scss` — there is no published/built `@angular/material` package in
// node_modules here).
//
// Typography: `mat.typography-hierarchy($theme, '.mat-typography', true)` needs a real THEME
// OBJECT (as `mat.define-theme()` returns), not the plain config map `mat.theme()` itself takes
// — `get-theme-typography()` reads typography values straight out of that object's internal
// `typography-tokens` map, which by DEFAULT holds LITERAL font values, not CSS variable
// references (`sass-utils.$use-system-typography-variables` defaults false). Passing
// `use-system-variables: true` in the typography config switches every value to
// `var(--mat-sys-<token>)` instead — the SAME `--mat-sys-*` custom properties `mat.theme()`
// itself emits (confirmed by compiling and comparing token names against
// scss/core/default-theme.scss's own `--mat-sys-title-large`/etc. declarations) — which is what
// keeps these classes theme-reactive instead of frozen at generation time. `true` for
// `$back-compat` (the mixin's 3rd positional arg) additionally emits the M2-era class aliases
// this port's consumers may still use (`.mat-h1`...`.mat-h6`, `.mat-headline-1`...`.mat-headline-6`,
// `.mat-body`/`.mat-body-strong`/`.mat-body-2`, `.mat-small`/`.mat-caption`), alongside the M3
// names (`.mat-display-large`, `.mat-headline-large`, `.mat-title-large`, `.mat-body-large`, …)
// and bare `h1`...`h6`/`p` selectors scoped under `.mat-typography`.
//
// Elevation: `mat.elevation-classes()` takes NO theme argument at all — its `box-shadow`
// fallback values are computed once, at Sass-compile-time, from `m3.$sys-theme` (upstream's own
// hardcoded "every value is its own CSS variable name" default map), independent of whatever
// theme an app actually uses. This means `.mat-elevation-z*`'s shadow COLOR stays fixed
// (`--mat-sys-shadow`'s resolved color at generation time) rather than tracking a live theme —
// upstream's own behavior, not something this port invents or could change by picking a
// different `$theme` input (there is no theme input to pick).
//
// KNOWN UPSTREAM QUIRK, reproduced faithfully (not fixed): `elevation.get-box-shadow()`'s
// internal `_compute-color-opacity()` only wraps a shadow color in `rgba(...)` when
// `meta.type-of($color) == color`; `m3.$sys-theme`'s `shadow` entry is the bare STRING
// `--mat-sys-shadow` (every value in that map is intentionally its own unwrapped CSS variable
// NAME, not a color — see tokens/m3/_theme.scss's `_create-system-app-vars-map`), so it's typeof
// "string", not "color", and is emitted completely unwrapped — e.g.
// `box-shadow: var(--mat-app-elevation-shadow-level-4, 0px 2px 4px -1px --mat-sys-shadow, ...)`.
// `--mat-sys-shadow` appears bare (not `var(--mat-sys-shadow)`) inside that fallback list — this
// is REAL, unmodified upstream `src/material/core/style/_elevation.scss`/`_m3-app.scss` output
// for ANY consumer calling `mat.elevation-classes()` with no further `--mat-app-elevation-
// shadow-level-*` overrides (which is the common case — `mat.theme()` never sets those), verified
// by compiling the real upstream mixins unmodified. See the Theming guide + core/SYNC.md for what
// this means for the rendered computed style (verified against a real browser, not just the Sass
// output) — `--mat-app-elevation-shadow-level-*` itself, not the invalid-looking tail of its
// fallback, is what actually matters once real token overrides are involved.

import * as sass from 'sass';
import {pathToFileURL} from 'node:url';
import {writeFile} from 'node:fs/promises';
import path from 'node:path';

const repoRoot = path.resolve(import.meta.dirname, '../../..');
const materialIndex = path.resolve(repoRoot, 'src/material/_index.scss');
const cdkIndex = path.resolve(repoRoot, 'src/cdk/_index.scss');
const typographyOutFile = path.resolve(
  repoRoot,
  'src/qwik-material/scss/core/typography-prebuilt.scss',
);
const elevationOutFile = path.resolve(
  repoRoot,
  'src/qwik-material/scss/core/elevation-prebuilt.scss',
);
// Plain-CSS copy for the Angular reference mirror (src/dev-app/qwik-parity/core.ts) — same
// generated text, so the Qwik side (which loads typography-prebuilt.css/elevation-prebuilt.css
// verbatim) and the Angular side are guaranteed byte-identical inputs by construction, never
// just "should match". See core.ts's own header comment.
const devAppOutFile = path.resolve(
  repoRoot,
  'src/dev-app/qwik-parity/typography-elevation.generated.css',
);

const TYPOGRAPHY_ENTRY = `@use '@angular/material' as mat;

$theme: mat.define-theme((
  color: (
    primary: mat.\$azure-palette,
    tertiary: mat.\$azure-palette,
    theme-type: color-scheme,
  ),
  typography: (
    plain-family: Roboto,
    use-system-variables: true,
  ),
  density: (
    scale: 0,
  ),
));

@include mat.typography-hierarchy($theme, '.mat-typography', true);
`;

const ELEVATION_ENTRY = `@use '@angular/material' as mat;

@include mat.elevation-classes();
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

function compile(entry) {
  return sass.compileString(entry, {
    style: 'expanded',
    importers: [importer()],
    logger: {
      warn(message, options) {
        console.warn(
          `[generate-typography-elevation-prebuilt] ${options?.deprecation ? 'deprecation: ' : ''}${message}`,
        );
      },
    },
  }).css;
}

async function main() {
  const typographyCss = compile(TYPOGRAPHY_ENTRY);
  const elevationCss = compile(ELEVATION_ENTRY);

  const typographyHeader = `// AUTO-GENERATED — do not hand-edit.
// Regenerate with: node scripts/generate-typography-elevation-prebuilt.mjs (from src/qwik-material/)
//
// Compiled from upstream's real .scss sources (src/material/core/typography/_typography.scss's
// \`mat.typography-hierarchy()\` mixin) via the Sass entry below — see
// generate-typography-elevation-prebuilt.mjs for the full explanation:
//
//   @use '@angular/material' as mat;
//
//   $theme: mat.define-theme((
//     color: (primary: mat.$azure-palette, tertiary: mat.$azure-palette, theme-type: color-scheme),
//     typography: (plain-family: Roboto, use-system-variables: true),
//     density: (scale: 0),
//   ));
//
//   @include mat.typography-hierarchy($theme, '.mat-typography', true);
//
// Ships as the opt-in \`typography-prebuilt.css\` export (see package.json \`exports\` and the
// Theming guide) — NOT included in core-prebuilt.css, matching upstream's own "typography classes
// are opt-in" contract (\`mat.typography-hierarchy()\` is never called by \`mat.theme()\` itself).
`;

  const elevationHeader = `// AUTO-GENERATED — do not hand-edit.
// Regenerate with: node scripts/generate-typography-elevation-prebuilt.mjs (from src/qwik-material/)
//
// Compiled from upstream's real .scss sources (src/material/core/_core.scss's
// \`mat.elevation-classes()\` mixin, which takes no theme argument — see that script's own doc
// comment for the exact entry and the upstream \`--mat-sys-shadow\`-in-fallback quirk this
// faithfully reproduces) via:
//
//   @use '@angular/material' as mat;
//
//   @include mat.elevation-classes();
//
// Ships as the opt-in \`elevation-prebuilt.css\` export (see package.json \`exports\` and the
// Theming guide) — NOT included in core-prebuilt.css, matching upstream's own "elevation classes
// are opt-in" contract (\`mat.theme()\` never calls \`mat.elevation-classes()\` itself).
`;

  await writeFile(typographyOutFile, typographyHeader + '\n' + typographyCss + '\n', 'utf8');
  await writeFile(elevationOutFile, elevationHeader + '\n' + elevationCss + '\n', 'utf8');

  const devAppHeader = `/* AUTO-GENERATED — do not hand-edit.
   Regenerate with: node src/qwik-material/scripts/generate-typography-elevation-prebuilt.mjs
   Plain-CSS concatenation of qwik-material's typography-prebuilt.css + elevation-prebuilt.css —
   see this repo's qwik-material/core/SYNC.md "Typography + elevation classes" entry and
   core.ts's own header comment for why the Angular mirror page loads THIS file verbatim rather
   than re-deriving the same rules via its own \`@include mat.typography-hierarchy(...)\`/
   \`@include mat.elevation-classes();\` (byte-identical input by construction, not by trusting
   two independently-written recipes to stay in sync). */
`;
  await writeFile(
    devAppOutFile,
    devAppHeader + '\n' + typographyCss + '\n' + elevationCss + '\n',
    'utf8',
  );
}

await main();
console.log(`Wrote ${path.relative(repoRoot, typographyOutFile)}`);
console.log(`Wrote ${path.relative(repoRoot, elevationOutFile)}`);
console.log(`Wrote ${path.relative(repoRoot, devAppOutFile)}`);
