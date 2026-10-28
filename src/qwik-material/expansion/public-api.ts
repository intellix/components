// Public API for @angular-community/qwik-material/expansion.
// Qwik port of src/material/expansion/* (mat-accordion, mat-expansion-panel,
// header, title, description, action-row, lazy content), built on
// @angular-community/qwik-cdk/accordion.

export type {MatExpansionConfig} from './expansion-config';
export {MAT_EXPANSION_CONFIG} from './expansion-config';

export type {MatAccordionDisplayMode, MatAccordionTogglePosition} from './accordion-state';

export {MatAccordion, type MatAccordionProps} from './mat-accordion';
export {MatExpansionPanel, type MatExpansionPanelProps} from './mat-expansion-panel';
export {
  MatExpansionPanelHeader,
  type MatExpansionPanelHeaderProps,
} from './mat-expansion-panel-header';
export {MatPanelTitle, type MatPanelTitleProps} from './mat-panel-title';
export {MatPanelDescription, type MatPanelDescriptionProps} from './mat-panel-description';
export {MatActionRow, type MatActionRowProps} from './mat-action-row';
export {MatExpansionPanelContent} from './mat-expansion-panel-content';
