#!/usr/bin/env node
// Byte-parity check for every AUTO-GENERATED scss/core/*.scss file this package ships
// (default-theme.scss, typography-prebuilt.scss, elevation-prebuilt.scss) — re-compiles each one
// fresh from the REAL, unmodified upstream Sass sources (same recipe + importer each generator
// script itself uses) and verifies the checked-in file is byte-identical to that output. Catches
// drift: a hand-edit of a "do not hand-edit" file, or an upstream material/cdk source change that
// the checked-in file was never regenerated against.
//
// Usage: node src/qwik-material/scripts/check-generated-scss.mjs
// (also runnable via `pnpm -C src/qwik-material check-generated-scss`)

import {readFile} from 'node:fs/promises';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
import * as sass from 'sass';

const repoRoot = path.resolve(import.meta.dirname, '../../..');
const materialIndex = path.resolve(repoRoot, 'src/material/_index.scss');
const cdkIndex = path.resolve(repoRoot, 'src/cdk/_index.scss');

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
  return sass.compileString(entry, {style: 'expanded', importers: [importer()]}).css;
}

const DEFAULT_THEME_ENTRY = `@use '@angular/material' as mat;

html {
  color-scheme: light dark;
  @include mat.theme((
    color: mat.$azure-palette,
    typography: Roboto,
    density: 0,
  ));
}
`;

const TYPOGRAPHY_ENTRY = `@use '@angular/material' as mat;

$theme: mat.define-theme((
  color: (
    primary: mat.$azure-palette,
    tertiary: mat.$azure-palette,
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

/** [checked-in file, Sass entry, header-line-count-to-skip-on-both-sides]. */
const CASES = [
  {
    file: 'src/qwik-material/scss/core/default-theme.scss',
    entry: DEFAULT_THEME_ENTRY,
  },
  {
    file: 'src/qwik-material/scss/core/typography-prebuilt.scss',
    entry: TYPOGRAPHY_ENTRY,
  },
  {
    file: 'src/qwik-material/scss/core/elevation-prebuilt.scss',
    entry: ELEVATION_ENTRY,
  },
];

/** Strips this repo's own "AUTO-GENERATED" `//`-comment header block, keeping only the compiled
 *  Sass output that follows it — the header text itself isn't part of what compile() produces. */
function stripHeader(fileText) {
  const lines = fileText.split('\n');
  let i = 0;
  while (i < lines.length && (lines[i].startsWith('//') || lines[i].trim() === '')) i++;
  return lines.slice(i).join('\n').trim();
}

let ok = true;

for (const {file, entry} of CASES) {
  const abs = path.resolve(repoRoot, file);
  const checkedIn = await readFile(abs, 'utf8').catch(() => null);
  if (checkedIn === null) {
    console.error(`FAIL missing file: ${file}`);
    ok = false;
    continue;
  }
  let fresh;
  try {
    fresh = compile(entry);
  } catch (err) {
    console.error(`ERROR compiling fresh baseline for ${file}: ${err.message}`);
    ok = false;
    continue;
  }
  const checkedInBody = stripHeader(checkedIn);
  const freshBody = fresh.trim();
  if (checkedInBody !== freshBody) {
    console.error(`FAIL ${file} is stale — differs from a fresh compile of the real upstream Sass.`);
    for (let i = 0; i < Math.min(checkedInBody.length, freshBody.length); i++) {
      if (checkedInBody[i] !== freshBody[i]) {
        console.error(`  First diff at pos ${i}:`);
        console.error(`  checked-in: ${JSON.stringify(checkedInBody.slice(Math.max(0, i - 40), i + 40))}`);
        console.error(`  fresh:      ${JSON.stringify(freshBody.slice(Math.max(0, i - 40), i + 40))}`);
        break;
      }
    }
    if (checkedInBody.length !== freshBody.length) {
      console.error(`  Length mismatch: checked-in=${checkedInBody.length} fresh=${freshBody.length}`);
    }
    ok = false;
  } else {
    console.log(`PASS ${file} matches a fresh compile of the real upstream Sass`);
  }
}

process.exit(ok ? 0 : 1);
