import {readdirSync} from 'node:fs';
import {isAbsolute, join, relative} from 'node:path';
import ts from 'typescript';
import {describe, expect, it} from 'vitest';

/**
 * A `$` closure (`useTask$`, `useVisibleTask$`, `$()`, …) must not use a local declared after it.
 * The optimizer moves the closure into its own segment and passes its captures where the closure
 * is created (`qrl(…).w([captures])` at the call), so a later `const` is read in its temporal dead
 * zone (Qwik rc.5: "Cannot access 'p' before initialization", `MenuPanel` never opened in an app's
 * production build), or, with an older optimizer, not captured at all (rc.4: "finishExit is not
 * defined" when the menu closed). Plain JavaScript closures don't care; QRLs do.
 */
const root = import.meta.dirname;

function sources(dir: string): string[] {
  return readdirSync(dir, {withFileTypes: true}).flatMap(entry => {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) {
      return ['node_modules', 'dist', 'scss', 'scripts'].includes(entry.name) ? [] : sources(path);
    }
    return /\.tsx?$/.test(entry.name) && !/\.(spec|d)\.tsx?$/.test(entry.name) ? [path] : [];
  });
}

function lateCaptures(files: string[], host?: ts.CompilerHost): string[] {
  const options = {noResolve: true, jsx: ts.JsxEmit.Preserve, target: ts.ScriptTarget.ESNext};
  const program = ts.createProgram(files, options, host);
  const checker = program.getTypeChecker();
  const found: string[] = [];
  for (const file of files) {
    const sf = program.getSourceFile(file)!;
    const at = (node: ts.Node) =>
      `${isAbsolute(file) ? relative(root, file) : file}:${sf.getLineAndCharacterOfPosition(node.getStart()).line + 1}`;
    const visit = (node: ts.Node): void => {
      if (ts.isCallExpression(node)) {
        const callee = ts.isPropertyAccessExpression(node.expression)
          ? node.expression.name
          : node.expression;
        const name = ts.isIdentifier(callee) ? callee.text : '';
        if (name.endsWith('$') && name !== 'component$') {
          for (const closure of node.arguments) {
            if (!ts.isArrowFunction(closure) && !ts.isFunctionExpression(closure)) continue;
            const reported = new Set<string>();
            const inner = (n: ts.Node): void => {
              if (ts.isIdentifier(n) && !reported.has(n.text)) {
                const symbol =
                  ts.isShorthandPropertyAssignment(n.parent) && n.parent.name === n
                    ? checker.getShorthandAssignmentValueSymbol(n.parent)
                    : checker.getSymbolAtLocation(n);
                const decl = symbol?.valueDeclaration ?? symbol?.declarations?.[0];
                const list = decl && ts.findAncestor(decl, ts.isVariableDeclarationList);
                if (
                  decl &&
                  list &&
                  list.flags & ts.NodeFlags.BlockScoped &&
                  decl.getSourceFile() === sf &&
                  ts.findAncestor(decl, ts.isFunctionLike) && // a local, not a module-level binding
                  (decl.end < closure.pos || decl.pos > closure.end) && // outside the closure
                  decl.getStart() > node.getStart() // declared after the call
                ) {
                  reported.add(n.text);
                  found.push(`${at(node)} ${name}(…) uses \`${n.text}\`, declared at ${at(decl)}`);
                }
              }
              ts.forEachChild(n, inner);
            };
            inner(closure.body);
          }
        }
      }
      ts.forEachChild(node, visit);
    };
    visit(sf);
  }
  return found;
}

describe('QRL capture order', () => {
  it('no `$` closure uses a local declared after it', () => {
    expect(lateCaptures(sources(root))).toEqual([]);
  });

  it('detects a late capture', () => {
    const late = [
      'export const C = component$(() => {',
      '  useTask$(() => later());',
      '  const later = $(() => {});',
      '});',
    ].join('\n');
    const host = ts.createCompilerHost({});
    const getSourceFile = host.getSourceFile;
    host.getSourceFile = (fileName, languageVersion, ...rest) =>
      fileName === 'late.tsx'
        ? ts.createSourceFile(fileName, late, languageVersion, true)
        : getSourceFile(fileName, languageVersion, ...rest);
    expect(lateCaptures(['late.tsx'], host)).toEqual([
      'late.tsx:2 useTask$(…) uses `later`, declared at late.tsx:3',
    ]);
  });
});
