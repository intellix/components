// Public API for @angular-community/qwik-material/timepicker.
// See docs/superpowers/specs/2026-10-27-qwik-material-dom-parity-remediation-design.md and
// timepicker/SYNC.md.

export {
  useMatTimepicker,
  type MatTimepickerHandle,
  type MatTimepickerRenderOption,
  type UseMatTimepickerOptions,
} from './use-mat-timepicker';
export {MatTimepickerInput, type MatTimepickerInputProps} from './mat-timepicker-input';
export {MatTimepickerToggle, type MatTimepickerToggleProps} from './mat-timepicker-toggle';
export {MatTimepickerPanel, type MatTimepickerPanelProps} from './mat-timepicker-panel';
export {
  MAT_TIMEPICKER_CONFIG,
  useMatTimepickerProvider,
  type MatTimepickerConfig,
} from './timepicker-config';
export {parseInterval, generateOptions, type MatTimepickerOption} from './timepicker-util';
export {
  openTimepickerPanel,
  closeTimepickerPanel,
  selectTimepickerOption,
  formatTimeForDisplay,
} from './timepicker-runtime';
