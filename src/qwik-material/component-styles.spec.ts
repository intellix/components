import {existsSync, readFileSync, readdirSync} from 'node:fs';
import {join, relative} from 'node:path';
import ts from 'typescript';
import {describe, expect, it} from 'vitest';
import {
  COMPONENT_STYLE_ENTRIES,
  compileComponentStyles,
  componentStylePaths,
  renderStylesModule,
} from './scripts/component-styles.mjs';

/**
 * Every entry point with structural CSS ships it in `<entry>/<entry>-styles.ts` (generated from its
 * Sass by `scripts/component-styles.mjs`, wrapped in `@layer qwik-material`): `useMat<Entry>Styles()`,
 * exported from the entry point — called by every component upstream declares that stylesheet on
 * (`styleUrl`), as its FIRST hook.
 */
const root = import.meta.dirname;

const pascal = (entry: string) =>
  entry.replace(/(^|-)([a-z])/g, (_, __, c: string) => c.toUpperCase());
const hookName = (entry: string) => `useMat${pascal(entry)}Styles`;

/**
 * The components that register each entry's CSS: upstream's components with that stylesheet as
 * their `styleUrl`(s) (or that load it through a style loader, e.g. `MatBadge`'s
 * `_MatBadgeStyleLoader`), under their qwik-material names, plus qwik-material's own parts that
 * render that markup themselves (a panel, a container's factory). `[hook, …]` lists a component
 * that registers another entry's CSS too, because it renders that entry's markup by hand
 * (e.g. the datepicker toggle's icon button) — the other entry's hook comes FIRST, so it shares
 * the `<style>` the real component registers.
 */
const REGISTERS: Record<string, string[]> = {
  autocomplete: ['MatAutocomplete', 'MatAutocompletePanel'],
  badge: ['useMatBadge'],
  'bottom-sheet': ['MatBottomSheetContainer'],
  button: ['MatButton', 'MatIconButton', 'MatFabButton', 'MatMiniFabButton'],
  'button-toggle': ['MatButtonToggleGroup', 'MatButtonToggle'],
  card: ['MatCard'],
  checkbox: ['MatCheckbox'],
  chips: ['MatChipSet', 'MatChipListbox', 'MatChipGrid', 'MatChip', 'MatChipOption', 'MatChipRow'],
  datepicker: [
    'MatCalendar',
    'MatCalendarBody',
    'MatDateRangeInput',
    'MatDatepickerContent',
    'MatDatepickerToggle',
  ],
  dialog: ['MatDialogContainer'],
  divider: ['MatDivider'],
  expansion: ['MatAccordion', 'MatExpansionPanel', 'MatExpansionPanelHeader'],
  'form-field': ['MatFormField'],
  'grid-list': ['MatGridTile', 'GridListStyles'],
  icon: ['MatIcon'],
  list: ['MatList', 'MatNavList', 'MatActionList', 'MatListItem'],
  // `MenuStyles`: the plain-function `MatMenu` placeholder's loader (its `<mat-menu>` host).
  menu: ['MenuStyles', 'MenuPanel'],
  paginator: ['MatPaginator'],
  'progress-bar': ['MatProgressBar'],
  'progress-spinner': ['createSpinner'],
  radio: ['MatRadioGroup', 'MatRadioButton'],
  select: ['MatSelect'],
  sidenav: ['createContainer'],
  'slide-toggle': ['MatSlideToggle'],
  slider: ['MatSlider'],
  'snack-bar': ['MatSnackBarContainer', 'SimpleSnackBar'],
  sort: ['MatSortHeader'],
  stepper: ['MatStepper', 'MatStepHeaderItem'],
  table: ['MatTable'],
  tabs: ['MatTabGroup', 'MatTabNav', 'MatTabLink'],
  // `MatTimepickerInput` renders upstream `MatTimepicker`'s `<mat-timepicker>` host.
  timepicker: ['MatTimepickerInput', 'MatTimepickerPanel'],
  toolbar: ['MatToolbar'],
  tooltip: ['TooltipPanel'],
  tree: ['MatTree'],
};

/**
 * Components registering ANOTHER entry's CSS, before their own (see REGISTERS). The datepicker's
 * and paginator's markup composes buttons and their CSS overrides the buttons' at equal
 * specificity (`.mat-calendar-period-button { min-width: 0 }` over `.mat-mdc-button`'s 64px), so
 * the button CSS has to come first — as the old global import order had it — and every one of
 * their registering components calls the two hooks in the same positions, sharing both `<style>`s.
 */
const ALSO_REGISTERS: Record<string, string[]> = {
  MatCalendar: ['useMatButtonStyles'],
  MatCalendarBody: ['useMatButtonStyles'],
  MatDateRangeInput: ['useMatButtonStyles'],
  MatDatepickerContent: ['useMatButtonStyles'],
  MatDatepickerToggle: ['useMatButtonStyles'],
  MatCalendarHeader: ['useMatButtonStyles'],
  MatTimepickerToggle: ['useMatButtonStyles'],
  MatPaginator: ['useMatButtonStyles'],
  PaginatorNavButton: ['useMatButtonStyles'],
};

function sources(dir: string): string[] {
  return readdirSync(dir, {withFileTypes: true}).flatMap(entry => {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) return sources(path);
    return /\.tsx?$/.test(entry.name) && !/\.(spec|d)\.tsx?$/.test(entry.name) ? [path] : [];
  });
}

/**
 * For every `component$(…)`/hook body in `files`, the leading `useMat*Styles()` calls (in order),
 * keyed by the declaring const/function name, and every style-hook call NOT in that leading run.
 */
function styleHookCalls(files: string[]) {
  const leading = new Map<string, string[]>();
  const misplaced: string[] = [];
  for (const file of files) {
    const text = readFileSync(file, 'utf8');
    const sf = ts.createSourceFile(file, text, ts.ScriptTarget.ESNext, true, ts.ScriptKind.TSX);
    const isStyleHookCall = (s: ts.Statement): string | undefined =>
      ts.isExpressionStatement(s) &&
      ts.isCallExpression(s.expression) &&
      ts.isIdentifier(s.expression.expression) &&
      /^useMat[A-Za-z]+Styles$/.test(s.expression.expression.text)
        ? s.expression.expression.text
        : undefined;
    const owner = (node: ts.Node): string => {
      for (let n: ts.Node | undefined = node; n; n = n.parent) {
        if (ts.isVariableDeclaration(n) && ts.isIdentifier(n.name)) return n.name.text;
        if (ts.isFunctionDeclaration(n) && n.name) return n.name.text;
      }
      return '?';
    };
    const visit = (node: ts.Node): void => {
      if (ts.isBlock(node) && node.parent && ts.isFunctionLike(node.parent)) {
        let i = 0;
        const calls: string[] = [];
        for (; i < node.statements.length; i++) {
          const name = isStyleHookCall(node.statements[i]);
          if (!name) break;
          calls.push(name);
        }
        if (calls.length) leading.set(owner(node), calls);
        for (; i < node.statements.length; i++) {
          if (isStyleHookCall(node.statements[i])) {
            const line = sf.getLineAndCharacterOfPosition(node.statements[i].getStart()).line + 1;
            misplaced.push(`${relative(root, file)}:${line}`);
          }
        }
      }
      ts.forEachChild(node, visit);
    };
    visit(sf);
  }
  return {leading, misplaced};
}

describe('component styles', () => {
  it.each(COMPONENT_STYLE_ENTRIES)(
    '%s: the committed styles module is its Sass, compiled, inside @layer qwik-material',
    async entry => {
      const file = componentStylePaths(entry).module;
      expect(existsSync(file), `${relative(root, file)} — run generate-component-styles`).toBe(
        true,
      );
      expect(
        readFileSync(file, 'utf8'),
        `${relative(root, file)} is stale — run generate-component-styles`,
      ).toBe(await renderStylesModule(entry));
      // One layer block holding every rule.
      const css = await compileComponentStyles(entry);
      expect(css).toMatch(/^@layer qwik-material\{[^]+\}$/);
      expect(css.match(/@layer/g)).toHaveLength(1);
    },
  );

  it.each(COMPONENT_STYLE_ENTRIES)('%s: the entry point exports its style hook', async entry => {
    const api = readFileSync(join(root, entry, 'public-api.ts'), 'utf8');
    expect(api).toContain(`export {${hookName(entry)}} from './${entry}-styles';`);
    const hook = readFileSync(componentStylePaths(entry).module, 'utf8');
    expect(hook).toMatch(new RegExp(`export function ${hookName(entry)}\\(\\): void \\{`));
    // The CSS is a literal in the `useStyles$` call (no `?inline` import — see the generator).
    expect(hook).toContain('useStyles$(\n    `@layer qwik-material{');
    expect(hook).not.toMatch(/^import .*css/m);
  });

  it('every style hook call is a leading statement (shared <style> id, see README)', () => {
    const {misplaced} = styleHookCalls(
      COMPONENT_STYLE_ENTRIES.flatMap(e => sources(join(root, e))),
    );
    expect(misplaced).toEqual([]);
  });

  it.each(Object.entries(REGISTERS))(
    '%s: each upstream styleUrl component registers the CSS first',
    (entry, components) => {
      const {leading} = styleHookCalls(sources(join(root, entry)));
      for (const component of components) {
        expect(leading.get(component), component).toEqual([
          ...(ALSO_REGISTERS[component] ?? []),
          hookName(entry),
        ]);
      }
    },
  );

  it.each(Object.entries(ALSO_REGISTERS))(
    '%s registers the CSS of the markup it renders by hand',
    (component, hooks) => {
      const {leading} = styleHookCalls(
        COMPONENT_STYLE_ENTRIES.flatMap(e => sources(join(root, e))),
      );
      expect(leading.get(component)?.slice(0, hooks.length), component).toEqual(hooks);
    },
  );

  it('REGISTERS covers every entry with CSS', () => {
    expect(Object.keys(REGISTERS).sort()).toEqual([...COMPONENT_STYLE_ENTRIES].sort());
  });
});
