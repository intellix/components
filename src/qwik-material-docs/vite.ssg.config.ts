import {extendConfig} from '@qwik.dev/router/vite';
import {ssgAdapter} from '@qwik.dev/router/adapters/static/vite';
import baseConfig from './vite.config';

/**
 * NOT currently used by `pnpm build` — kept as a reference/documentation of the "normal" way to
 * do this. Static-site-generation build config following the official Qwik Router SSG starter
 * pattern (`@qwik.dev/router` rc.4's `starters/adapters/ssg/adapters/ssg/vite.config.ts`):
 * `vite build -c vite.ssg.config.ts` after the plain client `vite build`, writing generated HTML
 * directly into the client build's `dist/` directory.
 *
 * Running real pages through it fails every one with `Code(Q14)` ("QRL can not be dynamically
 * resolved") the moment `<QwikCdkRoot>` is in the tree — reproducible even on a one-line
 * `<div>Hello</div>` homepage with no other content, confirmed via extensive bisection (see
 * `scripts/prerender.mjs`'s header comment for the full writeup). This build uses that script's
 * hand-rolled prerenderer instead, which drives the same `createQwikRouter` Node SSR middleware
 * `qwik-cdk-dev-app` already uses successfully — this file is left in place in case a future
 * `@qwik.dev/router` patch release fixes the underlying issue and this becomes usable again.
 */
export default extendConfig(baseConfig, () => {
  return {
    build: {
      ssr: true,
      rolldownOptions: {
        input: ['@qwik-router-config'],
      },
    },
    plugins: [
      ssgAdapter({
        origin: 'https://qwik-material-docs.invalid',
      }),
    ],
  };
});
