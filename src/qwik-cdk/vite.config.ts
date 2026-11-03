import {defineConfig} from 'vitest/config';
import {qwikVite} from '@qwik.dev/core/optimizer';
import dts from 'vite-plugin-dts';
import {resolve} from 'node:path';

const entries = [
  'platform',
  'bidi',
  'coercion',
  'keycodes',
  'layout',
  'portal',
  'a11y',
  'accordion',
  'stepper',
  'overlay',
  'dialog',
  'table',
  'tree',
  'collections',
  'clipboard',
  'text-field',
];

export default defineConfig({
  plugins: [
    qwikVite({csr: true, srcDir: '.'}),
    dts({outDirs: 'dist', insertTypesEntry: true}),
    {
      name: 'qwik-cdk-compile-sass-prebuilt',
      apply: 'build',
      async closeBundle() {
        const sass = await import('sass');
        const fs = await import('node:fs/promises');
        const path = await import('node:path');
        const entries: [string, string][] = [
          ['scss/overlay/overlay-prebuilt.scss', 'dist/overlay-prebuilt.css'],
          ['scss/a11y/a11y-prebuilt.scss', 'dist/a11y-prebuilt.css'],
          ['scss/text-field/text-field-prebuilt.scss', 'dist/text-field-prebuilt.css'],
        ];
        for (const [src, out] of entries) {
          const result = sass.compile(path.resolve(__dirname, src), {style: 'expanded'});
          await fs.mkdir(path.dirname(path.resolve(__dirname, out)), {recursive: true});
          await fs.writeFile(path.resolve(__dirname, out), result.css, 'utf8');
        }
      },
    },
    {
      name: 'qwik-cdk-copy-scss',
      apply: 'build',
      async closeBundle() {
        const fs = await import('node:fs/promises');
        const path = await import('node:path');
        const src = path.resolve(__dirname, 'scss');
        const dst = path.resolve(__dirname, 'dist/scss');
        await fs.cp(src, dst, {recursive: true});
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
      external: ['@qwik.dev/core', '@qwik.dev/core/build', '@qwik.dev/router'],
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
  },
});
