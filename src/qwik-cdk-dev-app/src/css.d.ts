// Ambient declaration for plain, unscoped CSS side-effect imports (`import './foo.css'`), used by
// docs-example routes that copy an upstream component's verbatim `.css` file next to the route
// (see e.g. `routes/mat-table/example/index.tsx`). Vite/Qwik handle these at build time regardless
// — this only satisfies `tsc`, which has no declaration for a bare `*.css` module on its own.
declare module '*.css';
