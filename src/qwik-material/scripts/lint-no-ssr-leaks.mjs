#!/usr/bin/env node
// Lint that flags direct browser-global access (document., window., navigator.,
// getComputedStyle(, requestAnimationFrame() outside an `if (isBrowser)` guard
// or a useVisibleTask$ callback in non-spec qwik-cdk files.

import {readFile, readdir} from 'node:fs/promises';
import {resolve, relative, join} from 'node:path';

const root = resolve(import.meta.dirname, '..');
const FORBIDDEN = /\b(document|window|navigator)\.|getComputedStyle\(|requestAnimationFrame\(/g;

async function* walk(dir) {
  for (const e of await readdir(dir, {withFileTypes: true})) {
    const p = join(dir, e.name);
    if (e.isDirectory()) {
      if (['node_modules', 'dist', 'scss', 'scripts'].includes(e.name)) continue;
      yield* walk(p);
    } else if (
      e.isFile() &&
      /\.(ts|tsx)$/.test(e.name) &&
      !e.name.endsWith('.spec.ts') &&
      !e.name.endsWith('.spec.tsx')
    ) {
      yield p;
    }
  }
}

function findBalanced(s, fromIdx) {
  let depth = 0;
  let i = s.indexOf('(', fromIdx);
  if (i < 0) return s.length;
  for (; i < s.length; i++) {
    if (s[i] === '(') depth++;
    else if (s[i] === ')') {
      depth--;
      if (depth === 0) return i;
    }
  }
  return s.length;
}

// Walk backwards counting `}` and `{` to find the unmatched `{` that opens the
// enclosing function/method/block scope of position `idx`.
function findEnclosingScopeStart(s, idx) {
  let depth = 0;
  for (let i = idx - 1; i >= 0; i--) {
    if (s[i] === '}') depth++;
    else if (s[i] === '{') {
      if (depth === 0) return i;
      depth--;
    }
  }
  return 0;
}

const failures = [];
for await (const f of walk(root)) {
  const src = await readFile(f, 'utf8');
  // Strip block comments, line comments, and string literals (cheap, not perfect).
  const stripped = src
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/\/\/.*$/gm, '')
    .replace(/(['"`])(?:\\.|[^\\])*?\1/g, '""');

  for (const match of stripped.matchAll(FORBIDDEN)) {
    const idx = match.index ?? 0;
    const upto = stripped.slice(0, idx);

    // useVisibleTask$ scope check: does the match fall inside the parens of a
    // useVisibleTask$ call that started before it?
    const lastTask = upto.lastIndexOf('useVisibleTask$');
    const lastTaskEnd = lastTask >= 0 ? findBalanced(stripped, lastTask) : -1;
    const inTask = lastTask >= 0 && idx < lastTaskEnd;

    // isBrowser guard: walk outward through nested `{` scopes. We consider the
    // violation guarded if any enclosing scope (including its earlier siblings
    // up to scope start) contains an `isBrowser` token.
    let guarded = false;
    let scanFrom = idx;
    while (scanFrom > 0) {
      const scopeStart = findEnclosingScopeStart(stripped, scanFrom);
      const scopeText = stripped.slice(scopeStart, scanFrom);
      if (
        /\bisBrowser\b/.test(scopeText) ||
        /typeof\s+(document|window|navigator)\b/.test(scopeText)
      ) {
        guarded = true;
        break;
      }
      if (scopeStart === 0) break;
      scanFrom = scopeStart;
    }

    // Per-line opt-out: `// ssr-leak-ok: <reason>` on the same line or one above.
    const lineNo = src.slice(0, src.indexOf(match[0], Math.max(0, idx - 50))).split('\n').length;
    const lines = src.split('\n');
    const lineText = lines[lineNo - 1] || '';
    const prevLineText = lines[lineNo - 2] || '';
    const optedOut =
      /\/\/\s*ssr-leak-ok\b/.test(lineText) || /\/\/\s*ssr-leak-ok\b/.test(prevLineText);

    if (!inTask && !guarded && !optedOut) {
      failures.push(`${relative(root, f)}:${lineNo}: ${match[0]} (unguarded)`);
    }
  }
}

if (failures.length) {
  console.error(`SSR leaks found (${failures.length}):`);
  for (const f of failures) console.error('  ' + f);
  process.exit(1);
}
console.log('No SSR leaks.');
