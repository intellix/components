/**
 * Fetches and caches icon SVG text by URL. The Qwik-port equivalent of
 * upstream `MatIconRegistry`'s `_fetchIcon`/`_inProgressUrlFetches`/
 * `_cachedIconsByUrl` (`src/material/icon/icon-registry.ts`), collapsed into
 * one cache: a `Map<url, Promise<string>>` kept IN THIS (PLAIN) MODULE's
 * top-level scope, not in any Qwik signal/store. Deliberately NOT part of
 * any `useStore()`/context value — see `icon-registry.ts`'s module doc
 * comment for why ("class instances with methods can't be serialized into
 * resumable state — keep serializable data in signals/stores and logic in
 * plain module functions" applies just as much to a bare runtime cache: it
 * holds live `Promise` objects, which can't be serialized at all, and it
 * doesn't need to be — it's a process-local performance cache, exactly like
 * upstream's registry-instance-local one, just keyed by the JS module
 * instead of an Angular DI instance).
 *
 * A `Promise`, once settled, stays cheap to re-await — so unlike upstream
 * (which deletes from `_inProgressUrlFetches` on completion and promotes the
 * *resolved SVG element* into a separate `_cachedIconsByUrl` map), this
 * cache keeps the SAME settled `Promise<string>` in place permanently on
 * success, and ONLY deletes the entry on FAILURE (so a later call can retry
 * a URL that failed, e.g. because the server was briefly down) — one map,
 * same end result: a successful fetch is served from cache forever after,
 * concurrent in-flight requests for the same URL share one request.
 */

/** Module-level fetch cache, shared across every icon in this process (server) or tab (browser). */
const fetchCache = new Map<string, Promise<string>>();

/** @docs-private — exposed only for tests that need a clean slate between cases. */
export function _clearIconFetchCacheForTests(): void {
  fetchCache.clear();
}

/**
 * Fetches the text content of `url`, deduplicating concurrent requests and
 * caching successful results forever (see module doc comment). Works
 * identically during SSR (Node's global `fetch`) and in the browser (after
 * resume) — the one platform API upstream's `HttpClient` abstracts over,
 * available natively in both environments this port targets.
 *
 * Relative URLs are NOT resolved against any base here (no router
 * dependency — this package doesn't depend on `@qwik.dev/router`/Qwik City,
 * so it has no access to the current request's origin). Register icons
 * with an absolute URL (e.g. a CDN link, or one your own `routeLoader$`
 * resolves to absolute via its own `RequestEvent.url` before calling
 * `addSvgIcon`) for the fetch to succeed during SSR; a root-relative URL
 * (`/assets/home.svg`) only works once resumed in a browser, which resolves
 * it against `document.baseURI` the same way an `<img src>` would.
 */
export function fetchIconText(url: string): Promise<string> {
  const cached = fetchCache.get(url);
  if (cached) return cached;

  const promise = fetch(url).then(res => {
    if (!res.ok) {
      throw new Error(`Failed to fetch icon from "${url}": ${res.status} ${res.statusText}`);
    }
    return res.text();
  });

  // Store the in-progress promise immediately (before the first `await`
  // anywhere) so a second call for the SAME url made before this one
  // settles gets the exact same promise — upstream's `_inProgressUrlFetches`
  // dedup, reproduced.
  fetchCache.set(url, promise);

  // On failure, forget it — a later call should be able to retry (matches
  // upstream's `finalize(() => this._inProgressUrlFetches.delete(url))`,
  // which always runs, success or failure; the success side effectively
  // "promotes" into the permanent cache here by just staying put).
  promise.catch(() => fetchCache.delete(url));

  return promise;
}
