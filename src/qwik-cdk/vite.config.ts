import {defineConfig} from 'vitest/config';
import {qwikVite} from '@builder.io/qwik/optimizer';
import dts from 'vite-plugin-dts';
import {resolve} from 'node:path';

const entries = ['platform', 'bidi', 'coercion', 'keycodes', 'portal', 'a11y', 'overlay', 'dialog'];

export default defineConfig({
  plugins: [qwikVite({csr: true, srcDir: '.'}), dts({outDirs: 'dist', insertTypesEntry: true})],
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
        /^\.\/root$/,
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
    include: ['**/*.spec.ts'],
  },
});
