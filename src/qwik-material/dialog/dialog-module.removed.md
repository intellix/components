# Not ported: dialog-module.ts
NgModules do not exist in Qwik. The consumer surface is the
`useMatDialog()` hook (see `mat-dialog.ts`). The default-options,
scroll-strategy, and animations-disabled contexts are wired via
`<QwikMaterialProvider>` (see `qwik-material-provider.tsx`).
