# @angular-community/qwik-cdk/text-field

Qwik port of [@angular/cdk/text-field](https://github.com/angular/components/tree/main/src/cdk/text-field).

- `useCdkTextareaAutosize({minRows, maxRows})` — directive-hook form of
  `[cdkTextareaAutosize]`; spread `hostProps` onto a plain `<textarea>` or
  `qwik-material/input`'s `<MatInput as="textarea">`. `enabled`/`resizeTrigger` signals
  control it from outside.
- `createTextareaAutosize(textarea, options)` — the underlying measuring/resizing engine, if
  you need it without the hook wiring.
- `useCdkAutofill()` — directive-hook form of `[cdkAutofill]`; spread `hostProps` onto an
  input-like element, read `isAutofilled` reactively.
- `createAutofillMonitor()` — the underlying `animationstart`-based detector.

Import `@angular-community/qwik-cdk/text-field-prebuilt.css` (or `@use
'@angular-community/qwik-cdk/scss/text-field'` in your own Sass) for the structural CSS
these two depend on (`.cdk-textarea-autosize`'s `resize: none`, the
`cdk-text-field-autofill-monitored` keyframe trick).

See `SYNC.md` for every deviation from upstream.
