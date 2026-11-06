import {defaultClientConditions, defaultServerConditions, defineConfig} from 'vite';
import {qwikVite} from '@qwik.dev/core/optimizer';
import {qwikRouter} from '@qwik.dev/router/vite';

/**
 * Base config for the qwik-material docs site. Mirrors `src/qwik-cdk-dev-app/vite.config.ts`
 * (the reference Qwik v2 app in this monorepo) — same `qwik` export-condition resolution so
 * qwik-cdk/qwik-material/qwik-material-examples are consumed from source (.ts/.tsx), letting the
 * Qwik optimizer walk their QRLs into this app's own manifest, and the same `cssMinify: 'esbuild'`
 * workaround (Vite 8's bundled lightningcss rejects a `::after:not(:empty)` selector in the
 * upstream-synced slide-toggle CSS this app also ships, via the shared `slide-toggle/example`
 * module).
 */
export default defineConfig({
  plugins: [qwikRouter(), qwikVite()],
  resolve: {
    conditions: ['qwik', ...defaultClientConditions],
  },
  ssr: {
    resolve: {
      conditions: ['qwik', ...defaultServerConditions],
    },
  },
  build: {
    cssMinify: 'esbuild',
  },
});
