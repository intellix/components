import type {ApiModule} from '../components/api-reference';

/**
 * All 48 generated API JSON files (`scripts/generate-api.mjs`'s output — 35 material + 13 cdk
 * entry points), loaded lazily via Vite's `import.meta.glob` (no `eager: true`) and only ever
 * called from a `routeLoader$` (`/components/[id]/api`, `/cdk/[id]/api`) — since this whole site
 * is statically generated, the loader's result is resolved once, at build time, and serialized
 * into the page; none of this (or the 48 JSON files it reads) ends up in the CLIENT bundle at
 * all for the production build, unlike an eager glob, which bundled all 48 files together into
 * one ~500KB chunk downloaded by every API tab visit.
 */
const modules = import.meta.glob('../generated/api/*.json') as Record<
  string,
  () => Promise<{default: ApiModule}>
>;

function keyFromPath(path: string): string {
  return path.split('/').pop()!.replace(/\.json$/, ''); // e.g. "material-button"
}

const loadersByKey = new Map<string, () => Promise<{default: ApiModule}>>();
for (const [path, loader] of Object.entries(modules)) {
  loadersByKey.set(keyFromPath(path), loader);
}

async function loadByKey(key: string, fallbackId: string): Promise<ApiModule> {
  const loader = loadersByKey.get(key);
  if (!loader) return {id: fallbackId, error: 'API data not generated.'};
  const mod = await loader();
  return mod.default;
}

export function loadMaterialApi(entryPoint: string): Promise<ApiModule> {
  return loadByKey(`material-${entryPoint}`, entryPoint);
}

export function loadCdkApi(entryPoint: string): Promise<ApiModule> {
  return loadByKey(`cdk-${entryPoint}`, entryPoint);
}
