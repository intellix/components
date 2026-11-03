import {test, expect} from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

/**
 * Upstream example styles are scoped to their component by Angular's view encapsulation; here an
 * example's CSS is global once imported, so an unscoped selector (e.g. a bare `mat-form-field`)
 * leaks onto every page that loads it. Every selector must start with the element tag of the
 * component that imports the stylesheet — except examples whose upstream component uses
 * `ViewEncapsulation.None` to style overlay content rendered outside the example.
 */
const EXAMPLES_DIR = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '../../../qwik-material-examples',
);
const GLOBAL_BY_DESIGN = new Set(['datepicker/datepicker-date-class', 'select/select-panel-class']);

function selectorLists(css: string): string[] {
  const withoutComments = css.replace(/\/\*[\s\S]*?\*\//g, '');
  const lists: string[] = [];
  const stack: string[] = [];
  let buffer = '';
  for (const char of withoutComments) {
    if (char === '{') {
      const prelude = buffer.trim();
      const inKeyframes = stack.at(-1) === 'keyframes';
      if (prelude.startsWith('@') || inKeyframes) {
        stack.push(/^@(-webkit-)?keyframes/.test(prelude) ? 'keyframes' : 'at');
      } else {
        stack.push('rule');
        lists.push(prelude);
      }
      buffer = '';
    } else if (char === '}') {
      stack.pop();
      buffer = '';
    } else if (char === ';') {
      buffer = '';
    } else {
      buffer += char;
    }
  }
  return lists;
}

const stylesheets = fs
  .readdirSync(EXAMPLES_DIR, {withFileTypes: true})
  .filter(d => d.isDirectory() && d.name !== 'node_modules')
  .flatMap(pkg =>
    fs
      .readdirSync(path.join(EXAMPLES_DIR, pkg.name), {withFileTypes: true})
      .filter(d => d.isDirectory())
      .map(d => `${pkg.name}/${d.name}`),
  )
  .filter(dir => !GLOBAL_BY_DESIGN.has(dir))
  .flatMap(dir =>
    fs
      .readdirSync(path.join(EXAMPLES_DIR, dir))
      .filter(file => file.endsWith('.css'))
      .map(file => ({dir, file})),
  );

for (const {dir, file} of stylesheets) {
  test(`${dir}/${file} only styles its own example`, () => {
    const folder = path.join(EXAMPLES_DIR, dir);
    const importer = fs
      .readdirSync(folder)
      .filter(f => f.endsWith('.tsx'))
      .map(f => fs.readFileSync(path.join(folder, f), 'utf8'))
      .find(source => source.includes(file));
    expect(importer, `no component imports ${file}`).toBeDefined();
    const host = importer!.match(/<([a-z][a-z0-9-]*-example(?:-[a-z0-9]+)*)\b/)?.[1];
    expect(host, `no *-example host element in the component importing ${file}`).toBeDefined();

    const scoped = new RegExp(`^${host}([\\s>.:\\[+~]|$)`);
    const unscoped = selectorLists(fs.readFileSync(path.join(folder, file), 'utf8'))
      .flatMap(list => list.split(',').map(s => s.trim()))
      .filter(selector => selector && !scoped.test(selector));
    expect(unscoped).toEqual([]);
  });
}
