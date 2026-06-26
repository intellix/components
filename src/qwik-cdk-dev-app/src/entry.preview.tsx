/**
 * Local preview entry for the qwik-cdk dev-app.
 *
 * Qwik City's `vite preview` plugin mounts the default-exported middleware on
 * Vite's preview server. Built from `vite build --ssr src/entry.preview.tsx`
 * → `server/entry.preview.js`.
 *
 * Production deployments should use `entry.ssr.tsx` instead (this file is
 * dev-loop only).
 */
import {createQwikCity} from '@builder.io/qwik-city/middleware/node';
// @ts-expect-error - virtual module provided by qwik-city/vite plugin
import qwikCityPlan from '@qwik-city-plan';
// @ts-expect-error - virtual module provided by qwik vite plugin
import {manifest} from '@qwik-client-manifest';
import render from './entry.ssr';

export default createQwikCity({render, qwikCityPlan, manifest});
