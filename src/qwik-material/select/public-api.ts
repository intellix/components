// Public API for @angular-community/qwik-material/select.
// See docs/superpowers/specs/2026-10-27-qwik-material-dom-parity-remediation-design.md
// and select/SYNC.md. `MatOption`/`MatOptgroup` live in `qwik-material/core`
// (shared with a future autocomplete/datepicker/timepicker port) — re-exported
// here too since every select consumer needs them to build the `options` prop.

export {MatSelect, type MatSelectProps} from './mat-select';
export {MatSelectPanel, type MatSelectPanelProps} from './mat-select-panel';
export type {MatSelectConfig} from './select-config';
export {MAT_SELECT_CONFIG} from './select-config';
export {
  resolveSelectOptions,
  extractOptionText,
  type ResolvedSelectOption,
  type ResolvedSelectGroup,
  type ResolvedSelectNode,
  type ResolvedSelectOptions,
} from './select-option-resolver';
export {SELECT_POSITIONS} from './select-runtime';

export {MatOption, type MatOptionProps} from '../core/mat-option';
export {MatOptgroup, type MatOptgroupProps} from '../core/mat-optgroup';
