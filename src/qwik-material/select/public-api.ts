// Public API for @angular-community/qwik-material/select.
// See docs/superpowers/specs/2026-10-27-qwik-material-dom-parity-remediation-design.md
// and select/SYNC.md. `MatOption`/`MatOptgroup` live in `qwik-material/core`
// (shared with a future autocomplete/datepicker/timepicker port) — they're
// INTERNAL renderers `MatSelectPanel` uses, not something a consumer of
// `<MatSelect options={...}>` writes directly (see mat-select.tsx's doc
// comment) — re-exported here anyway since a future consumer rendering its
// own option list outside `<MatSelect>` may still want them directly.

export {MatSelect, type MatSelectProps} from './mat-select';
export {MatSelectPanel, type MatSelectPanelProps} from './mat-select-panel';
export type {MatSelectConfig} from './select-config';
export {MAT_SELECT_CONFIG, MAT_SELECT_SCROLL_STRATEGY} from './select-config';
export {
  resolveSelectOptions,
  type MatSelectOptionDef,
  type MatSelectGroupDef,
  type MatSelectEntryDef,
  type ResolvedSelectOption,
  type ResolvedSelectGroup,
  type ResolvedSelectNode,
  type ResolvedSelectOptions,
} from './select-option-resolver';
export {SELECT_POSITIONS, getOptionScrollPosition} from './select-runtime';

export {MatOption, type MatOptionProps} from '../core/mat-option';
export {MatOptgroup, type MatOptgroupProps} from '../core/mat-optgroup';
