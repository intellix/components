/**
 * Upstream's `[attr.disabled]="_getDisabledAttribute()"` host binding writes the literal boolean
 * `true` through Angular's attribute renderer, which stringifies it to `disabled="true"` rather
 * than the empty-string boolean-attribute form. See button/SYNC.md.
 *
 * Spread the result onto the host (`{...disabledAttr(x)}`) instead of passing `disabled`: Qwik's
 * client renderer assigns any prop that exists on the element as a DOM PROPERTY
 * (`smartSetProperty`'s `prop in elm` branch), so `disabled="true"` set on the client becomes
 * `el.disabled = 'true'`, which the browser reflects as `disabled=""` — only SSR'd buttons kept
 * `"true"`. The upper-case key isn't a property name, so Qwik falls through to `setAttribute`
 * (and the SSR writer emits it verbatim); HTML attribute names are case-insensitive, so both
 * produce exactly `disabled="true"`, and removal (`removeAttribute('DISABLED')`) works the same.
 */
export function disabledAttr(value: boolean): {DISABLED?: 'true'} {
  return value ? {DISABLED: 'true'} : {};
}
