// Public API for @angular-community/qwik-material/list.
// See docs/superpowers/specs/2026-08-08-qwik-material-list-port-design.md §3.

export type {MatListConfig} from './list-config';
export {MAT_LIST_CONFIG} from './list-config';

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
  MatListItemIcon,
  MatListItemTitle,
  MatListItemLine,
  MatListItemMeta,
  type MatListItemSectionProps,
} from './mat-list-item-sections';
