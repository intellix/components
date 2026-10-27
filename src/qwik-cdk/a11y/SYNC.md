# a11y — Angular CDK sync status

## Ported items

### `_IdGenerator`

- Source: `src/cdk/a11y/id-generator.ts`
- Destination: `src/qwik-cdk/a11y/id-generator.ts`
- Changes from CDK original:
  - Removed `@Service()` decorator and all Angular DI (`inject`, `APP_ID`).
  - Simplified to a plain class with an incrementing `counter` (no per-prefix map, no `_appId` infix, no `randomize` flag).
  - Added `ID_GENERATOR_COUNTER` context (a plain `Signal<number>`, not the
    `IdGenerator` object itself — a closure-bearing value put through
    `useContextProvider` needs `noSerialize()`, which goes `undefined` across
    the SSR→resume boundary until a client-only `useVisibleTask$` repopulates
    it; too late for an id that must already be in the SSR HTML) and
    `useIdGenerator()` hook for Qwik DI, consumed first by
    `qwik-material/button-toggle` (2026-10-27 remediation) for
    `mat-button-toggle-N` / `mat-button-toggle-group-N` ids. `<QwikCdkRoot>`
    provides it backed by the same counter signal used for `cdk-dialog-N` /
    `cdk-overlay-N`, so every id family shares one monotonic sequence
    app-wide, closer to upstream's actual singleton `_IdGenerator` service
    (upstream itself keeps a separate counter *per prefix* via a `Map` — this
    port keeps the earlier simplification of one global counter for all
    prefixes, which is unobservable to consumers since prefixes never
    collide and the qwik-material parity harness normalizes id digits away).
    A caller without a `<QwikCdkRoot>` ancestor (e.g. an isolated unit test)
    falls back to a private counter.

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
  - Added `FOCUS_MONITOR` context (for manual sharing — see below) and a
    `useFocusMonitor(hostRef, {checkChildren})` convenience hook (qwik-material
    button consumes it, 2026-10-27): mirrors `inject(FocusMonitor)` +
    `ngAfterViewInit`'s `monitor(el, checkChildren)` + `ngOnDestroy`'s
    `stopMonitoring(el)`, applying/clearing the `cdk-*-focused` classes.
    Deliberately does *not* read `FOCUS_MONITOR` from context itself: a
    `FocusMonitor` is a closure full of functions, and capturing a
    context-resolved one into a `useVisibleTask$` from the component's render
    scope crashes SSR serialization (Qwik must serialize anything the task's
    closure captures from the outer scope; functions aren't serializable —
    "Code(3)"). The hook instead creates a fresh `FocusMonitor` *inside* its
    own task (a plain top-level import, like `createFocusTrap`/
    `createOverlayKeyboardDispatcher` elsewhere in this package), so only the
    import reference crosses the `$` boundary. Each consumer gets its own
    engine; the resulting DOM is identical to one shared instance, just with
    one extra set of `document` listeners per consumer. Something that truly
    needs one shared instance across a subtree can still provide/read
    `FOCUS_MONITOR` manually, following the `noSerialize()` + reactive-store
    pattern in `qwik-cdk/root.tsx` (`internals.keyboardDispatcher`, etc.).
