// Public API for @angular-community/qwik-material/autocomplete.
// See docs/superpowers/specs/2026-10-27-qwik-material-dom-parity-remediation-design.md
// and autocomplete/SYNC.md. `MatOption`/`MatOptgroup` live in
// `qwik-material/core` (shared with `qwik-material/select`) — re-exported
// here anyway for a consumer that wants them directly, same convention
// `qwik-material/select`'s own public-api.ts already establishes.

export {MatAutocomplete, type MatAutocompleteProps} from './mat-autocomplete';
export {MatAutocompletePanel, type MatAutocompletePanelProps} from './mat-autocomplete-panel';
export type {MatAutocompleteConfig, MatAutocompleteProviderConfig} from './autocomplete-config';
export {
  MAT_AUTOCOMPLETE_CONFIG,
  MAT_AUTOCOMPLETE_SCROLL_STRATEGY,
  useMatAutocompleteProvider,
} from './autocomplete-config';
export {
  resolveAutocompleteOptions,
  type MatAutocompleteOptionDef,
  type MatAutocompleteGroupDef,
  type MatAutocompleteEntryDef,
  type ResolvedAutocompleteOption,
  type ResolvedAutocompleteGroup,
  type ResolvedAutocompleteNode,
  type ResolvedAutocompleteOptions,
} from './autocomplete-option-resolver';
export {
  AUTOCOMPLETE_POSITIONS,
  type MatAutocompleteOptionInfo,
  type MatAutocompleteOptionSelectedEvent,
  type MatAutocompleteOptionActivatedEvent,
} from './autocomplete-runtime';

export {MatOption, type MatOptionProps} from '../core/mat-option';
export {MatOptgroup, type MatOptgroupProps} from '../core/mat-optgroup';
