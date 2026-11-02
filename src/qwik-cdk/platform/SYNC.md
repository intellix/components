# platform — sync notes

Synced from `main` at commit `7ef5967ff21070a1dfdb044132e7a3ee175688a1`.

## Files ported

| Source (CDK) | Destination (qwik-cdk) | Notes |
|---|---|---|
| `src/cdk/platform/platform.ts` | `src/qwik-cdk/platform/platform.ts` | See deviations below |
| `src/cdk/platform/features/input-types.ts` | `src/qwik-cdk/platform/features/input-types.ts` | Verbatim; no Angular imports to remove |
| `src/cdk/platform/features/passive-listeners.ts` | `src/qwik-cdk/platform/features/passive-listeners.ts` | Verbatim; no Angular imports to remove |
| `src/cdk/platform/features/scrolling.ts` | `src/qwik-cdk/platform/features/scrolling.ts` | Verbatim; no Angular imports to remove |
| `src/cdk/platform/features/shadow-dom.ts` | `src/qwik-cdk/platform/features/shadow-dom.ts` | Verbatim; no Angular imports to remove |
| `src/cdk/platform/features/test-environment.ts` | `src/qwik-cdk/platform/features/test-environment.ts` | Verbatim; no Angular imports to remove |

## Files NOT ported

| Source (CDK) | Reason |
|---|---|
| `src/cdk/platform/platform-module.ts` | Angular `NgModule`; no Qwik equivalent needed |

## Deviations from CDK `platform.ts`

1. **No `@Injectable()`** — The CDK `Platform` class uses Angular's DI system. In Qwik-CDK the class is a plain class instantiated by consumers; no decorator needed.
2. **Added `PLATFORM` context** — A `ContextId<Platform>` created with `createContextId('qwik-cdk/platform')` replaces Angular's `InjectionToken`.
3. **Added `usePlatform()` hook** — Returns `useContext(PLATFORM)` for use inside Qwik components.
4. **Re-exported `isBrowser`** — Sourced from `@builder.io/qwik/build` and re-exported so consumers don't need to depend on the build module directly.
5. **`hasGlobalProp` helper** — Defined inline in `platform.ts` (CDK has no equivalent; the CDK version uses `typeof window !== 'undefined'` inline).
