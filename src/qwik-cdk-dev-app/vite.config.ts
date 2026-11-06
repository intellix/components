import {defaultClientConditions, defaultServerConditions, defineConfig} from 'vite';
import {qwikVite} from '@qwik.dev/core/optimizer';
import {qwikRouter} from '@qwik.dev/router/vite';

export default defineConfig({
  plugins: [qwikRouter(), qwikVite()],
  // Honour the `qwik` export condition so qwik-cdk is consumed from source
  // (.ts/.tsx) instead of its pre-built dist. This lets the qwik optimizer
  // walk the library's QRLs and emit them into the dev-app's manifest.
  resolve: {
    conditions: ['qwik', ...defaultClientConditions],
  },
  ssr: {
    resolve: {
      conditions: ['qwik', ...defaultServerConditions],
    },
    // `@formisch/qwik` ships its `dist/index.qwik.js`/`internals.qwik.js` UNOPTIMIZED — real,
    // literal `$(...)` calls, same as qwik-cdk/qwik-material's own source, deliberately meant to
    // be processed by the CONSUMING app's Qwik Vite plugin (which extracts each `$()` into its
    // own lazy-loadable chunk) rather than pre-compiled into opaque QRL chunk references itself.
    // Without `noExternal`, Vite's SSR build treats a `node_modules` package as an external,
    // plain Node `import` — never handing its source to the Qwik plugin's own transform at all —
    // so the `$()` calls that DO still get extracted (JSX-prop auto-wrapping inside `useForm$`'s
    // callback, etc.) end up with no chunk path attached, confirmed live as a build-time-fine,
    // runtime `Code(Q14)` SSR serialization crash ("QRLs can not be dynamically resolved,
    // because it does not have a chunk path") the moment `useForm$()` is called at all.
    noExternal: ['@formisch/qwik'],
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
