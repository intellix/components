import {defineConfig} from 'vitest/config';
import {qwikVite} from '@builder.io/qwik/optimizer';
import dts from 'vite-plugin-dts';
import {resolve} from 'node:path';

const entries = [
  'core',
  'dialog',
  'button',
  'card',
  'toolbar',
  'badge',
  'icon',
  'progress-bar',
  'progress-spinner',
  'divider',
  'grid-list',
  'list',
  'button-toggle',
  'slide-toggle',
  'expansion',
  'radio',
  'checkbox',
  'sort',
  'tabs',
  'sidenav',
  'snack-bar',
  'bottom-sheet',
  'form-field',
  'input',
  'stepper',
  'chips',
  'tooltip',
  'slider',
  'select',
  'menu',
  'table',
  'tree',
  'paginator',
];

export default defineConfig({
  plugins: [
    qwikVite({csr: true, srcDir: '.'}),
    dts({outDirs: 'dist', insertTypesEntry: true}),
    {
      name: 'qwik-material-compile-sass-prebuilt',
      apply: 'build',
      async closeBundle() {
        const sass = await import('sass');
        const fs = await import('node:fs/promises');
        const path = await import('node:path');
        const sassEntries: [string, string][] = [
          ['scss/core/core-prebuilt.scss', 'dist/core-prebuilt.css'],
          ['scss/dialog/dialog-prebuilt.scss', 'dist/dialog-prebuilt.css'],
          ['scss/button/button-prebuilt.scss', 'dist/button-prebuilt.css'],
          ['scss/card/card-prebuilt.scss', 'dist/card-prebuilt.css'],
          ['scss/toolbar/toolbar-prebuilt.scss', 'dist/toolbar-prebuilt.css'],
          ['scss/badge/badge-prebuilt.scss', 'dist/badge-prebuilt.css'],
          ['scss/icon/icon-prebuilt.scss', 'dist/icon-prebuilt.css'],
          ['scss/progress-bar/progress-bar-prebuilt.scss', 'dist/progress-bar-prebuilt.css'],
          [
            'scss/progress-spinner/progress-spinner-prebuilt.scss',
            'dist/progress-spinner-prebuilt.css',
          ],
          ['scss/divider/divider-prebuilt.scss', 'dist/divider-prebuilt.css'],
          ['scss/grid-list/grid-list-prebuilt.scss', 'dist/grid-list-prebuilt.css'],
          ['scss/list/list-prebuilt.scss', 'dist/list-prebuilt.css'],
          ['scss/button-toggle/button-toggle-prebuilt.scss', 'dist/button-toggle-prebuilt.css'],
          ['scss/slide-toggle/slide-toggle-prebuilt.scss', 'dist/slide-toggle-prebuilt.css'],
          ['scss/expansion/expansion-prebuilt.scss', 'dist/expansion-prebuilt.css'],
          ['scss/radio/radio-prebuilt.scss', 'dist/radio-prebuilt.css'],
          ['scss/checkbox/checkbox-prebuilt.scss', 'dist/checkbox-prebuilt.css'],
          ['scss/sort/sort-prebuilt.scss', 'dist/sort-prebuilt.css'],
          ['scss/tabs/tabs-prebuilt.scss', 'dist/tabs-prebuilt.css'],
          ['scss/sidenav/sidenav-prebuilt.scss', 'dist/sidenav-prebuilt.css'],
          ['scss/snack-bar/snack-bar-prebuilt.scss', 'dist/snack-bar-prebuilt.css'],
          ['scss/bottom-sheet/bottom-sheet-prebuilt.scss', 'dist/bottom-sheet-prebuilt.css'],
          ['scss/form-field/form-field-prebuilt.scss', 'dist/form-field-prebuilt.css'],
          ['scss/stepper/stepper-prebuilt.scss', 'dist/stepper-prebuilt.css'],
          ['scss/chips/chips-prebuilt.scss', 'dist/chips-prebuilt.css'],
          ['scss/tooltip/tooltip-prebuilt.scss', 'dist/tooltip-prebuilt.css'],
          ['scss/slider/slider-prebuilt.scss', 'dist/slider-prebuilt.css'],
          ['scss/select/select-prebuilt.scss', 'dist/select-prebuilt.css'],
          ['scss/menu/menu-prebuilt.scss', 'dist/menu-prebuilt.css'],
          ['scss/table/table-prebuilt.scss', 'dist/table-prebuilt.css'],
          ['scss/tree/tree-prebuilt.scss', 'dist/tree-prebuilt.css'],
          ['scss/paginator/paginator-prebuilt.scss', 'dist/paginator-prebuilt.css'],
        ];
        for (const [src, out] of sassEntries) {
          const srcAbs = path.resolve(__dirname, src);
          try {
            const result = sass.compile(srcAbs, {style: 'expanded'});
            await fs.mkdir(path.dirname(path.resolve(__dirname, out)), {recursive: true});
            await fs.writeFile(path.resolve(__dirname, out), result.css, 'utf8');
          } catch (err: unknown) {
            const e = err as {code?: string; message?: string};
            if (
              e?.code === 'ENOENT' ||
              (e?.message ?? '').includes('does not exist') ||
              (e?.message ?? '').includes('no such file or directory')
            ) {
              console.warn(`[qwik-material] skipping ${src} — not yet present.`);
              continue;
            }
            throw err;
          }
        }
      },
    },
    {
      name: 'qwik-material-copy-scss',
      apply: 'build',
      async closeBundle() {
        const fs = await import('node:fs/promises');
        const path = await import('node:path');
        const src = path.resolve(__dirname, 'scss');
        const dst = path.resolve(__dirname, 'dist/scss');
        try {
          await fs.cp(src, dst, {recursive: true});
        } catch (err: unknown) {
          const e = err as {code?: string};
          if (e?.code === 'ENOENT') return;
          throw err;
        }
      },
    },
  ],
  build: {
    outDir: 'dist',
    lib: {
      formats: ['es'],
      entry: {
        index: resolve(__dirname, 'index.ts'),
        ...Object.fromEntries(
          entries.map(e => [`${e}/index`, resolve(__dirname, `${e}/index.ts`)]),
        ),
      },
    },
    rollupOptions: {
      external: [
        '@builder.io/qwik',
        '@builder.io/qwik/build',
        '@builder.io/qwik-city',
        '@angular-community/qwik-cdk',
        /^@angular-community\/qwik-cdk\/.+$/,
        // qwik-material/table depends on qwik-material/sort (MatSortHeader
        // integration) — a same-package cross-entry import, the first of
        // its kind here. Externalizing it (resolved via this package's own
        // `exports` map at consume time, same as every qwik-cdk import
        // above) avoids bundling sort's code into table's own output.
        /^@angular-community\/qwik-material\/.+$/,
      ],
      output: {preserveModules: false, entryFileNames: '[name].js'},
    },
    target: 'es2022',
    sourcemap: true,
    emptyOutDir: true,
  },
  test: {
    environment: 'happy-dom',
    globals: false,
    include: ['**/*.spec.ts', '**/*.spec.tsx'],
    setupFiles: ['./vitest.setup.ts'],
  },
});
