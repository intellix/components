/**
 * Local preview entry for the qwik-cdk dev-app.
 *
 * Qwik Router's `vite preview` plugin mounts the default-exported middleware on
 * Vite's preview server. Built from `vite build --ssr src/entry.preview.tsx`
 * → `server/entry.preview.js`.
 *
 * Production deployments should use `entry.ssr.tsx` instead (this file is
 * dev-loop only).
 *
 * v2: `createQwikRouter` no longer takes explicit `qwikCityPlan`/`manifest`
 * params — the router config and client manifest are resolved internally
 * (see @qwik.dev/router's e2e/adapters-e2e starter, the authoritative
 * reference for this pattern at rc.4).
 */
import {createQwikRouter} from '@qwik.dev/router/middleware/node';
import render from './entry.ssr';

export default createQwikRouter({render});
