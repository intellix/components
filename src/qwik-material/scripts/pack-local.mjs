#!/usr/bin/env node
/**
 * Builds `@angular-community/qwik-cdk` and `@angular-community/qwik-material` and packs both into
 * installable tarballs, for installing into an app outside this repo before they're published:
 *
 *   pnpm -C src/qwik-material pack:local            # -> <repo>/dist/qwik-packages/*.tgz
 *   pnpm -C src/qwik-material pack:local /some/dir  # -> /some/dir/*.tgz
 *
 * `pnpm pack` rewrites the `workspace:*` peer dependency on qwik-cdk to its real version, so the
 * tarballs install anywhere. See the repo's MIGRATING.md for the consuming app's setup.
 */
import {execSync} from 'node:child_process';
import {mkdirSync, readdirSync} from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const src = path.resolve(here, '../..');
const out = path.resolve(process.argv[2] ?? path.join(src, '..', 'dist', 'qwik-packages'));
mkdirSync(out, {recursive: true});

for (const pkg of ['qwik-cdk', 'qwik-material']) {
  const dir = path.join(src, pkg);
  console.log(`\n▸ building ${pkg}`);
  execSync('pnpm run build', {cwd: dir, stdio: 'inherit'});
  execSync(`pnpm pack --pack-destination "${out}"`, {cwd: dir, stdio: 'inherit'});
}

console.log(`\nTarballs in ${out}:`);
for (const file of readdirSync(out).filter(f => f.endsWith('.tgz'))) {
  console.log(`  ${path.join(out, file)}`);
}
