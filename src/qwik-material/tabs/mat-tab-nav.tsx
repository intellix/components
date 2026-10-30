import {$, component$, Slot, useContext, useContextProvider, useSignal} from '@builder.io/qwik';
import {focusVia} from '@angular-community/qwik-cdk/a11y';
import {useAnimationsDisabled} from '../dialog/use-animations-disabled';
import {handleRippleEvent, rippleAnimationConfig} from '../core/ripple/ripple-dom';
import {MAT_TABS_CONFIG, type MatTabsConfig} from './tab-config';
import {computeNextTabFocusIndex, type TabFocusKey} from './tab-group-keyboard';
import {usePaginatedHeader} from './use-paginated-header';
import {MAT_TAB_NAV_STATE, type MatTabNavState} from './tab-nav-state';

export interface MatTabNavProps {
  /** Id of the `<MatTabNavPanel>` this nav is wired to (mirrors Angular's
   *  `[tabPanel]` template-reference binding — Qwik has no template
   *  variables, so the consumer threads the id explicitly). When omitted,
   *  the nav follows the plain link/navigation-landmark ARIA pattern
   *  instead of the tabs pattern (no scenario this port is gated on omits
   *  it). */
  tabPanelId?: string;
  color?: 'primary' | 'accent' | 'warn';
  fitInkBarToContent?: boolean;
  stretchTabs?: boolean;
  disablePagination?: boolean;
  disableRipple?: boolean;
  /** Normalized to ms if numeric. Deliberately has NO config/default
   *  fallback — see angular-parity.spec.ts note 10: `MatTabNav` never sets
   *  `--mat-tab-header-animation-duration` unless this prop is explicitly
   *  provided. */
  animationDuration?: string | number;
  class?: string | ReadonlyArray<string>;
  style?: string;
  id?: string;
}

const CONFIG_DEFAULTS: MatTabsConfig = {};

function normalizeDuration(value: string | number): string {
  const str = `${value}`;
  return /^\d+$/.test(str) ? `${value}ms` : str;
}

/**
 * Qwik port of `MatTabNav` + `MatPaginatedTabHeader`
 * (`src/material/tabs/tab-nav-bar/tab-nav-bar.ts` + `tab-nav-bar.html`).
 * Unlike `MatTabGroup`, links are ordinary nested `<MatTabLink>` children
 * (via `<Slot/>`) — see `tab-nav-state.ts`'s doc comment for why that's safe
 * here but not for the tab group's header/body split.
 */
export const MatTabNav = component$<MatTabNavProps>(props => {
  const config = useContext(MAT_TABS_CONFIG, CONFIG_DEFAULTS);
  const animationsDisabled = useAnimationsDisabled();

  const disablePagination = props.disablePagination ?? config.disablePagination ?? false;
  const headerRootRef = useSignal<HTMLElement>();
  const tabListContainerRef = useSignal<HTMLElement>();
  const tabListInnerRef = useSignal<HTMLElement>();
  const pagination = usePaginatedHeader(
    headerRootRef,
    tabListContainerRef,
    tabListInnerRef,
    disablePagination,
  );

  const focusedLink = useSignal<HTMLElement>();
  const navState: MatTabNavState = {
    focusedLink,
    hasTabPanel: props.tabPanelId != null,
    tabPanelId: props.tabPanelId,
    disableRipple: props.disableRipple ?? false,
  };
  const navStateSignal = useSignal<MatTabNavState>(navState);
  navStateSignal.value = navState;
  useContextProvider(MAT_TAB_NAV_STATE, navStateSignal);

  // Arrow-key/Home/End roving focus — mirrors `MatPaginatedTabHeader
  // ._handleKeydown()`'s default branch (`_keyManager.onKeydown`). Enter/
  // Space activation is handled per-link (`MatTabLink._handleKeydown`),
  // which synthesizes a real click (note 12) — this handler ignores those
  // keys entirely and lets them bubble.
  const onKeyDown$ = $((event: KeyboardEvent) => {
    if (event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) return;
    if (
      event.key !== 'ArrowLeft' &&
      event.key !== 'ArrowRight' &&
      event.key !== 'Home' &&
      event.key !== 'End'
    ) {
      return;
    }
    const container = tabListInnerRef.value;
    if (!container) return;
    const items = Array.from(container.querySelectorAll<HTMLElement>('.mdc-tab'));
    const target = event.target as HTMLElement | null;
    const currentEl = target?.closest<HTMLElement>('.mdc-tab');
    const current = currentEl ? items.indexOf(currentEl) : -1;
    const next = computeNextTabFocusIndex(event.key as TabFocusKey, items.length, current);
    if (next === null) return;
    event.preventDefault();
    const nextEl = items[next];
    focusedLink.value = nextEl;
    focusVia(nextEl, 'keyboard');
  });

  const onScrollBefore$ = $(() => pagination.scroll('before'));
  const onScrollAfter$ = $(() => pagination.scroll('after'));

  // Upstream `tab-nav-bar.html`'s pagination divs: bare `mat-ripple` (no
  // `matRippleTrigger` override), so trigger === container — the event's
  // own `element` (2nd) argument IS the container. ONE shared `$()`
  // reference per button, wired to all six pointer events — see
  // `core/ripple/ripple-renderer.ts`'s module doc comment for why that's
  // required, not just tidy (cross-chunk QRL ordering on a cold chunk).
  const paginationBeforeRippleEvent$ = $((event: MouseEvent | TouchEvent, element: Element) => {
    handleRippleEvent(event, element, {
      rippleDisabled: pagination.disableScrollBefore.value || navState.disableRipple,
      rippleConfig: {animation: rippleAnimationConfig(animationsDisabled.value)},
    });
  });
  const paginationAfterRippleEvent$ = $((event: MouseEvent | TouchEvent, element: Element) => {
    handleRippleEvent(event, element, {
      rippleDisabled: pagination.disableScrollAfter.value || navState.disableRipple,
      rippleConfig: {animation: rippleAnimationConfig(animationsDisabled.value)},
    });
  });

  const navAnimationDuration =
    props.animationDuration != null ? normalizeDuration(props.animationDuration) : undefined;

  const classes = [
    'mat-mdc-tab-nav-bar',
    'mat-mdc-tab-header',
    pagination.showPaginationControls.value && 'mat-mdc-tab-header-pagination-controls-enabled',
    (props.stretchTabs ?? true) && 'mat-mdc-tab-nav-bar-stretch-tabs',
    props.color !== 'warn' && props.color !== 'accent' && 'mat-primary',
    props.color === 'accent' && 'mat-accent',
    props.color === 'warn' && 'mat-warn',
    animationsDisabled.value && '_mat-animation-noopable',
    props.class,
  ].filter(Boolean) as string[];

  const tabListStyle =
    pagination.translateX.value !== undefined
      ? `transform: translateX(${pagination.translateX.value}px)`
      : undefined;

  const hostStyle = [
    props.style,
    navAnimationDuration && `--mat-tab-header-animation-duration: ${navAnimationDuration}`,
  ]
    .filter(Boolean)
    .join('; ');

  return (
    <nav
      ref={headerRootRef}
      id={props.id}
      class={classes}
      style={hostStyle || undefined}
      role={props.tabPanelId != null ? 'tablist' : undefined}
    >
      <div
        class={[
          'mat-ripple',
          'mat-mdc-tab-header-pagination',
          'mat-mdc-tab-header-pagination-before',
          pagination.disableScrollBefore.value && 'mat-mdc-tab-header-pagination-disabled',
        ]
          .filter(Boolean)
          .join(' ')}
        {...({'mat-ripple': ''} as Record<string, string>)}
        onClick$={onScrollBefore$}
        onMouseDown$={paginationBeforeRippleEvent$}
        onMouseUp$={paginationBeforeRippleEvent$}
        onMouseLeave$={paginationBeforeRippleEvent$}
        onTouchStart$={paginationBeforeRippleEvent$}
        onTouchEnd$={paginationBeforeRippleEvent$}
        onTouchCancel$={paginationBeforeRippleEvent$}
      >
        <div class="mat-mdc-tab-header-pagination-chevron" />
      </div>
      <div class="mat-mdc-tab-link-container" ref={tabListContainerRef} onKeyDown$={onKeyDown$}>
        <div class="mat-mdc-tab-list" style={tabListStyle}>
          <div class="mat-mdc-tab-links" ref={tabListInnerRef}>
            <Slot />
          </div>
        </div>
      </div>
      <div
        class={[
          'mat-ripple',
          'mat-mdc-tab-header-pagination',
          'mat-mdc-tab-header-pagination-after',
          pagination.disableScrollAfter.value && 'mat-mdc-tab-header-pagination-disabled',
        ]
          .filter(Boolean)
          .join(' ')}
        {...({'mat-ripple': ''} as Record<string, string>)}
        onClick$={onScrollAfter$}
        onMouseDown$={paginationAfterRippleEvent$}
        onMouseUp$={paginationAfterRippleEvent$}
        onMouseLeave$={paginationAfterRippleEvent$}
        onTouchStart$={paginationAfterRippleEvent$}
        onTouchEnd$={paginationAfterRippleEvent$}
        onTouchCancel$={paginationAfterRippleEvent$}
      >
        <div class="mat-mdc-tab-header-pagination-chevron" />
      </div>
    </nav>
  );
});
