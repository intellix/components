#!/usr/bin/env node
/**
 * Byte-diff test: verifies that src/qwik-cdk/dist/*-prebuilt.css matches
 * the CSS produced by compiling @angular/cdk's SCSS sources directly.
 *
 * Option A (compile-from-source baseline): instead of reading a pre-built
 * dist/releases/cdk/ artifact (which requires a full `pnpm build`), this
 * script compiles the CDK SCSS sources in-place using the same sass.compile()
 * call that the Vite plugin uses.  Both sides are compiled with
 * { style: 'expanded' }, making the comparison apples-to-apples.
 */
import {readFile} from 'node:fs/promises';
import {resolve, dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
import {createRequire} from 'node:module';

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(__dirname, '../../..');

// Use createRequire so sass resolves from the qwik-cdk node_modules tree.
const require = createRequire(import.meta.url);
const sass = require('sass');

/**
 * Each entry: [CDK source SCSS path, qwik-cdk dist CSS path]
 * Both paths are relative to the repo root.
 */
const pairs = [
  ['src/cdk/overlay/overlay-prebuilt.scss', 'src/qwik-cdk/dist/overlay-prebuilt.css'],
  ['src/cdk/a11y/a11y-prebuilt.scss', 'src/qwik-cdk/dist/a11y-prebuilt.css'],
  ['src/cdk/text-field/text-field-prebuilt.scss', 'src/qwik-cdk/dist/text-field-prebuilt.css'],
];

/** Strip copyright/license/sourcemap comment blocks then collapse whitespace. */
const STRIP_RE = /\/\*[\s\S]*?(?:Copyright|@license|sourceMappingURL)[\s\S]*?\*\/\s*/g;
function normalize(src) {
  return src.replace(STRIP_RE, '').replace(/\s+/g, ' ').trim();
}

let ok = true;

for (const [cdkScssRel, qwikCssRel] of pairs) {
  const cdkScssPath = resolve(repoRoot, cdkScssRel);
  const qwikCssPath = resolve(repoRoot, qwikCssRel);

  // Compile CDK source SCSS as the baseline.
  let baseline;
  try {
    const result = sass.compile(cdkScssPath, {style: 'expanded'});
    baseline = result.css;
  } catch (err) {
    console.error(`ERROR: could not compile CDK baseline ${cdkScssRel}: ${err.message}`);
    ok = false;
    continue;
  }

  // Read the qwik-cdk prebuilt dist CSS.
  const qwikCSS = await readFile(qwikCssPath, 'utf8').catch(() => null);
  if (qwikCSS === null) {
    console.error(`Missing qwik output: ${qwikCssRel}. Run \`pnpm -C src/qwik-cdk build\` first.`);
    ok = false;
    continue;
  }

  const normBaseline = normalize(baseline);
  const normQwik = normalize(qwikCSS);

  if (normBaseline !== normQwik) {
    console.error(`FAIL CSS diverges: ${qwikCssRel} != compiled(${cdkScssRel})`);
    // Emit a short character-level diff hint.
    for (let i = 0; i < Math.min(normBaseline.length, normQwik.length); i++) {
      if (normBaseline[i] !== normQwik[i]) {
        console.error(`  First diff at pos ${i}:`);
        console.error(
          `  baseline: ${JSON.stringify(normBaseline.slice(Math.max(0, i - 40), i + 40))}`,
        );
        console.error(`  qwik-cdk: ${JSON.stringify(normQwik.slice(Math.max(0, i - 40), i + 40))}`);
        break;
      }
    }
    if (normBaseline.length !== normQwik.length) {
      console.error(`  Length mismatch: baseline=${normBaseline.length} qwik=${normQwik.length}`);
    }
    ok = false;
  } else {
    console.log(`PASS ${qwikCssRel} matches compiled(${cdkScssRel})`);
  }
}

process.exit(ok ? 0 : 1);
