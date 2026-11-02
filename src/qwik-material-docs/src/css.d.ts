// Ambient declaration for plain, unscoped CSS side-effect imports (`import './foo.css'`).
// Vite/Qwik handle these at build time regardless — this only satisfies `tsc`. Mirrors
// `src/qwik-cdk-dev-app/src/css.d.ts`.
declare module '*.css';
