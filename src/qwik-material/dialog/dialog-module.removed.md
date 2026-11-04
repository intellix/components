# Not ported: dialog-module.ts
NgModules do not exist in Qwik. The consumer surface is the
`useMatDialog()` hook (see `mat-dialog.ts`). The default-options and
scroll-strategy contexts are wired via `useMatDialogProvider()` (see
`use-mat-dialog-provider.ts`); animations-disabled via
`useMatAnimationsProvider()` (see `use-animations-disabled.ts`).
