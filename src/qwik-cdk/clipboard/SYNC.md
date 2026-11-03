# clipboard — Angular CDK sync status

Added 2026-11-03 (blockers/cdk expansion — new entry point).
Last synced from upstream: `v21.2.14` (`8fe4d6a8ffcf`).

## Ported items

### `PendingCopy`

- Source: `src/cdk/clipboard/pending-copy.ts`
- Destination: `pending-copy.ts`
- Changes from CDK original:
  - `createPendingCopy(text, doc?)` factory (object literal + closures) instead of a `class`
    — same convention as `createFocusTrap` in `qwik-cdk/a11y`.
  - Guarded with `if (!isBrowser) return {copy: () => false, destroy: () => {}}` at the top
    — upstream has no such guard because it's only ever constructed from
    `Clipboard.beginCopy()`, itself only ever called from a directive's click handler
    (browser-only in practice); this port makes that assumption explicit rather than relying
    on "nobody calls this during SSR" convention alone.
  - The `_document` constructor parameter is a plain `doc: Document = document` default
    parameter instead of Angular's `inject(DOCUMENT)`.
  - Everything else (the fixed-position hidden textarea, `readOnly` for the iOS
    screen-jump workaround, `fullscreenElement` insertion, `execCommand('copy')` +
    restoring the previous focus) ported verbatim.

### `Clipboard`

- Source: `src/cdk/clipboard/clipboard.ts`
- Destination: `clipboard.ts`
- Changes from CDK original:
  - `copyToClipboard(text, doc?)` / `beginCopyToClipboard(text, doc?)` plain functions
    instead of an `@Injectable({providedIn: 'root'})` service — the upstream service has no
    state of its own (it's a pure `inject(DOCUMENT)` + `new PendingCopy(...)` wrapper), so no
    factory/context indirection is needed at all, unlike every other `@Injectable` ported
    elsewhere in this package.
  - Renamed from upstream's `copy`/`beginCopy` method names to avoid shadowing the DOM's own
    global `Clipboard` interface and to read clearly as free functions at an import site.

### `CdkCopyToClipboard` → `useCdkCopyToClipboard()`

- Source: `src/cdk/clipboard/copy-to-clipboard.ts`
- Destination: `use-cdk-copy-to-clipboard.ts`
- Changes from CDK original:
  - Directive → directive-hook (`qwik-material/core/host-props.ts`'s pattern): returns
    `{hostProps: {onClick$}, copy}` instead of owning a host element itself. `hostProps` is
    typed as a small local `CdkCopyToClipboardHostProps` (`{onClick$, [key: string]:
    unknown}`) rather than importing `qwik-material/core/host-props.ts`'s `HostProps` —
    qwik-material depends on qwik-cdk, never the reverse; the two are structurally
    compatible (that `HostProps` is an all-optional-fields-plus-index-signature interface)
    so a plain `{onClick$}` object already satisfies it for `mergeHostProps()`/a direct
    spread onto a `qwik-material` component.
  - `@Input('cdkCopyToClipboard') text` / `@Input('cdkCopyToClipboardAttempts') attempts` →
    plain `props.text`/`props.attempts`.
  - `@Output('cdkCopyToClipboardCopied') copied = new EventEmitter<boolean>()` →
    `props.onCopied$?: QRL<(successful: boolean) => void>`.
  - `inject(CDK_COPY_TO_CLIPBOARD_CONFIG, {optional: true})` → `useContext(
    CDK_COPY_TO_CLIPBOARD_CONFIG, {})` — passing `{}` (not `undefined`) as the context
    default, since `useContext(id, undefined)` throws in this Qwik version (see this
    package's top-level pitfalls list / grep `useOptional` elsewhere in this port for the
    same workaround).
  - `_ngZone.runOutsideAngular(() => setTimeout(attempt, 1))` → plain `setTimeout(attempt,
    1)` — no zone concept in Qwik.
  - `ngOnDestroy`'s pending-copy cleanup (`_pending` `Set`, clearing `_currentTimeout`) is
    not ported: each `copy()` call's retry loop owns its own single `pending`/timeout
    locally and tears itself down on completion; there's no per-instance teardown lifecycle
    to hook (the hook returns a value used directly in the SAME render, not a
    component with its own `ngOnDestroy`-equivalent moment — see this package's
    top-level pitfalls list on why a directive hook's internal closures must stay local
    rather than being captured into a component-owned cleanup registry). A component
    unmounting mid-retry simply lets the in-flight `setTimeout` fire once more harmlessly
    (it only touches its own local `pending`/calls `onCopied$`, never touches any
    signal/DOM the unmounted component owned).
  - `getAttempts()`/`runCopyAttempts()` resolution order (`attempts` param → `props.attempts`
    → `CDK_COPY_TO_CLIPBOARD_CONFIG.attempts` → `1`) matches upstream's constructor-time
    `config.attempts` fallback exactly, just re-resolved on every `copy()` call instead of
    once at construction (consistent with this port's "read props live" convention — see
    `qwik-material/tooltip`'s `use-mat-tooltip.ts` for the same "resolveConfig() called fresh
    inside every handler" shape).

## Intentionally not ported

- `CdkClipboardModule` (`clipboard-module.ts`) — Qwik has no module concept.

## Open deviations

- No parity/functional-spec coverage yet for the retry-attempts path specifically (requires
  intercepting `execCommand('copy')` to force a failure) — see the dev-app scenario/spec
  added alongside this entry point for the happy-path coverage that does exist.
