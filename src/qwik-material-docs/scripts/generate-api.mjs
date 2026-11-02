#!/usr/bin/env node
/**
 * Build-time API-reference generator. Scans each qwik-material/qwik-cdk entry point's
 * `public-api.ts` with the TypeScript compiler API (via ts-morph) and emits one JSON file per
 * entry point into `src/generated/api/`, consumed by the `/components/<id>/api` and
 * `/cdk/<id>/api` routes.
 *
 * Deliberately stays at the SYNTAX level (literal type-annotation text, not checker-resolved
 * types) rather than adding every dependency package to the ts-morph project: every prop
 * interface in this codebase already carries an explicit type annotation, so printing that text
 * verbatim is both simpler (no need to resolve `@qwik.dev/core`/qwik-cdk types to build a valid
 * TS program) and a MORE faithful reference (shows exactly what a consumer writes, e.g.
 * `QRL<(event: PointerEvent) => void>`, not an expanded structural type).
 *
 * Run via `pnpm run generate:api` (wired into this app's `dev`/`build` scripts) — regenerates on
 * every run, never hand-edited.
 */
import {Project, SyntaxKind} from 'ts-morph';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, '../../..');
const OUT_DIR = path.join(__dirname, '../src/generated/api');

const MATERIAL_ENTRY_POINTS = [
  'autocomplete', 'badge', 'bottom-sheet', 'button', 'button-toggle', 'card', 'checkbox', 'chips',
  'datepicker', 'dialog', 'divider', 'expansion', 'form-field', 'grid-list', 'icon', 'input',
  'list', 'menu', 'paginator', 'progress-bar', 'progress-spinner', 'radio', 'select', 'sidenav',
  'slide-toggle', 'slider', 'snack-bar', 'sort', 'stepper', 'table', 'tabs', 'timepicker',
  'toolbar', 'tooltip', 'tree',
];

const CDK_ENTRY_POINTS = [
  'a11y', 'accordion', 'bidi', 'coercion', 'dialog', 'keycodes', 'layout', 'overlay', 'platform',
  'portal', 'stepper', 'table', 'tree',
];

const project = new Project({
  skipAddingFilesFromTsConfig: true,
  compilerOptions: {
    target: 99 /* ESNext */,
    jsx: 4 /* ReactJSX */,
    jsxImportSource: '@qwik.dev/core',
    moduleResolution: 100 /* Bundler */,
    allowJs: false,
  },
});

project.addSourceFilesAtPaths([
  path.join(REPO_ROOT, 'src/qwik-material/**/*.{ts,tsx}'),
  path.join(REPO_ROOT, 'src/qwik-cdk/**/*.{ts,tsx}'),
  `!${path.join(REPO_ROOT, 'src/qwik-material/**/*.spec.{ts,tsx}')}`,
  `!${path.join(REPO_ROOT, 'src/qwik-cdk/**/*.spec.{ts,tsx}')}`,
  `!${path.join(REPO_ROOT, '**/node_modules/**')}`,
  `!${path.join(REPO_ROOT, '**/dist/**')}`,
]);

/** First sentence/paragraph vs. the rest, so the UI can show a summary with expandable details. */
function splitDescription(desc) {
  const text = desc.trim();
  if (!text) return {summary: '', details: ''};
  const paraBreak = text.indexOf('\n\n');
  if (paraBreak !== -1) {
    return {summary: text.slice(0, paraBreak).trim(), details: text.slice(paraBreak + 2).trim()};
  }
  if (text.length <= 220) return {summary: text, details: ''};
  const sentenceEnd = text.slice(0, 260).lastIndexOf('. ');
  if (sentenceEnd > 40) {
    return {summary: text.slice(0, sentenceEnd + 1).trim(), details: text.slice(sentenceEnd + 2).trim()};
  }
  return {summary: text, details: ''};
}

function jsDocFor(node) {
  const docs = typeof node.getJsDocs === 'function' ? node.getJsDocs() : [];
  if (docs.length === 0) return {summary: '', details: ''};
  const desc = docs.map(d => d.getDescription()).join('\n\n');
  return splitDescription(desc);
}

function defaultHint(text) {
  const m = /\bDefault(?:s to)?\s+([^.]+)\./i.exec(text);
  return m ? m[1].trim() : undefined;
}

function propsFromInterface(iface) {
  return iface.getProperties().map(prop => {
    const doc = jsDocFor(prop);
    return {
      name: prop.getName(),
      type: prop.getTypeNode()?.getText() ?? prop.getType().getText(),
      optional: prop.hasQuestionToken(),
      summary: doc.summary,
      details: doc.details,
      defaultHint: defaultHint(doc.summary + ' ' + doc.details),
    };
  });
}

/** Also handles a `type X = {...}` object-literal type alias the same way as an interface. */
function propsFromTypeAlias(alias) {
  const typeNode = alias.getTypeNode();
  if (!typeNode || typeNode.getKind() !== SyntaxKind.TypeLiteral) return undefined;
  return typeNode.getMembers().map(member => {
    if (member.getKind() !== SyntaxKind.PropertySignature) return undefined;
    const doc = jsDocFor(member);
    return {
      name: member.getName(),
      type: member.getTypeNode()?.getText() ?? '',
      optional: member.hasQuestionToken(),
      summary: doc.summary,
      details: doc.details,
      defaultHint: defaultHint(doc.summary + ' ' + doc.details),
    };
  }).filter(Boolean);
}

function functionSignature(node) {
  const params = node
    .getParameters()
    .map(p => `${p.getName()}${p.hasQuestionToken() ? '?' : ''}: ${p.getTypeNode()?.getText() ?? 'unknown'}`)
    .join(', ');
  const returnType = node.getReturnTypeNode()?.getText() ?? '';
  return `(${params})${returnType ? ' => ' + returnType : ''}`;
}

/** A clean, syntax-level type string for a `const X = ...` with no explicit type annotation —
 *  e.g. `createContextId<MatButtonConfig>(...)` -> `ContextId<MatButtonConfig>`. Falling back to
 *  the checker-resolved type (`decl.getType().getText()`) for these prints an absolute
 *  `import("/Users/.../button-config.ts").MatButtonConfig` path (this machine's own disk path —
 *  never something to publish), since ts-morph's checker has no bare-specifier module resolution
 *  configured; every call here (`createContextId`, `createOverlayPositionBuilder`, …) already
 *  carries an explicit generic type argument in its own source, which is both cleaner and avoids
 *  the leak entirely. */
function constantTypeText(decl, initializer) {
  const annotated = decl.getTypeNode()?.getText();
  if (annotated) return annotated;
  if (initializer?.getKind() === SyntaxKind.CallExpression) {
    const typeArgs = initializer.getTypeArguments?.() ?? [];
    const callee = initializer.getExpression().getText();
    const calleeType = callee.replace(/^create/, '');
    if (typeArgs.length > 0) {
      return `${calleeType}<${typeArgs.map(t => t.getText()).join(', ')}>`;
    }
    return `${calleeType}<...>`;
  }
  // Last resort: a short literal (string/number/boolean) prints fine via the checker; anything
  // structural falls back to a generic label rather than risking another absolute-path leak.
  const text = decl.getType().getText();
  return /^(["'].*["']|[0-9.]+|true|false)$/.test(text) ? text : 'unknown';
}

function isComponentCall(initializer) {
  if (!initializer || initializer.getKind() !== SyntaxKind.CallExpression) return false;
  const expr = initializer.getExpression();
  const text = expr.getText();
  return text === 'component$' || text.endsWith('.component$');
}

function toPascalCase(id) {
  return id
    .split('-')
    .map(s => s.charAt(0).toUpperCase() + s.slice(1))
    .join('');
}

/**
 * Orders an entry point's exported components so its main component/hook comes first (e.g.
 * `MatSelect` before `MatOptgroup`), then related components — alphabetical otherwise provides
 * no signal a reader can use, and an entry point's OWN component is always the thing they came
 * to read about first. Heuristic: the entry point id (e.g. `button-toggle`) converted to
 * PascalCase (`ButtonToggle`) should exactly match the component name with a `Mat`/`Cdk` prefix
 * stripped (`MatButtonToggle`, `CdkAccordion`) — or, for a plural entry point id naming a
 * singular component (`chips` -> `MatChip`), the same check with a trailing `s` dropped. Falls
 * back to plain alphabetical (unchanged) when nothing matches, which only affects entry points
 * with no single obviously-main component (e.g. `qwik-cdk/keycodes`, all constants).
 */
function sortComponentsMainFirst(components, id) {
  const sorted = [...components].sort((a, b) => a.name.localeCompare(b.name));
  const pascal = toPascalCase(id);
  const candidates = pascal.endsWith('s') ? [pascal, pascal.slice(0, -1)] : [pascal];
  const isMain = name => candidates.some(c => name === `Mat${c}` || name === `Cdk${c}` || name === c);
  let mainIndex = sorted.findIndex(c => isMain(c.name));
  if (mainIndex === -1) {
    mainIndex = sorted.findIndex(c => candidates.some(cand => c.name.endsWith(cand)));
  }
  if (mainIndex <= 0) return sorted;
  const main = sorted[mainIndex];
  return [main, ...sorted.slice(0, mainIndex), ...sorted.slice(mainIndex + 1)];
}

function analyzeEntryPoint(pkgRoot, id) {
  const publicApiPath = path.join(pkgRoot, id, 'public-api.ts');
  if (!fs.existsSync(publicApiPath)) return {id, error: `public-api.ts not found at ${publicApiPath}`};

  const sourceFile = project.getSourceFileOrThrow(publicApiPath);
  const exported = sourceFile.getExportedDeclarations();

  // First pass: find every `*Props` interface/type-literal alias, keyed by its own name.
  const propsTypes = new Map();
  for (const [name, decls] of exported) {
    if (!name.endsWith('Props')) continue;
    const decl = decls[0];
    if (!decl) continue;
    if (decl.getKind() === SyntaxKind.InterfaceDeclaration) {
      propsTypes.set(name, {kind: 'interface', props: propsFromInterface(decl)});
    } else if (decl.getKind() === SyntaxKind.TypeAliasDeclaration) {
      const props = propsFromTypeAlias(decl);
      if (props) propsTypes.set(name, {kind: 'type', props});
    }
  }

  const components = [];
  const hooks = [];
  const functions = [];
  const types = [];
  const constants = [];
  const consumedPropsNames = new Set();

  for (const [name, decls] of exported) {
    if (name.endsWith('Props')) continue; // handled via propsTypes, attached below
    const decl = decls[0];
    if (!decl) continue;
    const doc = jsDocFor(decl);

    if (decl.getKind() === SyntaxKind.VariableDeclaration) {
      const initializer = decl.getInitializer();
      if (isComponentCall(initializer)) {
        const typeArgs = initializer.getTypeArguments?.() ?? [];
        const propsTypeName = typeArgs[0]?.getText() ?? `${name}Props`;
        const propsType = propsTypes.get(propsTypeName);
        if (propsType) consumedPropsNames.add(propsTypeName);
        components.push({
          name,
          summary: doc.summary,
          details: doc.details,
          propsTypeName: propsType ? propsTypeName : undefined,
          props: propsType?.props ?? [],
        });
        continue;
      }
      if (name.startsWith('use') && initializer && /=>/.test(initializer.getText().slice(0, 40))) {
        hooks.push({
          name,
          summary: doc.summary,
          details: doc.details,
          signature: decl.getTypeNode()?.getText() ?? undefined,
        });
        continue;
      }
      if (initializer && (initializer.getKind() === SyntaxKind.ArrowFunction || initializer.getKind() === SyntaxKind.FunctionExpression)) {
        functions.push({
          name,
          summary: doc.summary,
          details: doc.details,
          signature: functionSignature(initializer),
        });
        continue;
      }
      constants.push({
        name,
        summary: doc.summary,
        details: doc.details,
        type: constantTypeText(decl, initializer),
      });
      continue;
    }

    if (decl.getKind() === SyntaxKind.FunctionDeclaration) {
      const bucket = name.startsWith('use') ? hooks : functions;
      bucket.push({name, summary: doc.summary, details: doc.details, signature: functionSignature(decl)});
      continue;
    }

    if (decl.getKind() === SyntaxKind.InterfaceDeclaration) {
      types.push({
        name,
        kind: 'interface',
        summary: doc.summary,
        details: doc.details,
        members: propsFromInterface(decl),
      });
      continue;
    }

    if (decl.getKind() === SyntaxKind.TypeAliasDeclaration) {
      const typeNode = decl.getTypeNode();
      types.push({
        name,
        kind: 'type',
        summary: doc.summary,
        details: doc.details,
        definition: typeNode?.getText() ?? '',
      });
      continue;
    }

    if (decl.getKind() === SyntaxKind.EnumDeclaration) {
      types.push({name, kind: 'enum', summary: doc.summary, details: doc.details, definition: decl.getText()});
      continue;
    }
  }

  // Any `*Props` type not consumed by a component (rare, but keep it discoverable).
  for (const [name, value] of propsTypes) {
    if (consumedPropsNames.has(name)) continue;
    types.push({name, kind: value.kind === 'interface' ? 'interface' : 'type', summary: '', details: '', members: value.props});
  }

  hooks.sort((a, b) => a.name.localeCompare(b.name));
  functions.sort((a, b) => a.name.localeCompare(b.name));
  types.sort((a, b) => a.name.localeCompare(b.name));
  constants.sort((a, b) => a.name.localeCompare(b.name));

  return {id, components: sortComponentsMainFirst(components, id), hooks, functions, types, constants};
}

fs.mkdirSync(OUT_DIR, {recursive: true});

let count = 0;
for (const id of MATERIAL_ENTRY_POINTS) {
  const result = analyzeEntryPoint(path.join(REPO_ROOT, 'src/qwik-material'), id);
  fs.writeFileSync(path.join(OUT_DIR, `material-${id}.json`), JSON.stringify(result, null, 2));
  count++;
}
for (const id of CDK_ENTRY_POINTS) {
  const result = analyzeEntryPoint(path.join(REPO_ROOT, 'src/qwik-cdk'), id);
  fs.writeFileSync(path.join(OUT_DIR, `cdk-${id}.json`), JSON.stringify(result, null, 2));
  count++;
}

console.log(`Generated API reference JSON for ${count} entry points -> ${path.relative(REPO_ROOT, OUT_DIR)}`);
