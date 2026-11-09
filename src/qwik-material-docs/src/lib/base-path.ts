/**
 * The site's base path — Vite's `base` (set from `DOCS_BASE` at build time, e.g. `/components/`
 * for a GitHub Pages project site; `/` otherwise). Always ends with `/`.
 */
export const BASE_PATH: string = import.meta.env.BASE_URL;

/** Prefixes a root-relative site path (`/components/button/`) with the base path. Anything else
 *  (external URLs, `#fragments`, already-relative paths) is returned unchanged. */
export function withBase(path: string): string {
  return path.startsWith('/') && !path.startsWith('//') ? BASE_PATH + path.slice(1) : path;
}
