import {
  $,
  component$,
  useContext,
  useSignal,
  useTask$,
  type JSXOutput,
  type QRL,
} from '@builder.io/qwik';
import {focusVia, useIdGenerator} from '@angular-community/qwik-cdk/a11y';
import {useAnimationsDisabled} from '../dialog/use-animations-disabled';
import {MAT_TABS_CONFIG, type MatTabsConfig} from './tab-config';
import {
  computeNextTabFocusIndex,
  shouldActivateOnKey,
  type TabFocusKey,
} from './tab-group-keyboard';
import {usePaginatedHeader} from './use-paginated-header';
import {MatTabLabelItem} from './mat-tab-label';
import {MatTabBodyItem} from './mat-tab-body';

/**
 * Descriptor for one tab — mirrors `MatTab`'s inputs
 * (`src/material/tabs/tab.ts`). `MatTabGroup` takes an array of these rather
 * than nested `<MatTab>` children: Angular's `MatTab` is a pure data holder
 * that `MatTabGroup` discovers via `@ContentChildren` and then renders
 * TWICE — once as a header label (`tab-header.html`'s `@for`) and once as a
 * `<mat-tab-body>` portal (`tab-group.html`'s second `@for`), two
 * *different* DOM subtrees that must stay index-aligned. Qwik has no
 * `@ContentChildren` equivalent and — per the project's own documented
 * pitfall — can't read a `<Slot>`'s projected children's props during SSR
 * (the children render in their own pass, strictly after the parent's own
 * template has already been built; mutating shared state from inside a
 * child can't un-stale an already-rendered sibling). A `tabs` data prop
 * sidesteps the problem entirely: `MatTabGroup` has full synchronous access
 * to every tab's label/content/disabled/etc. up front and can render both
 * subtrees directly from it. This is the same "named props instead of
 * nested children" shape `qwik-material/list` uses for a narrower instance
 * of the same underlying constraint — see the design doc's porting notes.
 * `content`/`labelTemplate` accept plain `JSXOutput` values (ordinary Qwik
 * props — no different from passing a `JSXOutput` through any other prop).
 */
export interface MatTabDef {
  /** `MatTab.textLabel` (`[label]`/`label` input). */
  label?: string;
  /** `<ng-template mat-tab-label>` (`MatTabLabel`) — a custom label instead
   *  of plain text. */
  labelTemplate?: JSXOutput;
  /** `MatTab.disabled`. */
  disabled?: boolean;
  /** `MatTab['aria-label']`. */
  ariaLabel?: string;
  /** `MatTab['aria-labelledby']` — ignored when `ariaLabel` is set. */
  ariaLabelledby?: string;
  /** `MatTab.labelClass`. */
  labelClass?: string | ReadonlyArray<string>;
  /** `MatTab.bodyClass`. */
  bodyClass?: string | ReadonlyArray<string>;
  /** `MatTab.id` — overrides the auto-generated label id. */
  id?: string;
  /**
   * Tab body content. Only rendered once this tab first centers, and
   * removed again on leaving (unless `preserveContent` on the group) — the
   * same lazy/detach behavior upstream gets from `<ng-template
   * matTabContent>` AND from plain inline content alike (see
   * `mat-tab-body.tsx`'s doc comment for why there's no separate "lazy"
   * variant of this prop).
   */
  content?: JSXOutput;
}

export interface MatTabGroupProps {
  tabs: MatTabDef[];
  /** The index of the active tab. Consumer owns the state. */
  selectedIndex?: number;
  /** Two-way-binding half of `[(selectedIndex)]`. */
  onSelectedIndexChange$?: QRL<(index: number) => void>;
  /** Fires whenever keyboard/click focus moves within the header. */
  onFocusChange$?: QRL<(index: number) => void>;
  /** M2-only theme color. Default 'primary'. */
  color?: 'primary' | 'accent' | 'warn';
  /** Whether the ink bar should fit its width to the tab label content. */
  fitInkBarToContent?: boolean;
  /** `[mat-stretch-tabs]` — whether tabs stretch to fill the header. Default true. */
  stretchTabs?: boolean;
  /** `[mat-align-tabs]` — reflected onto the host as a literal attribute
   *  when set (angular-parity.spec.ts note 7). */
  alignTabs?: 'start' | 'center' | 'end' | null;
  /** Whether the tab group grows to the size of the active tab. */
  dynamicHeight?: boolean;
  /** Position of the tab header. Default 'above'. */
  headerPosition?: 'above' | 'below';
  /** Duration for the tab animation (string|number, normalized to ms). */
  animationDuration?: string | number;
  /** `tabindex` for the inner element that wraps the tab content. */
  contentTabIndex?: number;
  /** Disables pagination. */
  disablePagination?: boolean;
  /** Disables ripples. */
  disableRipple?: boolean;
  /** Keeps tab content in the DOM while off-screen. */
  preserveContent?: boolean;
  'aria-label'?: string;
  'aria-labelledby'?: string;
  class?: string | ReadonlyArray<string>;
  /** Plain CSS text, same as a native `style` attribute (e.g. `"width: 480px"`). */
  style?: string;
  id?: string;
}

const CONFIG_DEFAULTS: MatTabsConfig = {};

function normalizeDuration(value: string | number): string {
  const str = `${value}`;
  return /^\d+$/.test(str) ? `${value}ms` : str;
}

function clampIndex(index: number | undefined, length: number): number {
  return Math.min(length - 1, Math.max((index || 0) as number, 0));
}

/**
 * Qwik port of `MatTabGroup` (`src/material/tabs/tab-group.ts` +
 * `tab-group.html`), `MatTabHeader` (`tab-header.ts`/`.html`) and
 * `MatPaginatedTabHeader` (`paginated-tab-header.ts`) combined into one
 * component — upstream splits header/body into separate `@docs-private`
 * components, but nothing in the public API or the DOM contract requires
 * that split here.
 */
export const MatTabGroup = component$<MatTabGroupProps>(props => {
  const config = useContext(MAT_TABS_CONFIG, CONFIG_DEFAULTS);
  const idGen = useIdGenerator();
  const groupId = useSignal(() => idGen.getId('mat-tab-group-'));
  const animationsDisabled = useAnimationsDisabled();

  const tabs = props.tabs;
  const disabledFlags = tabs.map(tab => !!tab.disabled);
  const selectedIndex = clampIndex(props.selectedIndex, tabs.length);

  // Previous selectedIndex, tracked for the body's left/right/can-animate
  // classes (mirrors `MatTabBody._previousPosition`). `track()` reads the
  // real prop (not the locally-clamped `selectedIndex`) so the task
  // actually re-runs on every change.
  const previousSelectedIndex = useSignal(selectedIndex);
  const lastTrackedSelectedIndex = useSignal(selectedIndex);
  useTask$(({track}) => {
    const raw = track(() => props.selectedIndex);
    const clamped = clampIndex(raw, tabs.length);
    previousSelectedIndex.value = lastTrackedSelectedIndex.value;
    lastTrackedSelectedIndex.value = clamped;
  });

  // Roving-tabindex focus tracking (`MatPaginatedTabHeader.focusIndex`).
  // `null` until a click/keyboard interaction explicitly moves it, falling
  // back to `selectedIndex` — see tab-group-keyboard.ts's module doc
  // comment for why this simplification is safe for every scenario this
  // port is gated on.
  const focusIndex = useSignal<number | null>(null);

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

  const onActivate$ = $((index: number, element: HTMLElement) => {
    focusIndex.value = index;
    element.focus();
    props.onFocusChange$?.(index);
    if (!disabledFlags[index]) {
      props.onSelectedIndexChange$?.(index);
    }
  });

  const onKeyDown$ = $((event: KeyboardEvent) => {
    if (event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) return;
    const count = disabledFlags.length;

    if (event.key === 'Enter' || event.key === ' ') {
      const fi = focusIndex.value;
      if (fi !== null && shouldActivateOnKey(fi, selectedIndex, disabledFlags[fi])) {
        event.preventDefault();
        props.onSelectedIndexChange$?.(fi);
      }
      return;
    }

    if (
      event.key !== 'ArrowLeft' &&
      event.key !== 'ArrowRight' &&
      event.key !== 'Home' &&
      event.key !== 'End'
    ) {
      return;
    }
    const current = focusIndex.value ?? selectedIndex;
    const next = computeNextTabFocusIndex(event.key as TabFocusKey, count, current);
    if (next === null) return;
    event.preventDefault();
    focusIndex.value = next;
    props.onFocusChange$?.(next);
    const items = tabListInnerRef.value?.querySelectorAll<HTMLElement>('.mdc-tab');
    const target = items?.[next];
    if (target) focusVia(target, 'keyboard');
  });

  const onScrollBefore$ = $(() => pagination.scroll('before'));
  const onScrollAfter$ = $(() => pagination.scroll('after'));

  const animationDuration = normalizeDuration(
    props.animationDuration ?? config.animationDuration ?? '500ms',
  );

  const groupClasses = [
    'mat-mdc-tab-group',
    `mat-${props.color || 'primary'}`,
    props.dynamicHeight && 'mat-mdc-tab-group-dynamic-height',
    props.headerPosition === 'below' && 'mat-mdc-tab-group-inverted-header',
    (props.stretchTabs ?? true) && 'mat-mdc-tab-group-stretch-tabs',
    props.class,
  ].filter(Boolean) as string[];

  const headerClasses = [
    'mat-mdc-tab-header',
    pagination.showPaginationControls.value && 'mat-mdc-tab-header-pagination-controls-enabled',
  ].filter(Boolean) as string[];

  const tabListStyle =
    pagination.translateX.value !== undefined
      ? `transform: translateX(${pagination.translateX.value}px)`
      : undefined;

  const hostAttrs: Record<string, string> = {};
  if (props.alignTabs != null) hostAttrs['mat-align-tabs'] = props.alignTabs;

  const hostStyle = [
    props.style,
    `--mat-tab-body-animation-duration: ${animationDuration}`,
    `--mat-tab-header-animation-duration: ${animationDuration}`,
  ]
    .filter(Boolean)
    .join('; ');

  return (
    <mat-tab-group id={props.id} class={groupClasses} style={hostStyle} {...hostAttrs}>
      <mat-tab-header ref={headerRootRef} class={headerClasses}>
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
        >
          <div class="mat-mdc-tab-header-pagination-chevron" />
        </div>
        <div
          class={[
            'mat-mdc-tab-label-container',
            animationsDisabled.value && '_mat-animation-noopable',
          ]
            .filter(Boolean)
            .join(' ')}
          ref={tabListContainerRef}
          onKeyDown$={onKeyDown$}
        >
          <div
            class="mat-mdc-tab-list"
            role="tablist"
            style={tabListStyle}
            aria-label={props['aria-label'] || undefined}
            aria-labelledby={props['aria-labelledby'] || undefined}
          >
            <div class="mat-mdc-tab-labels" ref={tabListInnerRef}>
              {tabs.map((tab, i) => (
                <MatTabLabelItem
                  key={tab.id ?? i}
                  index={i}
                  id={tab.id || `${groupId.value}-label-${i}`}
                  contentId={`${groupId.value}-content-${i}`}
                  selected={selectedIndex === i}
                  disabled={!!tab.disabled}
                  tabIndex={i === (focusIndex.value ?? selectedIndex) ? 0 : -1}
                  posinset={i + 1}
                  setsize={tabs.length}
                  ariaLabel={tab.ariaLabel}
                  ariaLabelledby={tab.ariaLabelledby}
                  labelClass={tab.labelClass}
                  label={tab.label}
                  labelTemplate={tab.labelTemplate}
                  onActivate$={onActivate$}
                />
              ))}
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
        >
          <div class="mat-mdc-tab-header-pagination-chevron" />
        </div>
      </mat-tab-header>
      <div
        class={[
          'mat-mdc-tab-body-wrapper',
          (animationsDisabled.value || animationDuration === '0' || animationDuration === '0ms') &&
            '_mat-animation-noopable',
        ]
          .filter(Boolean)
          .join(' ')}
      >
        {tabs.map((tab, i) => (
          <MatTabBodyItem
            key={tab.id ?? i}
            id={`${groupId.value}-content-${i}`}
            labelledBy={tab.id || `${groupId.value}-label-${i}`}
            position={i - selectedIndex}
            previousPosition={i - previousSelectedIndex.value}
            preserveContent={props.preserveContent ?? false}
            bodyClass={tab.bodyClass}
            contentTabIndex={props.contentTabIndex}
            content={tab.content}
          />
        ))}
      </div>
    </mat-tab-group>
  );
});
