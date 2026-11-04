// Public API for @angular-community/qwik-material/card.
// See docs/superpowers/specs/2026-07-20-qwik-material-card-port-design.md §2.

export type {MatCardAppearance} from './card-appearance';
export type {MatCardConfig} from './card-config';
export {MAT_CARD_CONFIG, useMatCardProvider} from './card-config';

export {MatCard, type MatCardProps} from './mat-card';
export {MatCardHeader, type MatCardHeaderProps} from './mat-card-header';
export {MatCardTitleGroup, type MatCardTitleGroupProps} from './mat-card-title-group';
export {MatCardTitle, type MatCardTitleProps} from './mat-card-title';
export {MatCardSubtitle, type MatCardSubtitleProps} from './mat-card-subtitle';
export {MatCardContent, type MatCardContentProps} from './mat-card-content';
export {MatCardActions, type MatCardActionsProps} from './mat-card-actions';
export {MatCardFooter, type MatCardFooterProps} from './mat-card-footer';
export {
  MatCardImage,
  MatCardSmImage,
  MatCardMdImage,
  MatCardLgImage,
  MatCardXlImage,
  type MatCardImageProps,
} from './mat-card-image';
export {MatCardAvatar, type MatCardAvatarProps} from './mat-card-avatar';
