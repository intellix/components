export type {Platform} from '../platform';
export {createPlatform} from '../platform';
export type {IdGenerator, _IdGenerator} from './id-generator';
export {createIdGenerator, ID_GENERATOR_COUNTER, useIdGenerator} from './id-generator';
export type {InteractivityChecker} from './interactivity-checker/interactivity-checker';
export {createInteractivityChecker} from './interactivity-checker/interactivity-checker';
export type {IsFocusableConfig} from './interactivity-checker/interactivity-checker';
export type {InputModalityDetector} from './input-modality/input-modality-detector';
export {
  createInputModalityDetector,
  INPUT_MODALITY_DETECTOR,
  useInputModalityDetector,
  TOUCH_BUFFER_MS,
} from './input-modality/input-modality-detector';
export type {InputModality} from './input-modality/input-modality-detector';
export type {FocusMonitor} from './focus-monitor/focus-monitor';
export {
  createFocusMonitor,
  FOCUS_MONITOR,
  FocusMonitorDetectionMode,
} from './focus-monitor/focus-monitor';
export type {FocusOrigin, FocusOptions} from './focus-monitor/focus-monitor';
export {useFocusOrigin, focusVia} from './focus-origin/focus-origin';
// Plain, non-`useOn()` building blocks for `useFocusOrigin()`'s SAME
// keyboard-vs-pointer heuristic — exported so a hostProps-returning
// directive hook (e.g. `qwik-material/tooltip`'s `useMatTooltip()`) that
// can't rely on `useOn()` attaching to the right element (its caller isn't
// necessarily the one owning the host — see `qwik-material/core/host-
// props.ts`) can reproduce the exact same origin resolution via plain JSX
// handler props instead. See recent-keydown.ts's doc comment.
export {wasRecentKeydown, consumeRecentKeydown} from './focus-origin/recent-keydown';
export type {FocusTrap} from './focus-trap/focus-trap';
export {createFocusTrap} from './focus-trap/focus-trap';
export {useFocusTrap} from './focus-trap/use-focus-trap';
export type {
  UseFocusTrapOptions,
  UseFocusTrapReturn,
  AutoFocusTarget,
} from './focus-trap/use-focus-trap';
export type {LiveAnnouncer, AriaLivePoliteness} from './live-announcer/live-announcer';
export {createLiveAnnouncer} from './live-announcer/live-announcer';
export type {
  ListKeyManager,
  ListKeyManagerOption,
  ListKeyManagerModifierKey,
} from './key-manager/list-key-manager';
export {createListKeyManager} from './key-manager/list-key-manager';
export type {FocusKeyManager, FocusableOption} from './key-manager/focus-key-manager';
export {createFocusKeyManager} from './key-manager/focus-key-manager';
export type {Typeahead} from './key-manager/typeahead';
export {createTypeahead} from './key-manager/typeahead';
export type {
  TreeKeyManagerItem,
  TreeKeydownAction,
  ResolveTreeKeydownOptions,
} from './key-manager/tree-key-manager';
export {resolveTreeKeydown} from './key-manager/tree-key-manager';
