#!/usr/bin/env node
/**
 * Re-vendors freshly packed qwik-cdk / qwik-material tarballs into an app that installs them
 * from its own `vendor/` folder (`"file:./vendor/….tgz"` dependencies):
 *
 *   pnpm -C src/qwik-material vendor:local <app-dir> [--commit]
 *
 * 1. Builds and packs both packages (`pack-local.mjs`).
 * 2. Copies the tarballs over `<app-dir>/vendor/*.tgz`.
 * 3. Replaces the previously vendored commit hash (full and 10-character short form) with this
 *    repository's HEAD in `vendor/README.md` and any top-level `*.md` that mentions it.
 * 4. Runs `pnpm install` in the app, so its lockfile picks up the new tarball integrity.
 * 5. With `--commit`, commits ONLY the files this script changed (via a pathspec, so anything
 *    else the app has staged or modified is left alone) — and refuses to if any of those files
 *    already had uncommitted changes before it ran.
 */
import {execFileSync, execSync} from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const args = process.argv.slice(2);
const commit = args.includes('--commit');
const appDir = args.find(a => !a.startsWith('--'));
if (!appDir) {
  console.error('Usage: vendor-local.mjs <app-dir> [--commit]');
  process.exit(1);
}
const app = path.resolve(appDir);
const vendorDir = path.join(app, 'vendor');
if (!fs.existsSync(vendorDir)) {
  console.error(
    `${vendorDir} doesn't exist — this script only refreshes an existing vendor/ folder.`,
  );
  process.exit(1);
}

const here = path.dirname(fileURLToPath(import.meta.url));
const repo = execSync('git rev-parse --show-toplevel', {cwd: here}).toString().trim();
const head = execSync('git rev-parse HEAD', {cwd: repo}).toString().trim();
const git = (...gitArgs) => execFileSync('git', gitArgs, {cwd: app}).toString();
const dirty = file => git('status', '--porcelain', '--', file).trim() !== '';

// Files this script may change, and whether each was already modified before it ran.
const docs = fs
  .readdirSync(app)
  .filter(f => f.endsWith('.md'))
  .map(f => path.join(app, f));
const vendorReadme = path.join(vendorDir, 'README.md');
if (fs.existsSync(vendorReadme)) docs.unshift(vendorReadme);
const lockfile = path.join(app, 'pnpm-lock.yaml');
const tarballs = [
  'angular-community-qwik-cdk-0.0.0.tgz',
  'angular-community-qwik-material-0.0.0.tgz',
];
const candidates = [...tarballs.map(t => path.join(vendorDir, t)), lockfile, ...docs];
const preDirty = candidates.filter(f => fs.existsSync(f) && dirty(f));

// 1. Pack.
const out = fs.mkdtempSync(path.join(os.tmpdir(), 'qwik-packages-'));
execFileSync('node', [path.join(here, 'pack-local.mjs'), out], {stdio: 'inherit'});

// 2. Copy.
for (const t of tarballs) fs.copyFileSync(path.join(out, t), path.join(vendorDir, t));

// 3. Update the recorded commit.
const previous = fs.existsSync(vendorReadme)
  ? fs.readFileSync(vendorReadme, 'utf8').match(/\b[0-9a-f]{40}\b/)?.[0]
  : undefined;
if (previous && previous !== head) {
  for (const doc of docs) {
    const text = fs.readFileSync(doc, 'utf8');
    const next = text
      .replaceAll(previous, head)
      .replaceAll(previous.slice(0, 10), head.slice(0, 10));
    if (next !== text) fs.writeFileSync(doc, next);
  }
}

// 4. Install.
execSync('pnpm install --prefer-offline', {cwd: app, stdio: 'inherit'});

const changed = candidates.filter(f => fs.existsSync(f) && dirty(f));
console.log(`\nVendored ${repo} @ ${head.slice(0, 10)} into ${app}.`);
console.log(`Changed: ${changed.map(f => path.relative(app, f)).join(', ') || 'nothing'}`);

// 5. Commit.
if (commit && changed.length > 0) {
  const conflicting = changed.filter(f => preDirty.includes(f));
  if (conflicting.length > 0) {
    console.error(
      `Not committing: ${conflicting.map(f => path.relative(app, f)).join(', ')} already had ` +
        'uncommitted changes before vendoring. Commit them together by hand.',
    );
    process.exit(1);
  }
  git(
    'commit',
    '-m',
    `chore(vendor): qwik-cdk/qwik-material @ ${head.slice(0, 10)}\n\n` +
      `Re-vendored from ${head} by vendor-local.mjs.\n\n` +
      'Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>',
    '--',
    ...changed.map(f => path.relative(app, f)),
  );
  console.log(`Committed: ${git('log', '-1', '--format=%h %s').trim()}`);
}
