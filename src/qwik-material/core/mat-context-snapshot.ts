import {useContext, type ContextId} from '@qwik.dev/core';
import type {OverlayContextOverride} from '@angular-community/qwik-cdk/overlay';
import {
  MAT_ANIMATIONS_DISABLED,
  MAT_DIALOG_DEFAULT_OPTIONS,
  MAT_DIALOG_SCROLL_STRATEGY,
} from '../dialog/mat-dialog-tokens';
import {MAT_BUTTON_CONFIG} from '../button/button-config';
import {MAT_CARD_CONFIG} from '../card/card-config';
import {MAT_BADGE_CONFIG} from '../badge/badge-config';
import {MAT_ICON_CONFIG} from '../icon/icon-config';
import {MAT_ICON_REGISTRY} from '../icon/icon-registry';
import {MAT_PROGRESS_BAR_CONFIG} from '../progress-bar/progress-bar-config';
import {MAT_PROGRESS_SPINNER_CONFIG} from '../progress-spinner/progress-spinner-config';
import {MAT_DIVIDER_CONFIG} from '../divider/divider-config';
import {MAT_GRID_LIST_CONFIG} from '../grid-list/grid-list-config';
import {MAT_LIST_CONFIG} from '../list/list-config';
import {MAT_BUTTON_TOGGLE_CONFIG} from '../button-toggle/button-toggle-config';
import {MAT_SLIDE_TOGGLE_CONFIG} from '../slide-toggle/slide-toggle-config';
import {MAT_EXPANSION_CONFIG} from '../expansion/expansion-config';
import {MAT_RADIO_CONFIG} from '../radio/radio-config';
import {MAT_CHECKBOX_CONFIG} from '../checkbox/checkbox-config';
import {MAT_SORT_CONFIG} from '../sort/sort-config';
import {MAT_TABS_CONFIG} from '../tabs/tab-config';
import {MAT_SIDENAV_CONFIG} from '../sidenav/sidenav-config';
import {MAT_SNACK_BAR_DEFAULT_OPTIONS} from '../snack-bar/mat-snack-bar-tokens';
import {
  MAT_BOTTOM_SHEET_DEFAULT_OPTIONS,
  MAT_BOTTOM_SHEET_SCROLL_STRATEGY,
} from '../bottom-sheet/mat-bottom-sheet-tokens';
import {MAT_FORM_FIELD_CONFIG} from '../form-field/form-field-config';
import {MAT_INPUT_CONFIG} from '../input/input-config';
import {CDK_STEPPER_GLOBAL_OPTIONS} from '@angular-community/qwik-cdk/stepper';
import {MAT_CHIPS_CONFIG} from '../chips/tokens';
import {MAT_TOOLTIP_DEFAULT_OPTIONS} from '../tooltip/mat-tooltip-tokens';
import {MAT_SELECT_CONFIG, MAT_SELECT_SCROLL_STRATEGY} from '../select/select-config';
import {MAT_MENU_DEFAULT_OPTIONS, MAT_MENU_SCROLL_STRATEGY} from '../menu/mat-menu-tokens';
import {MAT_TIMEPICKER_CONFIG} from '../timepicker/timepicker-config';
import {MAT_PAGINATOR_CONFIG} from '../paginator/paginator-config';
import {MAT_PAGINATOR_INTL} from '../paginator/paginator-intl';
import {
  MAT_AUTOCOMPLETE_CONFIG,
  MAT_AUTOCOMPLETE_SCROLL_STRATEGY,
} from '../autocomplete/autocomplete-config';
import {MAT_ERROR_STATE_MATCHER} from './error-state-matcher';
import {MAT_RIPPLE_GLOBAL_OPTIONS} from './ripple/ripple-global-options';
import {MAT_DATE_ADAPTER_FACTORY, MAT_DATE_LOCALE} from './datetime/use-date-adapter';
import {MAT_DATE_FORMATS} from './datetime/date-formats';

/**
 * Every configuration context a `useMat*Provider()` hook can provide, in no particular order
 * (order doesn't matter for a snapshot — see {@link useMatContextSnapshot}'s own doc comment
 * for why). This is the single canonical list backing that function — kept in this one file
 * precisely so it can't drift silently out of sync with the actual provider hooks: adding a
 * new provider hook/context anywhere in `qwik-material` is the same change as adding its
 * context id here.
 *
 * Formerly `QWIK_MATERIAL_CONTEXT_IDS` (`dialog/qwik-material-provider.tsx`, removed when the
 * single `<QwikMaterialProvider>` component was replaced by one hook per setting — see
 * `core/SYNC.md`). Relocated to `core` so it no longer has to live inside (and name-check
 * against) a single component's file. `MAT_ICON_REGISTRY` is a new addition here — it was
 * never part of the old component (icon registration had its own separate
 * `<MatIconRegistryProvider>`), but it belongs in the dialog/bottom-sheet context-forwarding
 * set just as much as every `MAT_*_CONFIG` does: a dialog/bottom-sheet opened from a subtree
 * with registered icons should still resolve `<MatIcon svgIcon="...">` inside its content.
 */
const MAT_CONTEXT_IDS: readonly ContextId<unknown>[] = [
  MAT_DIALOG_DEFAULT_OPTIONS,
  MAT_DIALOG_SCROLL_STRATEGY,
  MAT_ANIMATIONS_DISABLED,
  MAT_BUTTON_CONFIG,
  MAT_CARD_CONFIG,
  MAT_BADGE_CONFIG,
  MAT_ICON_CONFIG,
  MAT_ICON_REGISTRY,
  MAT_PROGRESS_BAR_CONFIG,
  MAT_PROGRESS_SPINNER_CONFIG,
  MAT_DIVIDER_CONFIG,
  MAT_GRID_LIST_CONFIG,
  MAT_LIST_CONFIG,
  MAT_BUTTON_TOGGLE_CONFIG,
  MAT_SLIDE_TOGGLE_CONFIG,
  MAT_EXPANSION_CONFIG,
  MAT_RADIO_CONFIG,
  MAT_CHECKBOX_CONFIG,
  MAT_SORT_CONFIG,
  MAT_TABS_CONFIG,
  MAT_SIDENAV_CONFIG,
  MAT_SNACK_BAR_DEFAULT_OPTIONS,
  MAT_BOTTOM_SHEET_DEFAULT_OPTIONS,
  MAT_BOTTOM_SHEET_SCROLL_STRATEGY,
  MAT_FORM_FIELD_CONFIG,
  MAT_INPUT_CONFIG,
  CDK_STEPPER_GLOBAL_OPTIONS,
  MAT_CHIPS_CONFIG,
  MAT_TOOLTIP_DEFAULT_OPTIONS,
  MAT_SELECT_CONFIG,
  MAT_SELECT_SCROLL_STRATEGY,
  MAT_MENU_DEFAULT_OPTIONS,
  MAT_MENU_SCROLL_STRATEGY,
  MAT_TIMEPICKER_CONFIG,
  MAT_PAGINATOR_CONFIG,
  MAT_PAGINATOR_INTL,
  MAT_AUTOCOMPLETE_CONFIG,
  MAT_AUTOCOMPLETE_SCROLL_STRATEGY,
  MAT_ERROR_STATE_MATCHER,
  MAT_RIPPLE_GLOBAL_OPTIONS,
  MAT_DATE_ADAPTER_FACTORY,
  MAT_DATE_FORMATS,
  MAT_DATE_LOCALE,
];

/** @docs-private — exposed for tests that need to assert the full set. */
export {MAT_CONTEXT_IDS};

/**
 * Sentinel distinguishing "no provider for this context" from a real,
 * legitimately-provided value — including one that happens to also be an
 * empty object (several configs above default to `{}`). A plain frozen
 * object compared by reference, not a `Symbol` (a `Symbol` default can't
 * be SSR-serialized if it ever leaked into state — it doesn't here, this
 * stays a local variable — but there's no reason to risk it when a plain
 * object works just as well for reference-equality filtering).
 */
const NOT_PROVIDED: unknown = Object.freeze({});

/**
 * Snapshots every qwik-material configuration context that IS currently visible — i.e. every
 * one of {@link MAT_CONTEXT_IDS} that resolves to something other than `NOT_PROVIDED` — as an
 * `OverlayContextOverride[]` ready to merge into `OverlayConfig.context`.
 *
 * This is what makes "automatically carry every qwik-material configuration context visible
 * where `useMatDialog()`/`useMatBottomSheet()` is called into the opened content" possible:
 * those hooks call this at the point THEY are invoked (inside the opener's own render),
 * capturing whatever `useMat*Provider()` ancestors are in scope THERE, then pass the result
 * through to `OverlayHost` (a sibling of the opener, under `<QwikCdkRoot>`, which otherwise
 * can't see them — see `OverlayConfig.context`'s doc comment) via `overlay.create()`'s config.
 *
 * Calling `useContext()` in a loop over a fixed, module-level-constant array (same array,
 * same order, every call) is safe: unlike `useSignal`/`useStore`/`useTask$`, `useContext`
 * allocates no sequential per-call slot of its own — it's a pure lookup against the calling
 * component's live context map, so there is no "hook call order" to keep consistent across
 * renders here.
 */
export function useMatContextSnapshot(): OverlayContextOverride[] {
  const result: OverlayContextOverride[] = [];
  for (const id of MAT_CONTEXT_IDS) {
    const value = useContext(id, NOT_PROVIDED);
    if (value !== NOT_PROVIDED) {
      result.push({ctx: id, value});
    }
  }
  return result;
}
