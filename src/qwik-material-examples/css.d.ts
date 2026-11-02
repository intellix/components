// Ambient declaration for plain, unscoped CSS side-effect imports (`import './foo.css'`), used by
// several of these docs-example modules that copy an upstream component's verbatim `.css` file
// next to the example (see e.g. `table/example/index.tsx`). Vite/Qwik handle these at build time
// regardless — this only satisfies `tsc`, which has no declaration for a bare `*.css` module on
// its own. Mirrors `src/qwik-cdk-dev-app/src/css.d.ts`.
declare module '*.css';
