import {describe, it, expect, vi, beforeEach, afterEach} from 'vitest';

import {_clearIconFetchCacheForTests, _fetchIconText, fetchIconText} from './icon-fetch';

/** `fetchIconText` on the server (an SSR process: many requests) and in the browser (one page). */
const onServer = (url: string) => _fetchIconText(url, false);
const inBrowser = (url: string) => _fetchIconText(url, true);

const URL_A = 'https://cdn.example/a.svg';
const SVG_A = '<svg><path d="A"/></svg>';

const ok = (text: string) => ({ok: true, status: 200, statusText: 'OK', text: async () => text});

/** A `fetch` that never settles — what workerd leaves behind when the request that started it is aborted. */
const neverSettles = () => new Promise<never>(() => undefined);

/** Resolves `promise` within a few macrotasks, or reports it as still pending. */
async function settledOrPending<T>(promise: Promise<T>): Promise<T | 'pending'> {
  return Promise.race([promise, new Promise<'pending'>(r => setTimeout(() => r('pending'), 20))]);
}

describe('fetchIconText', () => {
  beforeEach(() => {
    _clearIconFetchCacheForTests();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  describe('on the server', () => {
    it('never shares a pending fetch: a later request fetches for itself when an earlier one never settles', async () => {
      const fetchMock = vi
        .fn()
        .mockImplementationOnce(neverSettles)
        .mockImplementation(async () => ok(SVG_A));
      vi.stubGlobal('fetch', fetchMock);

      const abandoned = onServer(URL_A);
      expect(await settledOrPending(abandoned)).toBe('pending');

      // The next request's render gets the icon, not the first request's dead promise.
      await expect(settledOrPending(onServer(URL_A))).resolves.toBe(SVG_A);
      expect(fetchMock).toHaveBeenCalledTimes(2);
    });

    it('shares the fetched text across requests once one fetch succeeds', async () => {
      const fetchMock = vi.fn(async () => ok(SVG_A));
      vi.stubGlobal('fetch', fetchMock);

      await expect(onServer(URL_A)).resolves.toBe(SVG_A);
      await expect(onServer(URL_A)).resolves.toBe(SVG_A);
      expect(fetchMock).toHaveBeenCalledTimes(1);
    });

    it('never caches a failure: the next call retries', async () => {
      const fetchMock = vi
        .fn()
        .mockImplementationOnce(async () => ({
          ok: false,
          status: 503,
          statusText: 'Service Unavailable',
          text: async () => '',
        }))
        .mockImplementation(async () => ok(SVG_A));
      vi.stubGlobal('fetch', fetchMock);

      await expect(onServer(URL_A)).rejects.toThrow(
        `Failed to fetch icon from "${URL_A}": 503 Service Unavailable`,
      );
      await expect(onServer(URL_A)).resolves.toBe(SVG_A);
      expect(fetchMock).toHaveBeenCalledTimes(2);
    });

    it('never caches a network error either', async () => {
      const fetchMock = vi
        .fn()
        .mockImplementationOnce(async () => {
          throw new TypeError('network down');
        })
        .mockImplementation(async () => ok(SVG_A));
      vi.stubGlobal('fetch', fetchMock);

      await expect(onServer(URL_A)).rejects.toThrow('network down');
      await expect(onServer(URL_A)).resolves.toBe(SVG_A);
      expect(fetchMock).toHaveBeenCalledTimes(2);
    });
  });

  describe('in the browser', () => {
    it('deduplicates concurrent fetches of the same URL (one request, the same promise)', async () => {
      const fetchMock = vi.fn(async () => ok(SVG_A));
      vi.stubGlobal('fetch', fetchMock);

      const first = inBrowser(URL_A);
      const second = inBrowser(URL_A);
      expect(second).toBe(first);
      await expect(Promise.all([first, second])).resolves.toEqual([SVG_A, SVG_A]);
      expect(fetchMock).toHaveBeenCalledTimes(1);
    });

    it('caches the text once fetched', async () => {
      const fetchMock = vi.fn(async () => ok(SVG_A));
      vi.stubGlobal('fetch', fetchMock);

      await inBrowser(URL_A);
      await expect(inBrowser(URL_A)).resolves.toBe(SVG_A);
      expect(fetchMock).toHaveBeenCalledTimes(1);
    });

    it('forgets a failed in-flight fetch: the next call retries', async () => {
      const fetchMock = vi
        .fn()
        .mockImplementationOnce(async () => {
          throw new TypeError('network down');
        })
        .mockImplementation(async () => ok(SVG_A));
      vi.stubGlobal('fetch', fetchMock);

      await expect(inBrowser(URL_A)).rejects.toThrow('network down');
      await expect(inBrowser(URL_A)).resolves.toBe(SVG_A);
      expect(fetchMock).toHaveBeenCalledTimes(2);
    });
  });

  it('is the browser behaviour in a browser build (`isBrowser`, folded at build time)', async () => {
    const fetchMock = vi.fn(async () => ok(SVG_A));
    vi.stubGlobal('fetch', fetchMock);

    const first = fetchIconText(URL_A);
    expect(fetchIconText(URL_A)).toBe(first);
    await expect(first).resolves.toBe(SVG_A);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});
