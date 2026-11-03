import {component$, Slot} from '@qwik.dev/core';
import {useMatIconRegistry, type MatIconRegistrySeed} from './icon-registry';

/**
 * App-wide (or subtree-wide) SVG icon registry provider. Place it once near
 * the root of your app — typically wrapping (or wrapped by)
 * `QwikMaterialProvider` — so every descendant `<MatIcon svgIcon="...">`
 * resolves against the same registered icons/icon-sets.
 *
 * ```tsx
 * export const useIcons = routeLoader$(async () => {
 *   const icons = await fetch('https://api.example.com/icons').then(r => r.json());
 *   return icons as Array<{name: string; url: string}>;
 * });
 *
 * export default component$(() => {
 *   const icons = useIcons();
 *   return (
 *     <MatIconRegistryProvider
 *       icons={icons.value.map(i => ({name: i.name, url: trustIconResourceUrl(i.url)}))}
 *     >
 *       <Slot />
 *     </MatIconRegistryProvider>
 *   );
 * });
 * ```
 *
 * `icons`/`iconSets` seed the registry ONCE, at this component's first
 * render — see {@link MatIconRegistrySeed}'s doc comment. To register more
 * icons later from elsewhere in the tree, call {@link addSvgIcon} (etc.)
 * directly against the store returned by `useOptionalIconRegistry()`.
 *
 * Not folded into the big `QwikMaterialProvider` (unlike every `Mat*Config`)
 * — kept as its own small, independently-composable provider so apps that
 * don't register any SVG icons never pay for (or need to think about) this
 * context at all.
 */
export const MatIconRegistryProvider = component$<MatIconRegistrySeed>(props => {
  useMatIconRegistry(props);
  return <Slot />;
});
