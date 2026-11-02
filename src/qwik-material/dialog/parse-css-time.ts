/**
 * Parses a CSS time value into milliseconds.
 *
 * Accepts:
 *   - `number` (assumed ms)
 *   - `<n>ms` — e.g. '150ms'
 *   - `<n>s`  — e.g. '0.15s'
 *   - `<n>` (bare number-string) — assumed ms for parity with Angular's coerceNumberProperty
 *
 * Returns `null` for undefined/null/unparseable input so callers can fall back
 * to their own defaults.
 */
export function parseCssTime(v: number | string | undefined | null): number | null {
  if (v == null) return null;
  if (typeof v === 'number') return Number.isFinite(v) ? v : null;
  const m = v.trim().match(/^(\d+(?:\.\d+)?)(ms|s)?$/);
  if (!m) return null;
  const n = parseFloat(m[1]);
  if (!Number.isFinite(n)) return null;
  return m[2] === 's' ? n * 1000 : n;
}
