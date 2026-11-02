/**
 * SSR middleware used by `scripts/prerender.mjs` to produce this site's static HTML files (see
 * that script's header comment for why a hand-rolled prerender script is used here instead of
 * `@qwik.dev/router`'s `ssgAdapter` — a build-time-only, per-route serialization crash tied to
 * `<QwikCdkRoot>` specifically under the SSG worker pipeline, not reproducible under this exact
 * same `createQwikRouter` Node middleware, which `src/qwik-cdk-dev-app` already uses successfully
 * for its own `vite preview`).
 */
import {createQwikRouter} from '@qwik.dev/router/middleware/node';
import render from './entry.ssr';

export default createQwikRouter({render});
