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
// `component-styles.spec.ts` fails when a committed file no longer matches its Sass; the package
// build regenerates them too.
//
// The cascade layer: `useStyles$` styles land wherever a component first renders (in `<body>`
// during SSR, `<head>` when first rendered in the browser) — after an app's own stylesheets. Inside
// one named layer, every unlayered app/brand rule beats this package's rules whatever their order
// or specificity, as with Angular Material's styles in `<head>` before the app's. The global core
// CSS (`core-prebuilt.css`, plus typography/elevation) is wrapped in the same layer by the build
// (see `vite.config.ts`).
//
// Usage: node src/qwik-material/scripts/component-styles.mjs
// (also runnable via `pnpm -C src/qwik-material generate-component-styles`)

import {readFile, writeFile} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const packageRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

/** The cascade layer every qwik-material stylesheet is emitted in. */
export const LAYER = 'qwik-material';

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

/** `css` inside `@layer qwik-material { … }`. A `@charset`/`@import` can't sit in a layer block. */
export function wrapInLayer(css, {compressed = false} = {}) {
  if (/@charset|@import/.test(css)) {
    throw new Error('qwik-material: compiled CSS has a @charset/@import that cannot be layered');
  }
  return compressed ? `@layer ${LAYER}{${css.trim()}}` : `@layer ${LAYER} {\n${css.trimEnd()}\n}\n`;
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

/** An entry's CSS, compiled fresh from its Sass: compressed, inside the layer. */
export async function compileComponentStyles(entry) {
  const sass = await import('sass');
  const css = sass.compile(componentStylePaths(entry).scss, {
    style: 'compressed',
    charset: false,
  }).css;
  return wrapInLayer(css, {compressed: true});
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

/** The generated `<entry>/<entry>-styles.ts` for an entry. */
export async function renderStylesModule(entry) {
  const css = await compileComponentStyles(entry);
  const literal = css.replace(/\\/g, '\\\\').replace(/`/g, '\\`').replace(/\$\{/g, '\\${');
  const doc = docLines(
    `Registers this entry point's CSS — \`scss/${entry}/${entry}-prebuilt.scss\`, compiled inside ` +
      `\`@layer qwik-material\` — for the rendering document, once: upstream's ` +
      `${COMPONENT_STYLES[entry]} (src/material/${entry}/), attached when the component is first ` +
      `created, unscoped (\`ViewEncapsulation.None\`). Server rendering writes it before the ` +
      `first instance; a component first rendered in the browser brings it with its own chunk. ` +
      `Call it as the component's FIRST hook — Qwik keys a \`useStyles$\` \`<style>\` by the call ` +
      `site AND the hook's index in the component, so only first-hook calls share one ` +
      `\`<style>\` (README "Component styles"). Exported for markup rendered without the ` +
      `component (a hand-written host, a plain render function).`,
  );
  return (
    `// Generated from scss/${entry}/${entry}-prebuilt.scss by scripts/component-styles.mjs — do not\n` +
    `// edit; run \`pnpm -C src/qwik-material generate-component-styles\`.\n` +
    `import {useStyles$} from '@qwik.dev/core';\n\n` +
    `/**\n${doc}\n */\n` +
    `export function ${styleHookName(entry)}(): void {\n` +
    `  useStyles$(\n    \`${literal}\`,\n  );\n` +
    `}\n`
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
  const written = await writeComponentStyles();
  console.log(
    written.length
      ? `[qwik-material] regenerated ${written.map(e => `${e}/${e}-styles.ts`).join(', ')}`
      : '[qwik-material] component styles up to date',
  );
}
