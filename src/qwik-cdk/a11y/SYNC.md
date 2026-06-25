# a11y — Angular CDK sync status

## Ported items

### `_IdGenerator`

- Source: `src/cdk/a11y/id-generator.ts`
- Destination: `src/qwik-cdk/a11y/id-generator.ts`
- Changes from CDK original:
  - Removed `@Service()` decorator and all Angular DI (`inject`, `APP_ID`).
  - Simplified to a plain class with an incrementing `counter` (no per-prefix map, no `_appId` infix, no `randomize` flag).
  - Added `ID_GENERATOR` context and `useIdGenerator()` hook for Qwik DI.

### `InteractivityChecker`

- Source: `src/cdk/a11y/interactivity-checker/interactivity-checker.ts`
- Destination: `src/qwik-cdk/a11y/interactivity-checker/interactivity-checker.ts`
- Changes from CDK original:
  - Removed `@Service()` decorator.
  - Removed `inject(Platform)` — replaced with constructor parameter `platform: Platform = new Platform()`.
  - Dropped `import { Service, inject } from '@angular/core'`.
  - All helper functions and logic ported verbatim.
