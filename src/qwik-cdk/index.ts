// Top-level export. Per-entry-point exports live in their own index.ts files.
export {QwikCdkRoot} from './root';
export type {QwikCdkRootProps} from './root';
// The QWIK_CDK umbrella + its shape are exposed so downstream packages
// (e.g. qwik-material) can reuse the same overlay registry + dispatchers
// that <QwikCdkRoot> installs, rather than parallel state.
export {QWIK_CDK} from './internals/internals';
export type {QwikCdkInternals} from './internals/internals';
