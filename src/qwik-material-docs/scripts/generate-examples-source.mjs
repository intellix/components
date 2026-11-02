#!/usr/bin/env node
/**
 * Build-time "View code" source generator. Walks every `src/qwik-material-examples/<pkg>/<route>`
 * module (the single source of truth also imported live by `<ExampleEmbed>` and by
 * `qwik-cdk-dev-app`'s thin wrapper routes), Shiki-highlights each of its files, and writes one
 * JSON file per example into `src/generated/examples/`. Pre-generating this avoids needing `fs` or
 * an async Shiki call inside any component — `<ExampleEmbed>` just imports the JSON like any other
 * static data.
 *
 * Run via `pnpm run generate:examples-source` (wired into this app's `dev`/`build` scripts).
 */
import {createHighlighter} from 'shiki';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const EXAMPLES_ROOT = path.resolve(__dirname, '../../qwik-material-examples');
const OUT_DIR = path.join(__dirname, '../src/generated/examples');

const LANG_BY_EXT = {'.tsx': 'tsx', '.ts': 'tsx', '.css': 'css'};

function listExampleDirs() {
  const entries = [];
  for (const pkg of fs.readdirSync(EXAMPLES_ROOT, {withFileTypes: true})) {
    if (!pkg.isDirectory() || pkg.name === 'node_modules') continue;
    const pkgDir = path.join(EXAMPLES_ROOT, pkg.name);
    for (const route of fs.readdirSync(pkgDir, {withFileTypes: true})) {
      if (!route.isDirectory()) continue;
      entries.push({pkg: pkg.name, route: route.name, dir: path.join(pkgDir, route.name)});
    }
  }
  return entries;
}

async function main() {
  const highlighter = await createHighlighter({
    themes: ['github-light', 'github-dark'],
    langs: ['tsx', 'css'],
  });

  fs.mkdirSync(OUT_DIR, {recursive: true});

  const entries = listExampleDirs();
  for (const {pkg, route, dir} of entries) {
    const files = fs
      .readdirSync(dir)
      .filter(f => /\.(tsx|ts|css)$/.test(f))
      .sort((a, b) => (a === 'index.tsx' ? -1 : b === 'index.tsx' ? 1 : a.localeCompare(b)))
      .map(name => {
        const ext = path.extname(name);
        const lang = LANG_BY_EXT[ext] ?? 'text';
        const code = fs.readFileSync(path.join(dir, name), 'utf8');
        const html = highlighter.codeToHtml(code, {
          lang,
          themes: {light: 'github-light', dark: 'github-dark'},
          defaultColor: false,
        });
        return {name, lang, code, html};
      });

    fs.writeFileSync(
      path.join(OUT_DIR, `${pkg}__${route}.json`),
      JSON.stringify({pkg, route, files}, null, 2),
    );
  }

  console.log(`Generated highlighted source for ${entries.length} examples -> ${path.relative(process.cwd(), OUT_DIR)}`);
}

main();
