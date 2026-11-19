import {defineConfig} from 'vitest/config';
import {qwikVite} from '@qwik.dev/core/optimizer';
import dts from 'vite-plugin-dts';
import {resolve} from 'node:path';
import {wrapInLayer, writeComponentStyles} from './scripts/component-styles.mjs';

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
  'timepicker',
  'menu',
  'table',
  'tree',
  'paginator',
  'autocomplete',
  'datepicker',
  // Aggregator entry point — imports from every entry point ABOVE via this package's own
  // `exports` map (never the reverse, to avoid a cycle); see providers/public-api.ts's module
  // doc comment and providers/SYNC.md.
  'providers',
];

export default defineConfig({
  plugins: [
    qwikVite({csr: true, srcDir: '.'}),
    dts({outDirs: 'dist', insertTypesEntry: true}),
    {
      // Each component entry point's CSS is generated into the SOURCE tree, committed: the
      // `useMat<Entry>Styles()` hook in `<entry>/<entry>-styles.ts`, with the compiled CSS as a
      // literal — see scripts/component-styles.mjs. Regenerated here so a build (and so
      // `pack:local`) always ships CSS matching the Sass; `component-styles.spec.ts` catches a
      // stale commit.
      name: 'qwik-material-component-styles',
      apply: 'build',
      async buildStart() {
        const written = await writeComponentStyles();
        if (written.length) {
          console.warn(
            `[qwik-material] regenerated ${written.join(', ')} component styles — commit them.`,
          );
        }
      },
    },
    {
      // The CSS that stays global — an app imports each once: the core (default theme, ripple,
      // focus indicators, option, pseudo-checkbox, …) and the typography/elevation classes. Inside
      // the same `@layer qwik-material` as every component's CSS, so the app's unlayered CSS wins.
      name: 'qwik-material-compile-sass-prebuilt',
      apply: 'build',
      async closeBundle() {
        const sass = await import('sass');
        const fs = await import('node:fs/promises');
        const path = await import('node:path');
        const sassEntries: [string, string][] = [
          ['scss/core/core-prebuilt.scss', 'dist/core-prebuilt.css'],
          ['scss/core/typography-prebuilt.scss', 'dist/typography-prebuilt.css'],
          ['scss/core/elevation-prebuilt.scss', 'dist/elevation-prebuilt.css'],
        ];
        for (const [src, out] of sassEntries) {
          const result = sass.compile(path.resolve(__dirname, src), {style: 'expanded'});
          await fs.mkdir(path.dirname(path.resolve(__dirname, out)), {recursive: true});
          await fs.writeFile(path.resolve(__dirname, out), wrapInLayer(result.css), 'utf8');
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
        '@qwik.dev/core',
        '@qwik.dev/core/build',
        '@qwik.dev/router',
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
