# @angular-community/qwik-cdk/clipboard

Qwik port of [@angular/cdk/clipboard](https://github.com/angular/components/tree/main/src/cdk/clipboard).

- `copyToClipboard(text, doc?)` / `beginCopyToClipboard(text, doc?)` — plain functions
  (upstream's `Clipboard` service has no state of its own, so no factory/context is needed).
- `createPendingCopy(text, doc?)` — the deferred-copy primitive these two build on.
- `useCdkCopyToClipboard({text, attempts, onCopied$})` — directive-hook form of
  `[cdkCopyToClipboard]`; spread `hostProps` onto the trigger element
  (`<button {...clip.hostProps}>`). See `qwik-material/core/host-props.ts`'s doc comment for
  the general "directive hook" pattern this follows.
- `CDK_COPY_TO_CLIPBOARD_CONFIG` — Qwik context for the default `attempts`.

See `SYNC.md` for every deviation from upstream.
