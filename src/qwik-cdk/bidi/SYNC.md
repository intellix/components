# bidi — sync notes

CDK reference: `src/cdk/bidi/public-api.ts` (angular/components main branch)

## Exported symbols in CDK vs Qwik-CDK

| CDK symbol | Status | Notes |
|---|---|---|
| `Direction` (type) | **Re-exported** | `'ltr' \| 'rtl'` — identical. |
| `Directionality` (class) | **Re-exported** | Signal-backed instead of `@Injectable`. `change` is a synchronous method that mutates the signal, replacing CDK's `EventEmitter`-based `change` Observable. `_resolveDirectionality` helper not ported (browser-direction detection not needed in Qwik SSR context). |
| `DIR_DOCUMENT` (InjectionToken) | **Removed** | Angular-specific DI token used to inject `Document` for initial dir detection. Not applicable in Qwik. Document access in SSR is handled through `@builder.io/qwik/server` primitives if needed in future. |
| `Dir` (directive) | **Removed** | See `dir.removed.md`. Angular structural directive. Consumers pass `direction` prop on `<QwikCdkRoot>` or `DialogConfig.direction`. |
| `BidiModule` (NgModule) | **Removed** | NgModules do not exist in Qwik. |

## Key behavioral differences

- **`Directionality.change`**: CDK exposes an `EventEmitter<Direction>` (Observable). Qwik-CDK exposes a synchronous `change(next: Direction): void` method that directly mutates the signal value. Subscribers react via Qwik's reactive system.
- **`Directionality.value`**: CDK uses Angular's `signal()` (getter-based). Qwik-CDK uses a plain-object signal shim `{ value: Direction }` in the constructor; `QwikCdkRoot` replaces this with a real `useSignal()` instance at context-provision time.
- **Initial direction detection**: CDK reads `document.body.dir` / `document.documentElement.dir` on construction (via `DIR_DOCUMENT`). Qwik-CDK defaults to `'ltr'`; consumers pass initial direction explicitly.

## Added symbols (Qwik-CDK only)

| Symbol | Purpose |
|---|---|
| `DIRECTIONALITY` (ContextId) | Qwik context for dependency injection of `Directionality`. Replaces Angular's `@Injectable()` DI. |
| `useDirectionality()` | Convenience hook — calls `useContext(DIRECTIONALITY)`. |
| `isDirection(v)` | Type guard narrowing `unknown` to `Direction`. |
