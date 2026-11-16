/**
 * Fetches and caches icon SVG text by URL. The Qwik-port equivalent of
 * upstream `MatIconRegistry`'s `_fetchIcon`/`_inProgressUrlFetches`/
 * `_cachedIconsByUrl` (`src/material/icon/icon-registry.ts`): two maps kept
 * IN THIS (PLAIN) MODULE's top-level scope, not in any Qwik signal/store.
 * Deliberately NOT part of any `useStore()`/context value — see
 * `icon-registry.ts`'s module doc comment for why ("class instances with
 * methods can't be serialized into resumable state — keep serializable data
 * in signals/stores and logic in plain module functions" applies just as
 * much to a bare runtime cache: it holds live `Promise` objects, which can't
 * be serialized at all, and it doesn't need to be — it's a process-local
 * performance cache, exactly like upstream's registry-instance-local one,
 * just keyed by the JS module instead of an Angular DI instance).
 *
 * PATCH (lambda-whitelabel-qwik): the fetched TEXT is what's shared across
 * the process (`cachedIconsByUrl`, upstream's `_cachedIconsByUrl`), never a
 * pending fetch — on the server. An SSR process serves many requests, and
 * on Cloudflare Workers (workerd) a `fetch()` belongs to the request that
 * started it: when that request ends first (the visitor navigated away
 * mid-render, aborting the response), its pending I/O is cancelled and the
 * promise NEVER settles. Shared, it stayed in the cache for good, and every
 * later render of that icon awaited it forever — the whole page stream hung
 * at the first `<mat-icon>` using it. So the server only dedupes per call
 * (a concurrent miss fetches again; the first success is cached for all),
 * and only the browser — one page, one context — shares an in-flight fetch
 * (upstream's `_inProgressUrlFetches`).
 *
 * A failure is never cached (a later call retries the URL, e.g. after the
 * server was briefly down) — upstream's `finalize(() =>
 * this._inProgressUrlFetches.delete(url))`, which always runs.
 */
import {isBrowser} from '@qwik.dev/core/build';

/** Successfully fetched icon text by URL — plain strings, safe to share across server requests. */
const cachedIconsByUrl = new Map<string, string>();

/** Fetches in flight by URL — the browser's only (see the module doc comment). */
const inProgressUrlFetches = new Map<string, Promise<string>>();

/** @docs-private — exposed only for tests that need a clean slate between cases. */
export function _clearIconFetchCacheForTests(): void {
  cachedIconsByUrl.clear();
  inProgressUrlFetches.clear();
}

/**
 * Fetches the text content of `url`, caching successful results forever and
 * (in the browser) deduplicating concurrent requests (see module doc
 * comment). Works identically during SSR (the runtime's global `fetch`) and
 * in the browser (after resume) — the one platform API upstream's
 * `HttpClient` abstracts over, available natively in both environments this
 * port targets.
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
  return _fetchIconText(url, isBrowser);
}

/**
 * @docs-private — {@link fetchIconText} with the environment made explicit,
 * for tests: `@qwik.dev/core/build`'s `isBrowser` is a build-time constant
 * (the optimizer folds it), so one test build can't flip it.
 *
 * @param shareInFlight whether a pending fetch is shared with later callers
 *   (the browser's one page; never a server process's many requests).
 */
export function _fetchIconText(url: string, shareInFlight: boolean): Promise<string> {
  const cached = cachedIconsByUrl.get(url);
  if (cached !== undefined) return Promise.resolve(cached);

  const inProgress = shareInFlight ? inProgressUrlFetches.get(url) : undefined;
  if (inProgress) return inProgress;

  const promise = fetch(url)
    .then(res => {
      if (!res.ok) {
        throw new Error(`Failed to fetch icon from "${url}": ${res.status} ${res.statusText}`);
      }
      return res.text();
    })
    .then(text => {
      cachedIconsByUrl.set(url, text);
      return text;
    });

  if (shareInFlight) {
    // Stored before the first `await` anywhere, so a second call for the SAME
    // url made before this one settles gets the exact same promise.
    inProgressUrlFetches.set(url, promise);
    const forget = () => inProgressUrlFetches.delete(url);
    promise.then(forget, forget);
  }

  return promise;
}
