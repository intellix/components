/**
 * MatList scenario port from src/material/list/list.spec.ts.
 *
 * Upstream has ~40 `it()` blocks — heavy on @ContentChildren QueryList
 * inspection + _updateItemLines + cdkObserveContent behavior verification,
 * none of which has a Qwik SSR equivalent to unit-test directly (Qwik has
 * no content-query API, and `createDOM(<Component$/>)` hangs the vitest
 * worker in this project — see mat-button-scenarios.spec.tsx's note).
 * Restructured:
 *
 *   - Live sanity tests: typeof + MAT_LIST_CONFIG.id + config +
 *     props shape acceptance for all 10 components, matching the CURRENT
 *     API (named-prop sections on MatListItem — see mat-list-item.tsx's
 *     doc comment for why nested children aren't used).
 *   - describe.skip DOM-rendered: deferred to Playwright.
 *   - describe.skip Angular-only: deferred forever per the remediation
 *     design doc's "Qwik primitives are unrestricted" / no-lifecycle-hooks
 *     reality.
 *
 * Real DOM assertions live in
 * src/qwik-cdk-parity-tests/specs/material-list/*.spec.ts.
 */
import {describe, it, expect} from 'vitest';
import {
  MAT_LIST_CONFIG,
  MAT_LIST_BASE_STATE,
  MAT_LIST_BASE_STATE_DEFAULTS,
  MatList,
  MatNavList,
  MatActionList,
  MatSubheader,
  MatListItem,
  MatListItemAvatar,
  MatListItemIcon,
  MatListItemTitle,
  MatListItemLine,
  MatListItemMeta,
  type MatListConfig,
  type MatListBaseState,
  type MatListProps,
  type MatNavListProps,
  type MatActionListProps,
  type MatSubheaderProps,
  type MatListItemProps,
  type MatListItemSectionProps,
  type MatListItemAvatarProps,
  type MatListItemIconProps,
} from './public-api';

describe('MatList surface — sanity', () => {
  it('all 10 components are exported and function-shaped', () => {
    expect(typeof MatList).toBe('function');
    expect(typeof MatNavList).toBe('function');
    expect(typeof MatActionList).toBe('function');
    expect(typeof MatSubheader).toBe('function');
    expect(typeof MatListItem).toBe('function');
    expect(typeof MatListItemAvatar).toBe('function');
    expect(typeof MatListItemIcon).toBe('function');
    expect(typeof MatListItemTitle).toBe('function');
    expect(typeof MatListItemLine).toBe('function');
    expect(typeof MatListItemMeta).toBe('function');
  });

  it('MAT_LIST_CONFIG carries the expected context id', () => {
    expect(MAT_LIST_CONFIG.id).toBe('qwik-material/list-config');
  });

  it('MatListConfig accepts an empty object', () => {
    const cfg: MatListConfig = {};
    expect(cfg).toBeDefined();
  });

  it('MAT_LIST_BASE_STATE carries the expected context id and non-interactive default', () => {
    expect(MAT_LIST_BASE_STATE.id).toBe('qwik-material/list-base-state');
    const defaults: MatListBaseState = MAT_LIST_BASE_STATE_DEFAULTS;
    expect(defaults.isNonInteractive).toBe(true);
  });

  it('MatListProps + MatNavListProps + MatActionListProps accept aria + role + disabled + class + id', () => {
    const listProps: MatListProps = {
      role: 'list',
      disabled: false,
      'aria-label': 'Inbox',
      'aria-labelledby': 'inbox-heading',
      'aria-describedby': 'inbox-desc',
      class: 'my-list',
      id: 'inbox',
    };
    const navProps: MatNavListProps = {
      role: 'ignored — nav forces navigation',
      disabled: true,
      'aria-label': 'Main navigation',
      class: 'my-nav',
      id: 'nav',
    };
    const actionProps: MatActionListProps = {
      disabled: false,
      class: 'my-actions',
      id: 'actions',
    };
    expect(listProps['aria-label']).toBe('Inbox');
    expect(navProps.disabled).toBe(true);
    expect(actionProps.class).toBe('my-actions');
  });

  it('MatListItemProps accepts as / href / activated / disabled / lines + the named section props', () => {
    const divProps: MatListItemProps = {
      role: 'listitem',
      class: 'item',
      id: 'i1',
      avatar: <MatListItemAvatar />,
      icon: <MatListItemIcon />,
      title: <MatListItemTitle>Inbox</MatListItemTitle>,
      lineContent: [<MatListItemLine key="l1">a</MatListItemLine>],
      meta: <MatListItemMeta>128</MatListItemMeta>,
      lines: 2,
    };
    const anchorProps: MatListItemProps = {
      as: 'a',
      href: '/inbox',
      activated: true,
      'aria-label': 'Inbox',
      id: 'nav-inbox',
    };
    const buttonProps: MatListItemProps = {
      as: 'button',
      disabled: true,
      'aria-label': 'Delete',
      id: 'delete',
    };
    expect(divProps.role).toBe('listitem');
    expect(divProps.lines).toBe(2);
    expect(anchorProps.as).toBe('a');
    expect(anchorProps.href).toBe('/inbox');
    expect(anchorProps.activated).toBe(true);
    expect(buttonProps.as).toBe('button');
    expect(buttonProps.disabled).toBe(true);
  });

  it('MatSubheaderProps accepts as + aria + class + id', () => {
    const props: MatSubheaderProps = {
      as: 'div',
      'aria-label': 'Section header',
      'aria-labelledby': 'section-title',
      'aria-describedby': 'section-desc',
      class: 'my-subheader',
      id: 'sh1',
    };
    expect(props['aria-label']).toBe('Section header');
    expect(props.as).toBe('div');
  });

  it('MatListItemSectionProps accepts class + style + id (shared by all 5 section components)', () => {
    const props: MatListItemSectionProps = {
      class: 'my-avatar',
      style: {background: 'red'},
      id: 'avatar-1',
    };
    expect(props.class).toBe('my-avatar');
    expect(props.id).toBe('avatar-1');
  });

  it('MatListItemAvatarProps / MatListItemIconProps accept as + style', () => {
    const avatarProps: MatListItemAvatarProps = {as: 'img', src: '/a.png', alt: 'Alice'};
    const iconProps: MatListItemIconProps = {as: 'span', style: 'color: red'};
    expect(avatarProps.as).toBe('img');
    expect(iconProps.as).toBe('span');
  });

  it('MatListItemProps.as union covers exactly div/a/button', () => {
    const divVariant: MatListItemProps['as'] = 'div';
    const anchorVariant: MatListItemProps['as'] = 'a';
    const buttonVariant: MatListItemProps['as'] = 'button';
    expect(divVariant).toBe('div');
    expect(anchorVariant).toBe('a');
    expect(buttonVariant).toBe('button');
  });
});

describe.skip('MatList DOM-rendered scenarios — see Playwright specs instead', () => {
  it('MatList renders <mat-list> with class ladder + role passthrough + aria-disabled="false" default', () => {});
  it('MatNavList renders <mat-nav-list role="navigation">; its items get mat-mdc-list-item-interactive', () => {});
  it('MatActionList renders <mat-action-list role="group">; its items get mat-mdc-list-item-interactive', () => {});
  it('MatListItem polymorphism: as="div" → <mat-list-item>; as="a" href → <a href>; as="button" → <button type="button">', () => {});
  it('MatListItem activated on <a> emits aria-current="page"; on <div> does not', () => {});
  it('MatListItem derives leading/trailing/line-count classes from the avatar/icon/title/lineContent/meta/lines props', () => {});
  it('section components (Avatar/Icon/Title/Line/Meta) render their own host element with the upstream class hooks, no wrapper', () => {});
});

describe.skip('MatList — Angular-only tests', () => {
  it('should coerce BooleanInput/NumberInput attribute values', () => {
    // Omitted — Qwik JSX passes booleans/numbers directly.
  });
  it('should enumerate slot content via @ContentChildren + _updateItemLines + cdkObserveContent', () => {
    // Qwik has no content-query equivalent — MatListItem instead takes the
    // avatar/icon/title/lineContent/meta sections as named props (see
    // mat-list-item.tsx's doc comment: reading `children` directly causes
    // Qwik's SSR renderer to stash the original nodes into a hidden
    // `<q:template>` sibling instead of rendering them, and a bare
    // `<Slot>` can't redistribute children into a NEW wrapper element —
    // confirmed empirically against this Qwik version before choosing
    // this design).
  });
  it('should inherit from MatListBase / MatListItemBase abstract classes', () => {
    // Collapsed to plain component$ wrappers + a small MAT_LIST_BASE_STATE
    // context for the one piece of inherited state items actually need
    // (container interactivity).
  });
  it('should integrate ripple / focus-manager / MDC state layer', () => {
    // Out of scope — no interaction steps in this component's
    // angular-parity.spec.ts; ripple DOM is a future qwik-cdk primitive.
  });
});
