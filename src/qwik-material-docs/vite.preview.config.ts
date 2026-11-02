import {defineConfig} from 'vite';

/**
 * Serves the prerendered static site in `dist/` exactly as a static host would. Deliberately
 * without the Qwik/Qwik Router plugins: with them, `vite preview` server-renders every request
 * from the separately built preview bundle, whose manifest hashes don't match the prerendered
 * client build (e.g. a 500 for the preloader's `*-bundle-graph.json`).
 */
export default defineConfig({
  build: {outDir: 'dist'},
  preview: {port: 4195, strictPort: true},
});
