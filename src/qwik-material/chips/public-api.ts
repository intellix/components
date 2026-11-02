// Public API for @angular-community/qwik-material/chips.
// See docs/superpowers/specs/2026-10-27-qwik-material-dom-parity-remediation-design.md
// and ...remaining-components-roadmap.md (wave 4).

export {MatChip, type MatChipProps, type MatChipRemoveButtonDef} from './mat-chip';
export {MatChipSet, type MatChipDef, type MatChipSetProps} from './mat-chip-set';
export {MatChipOption, type MatChipOptionProps} from './mat-chip-option';
export {
  MatChipListbox,
  type MatChipOptionDef,
  type MatChipListboxProps,
  type MatChipListboxChangeEvent,
} from './mat-chip-listbox';
export {MatChipRow, type MatChipRowProps} from './mat-chip-row';
export {
  MatChipGrid,
  type MatChipRowDef,
  type MatChipGridProps,
  type MatChipGridInputDef,
} from './mat-chip-grid';
export {MAT_CHIPS_CONFIG, type MatChipsConfig, type SeparatorKey} from './tokens';
