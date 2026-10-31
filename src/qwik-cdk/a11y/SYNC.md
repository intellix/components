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
  - Added `FOCUS_MONITOR` context for manual sharing (see below).
  - **2026-10-27 (button-toggle port):** added `useFocusOrigin()`
    (`focus-origin/focus-origin.ts`) — a lazy, `useOn()`-based,
    per-component replacement that doesn't use this engine at all (two DOM
    native signals — `pointerdown` + `focusin`/`focusout` — instead of the
    full `InputModalityDetector` + `FocusMonitor` algorithm). First consumed
    by `qwik-material/button-toggle`.
  - **2026-10-27 (lazy-interactions remediation, rule 7 — no per-instance
    `useVisibleTask$` for interaction plumbing in components that appear
    many times per page):** removed the `useFocusMonitor(hostRef,
    {checkChildren})` convenience hook that used to live here. It had
    mirrored `inject(FocusMonitor)` + `ngAfterViewInit`'s `monitor(el,
    checkChildren)` + `ngOnDestroy`'s `stopMonitoring(el)` by creating a
    fresh `FocusMonitor` inside a `useVisibleTask$` (deliberately *not*
    reading `FOCUS_MONITOR` from context itself, since a `FocusMonitor` is a
    closure full of functions and capturing a context-resolved one into a
    `useVisibleTask$` from the component's render scope crashes SSR
    serialization — "Code(3)"; creating it fresh inside the task sidestepped
    that, the same pattern `createFocusTrap`/`createOverlayKeyboardDispatcher`
    use elsewhere in this package). That sidestep fixed the SSR crash but not
    the eagerness: the task still ran on every resumed instance regardless of
    whether the user ever focused the element, loading its JS chunk
    unconditionally. Its only consumers (`qwik-material/button`,
    `mat-icon-button`, `mat-fab-button`, `mat-mini-fab-button`) switched to
    `useFocusOrigin()` instead — same rendered `cdk-*-focused` classes (see
    button/SYNC.md deviation 2), zero eager JS. With no remaining consumers,
    the hook was deleted outright rather than reimplemented lazily on top of
    this engine: there is no way to lazily call `FocusMonitor.monitor()`
    without *also* deferring the call itself to a first interaction — at
    which point the result is just `useFocusOrigin()` with extra
    indirection, not a meaningfully different primitive. `createFocusMonitor`
    / `FocusMonitor` / `FOCUS_MONITOR` stay exported for a caller that
    genuinely needs the full engine — e.g. `focusVia()` (programmatic focus
    with an explicit origin, which `useFocusOrigin()` has no equivalent for)
    or one shared instance across a subtree via the `noSerialize()` +
    reactive-store pattern in `qwik-cdk/root.tsx`
    (`internals.keyboardDispatcher`, etc.) — just not as a per-instance
    convenience hook.
  - **2026-10-27 (expansion port):** added `focusVia(element, origin,
    options)` to `focus-origin.ts` — NOT built on this engine, despite the
    note directly above anticipating it as the reason a caller would reach
    for `FocusMonitor.focusVia()`. The need (`MatAccordion`'s
    `FocusKeyManager`-equivalent arrow-key navigation, and
    `MatExpansionPanelHeader`'s "focus returns to the header as `'program'`
    when its panel closes with focus inside") is specifically about
    overriding `useFocusOrigin()`'s own heuristic for one element's next
    focus event — `useFocusOrigin()` already has a lazy `focusin` listener
    on that exact element, so `focusVia()` just writes a one-shot
    `data-cdk-pending-focus-origin` attribute that listener checks first,
    then calls `.focus()`. This needs no shared engine, no global capture
    listener, and no `useVisibleTask$` — unlike `createFocusMonitor().monitor()`,
    which requires registering a document-level capture listener per
    element up front (fine for one-off callers, but `MatExpansionPanelHeader`
    can appear dozens of times per page in a long accordion, exactly the
    "components that appear many times per page" case rule 7 is about).
  - **2026-10-28 (tooltip port): `useFocusOrigin()`'s keyboard-vs-program
    distinction reworked twice, both times to fix a real bug caught by
    `qwik-material/tooltip`'s `message-change` scenario (bare
    `element.focus()` after a hover must resolve `'program'`, not
    `'keyboard'`) WITHOUT regressing every existing consumer's real
    Tab-navigation case:
    1. The hook previously read the browser's own `:focus-visible`
       pseudo-class to decide `'keyboard'`. Confirmed live: Chromium's
       native heuristic also matches `:focus-visible` for a bare scripted
       `.focus()` call with no real keydown/mousedown behind it at all
       (e.g. Playwright's `locator.focus()`) — conflating "scripted, no
       recent interaction" with "real keyboard navigation", where upstream
       `FocusMonitor.getFocusOrigin()` correctly falls through to
       `'program'`. Replaced with tracking real `keydown` events directly.
    2. Tracking `keydown`s only works if the tracking is truly eager — a
       Tab press's own default action (advancing focus, then firing
       `focusin`) can complete before ANY Qwik-lazy listener resolves
       (`useOn`: component-scoped, so often not even attached to the
       right element for Tab, which fires the keydown on the
       *previously*-focused element, not the new target; `useOnDocument`:
       document-scoped but still at least one microtask away even for an
       already-cached chunk) — both attempts, in turn, intermittently lost
       that race under real test-harness load and misreported a real Tab
       press as `'program'` (see `material-expansion`'s
       `tabIntoFirstHeader` step, which caught it). The fix that actually
       holds: `focus-origin/recent-keydown.ts`'s state lives on `window`
       (not a module-level `let` — nothing guarantees one shared module
       instance across this package's separately-built entry points), set
       by a literal inline `<script>` in `<QwikCdkRoot>`'s own SSR output
       (`qwik-cdk/root.tsx`) — not a QRL at all, so it runs synchronously
       as the browser parses that point in the HTML, before Qwik's own
       bundle has even started loading. No time-based expiry either (an
       earlier version used `FocusMonitor`'s own 1ms "IMMEDIATE mode"
       window): the flag persists until the next `focusin` consumes it or
       a newer `pointerdown` invalidates it, because unlike upstream
       (which reads its `origin` variable synchronously, same listener
       that set it) this hook's `focusin` handler is itself a lazily-
       resolved QRL reading a DIFFERENT handler's flag — a short window
       routinely closed before that resolution finished.

- **`wasRecentKeydown`/`consumeRecentKeydown` promoted to the public API (2026-10-31,
  directive-hooks remediation).** Previously internal to `focus-origin.ts` (same package, plain
  relative import). `qwik-material/tooltip`'s `useMatTooltip()` needs the exact same keyboard-vs-
  pointer heuristic but can't call `useFocusOrigin()` itself — that hook's `useOn()` registrations
  attach to "the calling component's own host," which isn't necessarily the right element once a
  directive hook is spread onto a DIFFERENT host component (see `qwik-material/core/host-props.ts`
  and `qwik-material/tooltip/SYNC.md`). Exporting these two plain, `window`-backed functions lets
  `useMatTooltip()` reproduce the identical algorithm via ordinary JSX handler props instead,
  with zero duplication of the actual flag-tracking logic.

### `LiveAnnouncer`

- Source: `src/cdk/a11y/live-announcer/live-announcer.ts`
- Destination: `src/qwik-cdk/a11y/live-announcer/live-announcer.ts`
- Added 2026-10-28 (snack-bar port) — previously deferred per this directory's README.
- Changes from CDK original:
  - Removed `@Service()` decorator and all Angular DI (`inject`, `NgZone`, `DOCUMENT`,
    `DomSanitizer`, `LIVE_ANNOUNCER_ELEMENT_TOKEN`/`LIVE_ANNOUNCER_DEFAULT_OPTIONS`). A plain
    `createLiveAnnouncer()` factory, same pattern as `createFocusTrap`/
    `createOverlayKeyboardDispatcher` elsewhere in this package.
  - `LiveAnnouncerMessage` (`string | SafeHtml`) narrowed to `string` — no `DomSanitizer`/
    `SafeHtml` concept in Qwik; the `_setInnerHtml` branch is dropped.
  - **The live element is created lazily, on the first `announce()` call**, not eagerly when the
    service is constructed — upstream creates its `<div class="cdk-live-announcer-element">` in
    `document.body` the moment `inject(LiveAnnouncer)` runs, which has no Qwik equivalent that
    doesn't also mean "ship + run JS for every page that merely imports this module" (lazy-
    interactions remediation rule 7). Once created, the element is identical to upstream's (same
    classes/attributes).
  - `CdkAriaLive` (the `[cdkAriaLive]` attribute directive) not ported — out of scope for the
    snack-bar port that motivated this file; no consumer yet.
  - `ngOnDestroy` → `destroy()` (plain method, called explicitly by whoever owns the instance).

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

### `ListKeyManager` / `FocusKeyManager` / `Typeahead`

- Source: `src/cdk/a11y/key-manager/{list-key-manager,focus-key-manager,typeahead}.ts`
- Destination: `src/qwik-cdk/a11y/key-manager/{list-key-manager,focus-key-manager,typeahead}.ts`
- Added 2026-10-28 (menu port) — first consumer is `qwik-material/menu`'s `MenuPanel`
  (`menu-runtime.ts`'s `openMenu`), which builds a `FocusKeyManager` over the panel's rendered
  `.mat-mdc-menu-item` elements once attached. Intended to be reusable as-is for
  select/autocomplete/listbox later, per the remediation design doc.
- Changes from CDK originals:
  - `createListKeyManager(items)` / `createFocusKeyManager(items)` factory functions (not
    classes) — same convention as `createFocusMonitor`/`createOverlayService` elsewhere in this
    package.
  - `tabOut`/`change` are plain callback-subscription sets (`onTabOut(cb)`/`onChange(cb)`, each
    returning an unsubscribe function) instead of RxJS `Subject`s — qwik-cdk has no RxJS
    dependency.
  - `items` is a plain array snapshot (`setItems()` replaces it) — no `QueryList`/Angular
    `Signal` constructor overload, since there's no Qwik equivalent of a live content query.
    `MenuPanel` doesn't need live reactivity here: it builds the manager once, from the DOM, after
    the (static, for one open instance) items have already rendered.
  - Keyboard matching uses `event.key` string comparisons (`'ArrowDown'`, `'Home'`, …) instead of
    numeric `keyCode` constants — matches this port's existing convention elsewhere (e.g.
    `qwik-material/dialog`'s Escape handling) and needs no `qwik-cdk/keycodes` import beyond
    `hasModifierKey`.
  - `Typeahead` ported as `createTypeahead()`, with the RxJS `Subject`+`debounceTime` pipeline
    replaced by a plain `setTimeout` debounce reproducing the same externally-observable
    behaviour (buffer letters, search starting after the current selection, first non-skipped
    label-prefix match wins).
  - `ListKeyManager`/`FocusKeyManager`'s interface methods are typed to return `this` (not the
    base `ListKeyManager<T>` interface type) specifically so a chained
    `createFocusKeyManager(items).withWrap().withHomeAndEnd()` keeps `FocusKeyManager<T>`'s extra
    `setFocusOrigin()` in its static type.
  - `createFocusKeyManager()` reassigns the returned manager's OWN `setActiveItem` property
    (shadowing the inherited one) rather than returning a separate wrapper object — needed because
    `ListKeyManager`'s internal call sites (`setNextItemActive`, the typeahead `onSelect` callback
    installed by a LATER `.withTypeAhead()` chain call) all invoke `this.setActiveItem(...)` with
    `this` bound to the manager instance itself; a wrapper with a different identity would never
    see those calls. See `focus-key-manager.ts`'s own doc comment for the full reasoning.
  - `ActivedescendantKeyManager` / `TreeKeyManager` / `NoopTreeKeyManager` not ported — no
    consumer needs them yet.
