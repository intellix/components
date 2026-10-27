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

### `InputModalityDetector`

- Source: `src/cdk/a11y/input-modality/input-modality-detector.ts`
- Destination: `src/qwik-cdk/a11y/input-modality/input-modality-detector.ts`
- Changes from CDK original:
  - Removed `@Service()` decorator and all Angular DI (`inject`, `NgZone`, `RendererFactory2`, `DOCUMENT`, `InjectionToken`).
  - Removed RxJS (`BehaviorSubject`, `Observable`, `distinctUntilChanged`, `skip`).
  - Replaced `_modality` BehaviorSubject with a plain `{ value: InputModality }` signal shim (`readonly modality`).
  - Removed `modalityDetected` and `modalityChanged` RxJS observables; added `onModalityChange(cb)` callback registration for FocusMonitor integration.
  - Replaced `renderer.listen` with direct `document.addEventListener` (gated by `isBrowser` from `@builder.io/qwik/build`).
  - Added `destroy()` method that removes all event listeners and callbacks.
  - Inlined keycode constants (ALT, CONTROL, MAC_META, META, SHIFT) — no CDK import.
  - Inlined `isFakeMousedownFromScreenReader` and `isFakeTouchstartFromScreenReader` — no CDK import.
  - Inlined `_getEventTarget` helper.
  - Added `INPUT_MODALITY_DETECTOR` context and `useInputModalityDetector()` hook.

### `FocusMonitor`

- Source: `src/cdk/a11y/focus-monitor/focus-monitor.ts`
- Destination: `src/qwik-cdk/a11y/focus-monitor/focus-monitor.ts`
- Changes from CDK original:
  - Removed `@Service()` decorator and all Angular DI (`inject`, `NgZone`, `DOCUMENT`, `InjectionToken`).
  - Removed RxJS (`Observable`, `Subject`, `Subscription`, `takeUntil`, `observableOf`).
  - Constructor parameters: `(platform: Platform, modalityDetector: InputModalityDetector, detectionMode?)` — no NgZone.
  - `monitor()` returns `{ value: FocusOrigin }` signal shim instead of `Observable<FocusOrigin>`.
  - Replaced `Subject<FocusOrigin>` per element with a plain `{ value: FocusOrigin }` object.
  - Replaced RxJS subscription to `modalityDetected` with `InputModalityDetector.onModalityChange()` callback.
  - All `runOutsideAngular` / `this._ngZone.run()` calls removed — direct invocation.
  - Dropped `CdkMonitorFocus` directive (Angular component, not needed in Qwik port).
  - Dropped `coerceElement` — `monitor()` and `stopMonitoring()` accept `HTMLElement` only.
  - Inlined `_getEventTarget` and `_getShadowRoot` helpers.
  - `_onFocus` and `_onBlur` made public for direct triggering in tests (happy-dom does not fire focus events reliably).
  - Added `FOCUS_MONITOR` context and `useFocusMonitor()` hook.

### `FocusTrap` / `useFocusTrap`

- Source: `src/cdk/a11y/focus-trap/focus-trap.ts`
- Destination: `src/qwik-cdk/a11y/focus-trap/{focus-trap.ts,use-focus-trap.ts}`
- Changes from CDK original:
  - `FocusTrapFactory`/`ConfigurableFocusTrapFactory` collapsed into a single
    `createFocusTrap(element, checker, options)` factory + the `useFocusTrap()` hook (no
    Angular DI, no `ConfigurableFocusTrap` restore-on-destroy stack).
  - Anchor creation (`_createAnchor`) ported verbatim, including the `cdk-visually-hidden` class
    (fixed 2026-10-27 — was missing; see dialog/SYNC.md).
  - 2026-10-27 (DOM parity remediation): `useFocusTrap`'s `autoCapture: boolean` option replaced
    with `autoFocus: 'dialog' | 'first-tabbable' | 'first-heading' | string | boolean`, and a
    `restoreFocus: boolean` option added. `applyAutoFocus()` in `use-focus-trap.ts` now
    implements the same switch as upstream `CdkDialogContainer._trapFocus()` (including
    `_forceFocus()`'s temporary `tabindex="-1"` + blur/mousedown cleanup for non-natively-
    focusable targets), moved here from being dialog-specific since both `CdkDialogContainer`
    and `MatDialogContainer` need it identically.
