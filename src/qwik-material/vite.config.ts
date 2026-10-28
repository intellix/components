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
  'sort',
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
          ['scss/sort/sort-prebuilt.scss', 'dist/sort-prebuilt.css'],
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
