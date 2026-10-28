// Public API for @angular-community/qwik-cdk/table.
// Headless logic only — see SYNC.md. qwik-material/table supplies the
// actual rendered markup, consistent with the accordion/stepper split.

export {cdkColumnClass, cssClassFriendlyName, matColumnClass} from './column-css';
export {getCellRole} from './cell-role';
export {createDefaultHeaderText, defaultTextColumnDataAccessor} from './text-column-defaults';
export {getRowDefsForData, type RowDefLike} from './row-defs';
export {
  StickyStyler,
  createVirtualStickyElement,
  getCalculatedZIndex,
  virtualStickyElementToProps,
  STICKY_DIRECTIONS,
  type StickyDirection,
  type VirtualStickyElement,
} from './sticky-styler';
