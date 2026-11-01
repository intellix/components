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
});
