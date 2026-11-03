/**
 * Widens a closed palette-name union so it ALSO accepts an arbitrary string,
 * while keeping the named members as editor autocomplete suggestions.
 *
 * Mirrors an asymmetry already present in real Angular Material: several
 * components' public `color` *Input* is typed `string | null` (any token an
 * app cares to style via its own `.mat-<value>` CSS, confirmed per-component
 * against upstream source — see each component's own `color` prop doc
 * comment for the exact upstream line reference), while the *default-options
 * token* used for app-wide defaults (`Mat*Config.color`) stays
 * `ThemePalette`-only (`'primary' | 'accent' | 'warn' | undefined`). This
 * type is applied ONLY at the per-instance prop site, never to a `Mat*Config`
 * field, to keep that same asymmetry.
 *
 * `T | (string & {})` — not a bare `T | string`, which TypeScript collapses
 * to plain `string` and loses the literal members from autocomplete — is the
 * standard idiom for this ("branded string" widening).
 */
export type OpenString<T extends string> = T | (string & {});
