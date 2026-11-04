// Public API for @angular-community/qwik-material/list.
// See docs/superpowers/specs/2026-10-27-qwik-material-dom-parity-remediation-design.md
// and list/SYNC.md.

export type {MatListConfig} from './list-config';
export {MAT_LIST_CONFIG, useMatListProvider} from './list-config';

export type {MatListBaseState} from './list-context';
export {MAT_LIST_BASE_STATE, MAT_LIST_BASE_STATE_DEFAULTS} from './list-context';

export {
  MatList,
  type MatListProps,
  MatNavList,
  type MatNavListProps,
  MatActionList,
  type MatActionListProps,
  MatSubheader,
  type MatSubheaderProps,
} from './mat-list';

export {MatListItem, type MatListItemProps} from './mat-list-item';

export {
  MatListItemAvatar,
  type MatListItemAvatarProps,
  MatListItemIcon,
  type MatListItemIconProps,
  MatListItemTitle,
  type MatListItemTitleProps,
  MatListItemLine,
  type MatListItemLineProps,
  MatListItemMeta,
  type MatListItemSectionProps,
} from './mat-list-item-sections';
