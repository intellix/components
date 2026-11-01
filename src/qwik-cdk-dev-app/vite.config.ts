import {defineConfig} from 'vite';
import {qwikVite} from '@qwik.dev/core/optimizer';
import {qwikRouter} from '@qwik.dev/router/vite';

export default defineConfig({
  plugins: [qwikRouter(), qwikVite()],
  // Honour the `qwik` export condition so qwik-cdk is consumed from source
  // (.ts/.tsx) instead of its pre-built dist. This lets the qwik optimizer
  // walk the library's QRLs and emit them into the dev-app's manifest.
  resolve: {
    conditions: ['qwik', 'browser', 'module', 'import', 'default'],
  },
  ssr: {
    resolve: {
      conditions: ['qwik', 'node', 'module', 'import', 'default'],
    },
  },
  build: {
    // Vite 8's default CSS minifier (lightningcss 1.33) rejects
    // `::after:not(:empty)` ("Invalid pseudo class after pseudo element")
    // in the upstream-synced slide-toggle CSS
    // (qwik-material/scss/slide-toggle, mirrored verbatim from
    // src/material per the port's DOM/CSS parity rule — never rewritten).
    // Vite 7's bundled lightningcss accepted it; esbuild's CSS minifier
    // still does. Minification only affects byte size, never which rules
    // apply, so this has no effect on the parity harness's computed-style
    // comparisons.
    cssMinify: 'esbuild',
  },
});
