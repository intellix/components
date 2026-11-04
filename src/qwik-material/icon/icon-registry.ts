/**
 * Qwik-port equivalent of upstream `MatIconRegistry`
 * (`src/material/icon/icon-registry.ts`) — registers SVG icons/icon-sets by
 * name and namespace, resolves `<MatIcon svgIcon="...">` by name, and
 * fetches+caches URL-backed icons. See `icon/SYNC.md` for the full list of
 * deviations from upstream.
 *
 * Architecture (why this ISN'T a class, unlike the `@Injectable` upstream
 * service it replaces): "class instances with methods can't be serialized
 * into resumable state — keep serializable data in signals/stores and logic
 * in plain module functions or QRLs" is a hard constraint for this whole
 * port. So:
 *
 *   - **Data** — the name/namespace → icon-or-icon-set registrations, font
 *     aliases, default font-set class — lives in a plain, JSON-shaped
 *     `MatIconRegistryStore`, created with `useStore()` by
 *     {@link useMatIconRegistryProvider} and provided through {@link MAT_ICON_REGISTRY}
 *     context, exactly like every `Mat*Config` this port already threads
 *     through `QwikMaterialProvider`. This is the part that's genuinely
 *     request/app-tree-scoped (so concurrent SSR requests registering
 *     DIFFERENT icon sets — e.g. per-tenant data loaded in a `routeLoader$`
 *     — never see each other's data, unlike a naive module-level singleton
 *     would).
 *   - **Logic** — every `addSvgIcon*`/`getNamedSvgIcon`/etc. — is a plain
 *     exported function taking the store as its first argument, not a
 *     method on it: `addSvgIcon(registry, 'home', trustIconResourceUrl(url))`,
 *     not `registry.addSvgIcon(...)`. Matches `icon-fetch.ts`/
 *     `icon-set-extract.ts`'s same plain-function shape.
 *   - **The fetch cache** (live `Promise` objects — not serializable, and
 *     deliberately NOT request-scoped — see `icon-fetch.ts`'s own doc
 *     comment) and **icon resolvers** (plain functions — also not
 *     serializable; see this file's `addSvgIconResolver` doc comment) are
 *     the two pieces of upstream's registry state that live at plain MODULE
 *     scope instead, same rationale as `icon-fetch.ts`.
 */
import {createContextId, useContextProvider, useContext, useStore} from '@qwik.dev/core';
import {
  isTrustedHtml,
  isTrustedResourceUrl,
  type TrustedHtml,
  type TrustedResourceUrl,
} from './icon-trusted';
import {fetchIconText} from './icon-fetch';
import {extractIconFromSetMarkup} from './icon-set-extract';
import {withIconSvgAttributes} from './icon-svg-attrs';

/** Options that can be used to configure how an icon or icon-set is presented.
 *  Mirrors upstream `IconOptions` (`icon-registry.ts`). */
export interface IconOptions {
  /** View box to set on the icon, overriding whatever it already carries. */
  viewBox?: string;
  /**
   * Whether to fetch the icon with HTTP credentials.
   *
   * @deprecated Not applied — `icon-fetch.ts` calls the platform `fetch()`
   * directly with no per-call options (see that module's doc comment on why
   * this package doesn't take an HTTP-client dependency). Kept on the type
   * for API-surface parity with upstream `IconOptions`; accepted and
   * ignored. Fetch credentials app-wide via your own `fetch` override if
   * your runtime needs it (e.g. a server-side `globalThis.fetch` polyfill
   * configured with cookies) — the same escape hatch upstream's own
   * `HttpClient`-swap story relies on.
   */
  withCredentials?: boolean;
}

/** @docs-private */
interface IconEntry {
  kind: 'url' | 'literal';
  value: string;
  options?: IconOptions;
}

/**
 * Function invoked when trying to resolve the URL for an icon that has no
 * direct registration. Mirrors upstream `IconResolver`. Returns a trusted
 * URL (or one plus options), or `null` if this resolver doesn't know the
 * icon. See {@link addSvgIconResolver}'s doc comment for why resolvers are
 * module-global rather than stored on the registry.
 */
export type IconResolver = (
  name: string,
  namespace: string,
) => TrustedResourceUrl | {url: TrustedResourceUrl; options?: IconOptions} | null;

/**
 * The registry's serializable data: name/namespace → icon-or-icon-set
 * registrations, font-class aliases, and the default font-set class.
 * Created with `useStore()`, never constructed directly by consumers — see
 * {@link useMatIconRegistryProvider}.
 */
export interface MatIconRegistryStore {
  /** `"${namespace}:${name}"` → registration. */
  icons: Record<string, IconEntry>;
  /** `namespace` → icon-set registrations, in registration order (later = higher precedence). */
  iconSets: Record<string, IconEntry[]>;
  /** Font alias → CSS class names (`registerFontClassAlias`/`classNameForFontAlias`). */
  fontAliases: Record<string, string>;
  /** `setDefaultFontSetClass`/`getDefaultFontSetClass`. NOT consulted by
   *  `<MatIcon>`'s font-mode rendering — see `icon/SYNC.md`'s "registry font
   *  methods" deviation; kept here for upstream API-surface completeness
   *  only. `<MatIcon>`'s actual font-set default resolution is the
   *  independent, pre-existing `MatIconConfig.fontSet` mechanism. */
  defaultFontSetClass: string[];
}

function iconKey(namespace: string, name: string): string {
  return `${namespace}:${name}`;
}

/** Upstream's built-in registry default (`_defaultFontSetClass`). */
const DEFAULT_FONT_SET_CLASS = ['material-icons', 'mat-ligature-font'];

/** @docs-private */
export function createIconRegistryStore(): MatIconRegistryStore {
  return {
    icons: {},
    iconSets: {},
    fontAliases: {},
    defaultFontSetClass: [...DEFAULT_FONT_SET_CLASS],
  };
}

// ─────────────────────────────────────────────────────────────────────────
// Context + hooks
// ─────────────────────────────────────────────────────────────────────────

/**
 * Context id a `<MatIconRegistryProvider>` (or any ancestor calling
 * {@link useMatIconRegistryProvider}) provides. The id string is exposed publicly
 * and MUST remain stable across releases, same convention as every other
 * `MAT_*` context id in this port.
 */
export const MAT_ICON_REGISTRY = createContextId<MatIconRegistryStore>('qwikMaterial/iconRegistry');

/** Sentinel for {@link useOptionalIconRegistry} — see
 *  `core/mat-form-field-control.ts`'s `useOptionalFormFieldControlState()` doc
 *  comment for why this is a frozen plain object, not a `Symbol` (a `Symbol`
 *  default can't be SSR-serialized) or the literal value `undefined`
 *  (`useContext`'s own implementation can't tell "default is `undefined`"
 *  apart from "no default was passed", and throws `QError_notFoundContext`). */
const NO_REGISTRY: unknown = Object.freeze({});

/**
 * Reads the `MAT_ICON_REGISTRY` context, or `undefined` when `<MatIcon
 * svgIcon="...">` is used with no `<MatIconRegistryProvider>` (or
 * `useMatIconRegistryProvider()`-calling) ancestor at all. `<MatIcon>` itself treats
 * `undefined` as a resolution error (mirrors upstream's "no HttpClient" /
 * "icon not found" failure shape — logged, renders nothing) rather than
 * throwing synchronously, since a font-mode-only app with no SVG icons at
 * all is a completely valid, common case that must not be forced to add a
 * provider it doesn't need.
 */
export function useOptionalIconRegistry(): MatIconRegistryStore | undefined {
  const value = useContext(MAT_ICON_REGISTRY, NO_REGISTRY as MatIconRegistryStore);
  return value === (NO_REGISTRY as MatIconRegistryStore) ? undefined : value;
}

/** One icon to seed a registry with — see {@link MatIconRegistrySeed}. */
export interface MatIconRegistrySeedIcon {
  name: string;
  namespace?: string;
  url?: TrustedResourceUrl;
  literal?: TrustedHtml;
  options?: IconOptions;
}

/** One icon SET to seed a registry with — see {@link MatIconRegistrySeed}. */
export interface MatIconRegistrySeedIconSet {
  namespace?: string;
  url?: TrustedResourceUrl;
  literal?: TrustedHtml;
  options?: IconOptions;
}

/**
 * Initial registrations for {@link useMatIconRegistryProvider}/
 * {@link MatIconRegistryProvider} — the shape that makes "register icons at
 * app startup from data loaded at runtime" (e.g. a `routeLoader$`'s
 * `{name, url}[]` response) a one-line `<MatIconRegistryProvider
 * icons={icons.value.map(i => ({name: i.name, url:
 * trustIconResourceUrl(i.url)}))}>` instead of a manual imperative loop —
 * though the imperative loop (calling {@link addSvgIcon} etc. directly after
 * {@link useOptionalIconRegistry}) works too and is what this seed is built
 * from internally.
 *
 * Applied ONCE, at this provider's first render — exactly like
 * `QwikMaterialProviderProps.animationsDisabled`'s identical "read the
 * initial prop value into a persistent hook, ignore later prop changes"
 * pattern (`dialog/qwik-material-provider.tsx`). This is for STARTUP
 * registration; for registering MORE icons later from elsewhere in the
 * tree, call {@link addSvgIcon}/etc. directly on the store returned by
 * {@link useOptionalIconRegistry}.
 */
export interface MatIconRegistrySeed {
  icons?: MatIconRegistrySeedIcon[];
  iconSets?: MatIconRegistrySeedIconSet[];
}

function buildStoreFromSeed(seed: MatIconRegistrySeed | undefined): MatIconRegistryStore {
  const store = createIconRegistryStore();
  for (const icon of seed?.icons ?? []) {
    const namespace = icon.namespace ?? '';
    if (icon.url) {
      addSvgIconInNamespace(store, namespace, icon.name, icon.url, icon.options);
    } else if (icon.literal) {
      addSvgIconLiteralInNamespace(store, namespace, icon.name, icon.literal, icon.options);
    }
  }
  for (const set of seed?.iconSets ?? []) {
    const namespace = set.namespace ?? '';
    if (set.url) {
      addSvgIconSetInNamespace(store, namespace, set.url, set.options);
    } else if (set.literal) {
      addSvgIconSetLiteralInNamespace(store, namespace, set.literal, set.options);
    }
  }
  return store;
}

/**
 * Creates a fresh icon registry store (seeded, if `seed` is given — see
 * {@link MatIconRegistrySeed}) and provides it via {@link MAT_ICON_REGISTRY}
 * context to this component's descendants. Returns the store so the SAME
 * component can also register more icons imperatively
 * (`addSvgIcon(registry, ...)`) or read it back later.
 *
 * Call once near the (or any) root — e.g.
 *
 * ```tsx
 * export const useIcons = routeLoader$(async () => {
 *   const icons = await fetch('https://api.example.com/icons').then(r => r.json());
 *   return icons as Array<{name: string; url: string}>;
 * });
 *
 * export default component$(() => {
 *   const icons = useIcons();
 *   useMatIconRegistryProvider({
 *     icons: icons.value.map(i => ({name: i.name, url: trustIconResourceUrl(i.url)})),
 *   });
 *   return <Slot />;
 * });
 * ```
 *
 * `icons`/`iconSets` seed the registry ONCE, at this call's first render — see
 * {@link MatIconRegistrySeed}'s doc comment. To register more icons later from elsewhere in
 * the tree, call {@link addSvgIcon} (etc.) directly against the store returned by
 * {@link useOptionalIconRegistry}.
 *
 * Only this one context is provided; every other qwik-material configuration context stays
 * whatever an ancestor (or nothing) already provided — an app that registers no icons at all
 * never needs to call this.
 */
export function useMatIconRegistryProvider(seed?: MatIconRegistrySeed): MatIconRegistryStore {
  const store = useStore<MatIconRegistryStore>(() => buildStoreFromSeed(seed));
  useContextProvider(MAT_ICON_REGISTRY, store);
  return store;
}

// ─────────────────────────────────────────────────────────────────────────
// Registration — upstream's addSvgIcon*/addSvgIconSet* method set, as plain
// functions over a store (see this file's module doc comment for why).
// ─────────────────────────────────────────────────────────────────────────

/** Registers an icon by URL in the default namespace. Mirrors `addSvgIcon`. */
export function addSvgIcon(
  registry: MatIconRegistryStore,
  iconName: string,
  url: TrustedResourceUrl,
  options?: IconOptions,
): void {
  addSvgIconInNamespace(registry, '', iconName, url, options);
}

/** Registers an icon by URL in the given namespace. Mirrors `addSvgIconInNamespace`. */
export function addSvgIconInNamespace(
  registry: MatIconRegistryStore,
  namespace: string,
  iconName: string,
  url: TrustedResourceUrl,
  options?: IconOptions,
): void {
  if (!isTrustedResourceUrl(url)) {
    throw new Error(
      `addSvgIcon(InNamespace) requires a TrustedResourceUrl — call trustIconResourceUrl(url) first (icon "${iconName}").`,
    );
  }
  registry.icons[iconKey(namespace, iconName)] = {kind: 'url', value: url.url, options};
}

/** Registers an icon using an HTML string in the default namespace. Mirrors `addSvgIconLiteral`. */
export function addSvgIconLiteral(
  registry: MatIconRegistryStore,
  iconName: string,
  literal: TrustedHtml,
  options?: IconOptions,
): void {
  addSvgIconLiteralInNamespace(registry, '', iconName, literal, options);
}

/** Registers an icon using an HTML string in the given namespace. Mirrors `addSvgIconLiteralInNamespace`. */
export function addSvgIconLiteralInNamespace(
  registry: MatIconRegistryStore,
  namespace: string,
  iconName: string,
  literal: TrustedHtml,
  options?: IconOptions,
): void {
  if (!isTrustedHtml(literal)) {
    throw new Error(
      `addSvgIconLiteral(InNamespace) requires a TrustedHtml — call trustIconHtml(html) first (icon "${iconName}").`,
    );
  }
  registry.icons[iconKey(namespace, iconName)] = {kind: 'literal', value: literal.html, options};
}

/** Registers an icon SET by URL in the default namespace. Mirrors `addSvgIconSet`. */
export function addSvgIconSet(
  registry: MatIconRegistryStore,
  url: TrustedResourceUrl,
  options?: IconOptions,
): void {
  addSvgIconSetInNamespace(registry, '', url, options);
}

/** Registers an icon SET by URL in the given namespace. Mirrors `addSvgIconSetInNamespace`. */
export function addSvgIconSetInNamespace(
  registry: MatIconRegistryStore,
  namespace: string,
  url: TrustedResourceUrl,
  options?: IconOptions,
): void {
  if (!isTrustedResourceUrl(url)) {
    throw new Error(
      'addSvgIconSet(InNamespace) requires a TrustedResourceUrl — call trustIconResourceUrl(url) first.',
    );
  }
  pushIconSet(registry, namespace, {kind: 'url', value: url.url, options});
}

/** Registers an icon SET using an HTML string in the default namespace. Mirrors `addSvgIconSetLiteral`. */
export function addSvgIconSetLiteral(
  registry: MatIconRegistryStore,
  literal: TrustedHtml,
  options?: IconOptions,
): void {
  addSvgIconSetLiteralInNamespace(registry, '', literal, options);
}

/** Registers an icon SET using an HTML string in the given namespace. Mirrors `addSvgIconSetLiteralInNamespace`. */
export function addSvgIconSetLiteralInNamespace(
  registry: MatIconRegistryStore,
  namespace: string,
  literal: TrustedHtml,
  options?: IconOptions,
): void {
  if (!isTrustedHtml(literal)) {
    throw new Error(
      'addSvgIconSetLiteral(InNamespace) requires a TrustedHtml — call trustIconHtml(html) first.',
    );
  }
  pushIconSet(registry, namespace, {kind: 'literal', value: literal.html, options});
}

function pushIconSet(registry: MatIconRegistryStore, namespace: string, entry: IconEntry): void {
  const existing = registry.iconSets[namespace];
  if (existing) {
    existing.push(entry);
  } else {
    registry.iconSets[namespace] = [entry];
  }
}

/**
 * Registers an icon resolver function, invoked when `getNamedSvgIcon` can't
 * find a direct registration for the requested name/namespace. Mirrors
 * upstream `addSvgIconResolver`, with ONE deviation: resolvers are kept in
 * plain MODULE scope, not in any `MatIconRegistryStore` — a resolver is a
 * plain JS function, which (unlike every OTHER piece of registry data) has
 * no serializable representation at all, so it can't live inside a
 * `useStore()`-backed context value the way `icons`/`iconSets` do (a plain
 * function assigned into a Qwik store throws when the framework tries to
 * serialize it for resumability — see this port's "class instances with
 * methods"/"keep logic in plain module functions or QRLs" constraint, which
 * applies here just as much as it does to class instances). Resolvers
 * registered this way are available to EVERY registry in the process (akin
 * to upstream always having exactly one `MatIconRegistry` instance per
 * Angular app) rather than scoped to one `<MatIconRegistryProvider>` — call
 * this at module-evaluation time (e.g. once from a root layout component,
 * same place you'd otherwise call it on an injected service), not
 * conditionally per-request.
 */
export function addSvgIconResolver(resolver: IconResolver): void {
  resolvers.push(resolver);
}

const resolvers: IconResolver[] = [];

/** @docs-private — exposed only for tests that need a clean slate between cases. */
export function _clearIconResolversForTests(): void {
  resolvers.length = 0;
}

function resolveViaResolvers(name: string, namespace: string): IconEntry | null {
  for (const resolver of resolvers) {
    const result = resolver(name, namespace);
    if (!result) continue;
    const resolved = isTrustedResourceUrl(result) ? {url: result, options: undefined} : result;
    return {kind: 'url', value: resolved.url.url, options: resolved.options};
  }
  return null;
}

// ─────────────────────────────────────────────────────────────────────────
// Font aliasing / default font-set class — upstream API-surface
// completeness only; NOT consulted by <MatIcon> (see
// MatIconRegistryStore.defaultFontSetClass's doc comment and icon/SYNC.md).
// ─────────────────────────────────────────────────────────────────────────

/** Mirrors `registerFontClassAlias`. */
export function registerFontClassAlias(
  registry: MatIconRegistryStore,
  alias: string,
  classNames: string = alias,
): void {
  registry.fontAliases[alias] = classNames;
}

/** Mirrors `classNameForFontAlias`. */
export function classNameForFontAlias(registry: MatIconRegistryStore, alias: string): string {
  return registry.fontAliases[alias] ?? alias;
}

/** Mirrors `setDefaultFontSetClass`. */
export function setDefaultFontSetClass(
  registry: MatIconRegistryStore,
  ...classNames: string[]
): void {
  registry.defaultFontSetClass = classNames;
}

/** Mirrors `getDefaultFontSetClass`. */
export function getDefaultFontSetClass(registry: MatIconRegistryStore): string[] {
  return registry.defaultFontSetClass;
}

// ─────────────────────────────────────────────────────────────────────────
// Resolution — getNamedSvgIcon / getSvgIconFromUrl.
// ─────────────────────────────────────────────────────────────────────────

/**
 * Splits an `svgIcon` value into `[namespace, name]`. Mirrors upstream
 * `MatIcon._splitIconName` (`src/material/icon/icon.ts`) exactly, including
 * throwing on a second `:`.
 */
export function splitIconName(iconName: string): [namespace: string, name: string] {
  if (!iconName) return ['', ''];
  const parts = iconName.split(':');
  if (parts.length === 1) return ['', parts[0]];
  if (parts.length === 2) return [parts[0], parts[1]];
  throw new Error(`Invalid icon name: "${iconName}"`);
}

async function resolveEntryMarkup(entry: IconEntry): Promise<string> {
  return entry.kind === 'literal' ? entry.value : fetchIconText(entry.value);
}

async function resolveEntry(entry: IconEntry): Promise<string> {
  const markup = await resolveEntryMarkup(entry);
  return withIconSvgAttributes(markup, entry.options?.viewBox);
}

/**
 * Resolves an icon by (possibly namespaced) name, exactly like upstream
 * `getNamedSvgIcon`: a direct registration first, then a registered
 * resolver, then a search through the namespace's registered icon sets
 * (later-registered sets win, matching upstream's backward iteration).
 * Returns the resolved `<svg>...</svg>` markup, with the universal
 * `fit`/`height`/`width`/`preserveAspectRatio`/`focusable` attributes (plus
 * any `options.viewBox` override) already applied — see
 * `icon-svg-attrs.ts`. Throws (mirroring upstream's `getMatIconNameNotFoundError`)
 * if nothing matches.
 *
 * Deviation: upstream's icon-SET search fetches every uncached set in the
 * namespace in parallel, then searches all of them again. This port
 * searches sequentially, newest-registered first, stopping at the first
 * match (same winning icon either way — "icon sets added later have
 * precedence" — just without the parallel-fetch optimization). It also only
 * auto-tracks reads for Qwik's `useComputed$` reactivity up to this
 * function's own first `await` — a store mutation that happens WHILE an
 * icon-set search is already in flight (fetching a set's markup) won't
 * retroactively be picked up by that same in-flight lookup; a subsequent
 * `svgIcon` change (or any other prop/signal that reruns the computed) will
 * see the current store state correctly.
 */
export async function getNamedSvgIcon(
  registry: MatIconRegistryStore,
  rawName: string,
): Promise<string> {
  const [namespace, name] = splitIconName(rawName);
  const key = iconKey(namespace, name);

  const direct = registry.icons[key];
  if (direct) return resolveEntry(direct);

  const resolved = resolveViaResolvers(name, namespace);
  if (resolved) {
    registry.icons[key] = resolved; // Cache, same as upstream's `_svgIconConfigs.set(key, config)`.
    return resolveEntry(resolved);
  }

  const sets = registry.iconSets[namespace];
  if (sets) {
    for (let i = sets.length - 1; i >= 0; i--) {
      const setMarkup = await resolveEntryMarkup(sets[i]);
      if (setMarkup.indexOf(name) === -1) continue; // Quick pre-check, same as upstream.
      const extracted = extractIconFromSetMarkup(setMarkup, name);
      if (extracted) return withIconSvgAttributes(extracted, sets[i].options?.viewBox);
    }
  }

  throw new Error(`Unable to find icon with the name "${key}"`);
}

/**
 * Resolves an icon directly from a (trusted) URL, bypassing the name
 * registry entirely. Mirrors upstream `getSvgIconFromUrl`. Each call
 * returns independently-usable markup (no live DOM node to accidentally
 * share/mutate across calls — the string itself is already an independent
 * copy, unlike upstream's `cloneSvg()` step, which this port has no
 * equivalent need for).
 */
export async function getSvgIconFromUrl(
  url: TrustedResourceUrl,
  options?: IconOptions,
): Promise<string> {
  if (!isTrustedResourceUrl(url)) {
    throw new Error(
      'getSvgIconFromUrl requires a TrustedResourceUrl — call trustIconResourceUrl(url) first.',
    );
  }
  const text = await fetchIconText(url.url);
  return withIconSvgAttributes(text, options?.viewBox);
}
