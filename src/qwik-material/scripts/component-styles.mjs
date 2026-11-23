#!/usr/bin/env node
// Per-component CSS, compiled from Sass into the package SOURCE tree, so a component can register
// its own styles with `useStyles$` when it first renders — the way upstream Angular Material
// attaches a component's `styleUrl` (compiled with `encapsulation: ViewEncapsulation.None`, i.e.
// global, unscoped CSS) when the component is first created, instead of the app importing every
// component's CSS up front.
//
// For each entry point in COMPONENT_STYLES, compiles `scss/<entry>/<entry>-prebuilt.scss` (the
// entry's structural CSS: every upstream stylesheet its components use), wraps it in
// `@layer qwik-material { … }`, and writes `<entry>/<entry>-styles.ts`: a `useMat<Entry>Styles()`
// hook whose one `useStyles$(…)` call holds that CSS as a string literal.
//
// An entry in `COMPONENT_STYLE_VARIANTS` (button, list, badge) is split instead into a base sheet
// and variant sheets, each its own `useStyles$` call in the one hook, which registers the variants
// its caller passes (`useMatButtonStyles('elevated')`) — see that constant.
//
// Why generated TypeScript beside the source (committed) rather than a `.css` file:
// - A consuming app compiles this package's TypeScript SOURCE with its own Qwik Vite plugin (the
//   `qwik` export condition), so the CSS has to exist beside that source, already compiled — the
//   app needs neither Sass nor any Vite config of its own. The dist build (`import` condition)
//   bundles the same modules.
// - A literal, not `import css from './x.css?inline'`: the optimizer moves `useStyles$`'s argument
//   into its own segment, and a segment that only re-exports an imported string came out of
//   Vite 8's (Rolldown) client build in a chunk cycle with that string's module — the segment's
//   chunk read the binding before the other chunk had assigned it, so a component first rendered
//   in the browser registered an EMPTY `<style>` (the dev-app's own `example.css?inline` styles
//   have the same chunk shape). A literal leaves the segment with no imports at all.
// - Compressed: the string ships as is (no consumer CSS minifier sees it), into server-rendered
//   HTML and client chunks.
// Generation is explicit (`generate-component-styles`, below); nothing else writes these files.
// The package build (`vite.config.ts`) and `component-styles.spec.ts` only CHECK them, and fail
// with the command to run when a committed file no longer matches its Sass — so a build, a test
// run or `vendor:local` never ships, or silently fixes up, CSS the commit doesn't contain.
//
// The cascade layer: `useStyles$` styles land wherever a component first renders (in `<body>`
// during SSR, `<head>` when first rendered in the browser) — after an app's own stylesheets. Inside
// one named layer, every unlayered app/brand rule beats this package's rules whatever their order
// or specificity, as with Angular Material's styles in `<head>` before the app's. The global core
// CSS (`core-prebuilt.css`, plus typography/elevation) is wrapped in the same layer by the build
// (see `vite.config.ts`).
//
// Usage: node src/qwik-material/scripts/component-styles.mjs           (regenerate)
//        node src/qwik-material/scripts/component-styles.mjs --check   (exit 1 if stale)
// (also `pnpm -C src/qwik-material generate-component-styles` / `check-component-styles`)

import {readFile, writeFile} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const packageRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

/** The cascade layer every qwik-material stylesheet is emitted in. */
export const LAYER = 'qwik-material';

/**
 * The layer order, at the top of every stylesheet: qwik-cdk's CSS (`@layer qwik-cdk`) below
 * qwik-material's, so material's rules on CDK elements beat the CDK's own (dialog.css's 560px
 * `max-width` on the overlay pane over the CDK's 100%), as source order had it before either was
 * layered. Repeated in every file so it holds whichever loads first. Identical in qwik-cdk's
 * `scripts/css-layer.mjs`.
 *
 * ONE layer for all of qwik-material, not a sub-layer per entry point: upstream's stylesheets
 * resolve their overlaps by specificity (`.mat-mdc-icon-button svg { width: 24px }` over
 * paginator's `.mat-mdc-paginator-icon { width: 28px }`; `.mat-mdc-icon-button.mat-mdc-button-
 * disabled`'s color over datepicker's `.mat-datepicker-toggle button { color: inherit }`;
 * badge's deliberately doubled `.mat-badge.mat-badge { overflow: visible }` over `.mat-icon`'s
 * `hidden`), and a layer beats specificity. Only equal-specificity overlaps depend on order (the
 * calendar's `.mat-calendar-period-button { min-width: 0 }` over `.mdc-button`'s 64px): a
 * component registers the stylesheets its own CSS overrides BEFORE its own (README "Component
 * styles").
 */
export const LAYER_ORDER = '@layer qwik-cdk, qwik-material;';

/**
 * Entry points with their own structural CSS → the upstream component(s) that declare it
 * (`styleUrl`), for the hook's doc comment. `input` has none (upstream's `MatInput` ships no
 * stylesheet; its styles are form-field's), `core` ships `core-prebuilt.css` globally, and
 * `providers` is an aggregator.
 */
export const COMPONENT_STYLES = {
  autocomplete: "`MatAutocomplete`'s `styleUrl: 'autocomplete.css'` (autocomplete.ts)",
  badge:
    "the `MatBadge` directive's `_MatBadgeStyleLoader` (`styleUrl: 'badge.css'`, loaded through `_CdkPrivateStyleLoader`; badge.ts)",
  'bottom-sheet':
    "`MatBottomSheetContainer`'s `styleUrl: 'bottom-sheet-container.css'` (bottom-sheet-container.ts)",
  button:
    "`MatButton`'s `styleUrls: ['button.css', 'button-high-contrast.css']` (button.ts), `MatIconButton`'s `['icon-button.css', 'button-high-contrast.css']` (icon-button.ts) and `MatFabButton`/`MatMiniFabButton`'s `'fab.css'` (fab.ts)",
  'button-toggle': "`MatButtonToggle`'s `styleUrl: 'button-toggle.css'` (button-toggle.ts)",
  card: "`MatCard`'s `styleUrl: 'card.css'` (card.ts)",
  checkbox: "`MatCheckbox`'s `styleUrl: 'checkbox.css'` (checkbox.ts)",
  chips:
    "`MatChipSet`/`MatChipListbox`/`MatChipGrid`'s `styleUrl: 'chip-set.css'` and `MatChip`/`MatChipOption`/`MatChipRow`'s `'chip.css'` (chip*.ts)",
  datepicker:
    '`MatCalendar` (`calendar.css`), `MatCalendarBody` (`calendar-body.css`), `MatDateRangeInput` (`date-range-input.css`), `MatDatepickerContent` (`datepicker-content.css`), `MatDatepickerActions` (`datepicker-actions.css`) and `MatDatepickerToggle` (`datepicker-toggle.css`)',
  dialog: "`MatDialogContainer`'s `styleUrl: 'dialog.css'` (dialog-container.ts)",
  divider: "`MatDivider`'s `styleUrl: 'divider.css'` (divider.ts)",
  expansion:
    "`MatExpansionPanel`'s `styleUrl: 'expansion-panel.css'` and `MatExpansionPanelHeader`'s `'expansion-panel-header.css'`",
  'form-field': "`MatFormField`'s `styleUrl: './form-field.css'` (form-field.ts)",
  'grid-list': "`MatGridList`/`MatGridTile`'s `styleUrl: 'grid-list.css'`",
  icon: "`MatIcon`'s `styleUrl: 'icon.css'` (icon.ts)",
  list: "`MatList`/`MatNavList`/`MatActionList`/`MatSelectionList`'s `styleUrl: 'list.css'`",
  menu: "`MatMenu`'s `styleUrl: 'menu.css'` (menu.ts)",
  paginator: "`MatPaginator`'s `styleUrl: 'paginator.css'` (paginator.ts)",
  'progress-bar': "`MatProgressBar`'s `styleUrl: 'progress-bar.css'` (progress-bar.ts)",
  'progress-spinner':
    "`MatProgressSpinner`'s `styleUrl: 'progress-spinner.css'` (progress-spinner.ts)",
  radio: "`MatRadioButton`'s `styleUrl: 'radio.css'` (radio.ts)",
  select: "`MatSelect`'s `styleUrl: 'select.css'` (select.ts)",
  sidenav: "`MatDrawerContainer`/`MatSidenavContainer`'s `styleUrl: 'drawer.css'`",
  'slide-toggle': "`MatSlideToggle`'s `styleUrl: 'slide-toggle.css'` (slide-toggle.ts)",
  slider:
    "`MatSlider`'s `styleUrl: 'slider.css'` and `MatSliderVisualThumb`'s `'slider-thumb.css'`",
  'snack-bar':
    "`MatSnackBarContainer`'s `styleUrl: 'snack-bar-container.css'` and `SimpleSnackBar`'s `'simple-snack-bar.css'`",
  sort: "`MatSortHeader`'s `styleUrl: 'sort-header.css'` (sort-header.ts)",
  stepper: "`MatStepper`'s `styleUrl: 'stepper.css'` and `MatStepHeader`'s `'step-header.css'`",
  table: "`MatTable`'s `styleUrl: 'table.css'` (table.ts)",
  tabs: '`MatTabGroup` (`tab-group.css`), `MatTabBody` (`tab-body.css`), `MatTabHeader` (`tab-header.css`), `MatTabNav` (`tab-nav-bar.css`) and `MatTabLink` (`tab-link.css`)',
  timepicker: "`MatTimepicker`'s `styleUrl: 'timepicker.css'` (timepicker.ts)",
  toolbar: "`MatToolbar`'s `styleUrl: 'toolbar.css'` (toolbar.ts)",
  tooltip: "`TooltipComponent`'s `styleUrl: 'tooltip.css'` (tooltip.ts)",
  tree: "`MatTree`'s `styleUrl: 'tree.css'` (tree.ts)",
};

export const COMPONENT_STYLE_ENTRIES = Object.keys(COMPONENT_STYLES);

/**
 * Entry points whose CSS ships as a BASE sheet plus VARIANT sheets, each its own `useStyles$`
 * `<style>`, so a page carries only the parts of a large stylesheet it renders: a page of text and
 * raised buttons doesn't carry the outlined, tonal, icon-button and FAB rules (upstream ships them
 * in one `styleUrl`, which a component-at-a-time page pays for in full, in every SSR response).
 *
 * Each variant names the classes that select it: a rule goes to the first variant whose class
 * appears in one of its selectors (outside `:not()`); a rule listing selectors of several variants
 * is split into one rule per variant (same declarations, same order); everything else, at-rules
 * included, is base. Within a sheet, rules keep upstream's order. Across sheets, base always comes
 * before a variant (a component registers base first), so a variant rule that upstream placed
 * BEFORE a base rule now comes after it — `variantOrderConflicts()` (checked by
 * `component-styles.spec.ts`) asserts no such pair can decide a property for the same element at
 * equal specificity. Variants of one entry select mutually exclusive elements (a button has one
 * appearance), so their own relative order — whichever renders first — never matters.
 *
 * `doc` is the variant's line in the generated hook's doc comment.
 */
export const COMPONENT_STYLE_VARIANTS = {
  badge: {
    content: {
      classes: ['mat-badge-content'],
      doc: 'the content element (`.mat-badge-content`), which a badge renders only with content to show',
    },
  },
  button: {
    text: {classes: ['mat-mdc-button'], doc: "`MatButton`'s `text` appearance (`.mat-mdc-button`)"},
    filled: {
      classes: ['mat-mdc-unelevated-button'],
      doc: "`MatButton`'s `filled` appearance (`.mat-mdc-unelevated-button`)",
    },
    elevated: {
      classes: ['mat-mdc-raised-button'],
      doc: "`MatButton`'s `elevated` appearance (`.mat-mdc-raised-button`)",
    },
    outlined: {
      classes: ['mat-mdc-outlined-button'],
      doc: "`MatButton`'s `outlined` appearance (`.mat-mdc-outlined-button`)",
    },
    tonal: {
      classes: ['mat-tonal-button'],
      doc: "`MatButton`'s `tonal` appearance (`.mat-tonal-button`)",
    },
    icon: {classes: ['mat-mdc-icon-button'], doc: '`MatIconButton` (icon-button.scss)'},
    fab: {
      classes: ['mat-mdc-fab-base', 'mat-mdc-fab', 'mat-mdc-mini-fab', 'mat-mdc-extended-fab'],
      doc: '`MatFabButton` and `MatMiniFabButton`, extended or not (fab.scss)',
    },
  },
  list: {
    rich: {
      classes: [
        'mdc-list-item--with-two-lines',
        'mdc-list-item--with-three-lines',
        'mdc-list-item__secondary-text',
        'mdc-list-item--with-overline',
        'mdc-list-item__overline-text',
        'mdc-list-item__start',
        'mdc-list-item__end',
        'mdc-list-item--with-leading-icon',
        'mdc-list-item--with-leading-avatar',
        'mdc-list-item--with-leading-checkbox',
        'mdc-list-item--with-leading-radio',
        'mdc-list-item--with-leading-switch',
        'mdc-list-item--with-trailing-icon',
        'mdc-list-item--with-trailing-meta',
        'mdc-list-item--with-trailing-checkbox',
        'mdc-list-item--with-trailing-radio',
        'mdc-list-item--with-trailing-switch',
        'mat-mdc-list-item-avatar',
        'mat-mdc-list-item-icon',
        'mat-mdc-list-item-both-leading-and-trailing',
        'mat-mdc-list-option',
      ],
      doc:
        'items of two or three lines and the leading/trailing sections (avatar, icon, meta, ' +
        'secondary lines; selection-list options)',
    },
  },
};

/**
 * Pairs `variantOrderConflicts()` reports that can't select the same element, by base selector →
 * variant selector (reviewed). None at present.
 */
const ORDER_CONFLICT_EXCEPTIONS = {};

/**
 * `css` inside `@layer qwik-material { … }`, after the layer order statement. A `@charset`/`@import`
 * can't sit in a layer block.
 */
export function wrapInLayer(css, {compressed = false} = {}) {
  if (/@charset|@import/.test(css)) {
    throw new Error('qwik-material: compiled CSS has a @charset/@import that cannot be layered');
  }
  return compressed
    ? `${LAYER_ORDER.replace(', ', ',')}@layer ${LAYER}{${css.trim()}}`
    : `${LAYER_ORDER}\n@layer ${LAYER} {\n${css.trimEnd()}\n}\n`;
}

/** `useMat<Entry>Styles` for an entry name. */
export const styleHookName = entry =>
  `useMat${entry.replace(/(^|-)([a-z])/g, (_, __, c) => c.toUpperCase())}Styles`;

/** Source Sass and generated module paths (absolute) for an entry. */
export function componentStylePaths(entry) {
  return {
    scss: path.join(packageRoot, 'scss', entry, `${entry}-prebuilt.scss`),
    module: path.join(packageRoot, entry, `${entry}-styles.ts`),
  };
}

/** An entry's CSS compiled fresh from its Sass, compressed, NOT yet in the layer. */
async function compileRaw(entry) {
  const sass = await import('sass');
  return sass.compile(componentStylePaths(entry).scss, {style: 'compressed', charset: false}).css;
}

/**
 * An entry's whole CSS, compiled fresh from its Sass: compressed, inside the layer. For an entry
 * with variants, what its base and every variant sheet together hold (in upstream's order).
 */
export async function compileComponentStyles(entry) {
  return wrapInLayer(await compileRaw(entry), {compressed: true});
}

/** The classes a selector requires (those inside `:not(…)` excluded). */
const requiredClasses = selector =>
  [...selector.replace(/:not\([^)]*\)/g, '').matchAll(/\.([\w-]+)/g)].map(m => m[1]);

/** The variant of `entry` a single selector belongs to, or `''` (base). */
function variantOfSelector(entry, selector) {
  const classes = requiredClasses(selector);
  const hits = Object.entries(COMPONENT_STYLE_VARIANTS[entry] ?? {})
    .filter(([, v]) => v.classes.some(c => classes.includes(c)))
    .map(([name]) => name);
  if (hits.length > 1) {
    throw new Error(
      `qwik-material: ${entry}: \`${selector}\` selects variants ${hits.join(' and ')} at once — ` +
        'put their classes in one variant (scripts/component-styles.mjs)',
    );
  }
  return hits[0] ?? '';
}

/**
 * Every style rule of a postcss root, as `context | selector | declarations` strings — the
 * multiset `splitComponentStyles()` checks it neither lost nor duplicated a rule against.
 */
function ruleKeys(root) {
  const keys = [];
  root.walkRules(rule => {
    const context = [];
    for (let p = rule.parent; p && p.type === 'atrule'; p = p.parent) {
      context.unshift(`@${p.name} ${p.params}`);
    }
    const body = rule.nodes.map(n => n.toString()).join(';');
    for (const selector of rule.selectors)
      keys.push(`${context.join(' ')} | ${selector} | ${body}`);
  });
  return keys.sort();
}

/**
 * An entry's CSS as its base sheet and its variant sheets (`COMPONENT_STYLE_VARIANTS`, declared
 * order), each compressed and in the layer. An entry without variants is all base.
 *
 * Throws when a variant comes out empty (its classes no longer select anything) or when the sheets
 * together don't hold exactly the entry's rules.
 */
export async function splitComponentStyles(entry) {
  const raw = await compileRaw(entry);
  const variants = COMPONENT_STYLE_VARIANTS[entry];
  if (!variants) return {base: wrapInLayer(raw, {compressed: true}), variants: []};
  const {default: postcss} = await import('postcss');
  const source = postcss.parse(raw);
  const sheets = new Map([['', postcss.root()]]);
  for (const name of Object.keys(variants)) sheets.set(name, postcss.root());
  // Each sheet's copy of an at-rule, so consecutive rules of one `@media` stay in one block.
  const copies = new WeakMap();
  const place = (node, ancestors) => {
    if (node.type === 'rule') {
      const bySheet = new Map();
      for (const selector of node.selectors) {
        const sheet = variantOfSelector(entry, selector);
        bySheet.set(sheet, [...(bySheet.get(sheet) ?? []), selector]);
      }
      for (const [sheet, selectors] of bySheet) {
        let parent = sheets.get(sheet);
        for (const ancestor of ancestors) {
          const last = parent.last;
          if (last && copies.get(last) === ancestor) {
            parent = last;
          } else {
            const copy = ancestor.clone({nodes: []});
            copies.set(copy, ancestor);
            parent.append(copy);
            parent = copy;
          }
        }
        parent.append(node.clone({selectors}));
      }
    } else if (node.type === 'atrule' && node.nodes && node.name !== 'keyframes') {
      for (const child of node.nodes) place(child, [...ancestors, node]);
    } else {
      // @keyframes, @font-face, …: base, whole.
      let parent = sheets.get('');
      for (const ancestor of ancestors) {
        const copy = ancestor.clone({nodes: []});
        parent.append(copy);
        parent = copy;
      }
      parent.append(node.clone());
    }
  };
  for (const node of source.nodes) place(node, []);

  const pieces = [...sheets.values()];
  const split = pieces.flatMap(ruleKeys).sort();
  if (JSON.stringify(split) !== JSON.stringify(ruleKeys(source))) {
    throw new Error(`qwik-material: ${entry}: the split sheets don't hold exactly its rules`);
  }
  const result = {base: wrapInLayer(sheets.get('').toString(), {compressed: true}), variants: []};
  for (const name of Object.keys(variants)) {
    const css = sheets.get(name).toString();
    if (!css) throw new Error(`qwik-material: ${entry}: variant ${name} selects no rule`);
    result.variants.push({name, css: wrapInLayer(css, {compressed: true})});
  }
  return result;
}

/**
 * A selector's specificity as `a,b,c`: ids; classes, attributes and pseudo-classes (`:not()`,
 * `:is()`, `:has()` count their argument, `:where()` nothing); types and pseudo-elements. Enough
 * for the compiled Material CSS this checks (no nested selector lists inside the pseudo-classes).
 */
export function specificity(selector) {
  const s = selector.replace(/::?([\w-]+)\(([^()]*)\)/g, (_, name, arg) =>
    ['not', 'is', 'has'].includes(name) ? ` ${arg}` : name === 'where' ? '' : ' :x',
  );
  const a = (s.match(/#[\w-]+/g) ?? []).length;
  const b = (s.match(/\.[\w-]+|\[[^\]]+\]|(?<!:):[\w-]+/g) ?? []).length;
  const c =
    (s.match(/(^|[\s>+~])[a-z][\w-]*/gi) ?? []).length + (s.match(/::[\w-]+/g) ?? []).length;
  return `${a},${b},${c}`;
}

/**
 * The base/variant rule pairs whose cascade order the split could flip: a variant rule upstream
 * placed BEFORE a base rule (now after it, in a later `<style>`), at equal specificity, for the
 * same pseudo-element, setting a property of the same family (`margin` ~ `margin-left`), whose
 * subjects (last compound selectors) could be one element — they share a class, or one has none.
 * Each as `base selector → variant selector`; `ORDER_CONFLICT_EXCEPTIONS` lists the reviewed
 * pairs that can't select the same element after all.
 */
export async function variantOrderConflicts(entry) {
  if (!COMPONENT_STYLE_VARIANTS[entry]) return [];
  const {default: postcss} = await import('postcss');
  const subject = sel =>
    requiredClasses(
      sel
        .split(/\s*[\s>+~]\s*/)
        .filter(Boolean)
        .pop() ?? '',
    );
  const family = prop =>
    prop.startsWith('--') ? prop : prop.replace(/^-(webkit|moz)-/, '').split('-')[0];
  const rules = [];
  postcss.parse(await compileRaw(entry)).walkRules(rule => {
    if (rule.parent.type === 'atrule' && rule.parent.name === 'keyframes') return;
    const props = new Set();
    rule.walkDecls(d => props.add(family(d.prop)));
    for (const selector of rule.selectors) {
      rules.push({
        selector,
        variant: variantOfSelector(entry, selector),
        specificity: specificity(selector),
        pseudoElement: selector.match(/::[\w-]+/)?.[0] ?? '',
        subject: subject(selector),
        props,
      });
    }
  });
  const exceptions = ORDER_CONFLICT_EXCEPTIONS[entry] ?? {};
  const conflicts = [];
  rules.forEach((v, i) => {
    if (!v.variant) return;
    for (const b of rules.slice(i + 1)) {
      if (
        !b.variant &&
        b.specificity === v.specificity &&
        b.pseudoElement === v.pseudoElement &&
        (!b.subject.length || !v.subject.length || b.subject.some(c => v.subject.includes(c))) &&
        [...v.props].some(p => b.props.has(p)) &&
        exceptions[b.selector] !== v.selector
      ) {
        conflicts.push(`${b.selector} → ${v.selector}`);
      }
    }
  });
  return conflicts;
}

/** Wraps `text` as ` * `-prefixed doc-comment lines of at most 100 columns. */
function docLines(text) {
  const lines = [];
  let line = '';
  for (const word of text.split(/\s+/)) {
    if (line && ` * ${line} ${word}`.length > 100) {
      lines.push(` * ${line}`);
      line = word;
    } else {
      line = line ? `${line} ${word}` : word;
    }
  }
  if (line) lines.push(` * ${line}`);
  return lines.join('\n');
}

/** `css` as the body of a template literal. */
const templateLiteral = css =>
  css.replace(/\\/g, '\\\\').replace(/`/g, '\\`').replace(/\$\{/g, '\\${');

/** `MatButtonStyleVariant` for `button`. */
export const styleVariantTypeName = entry =>
  `${styleHookName(entry)
    .replace(/^use/, '')
    .replace(/Styles$/, '')}StyleVariant`;

/** `export type <name> = 'a' | 'b';`, one member per line past 100 columns (as prettier). */
function typeDeclaration(name, members) {
  const line = `export type ${name} = ${members.map(m => `'${m}'`).join(' | ')};\n\n`;
  return line.length <= 101
    ? line
    : `export type ${name} =\n${members.map(m => `  | '${m}'`).join('\n')};\n\n`;
}

/** The generated `<entry>/<entry>-styles.ts` for an entry. */
export async function renderStylesModule(entry) {
  const {base, variants} = await splitComponentStyles(entry);
  const header =
    `// Generated from scss/${entry}/${entry}-prebuilt.scss by scripts/component-styles.mjs — do not\n` +
    `// edit; run \`pnpm -C src/qwik-material generate-component-styles\`.\n`;
  const registers =
    `Registers this entry point's CSS — \`scss/${entry}/${entry}-prebuilt.scss\`, compiled inside ` +
    `\`@layer qwik-material\` — for the rendering document, once: upstream's ` +
    `${COMPONENT_STYLES[entry]} (src/material/${entry}/), attached when the component is first ` +
    `created, unscoped (\`ViewEncapsulation.None\`). Server rendering writes it before the ` +
    `first instance; a component first rendered in the browser brings it with its own chunk. ` +
    `Call it as the component's FIRST hook — Qwik keys a \`useStyles$\` \`<style>\` by the call ` +
    `site AND the hook's index in the component, so only first-hook calls share one ` +
    `\`<style>\` (README "Component styles"). Exported for markup rendered without the ` +
    `component (a hand-written host, a plain render function).`;
  if (!variants.length) {
    return (
      header +
      `import {useStyles$} from '@qwik.dev/core';\n\n` +
      `/**\n${docLines(registers)}\n */\n` +
      `export function ${styleHookName(entry)}(): void {\n` +
      `  useStyles$(\n    \`${templateLiteral(base)}\`,\n  );\n` +
      `}\n`
    );
  }
  const type = styleVariantTypeName(entry);
  const config = COMPONENT_STYLE_VARIANTS[entry];
  const typeDoc = docLines(
    `The optional parts of this entry point's CSS, each its own \`<style>\` registered only by a ` +
      `component that renders it (scripts/component-styles.mjs \`COMPONENT_STYLE_VARIANTS\`): ` +
      variants.map(v => `\`'${v.name}'\`, ${config[v.name].doc}`).join('; ') +
      '.',
  );
  const hookDoc = docLines(
    `${registers.replace("this entry point's CSS", "this entry point's base CSS and the `variants` given")} ` +
      `Every call takes the same ${variants.length + 1} hook positions — the base sheet, then one ` +
      `per variant in declaration order (\`useConstant(undefined)\` for a variant not asked for) ` +
      `— so a variant's \`<style>\` has one id wherever it is registered, and a variant asked for ` +
      `only by a later render (a button switching appearance, a badge getting content) still ` +
      `registers then.`,
  );
  const variantCalls = variants
    .map(
      ({name, css}) =>
        `  // ${name}: ${config[name].doc.replace(/\s+/g, ' ')}\n` +
        `  if (variants.includes('${name}')) {\n` +
        `    useStyles$(\n      \`${templateLiteral(css)}\`,\n    );\n` +
        `  } else {\n    useConstant(undefined);\n  }\n`,
    )
    .join('');
  return (
    header +
    `import {useConstant, useStyles$} from '@qwik.dev/core';\n\n` +
    `/**\n${typeDoc}\n */\n` +
    typeDeclaration(
      type,
      variants.map(v => v.name),
    ) +
    `/**\n${hookDoc}\n */\n` +
    `export function ${styleHookName(entry)}(...variants: readonly ${type}[]): void {\n` +
    `  useStyles$(\n    \`${templateLiteral(base)}\`,\n  );\n` +
    variantCalls +
    `}\n`
  );
}

/** Entries whose committed module differs from a fresh compile (or is missing). */
export async function staleComponentStyles() {
  const stale = [];
  for (const entry of COMPONENT_STYLE_ENTRIES) {
    const current = await readFile(componentStylePaths(entry).module, 'utf8').catch(
      () => undefined,
    );
    if (current !== (await renderStylesModule(entry))) stale.push(entry);
  }
  return stale;
}

/** The error for stale entries: which files, and the command that regenerates them. */
export function staleMessage(stale) {
  return (
    `[qwik-material] stale generated component styles: ` +
    `${stale.map(e => `${e}/${e}-styles.ts`).join(', ')} no longer match their Sass. ` +
    'Run `pnpm -C src/qwik-material generate-component-styles` and commit the result.'
  );
}

/** Writes every entry's generated module whose content changed; returns the entries written. */
export async function writeComponentStyles() {
  const written = [];
  for (const entry of COMPONENT_STYLE_ENTRIES) {
    const next = await renderStylesModule(entry);
    const file = componentStylePaths(entry).module;
    const current = await readFile(file, 'utf8').catch(() => undefined);
    if (current === next) continue;
    await writeFile(file, next, 'utf8');
    written.push(entry);
  }
  return written;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  if (process.argv.includes('--check')) {
    const stale = await staleComponentStyles();
    if (stale.length) {
      console.error(staleMessage(stale));
      process.exit(1);
    }
    console.log('[qwik-material] component styles up to date');
    process.exit(0);
  }
  const written = await writeComponentStyles();
  console.log(
    written.length
      ? `[qwik-material] regenerated ${written.map(e => `${e}/${e}-styles.ts`).join(', ')}`
      : '[qwik-material] component styles up to date',
  );
}
