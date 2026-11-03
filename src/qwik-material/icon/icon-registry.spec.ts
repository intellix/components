import {describe, it, expect, vi, beforeEach, afterEach} from 'vitest';
import {
  addSvgIcon,
  addSvgIconInNamespace,
  addSvgIconLiteral,
  addSvgIconLiteralInNamespace,
  addSvgIconResolver,
  addSvgIconSet,
  addSvgIconSetLiteral,
  classNameForFontAlias,
  createIconRegistryStore,
  getDefaultFontSetClass,
  getNamedSvgIcon,
  getSvgIconFromUrl,
  registerFontClassAlias,
  setDefaultFontSetClass,
  splitIconName,
  _clearIconResolversForTests,
  type MatIconRegistryStore,
} from './icon-registry';
import {trustIconHtml, trustIconResourceUrl} from './icon-trusted';
import {_clearIconFetchCacheForTests} from './icon-fetch';

function mockFetch(responses: Record<string, string | Error>): ReturnType<typeof vi.fn> {
  const calls = new Map<string, number>();
  const fn = vi.fn(async (url: string) => {
    calls.set(url, (calls.get(url) ?? 0) + 1);
    const response = responses[url];
    if (response === undefined) {
      return {ok: false, status: 404, statusText: 'Not Found', text: async () => ''};
    }
    if (response instanceof Error) throw response;
    return {ok: true, status: 200, statusText: 'OK', text: async () => response};
  });
  (fn as unknown as {calls: Map<string, number>}).calls = calls;
  return fn;
}

describe('icon-registry', () => {
  let registry: MatIconRegistryStore;

  beforeEach(() => {
    registry = createIconRegistryStore();
    _clearIconFetchCacheForTests();
    _clearIconResolversForTests();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  describe('splitIconName', () => {
    it('splits "namespace:name"', () => {
      expect(splitIconName('social:cake')).toEqual(['social', 'cake']);
    });
    it('returns ["", name] with no namespace', () => {
      expect(splitIconName('penguin')).toEqual(['', 'penguin']);
    });
    it('returns ["", ""] for a falsy name', () => {
      expect(splitIconName('')).toEqual(['', '']);
    });
    it('throws on two or more colons', () => {
      expect(() => splitIconName('a:b:c')).toThrow(/Invalid icon name/);
    });
  });

  describe('addSvgIcon / getNamedSvgIcon — URL-backed, default namespace', () => {
    it('fetches, caches, and applies the universal SVG attributes', async () => {
      const fetchMock = mockFetch({
        'https://cdn.example/home.svg': '<svg viewBox="0 0 24 24"><path d="M1 1"/></svg>',
      });
      vi.stubGlobal('fetch', fetchMock);

      addSvgIcon(registry, 'home', trustIconResourceUrl('https://cdn.example/home.svg'));
      const markup = await getNamedSvgIcon(registry, 'home');

      expect(markup).toContain('viewBox="0 0 24 24"');
      expect(markup).toContain('fit=""');
      expect(markup).toContain('height="100%"');
      expect(markup).toContain('width="100%"');
      expect(markup).toContain('preserveAspectRatio="xMidYMid meet"');
      expect(markup).toContain('focusable="false"');
      expect(markup).toContain('<path d="M1 1"/>');
    });

    it('rejects for an unregistered name', async () => {
      await expect(getNamedSvgIcon(registry, 'missing')).rejects.toThrow(
        /Unable to find icon with the name ":missing"/,
      );
    });

    it('deduplicates concurrent fetches to the same URL', async () => {
      const fetchMock = mockFetch({'https://cdn.example/a.svg': '<svg><path d="A"/></svg>'});
      vi.stubGlobal('fetch', fetchMock);
      addSvgIcon(registry, 'a', trustIconResourceUrl('https://cdn.example/a.svg'));
      addSvgIcon(registry, 'a2', trustIconResourceUrl('https://cdn.example/a.svg'));

      const [m1, m2] = await Promise.all([
        getNamedSvgIcon(registry, 'a'),
        getNamedSvgIcon(registry, 'a2'),
      ]);
      expect(m1).toBe(m2);
      expect(fetchMock).toHaveBeenCalledTimes(1);
    });

    it('caches a successful fetch forever — a second lookup does not refetch', async () => {
      const fetchMock = mockFetch({'https://cdn.example/b.svg': '<svg><path d="B"/></svg>'});
      vi.stubGlobal('fetch', fetchMock);
      addSvgIcon(registry, 'b', trustIconResourceUrl('https://cdn.example/b.svg'));

      await getNamedSvgIcon(registry, 'b');
      await getNamedSvgIcon(registry, 'b');
      expect(fetchMock).toHaveBeenCalledTimes(1);
    });

    it('applies an IconOptions.viewBox override', async () => {
      const fetchMock = mockFetch({
        'https://cdn.example/c.svg': '<svg viewBox="0 0 10 10"><path d="C"/></svg>',
      });
      vi.stubGlobal('fetch', fetchMock);
      addSvgIcon(registry, 'c', trustIconResourceUrl('https://cdn.example/c.svg'), {
        viewBox: '0 0 99 99',
      });
      const markup = await getNamedSvgIcon(registry, 'c');
      expect(markup).toContain('viewBox="0 0 99 99"');
      expect(markup).not.toContain('0 0 10 10');
    });

    it('rejects when the fetch itself fails, with the upstream-style message prefix', async () => {
      vi.stubGlobal(
        'fetch',
        vi.fn(async () => ({ok: false, status: 500, statusText: 'Server Error', text: async () => ''})),
      );
      addSvgIcon(registry, 'd', trustIconResourceUrl('https://cdn.example/d.svg'));
      await expect(getNamedSvgIcon(registry, 'd')).rejects.toThrow(/Failed to fetch icon/);
    });
  });

  describe('addSvgIconInNamespace — namespaced lookup', () => {
    it('resolves "namespace:name" and does not collide with the default namespace', async () => {
      const fetchMock = mockFetch({
        'https://cdn.example/social-cake.svg': '<svg><path d="cake"/></svg>',
      });
      vi.stubGlobal('fetch', fetchMock);
      addSvgIconInNamespace(
        registry,
        'social',
        'cake',
        trustIconResourceUrl('https://cdn.example/social-cake.svg'),
      );
      await expect(getNamedSvgIcon(registry, 'cake')).rejects.toThrow(/Unable to find icon/);
      const markup = await getNamedSvgIcon(registry, 'social:cake');
      expect(markup).toContain('cake');
    });
  });

  describe('addSvgIconLiteral(InNamespace) — no fetch involved', () => {
    it('resolves a literal without ever calling fetch', async () => {
      const fetchMock = mockFetch({});
      vi.stubGlobal('fetch', fetchMock);
      addSvgIconLiteral(registry, 'lit', trustIconHtml('<svg><path d="L"/></svg>'));
      const markup = await getNamedSvgIcon(registry, 'lit');
      expect(markup).toContain('<path d="L"/>');
      expect(fetchMock).not.toHaveBeenCalled();
    });

    it('resolves a namespaced literal', async () => {
      addSvgIconLiteralInNamespace(registry, 'ns', 'lit2', trustIconHtml('<svg><path d="M"/></svg>'));
      const markup = await getNamedSvgIcon(registry, 'ns:lit2');
      expect(markup).toContain('<path d="M"/>');
    });

    it('requires a TrustedHtml, not a plain string', () => {
      expect(() =>
        // @ts-expect-error — intentionally passing a raw string to prove the runtime guard fires.
        addSvgIconLiteral(registry, 'bad', '<svg></svg>'),
      ).toThrow(/TrustedHtml/);
    });

    it('requires a TrustedResourceUrl, not a plain string', () => {
      expect(() =>
        // @ts-expect-error — intentionally passing a raw string to prove the runtime guard fires.
        addSvgIcon(registry, 'bad', 'https://cdn.example/x.svg'),
      ).toThrow(/TrustedResourceUrl/);
    });
  });

  describe('icon sets — addSvgIconSet(Literal)(InNamespace) + extraction fallback', () => {
    it('falls back to a registered icon set when no direct registration exists', async () => {
      addSvgIconSetLiteral(
        registry,
        trustIconHtml(
          '<svg><symbol id="thumb-up" viewBox="0 0 24 24"><path d="M1 21h4"/></symbol></svg>',
        ),
      );
      const markup = await getNamedSvgIcon(registry, 'thumb-up');
      expect(markup).toBe(
        '<svg viewBox="0 0 24 24" fit="" height="100%" width="100%" preserveAspectRatio="xMidYMid meet" focusable="false"><path d="M1 21h4"/></svg>',
      );
    });

    it('a later-registered set takes precedence over an earlier one for the same id', async () => {
      addSvgIconSetLiteral(registry, trustIconHtml('<svg><symbol id="x"><path d="OLD"/></symbol></svg>'));
      addSvgIconSetLiteral(registry, trustIconHtml('<svg><symbol id="x"><path d="NEW"/></symbol></svg>'));
      const markup = await getNamedSvgIcon(registry, 'x');
      expect(markup).toContain('NEW');
      expect(markup).not.toContain('OLD');
    });

    it('fetches a URL-backed icon set via the same cache as single icons', async () => {
      const fetchMock = mockFetch({
        'https://cdn.example/set.svg':
          '<svg><symbol id="star"><path d="STAR"/></symbol></svg>',
      });
      vi.stubGlobal('fetch', fetchMock);
      addSvgIconSet(registry, trustIconResourceUrl('https://cdn.example/set.svg'));
      const markup = await getNamedSvgIcon(registry, 'star');
      expect(markup).toContain('STAR');
      expect(fetchMock).toHaveBeenCalledTimes(1);
    });

    it('a namespaced icon set is only searched for that namespace', async () => {
      addSvgIconSetLiteral(
        registry,
        trustIconHtml('<svg><symbol id="y"><path d="DEFAULT"/></symbol></svg>'),
      );
      await expect(
        getNamedSvgIcon(registry, 'ns:y'), // not registered in 'ns'
      ).rejects.toThrow(/Unable to find icon/);
    });

    it('rejects when the id is not present in any registered set', async () => {
      addSvgIconSetLiteral(registry, trustIconHtml('<svg><symbol id="present"></symbol></svg>'));
      await expect(getNamedSvgIcon(registry, 'absent')).rejects.toThrow(/Unable to find icon/);
    });
  });

  describe('getSvgIconFromUrl — direct URL resolution, bypassing the name registry', () => {
    it('resolves independently of any registration', async () => {
      const fetchMock = mockFetch({'https://cdn.example/direct.svg': '<svg><path d="D"/></svg>'});
      vi.stubGlobal('fetch', fetchMock);
      const markup = await getSvgIconFromUrl(trustIconResourceUrl('https://cdn.example/direct.svg'));
      expect(markup).toContain('<path d="D"/>');
    });
  });

  describe('addSvgIconResolver', () => {
    it('is consulted when no direct registration exists, and the result is cached onto the store', async () => {
      const fetchMock = mockFetch({'https://cdn.example/resolved-ping.svg': '<svg><path d="P"/></svg>'});
      vi.stubGlobal('fetch', fetchMock);
      addSvgIconResolver((name, namespace) =>
        name === 'ping' && namespace === ''
          ? trustIconResourceUrl(`https://cdn.example/resolved-${name}.svg`)
          : null,
      );
      const markup = await getNamedSvgIcon(registry, 'ping');
      expect(markup).toContain('<path d="P"/>');
      // Cached onto the store (mirrors upstream `_svgIconConfigs.set`) — a direct
      // registration now exists, so a second lookup skips the resolver AND the
      // fetch cache still only sees one request either way.
      expect(registry.icons[':ping']).toBeDefined();
      await getNamedSvgIcon(registry, 'ping');
      expect(fetchMock).toHaveBeenCalledTimes(1);
    });

    it('returns null (falls through to "not found") when no resolver matches', async () => {
      addSvgIconResolver(() => null);
      await expect(getNamedSvgIcon(registry, 'unresolved')).rejects.toThrow(/Unable to find icon/);
    });
  });

  describe('font aliasing / default font-set class — API-surface completeness', () => {
    it('registerFontClassAlias / classNameForFontAlias', () => {
      registerFontClassAlias(registry, 'f1', 'font1 mat-ligature-font');
      expect(classNameForFontAlias(registry, 'f1')).toBe('font1 mat-ligature-font');
      expect(classNameForFontAlias(registry, 'unregistered')).toBe('unregistered');
    });

    it('registerFontClassAlias defaults classNames to the alias itself', () => {
      registerFontClassAlias(registry, 'solo');
      expect(classNameForFontAlias(registry, 'solo')).toBe('solo');
    });

    it('setDefaultFontSetClass / getDefaultFontSetClass, defaulting to the upstream registry default', () => {
      expect(getDefaultFontSetClass(registry)).toEqual(['material-icons', 'mat-ligature-font']);
      setDefaultFontSetClass(registry, 'my-font', 'my-ligature-class');
      expect(getDefaultFontSetClass(registry)).toEqual(['my-font', 'my-ligature-class']);
    });
  });
});
