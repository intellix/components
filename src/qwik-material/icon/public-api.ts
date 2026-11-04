// Public API for @angular-community/qwik-material/icon.
// See docs/superpowers/specs/2026-07-29-qwik-material-icon-port-design.md §2
// and icon/SYNC.md's "SVG icon registry" section for the registry additions.

export type {MatIconColor} from './icon-color';
export type {MatIconConfig} from './icon-config';
export {MAT_ICON_CONFIG, useMatIconProvider} from './icon-config';
export {MatIcon, type MatIconProps} from './mat-icon';

export {
  trustIconHtml,
  trustIconResourceUrl,
  type TrustedHtml,
  type TrustedResourceUrl,
} from './icon-trusted';

export {
  addSvgIcon,
  addSvgIconInNamespace,
  addSvgIconLiteral,
  addSvgIconLiteralInNamespace,
  addSvgIconResolver,
  addSvgIconSet,
  addSvgIconSetInNamespace,
  addSvgIconSetLiteral,
  addSvgIconSetLiteralInNamespace,
  classNameForFontAlias,
  createIconRegistryStore,
  getDefaultFontSetClass,
  getNamedSvgIcon,
  getSvgIconFromUrl,
  MAT_ICON_REGISTRY,
  registerFontClassAlias,
  setDefaultFontSetClass,
  splitIconName,
  useMatIconRegistryProvider,
  useOptionalIconRegistry,
  type IconOptions,
  type IconResolver,
  type MatIconRegistrySeed,
  type MatIconRegistrySeedIcon,
  type MatIconRegistrySeedIconSet,
  type MatIconRegistryStore,
} from './icon-registry';
