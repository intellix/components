# text-field — Angular CDK sync status

Added 2026-11-03 (blockers/cdk expansion — new entry point).
Last synced from upstream: `v21.2.14` (`8fe4d6a8ffcf`).

## Ported items

### `CdkTextareaAutosize`

- Source: `src/cdk/text-field/autosize.ts`
- Destination: `textarea-autosize.ts` (the measuring/resizing engine) +
  `use-cdk-textarea-autosize.ts` (the Qwik hook)
- Changes from CDK original:
  - `createTextareaAutosize(textarea, options)` factory (object literal + closures) for the
    core algorithm — same convention as `createFocusTrap` in `qwik-cdk/a11y`, and like it,
    not safe to store inside a `useSignal`/`useStore` (see `qwik-cdk/collections/
    data-source.ts`'s doc comment on the general pitfall).
  - `useCdkTextareaAutosize()` is a directive hook (`qwik-material/core/host-props.ts`'s
    pattern — see that module's doc comment), returning `{hostProps, enabled,
    resizeTrigger}` instead of a directive owning its own host. **This is the integration
    point for `MatInput as="textarea"`**: `MatInput`'s own props (`qwik-material/input/
    mat-input.tsx`) already happen to accept every key `hostProps` sets (`ref`, `class`,
    `rows`) — spreading `{...autosize.hostProps}` onto `<MatInput as="textarea">` works with
    ZERO changes to `MatInput` itself, exactly mirroring upstream applying
    `cdkTextareaAutosize` and `matInput` as two independent directives on the same host
    element. Chosen over adding a dedicated `autosize`/`autosizeMinRows`/`autosizeMaxRows`
    prop to `MatInput` because (a) it needs no change to an already-parity-tested component,
    (b) it's usable identically on a bare `<textarea>` with no `MatInput` involved at all,
    and (c) it's the more Angular-faithful shape — upstream's directive composition, not a
    component-specific prop, is literally how this behavior is expressed on the real side.
  - `ngAfterViewInit`/`ngDoCheck` (both already gated by `this._platform.isBrowser` on the
    real side — SSR never resizes there either) → a single `useVisibleTask$` that creates a
    fresh engine and attaches `focus`/`blur`/`input`/window-`resize` listeners via plain
    `addEventListener` — NOT a JSX `onInput$`/`onFocus$`/`onBlur$` host prop, specifically so
    it composes for free with a consumer's own handlers on the same element (a raw native
    listener never competes with Qwik's own JSX-prop event system the way `useOn()` would —
    see this package's top-level pitfalls list on `useOn()` replacing a same-named JSX-prop
    handler on the same root). Re-runs (and re-creates the engine + listeners) whenever
    `enabled`/`resizeTrigger` change.
  - `@Input('cdkAutosizeMinRows')`/`@Input('cdkAutosizeMaxRows')` → `options.minRows`/
    `options.maxRows` (static — read once per `useCdkTextareaAutosize()` call; mirrors how
    other hooks in this package read their own options, see e.g. `useFocusTrap`).
  - `@Input({alias: 'cdkTextareaAutosize', transform: booleanAttribute}) enabled` →
    `enabled: Signal<boolean>` returned from the hook — set `.value = false` to reset (mirrors
    upstream's own setter: `(this._enabled = value) ? this.resizeToFitContent(true) :
    this.reset()`), `.value = true` to re-enable.
  - `resizeToFitContent()`/`reset()`'s PUBLIC, template-ref-callable (`exportAs:
    'cdkTextareaAutosize'`) forms are not exposed as directly-callable functions from the
    hook — there is no live engine instance anywhere outside the `useVisibleTask$`'s own
    closure to call into (storing one in a signal hits the same "object with methods can't
    cross the SSR→resume boundary" pitfall noted above). Instead, bump
    `resizeTrigger.value++` to force a `resizeToFitContent(true)` re-measurement (e.g. after
    setting the textarea's value programmatically, outside of a real `input` event).
    **Open deviation:** there's no equivalent of calling `reset()` while staying `enabled`
    (upstream's public method does this independently of the `enabled` flag) — toggling
    `enabled.value` off then back on achieves the same visual result but is not identical
    API shape; no current scenario needs the distinction.
  - `_handleFocusEvent`/`_hasFocus` → `engine.setHasFocus(boolean)`, called from the
    `focus`/`blur` listeners.
  - `_scrollToCaretPosition`'s "only if not destroyed and has focus" guard simplified: since
    the engine is recreated per task-run rather than torn down mid-call, there's no
    "destroyed but a stale rAF still fires" race to guard against the same way upstream does
    with its `_destroyed` `Subject`.
  - Everything else (line-height/placeholder-height caching via a cloned, hidden textarea,
    the Firefox-specific measuring class, the margin-filler focus workaround, the 2px
    padding/4px subtraction Chrome measurement workaround) ported verbatim — see
    `textarea-autosize.spec.ts`, adapted from upstream `autosize.spec.ts`.
  - Upstream's `placeholder` getter/setter (which also drives `_cacheTextareaPlaceholderHeight`
    on every placeholder change) is exposed as `notePlaceholderChanged()` instead — call it
    after changing a plain `<textarea>`'s `placeholder` attribute yourself (this port has no
    property-interception mechanism to hook a setter the way upstream's `@Input() placeholder`
    does).

### `AutofillMonitor` / `CdkAutofill`

- Source: `src/cdk/text-field/autofill.ts`
- Destination: `autofill-monitor.ts` (the engine) + `use-cdk-autofill.ts` (the Qwik hook)
- Changes from CDK original:
  - `createAutofillMonitor()` factory instead of an `@Injectable({providedIn: 'root'})`
    service — same convention as `createFocusMonitor` in `qwik-cdk/a11y`.
  - `monitor(element)` returning `Observable<AutofillEvent>` → `monitor(element, onChange):
    () => void` (plain callback registration, returning an unsubscribe function) — no RxJS
    dependency, same convention as `ListKeyManager.onChange()`/
    `UniqueSelectionDispatcher.listen()` elsewhere in this package.
  - `useCdkAutofill()` is a directive hook (same pattern as `useCdkTextareaAutosize()`
    above): `{hostProps: {ref, class}, isAutofilled: Signal<boolean>}`. Client-only
    (`useVisibleTask$`) — real autofill detection is inherently a live-browser-only concern,
    same as upstream gates the whole feature behind `this._platform.isBrowser`.
  - `this._renderer.listen(element, 'animationstart', listener, {passive: true})` → plain
    `element.addEventListener('animationstart', listener, {passive: true})`. No `NgZone`
    (`_ngZone.run(() => subject.next(...))`) — the callback runs directly; Qwik has no zone
    concept.
  - **`qwik-material/input`'s `MatInput` already renders `cdk-text-field-autofill-monitored`
    unconditionally (browser-only concept, no live detection — see that component's own
    SYNC.md deviation #3, written before this entry point existed).** This port's
    `CDK_TEXT_FIELD_AUTOFILL_MONITORED_CLASS` constant (in `use-cdk-autofill.ts`) is the
    exact same string (`'cdk-text-field-autofill-monitored'`), confirmed by direct string
    comparison — `MatInput` is left untouched (no behavior change, no new dependency on this
    entry point) since it has no parity scenario exercising real browser autofill either;
    `useCdkAutofill()` is available for a consumer that DOES want the real, live detection
    (e.g. a plain `<input>` outside of `MatInput`, or a future `MatInput` enhancement).
  - `ngOnDestroy`'s "stop monitoring every still-monitored element" is `destroy()`, called
    explicitly by whoever owns a `createAutofillMonitor()` instance — `useCdkAutofill()`'s own
    cleanup calls it on its own instance.
  - `CdkAutofill` (the `[cdkAutofill]` attribute directive form — host-bound output) is
    folded entirely into `useCdkAutofill()`; there's no separate "I'm only the event, not the
    detector" layer the way upstream splits `AutofillMonitor` (service) from `CdkAutofill`
    (directive) — this hook does both, since nothing in this port needs the monitor service
    and the hook as genuinely separate consumers.

### Structural CSS (`_text-field.scss` / `text-field-prebuilt.scss`)

- Source: `src/cdk/text-field/_index.scss`, `src/cdk/text-field/text-field-prebuilt.scss`
- Destination: `qwik-cdk/scss/text-field/_index.scss`,
  `qwik-cdk/scss/text-field/text-field-prebuilt.scss`
- Ported verbatim (selectors, declarations, comments) — see `scripts/diff-prebuilt-css.mjs`'s
  new `text-field-prebuilt.scss` pair for the byte-for-byte compiled-CSS parity check (same
  pattern as the existing `overlay-prebuilt.css`/`a11y-prebuilt.css` pairs).
- **Not ported:** `text-field-autofill-color($background, $foreground)` — a theming mixin
  for an app that wants to recolor an autofilled field (keyframe-per-call-site, with a
  module-global counter for unique keyframe names). No consumer in this port customizes
  autofill colors; add it if one needs to.
- `qwik-material/scss/form-field/_mdc-text-field-textarea-overrides.scss`'s comment
  ("make sure the `cdk-textarea-autosize` class is still able to override the `resize`
  property") already anticipated this entry point's `resize: none` rule — confirmed the two
  don't conflict (this partial's selector is scoped to `.mat-mdc-form-field-textarea-control`,
  this entry point's is `textarea.cdk-textarea-autosize`; both can apply to the same
  `<textarea as="textarea">` inside a `<MatFormField>`, with `cdk-textarea-autosize`'s plain
  element+class selector specificity winning over the form-field's class-only selector for
  the contested `resize` property — same specificity relationship upstream relies on).

## Intentionally not ported

- `CdkTextFieldModule` (`text-field-module.ts`) — Qwik has no module concept.
- `_CdkTextFieldStyleLoader` (`text-field-style-loader.ts`) — Angular's lazy-stylesheet-
  injection DI token; this port ships the structural CSS as a static `-prebuilt.css` /
  `scss/*` import instead (same convention as `overlay`/`a11y`'s `_CdkOverlayStyleLoader` /
  equivalent, already noted in `qwik-cdk/SYNC.md`'s top-level rebaseline entry).

## Open deviations

- `TextareaAutosize.reset()` while `enabled` stays `true` has no dedicated trigger from
  `useCdkTextareaAutosize()` — see the deviation note under `CdkTextareaAutosize` above.
- No functional/parity spec yet exercises `useCdkAutofill()`'s real detection path (requires
  either a genuine browser autofill or a synthetic `animationstart` dispatch in a Playwright
  page — the latter is straightforward and is a documented follow-up, same scope line as the
  retry-attempts path noted in `qwik-cdk/clipboard/SYNC.md`). The CSS keyframe trick itself
  (`.cdk-text-field-autofill-monitored:-webkit-autofill`) cannot be exercised by Playwright's
  own form autofill since it isn't a `:-webkit-autofill`-triggering mechanism; manual QA only.
