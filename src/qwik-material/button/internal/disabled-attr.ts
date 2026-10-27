/**
 * Upstream's `[attr.disabled]="_getDisabledAttribute()"` host binding writes
 * the literal boolean `true` through Angular's attribute renderer, which
 * stringifies it to the attribute value `"true"` (`disabled="true"`) rather
 * than the standard HTML empty-string boolean-attribute form Qwik's `boolean`
 * JSX prop produces (`disabled=""`). See button/SYNC.md.
 *
 * Qwik's JSX types `disabled` on `<button>`/`<a>` as `boolean | undefined`
 * (mirrors the native DOM property), so there is no typed way to pass the
 * string `"true"` directly. This helper returns the real runtime value
 * (`'true'` or `undefined`) through a `boolean | undefined`-shaped lie: the
 * SSR attribute writer only special-cases the *exact* boolean `true` as the
 * empty-attribute form (see `_setAttribute`/the opening-element writer in
 * `@builder.io/qwik/dist/core.mjs`), so a string value renders as
 * `disabled="true"` exactly as Angular does, while TypeScript stays happy at
 * the call site.
 */
export function disabledAttr(value: boolean): boolean | undefined {
  return (value ? 'true' : undefined) as unknown as boolean | undefined;
}
