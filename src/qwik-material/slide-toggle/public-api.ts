// Public API for @angular-community/qwik-material/slide-toggle.
// See docs/superpowers/specs/2026-10-27-qwik-material-dom-parity-remediation-design.md.

export type {MatSlideToggleConfig} from './slide-toggle-config';
export {MAT_SLIDE_TOGGLE_CONFIG, useMatSlideToggleProvider} from './slide-toggle-config';

export {MatSlideToggle, type MatSlideToggleProps} from './mat-slide-toggle';

// The entry point's CSS, registered by its components; see slide-toggle-styles.ts.
export {useMatSlideToggleStyles} from './slide-toggle-styles';
