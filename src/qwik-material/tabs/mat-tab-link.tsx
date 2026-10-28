import {$, component$, Slot, useContext, useSignal, type QRL} from '@builder.io/qwik';
import {useFocusOrigin, useIdGenerator} from '@angular-community/qwik-cdk/a11y';
import {MAT_TAB_NAV_STATE, MAT_TAB_NAV_STATE_DEFAULTS} from './tab-nav-state';

export interface MatTabLinkProps {
  /** Whether this link is the active one (`[active]`). */
  active?: boolean;
  disabled?: boolean;
  /** Real tabindex used when this link holds roving focus. Default 0. */
  tabIndex?: number;
  id?: string;
  disableRipple?: boolean;
  onClick$?: QRL<(event: PointerEvent) => void>;
  class?: string | ReadonlyArray<string>;
}

/**
 * Qwik port of `MatTabLink` (`src/material/tabs/tab-nav-bar/tab-nav-bar.ts`
 * `MatTabLink` class + `tab-link.html`). A normal nested child of
 * `<MatTabNav>` — see `tab-nav-state.ts`'s doc comment for why links don't
 * need the `tabs`-data-array treatment `MatTabGroup` requires.
 */
export const MatTabLink = component$<MatTabLinkProps>(props => {
  const navState = useContext(MAT_TAB_NAV_STATE, {value: MAT_TAB_NAV_STATE_DEFAULTS});
  const nav = navState.value;
  const idGen = useIdGenerator();
  const autoId = useSignal(() => idGen.getId('mat-tab-link-'));
  const id = props.id ?? autoId.value;
  const elRef = useSignal<HTMLElement>();
  const focusOrigin = useFocusOrigin();

  const active = props.active ?? false;
  const disabled = props.disabled ?? false;
  const tabIndexWhenFocused = props.tabIndex ?? 0;

  // Roving tabindex by element identity (see tab-nav-state.ts). Both sides
  // are `undefined` throughout SSR (no real DOM element exists yet) and
  // before any interaction on the client, so this naturally falls back to
  // `active` exactly when upstream's `_focusedItem` would too.
  const isRovingFocused =
    nav.focusedLink.value && elRef.value ? nav.focusedLink.value === elRef.value : active;
  const tabIndex = isRovingFocused ? tabIndexWhenFocused : -1;

  const onClick$ = $((event: PointerEvent) => {
    nav.focusedLink.value = elRef.value;
    props.onClick$?.(event);
  });

  // Mirrors `_handleKeydown`: Enter/Space on a focused link synthesizes a
  // real click (angular-parity.spec.ts note 12) when a tab panel is bound;
  // Space additionally prevents the page-scroll default.
  const onKeyDown$ = $((event: KeyboardEvent) => {
    if (event.key !== ' ' && event.key !== 'Enter') return;
    if (disabled) {
      event.preventDefault();
    } else if (nav.hasTabPanel) {
      if (event.key === ' ') event.preventDefault();
      elRef.value?.click();
    }
  });

  const classes = [
    'mdc-tab',
    'mat-mdc-tab-link',
    'mat-focus-indicator',
    active && 'mdc-tab--active',
    active && 'mdc-tab-indicator--active',
    disabled && 'mat-mdc-tab-disabled',
    focusOrigin.value && 'cdk-focused',
    focusOrigin.value === 'touch' && 'cdk-touch-focused',
    focusOrigin.value === 'keyboard' && 'cdk-keyboard-focused',
    focusOrigin.value === 'mouse' && 'cdk-mouse-focused',
    focusOrigin.value === 'program' && 'cdk-program-focused',
    props.class,
  ].filter(Boolean) as string[];

  return (
    <a
      ref={elRef}
      id={id}
      class={classes}
      role={nav.hasTabPanel ? 'tab' : undefined}
      tabIndex={tabIndex}
      aria-controls={nav.hasTabPanel ? nav.tabPanelId : undefined}
      aria-selected={nav.hasTabPanel ? (active ? 'true' : 'false') : undefined}
      aria-current={active && !nav.hasTabPanel ? 'page' : undefined}
      aria-disabled={disabled ? 'true' : 'false'}
      {...({'mat-tab-link': ''} as Record<string, string>)}
      onClick$={onClick$}
      onKeyDown$={onKeyDown$}
    >
      <span class="mdc-tab__ripple" />
      <div
        class="mat-ripple mat-mdc-tab-ripple"
        {...({'mat-ripple': ''} as Record<string, string>)}
      />
      <span class="mdc-tab__content">
        <span class="mdc-tab__text-label">
          <Slot />
        </span>
      </span>
      <span class="mdc-tab-indicator">
        <span class="mdc-tab-indicator__content mdc-tab-indicator__content--underline" />
      </span>
    </a>
  );
});
